import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'geodata',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// CSV Upload endpoint
app.post('/api/upload/csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { tableName, latColumn, lngColumn } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    // Parse CSV file
    const csvData: any[] = [];
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (row) => csvData.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (csvData.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Get headers and filter out empty ones
    const allHeaders = Object.keys(csvData[0]);
    const headers = allHeaders.filter(h => h && h.trim() !== '');
    
    if (headers.length === 0) {
      return res.status(400).json({ error: 'No valid column headers found' });
    }

    // Sanitize column names for PostgreSQL
    const sanitizeColumnName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 63); // PostgreSQL column name length limit
    };

    const sanitizedHeaders = headers.map(sanitizeColumnName);
    const hasGeometry = latColumn && lngColumn;

    // Create table
    const columnsDefinition = sanitizedHeaders.map(col => `"${col}" TEXT`).join(', ');
    const geometryColumn = hasGeometry ? ', geom GEOMETRY(Point, 4326)' : '';
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id SERIAL PRIMARY KEY,
        ${columnsDefinition}${geometryColumn},
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create spatial index if has geometry
    if (hasGeometry) {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS "idx_${tableName}_geom" 
        ON "${tableName}" USING GIST (geom)
      `);
    }

    // Insert data
    for (const row of csvData) {
      const values = headers.map(h => row[h] || null);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      let insertQuery: string;
      let insertParams: any[];

      if (hasGeometry && row[latColumn] && row[lngColumn]) {
        const lat = parseFloat(row[latColumn]);
        const lng = parseFloat(row[lngColumn]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          insertQuery = `
            INSERT INTO "${tableName}" (${sanitizedHeaders.map(h => `"${h}"`).join(', ')}, geom)
            VALUES (${placeholders}, ST_SetSRID(ST_MakePoint($${values.length + 1}, $${values.length + 2}), 4326))
          `;
          insertParams = [...values, lng, lat];
        } else {
          continue; // Skip rows with invalid coordinates
        }
      } else {
        insertQuery = `
          INSERT INTO "${tableName}" (${sanitizedHeaders.map(h => `"${h}"`).join(', ')})
          VALUES (${placeholders})
        `;
        insertParams = values;
      }

      await pool.query(insertQuery, insertParams);
    }

    res.json({
      success: true,
      message: 'CSV uploaded and table created successfully',
      tableName,
      rowCount: csvData.length,
    });

  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload CSV',
    });
  }
});

// GeoJSON Upload endpoint
app.post('/api/upload/geojson', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { tableName, recreateTable } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    // Drop table if it exists and recreateTable flag is set
    if (recreateTable === 'true' || recreateTable === true) {
      await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    // Parse GeoJSON file
    const geoJsonText = req.file.buffer.toString();
    let geoJsonData: any;

    try {
      geoJsonData = JSON.parse(geoJsonText);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // Validate GeoJSON structure
    if (!geoJsonData.type || geoJsonData.type !== 'FeatureCollection') {
      return res.status(400).json({ 
        error: 'Invalid GeoJSON: Must be a FeatureCollection' 
      });
    }

    if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
      return res.status(400).json({ 
        error: 'Invalid GeoJSON: No features array found' 
      });
    }

    if (geoJsonData.features.length === 0) {
      return res.status(400).json({ error: 'GeoJSON file has no features' });
    }

    // Extract all unique property keys from features
    const allProperties = new Set<string>();
    geoJsonData.features.forEach((feature: any) => {
      if (feature.properties) {
        Object.keys(feature.properties).forEach(key => allProperties.add(key));
      }
    });

    const propertyColumns = Array.from(allProperties);

    // Sanitize column names for PostgreSQL
    const sanitizeColumnName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 63);
    };

    // Reserved column names that we create automatically
    const reservedColumns = new Set(['id', 'geom', 'geometry', 'created_at', 'geojson_properties']);
    
    // Sanitize and ensure unique column names
    const sanitizedColumns: string[] = [];
    const seenColumns = new Set<string>();
    
    propertyColumns.forEach(col => {
      let sanitized = sanitizeColumnName(col);
      
      // Skip reserved column names
      if (reservedColumns.has(sanitized)) {
        sanitized = `${sanitized}_prop`;
      }
      
      // If column name already exists, append a number
      if (seenColumns.has(sanitized)) {
        let counter = 1;
        while (seenColumns.has(`${sanitized}_${counter}`)) {
          counter++;
        }
        sanitized = `${sanitized}_${counter}`;
      }
      
      seenColumns.add(sanitized);
      sanitizedColumns.push(sanitized);
    });

    // Determine geometry types from all features
    const geometryTypes = new Set<string>();
    geoJsonData.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type) {
        geometryTypes.add(feature.geometry.type);
      }
    });
    
    // If mixed geometry types, use generic GEOMETRY, otherwise use specific type
    let geometryTypeConstraint: string;
    if (geometryTypes.size > 1) {
      // Mixed types - use generic GEOMETRY
      geometryTypeConstraint = 'GEOMETRY';
    } else {
      // Single type - use specific constraint
      const singleType = Array.from(geometryTypes)[0];
      geometryTypeConstraint = singleType;
    }

    // Create table with geometry column
    const columnsDefinition = sanitizedColumns.map(col => `"${col}" TEXT`).join(', ');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id SERIAL PRIMARY KEY,
        ${columnsDefinition ? columnsDefinition + ',' : ''}
        geom GEOMETRY(${geometryTypeConstraint}, 4326),
        geojson_properties JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create spatial index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "idx_${tableName}_geom" 
      ON "${tableName}" USING GIST (geom)
    `);

    // Insert features
    let insertedCount = 0;
    for (const feature of geoJsonData.features) {
      if (!feature.geometry || !feature.geometry.coordinates) {
        continue; // Skip features without geometry
      }

      // Extract property values
      const properties = feature.properties || {};
      const values = propertyColumns.map(prop => properties[prop] || null);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      // Convert GeoJSON geometry to PostGIS geometry
      const geometryGeoJSON = JSON.stringify(feature.geometry);

      const insertQuery = `
        INSERT INTO "${tableName}" (
          ${sanitizedColumns.map(c => `"${c}"`).join(', ')}
          ${sanitizedColumns.length > 0 ? ',' : ''}
          geom,
          geojson_properties
        )
        VALUES (
          ${placeholders}
          ${values.length > 0 ? ',' : ''}
          ST_SetSRID(ST_GeomFromGeoJSON($${values.length + 1}), 4326),
          $${values.length + 2}
        )
      `;

      await pool.query(insertQuery, [
        ...values,
        geometryGeoJSON,
        JSON.stringify(properties)
      ]);
      insertedCount++;
    }

    res.json({
      success: true,
      message: 'GeoJSON uploaded and table created successfully',
      tableName,
      featureCount: insertedCount,
      geometryType: geometryTypeConstraint,
      geometryTypes: Array.from(geometryTypes),
      properties: propertyColumns,
    });

  } catch (error) {
    console.error('Error uploading GeoJSON:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload GeoJSON',
    });
  }
});

// Get all available tables
app.get('/api/tables', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) AS size,
        (
          SELECT COUNT(*) 
          FROM information_schema.columns 
          WHERE table_name = t.table_name 
          AND table_schema = 'public'
        ) as column_count,
        EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = t.table_name 
          AND table_schema = 'public' 
          AND udt_name = 'geometry'
        ) as has_geometry
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Delete a table
app.delete('/api/tables/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    
    // Drop the table
    await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    
    res.json({
      success: true,
      message: `Table "${tableName}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete table',
    });
  }
});

// Get columns for a specific table
app.get('/api/tables/:tableName/columns', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    
    const result = await pool.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching columns:', error);
    res.status(500).json({ error: 'Failed to fetch columns' });
  }
});

// Get unique values for each column (for filter dropdowns)
app.get('/api/tables/:tableName/column-values', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    
    // Get text columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      AND data_type IN ('character varying', 'text', 'varchar', 'character')
      AND udt_name != 'geometry'
    `, [tableName]);
    
    const columnValues: Record<string, string[]> = {};
    
    // Fetch unique values for each column (limit to 100 unique values)
    for (const col of columnsResult.rows) {
      const columnName = col.column_name;
      try {
        const valuesResult = await pool.query(`
          SELECT DISTINCT "${columnName}"
          FROM "${tableName}"
          WHERE "${columnName}" IS NOT NULL
          AND "${columnName}" != ''
          ORDER BY "${columnName}"
          LIMIT 100
        `);
        
        columnValues[columnName] = valuesResult.rows.map(row => row[columnName]);
      } catch (err) {
        console.error(`Error fetching values for column ${columnName}:`, err);
        columnValues[columnName] = [];
      }
    }
    
    res.json(columnValues);
  } catch (error) {
    console.error('Error fetching column values:', error);
    res.status(500).json({ error: 'Failed to fetch column values' });
  }
});

// Get data from any table with optional filters
app.get('/api/tables/:tableName/data', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { limit = '1000', offset = '0', ...filters } = req.query;
    
    // First check if table has geometry column
    const columnsResult = await pool.query(`
      SELECT column_name, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
    `, [tableName]);
    
    const columns = columnsResult.rows;
    const geometryCol = columns.find(c => c.udt_name === 'geometry');
    
    // Build SELECT query
    let selectCols = columns
      .filter(c => c.udt_name !== 'geometry')
      .map(c => `"${c.column_name}"`)
      .join(', ');
    
    if (geometryCol) {
      const geomColName = geometryCol.column_name;
      // Get geometry type and handle accordingly
      selectCols += `, 
        ST_AsGeoJSON(${geomColName})::json as geometry,
        ST_GeometryType(${geomColName}) as geometry_type,
        ST_X(ST_Centroid(${geomColName})) as longitude,
        ST_Y(ST_Centroid(${geomColName})) as latitude`;
    }
    
    // Build WHERE clause for filters
    const filterConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    // Add filters for each query parameter
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Check if column exists in table
        const column = columns.find(c => c.column_name === key);
        if (column) {
          // Use exact match for dropdown selections
          filterConditions.push(`"${key}" = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
    });
    
    let query = `SELECT ${selectCols} FROM "${tableName}"`;
    
    if (filterConditions.length > 0) {
      query += ` WHERE ${filterConditions.join(' AND ')}`;
    }
    
    // Add limit and offset params
    params.push(limit);
    params.push(offset);
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const dataResult = await pool.query(query, params);
    
    res.json({
      success: true,
      count: dataResult.rows.length,
      data: dataResult.rows,
      hasGeometry: !!geometryCol,
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch data',
    });
  }
});

// Export table as GeoJSON
app.get('/api/tables/:tableName/export/geojson', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    
    // Check if table has geometry column
    const columnsResult = await pool.query(`
      SELECT column_name, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
    `, [tableName]);
    
    const columns = columnsResult.rows;
    const geometryCol = columns.find(c => c.udt_name === 'geometry');
    
    if (!geometryCol) {
      return res.status(400).json({ 
        error: 'Table does not have geometry data for GeoJSON export' 
      });
    }
    
    // Get all property columns (excluding geometry, id, created_at)
    const propertyColumns = columns
      .filter(c => 
        c.udt_name !== 'geometry' && 
        c.column_name !== 'id' && 
        c.column_name !== 'created_at' &&
        c.column_name !== 'geojson_properties'
      )
      .map(c => c.column_name);
    
    // Build query to get GeoJSON features
    const query = `
      SELECT 
        ST_AsGeoJSON(${geometryCol.column_name})::json as geometry,
        ${propertyColumns.map(col => `"${col}"`).join(', ')}
        ${columns.find(c => c.column_name === 'geojson_properties') ? ', geojson_properties' : ''}
      FROM "${tableName}"
    `;
    
    const result = await pool.query(query);
    
    // Build GeoJSON FeatureCollection
    const features = result.rows.map(row => {
      // Extract geometry
      const geometry = row.geometry;
      
      // Build properties object
      const properties: any = {};
      propertyColumns.forEach(col => {
        if (row[col] !== null && row[col] !== undefined) {
          // Try to parse as number if it looks like one
          const value = row[col];
          if (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(value as any)) {
            properties[col] = parseFloat(value);
          } else {
            properties[col] = value;
          }
        }
      });
      
      // Merge with original geojson_properties if exists
      if (row.geojson_properties) {
        Object.assign(properties, row.geojson_properties);
      }
      
      return {
        type: 'Feature',
        geometry: geometry,
        properties: properties
      };
    });
    
    const geoJson = {
      type: 'FeatureCollection',
      features: features
    };
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/geo+json');
    res.setHeader('Content-Disposition', `attachment; filename="${tableName}.geojson"`);
    res.json(geoJson);
    
  } catch (error) {
    console.error('Error exporting GeoJSON:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to export GeoJSON',
    });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🗺️  PostGIS geospatial data visualization server`);
});

export default app;

