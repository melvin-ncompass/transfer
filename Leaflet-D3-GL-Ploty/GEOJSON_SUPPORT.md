# 🗺️ GeoJSON Support Documentation

## ✅ Feature Complete!

The dashboard now supports **GeoJSON file uploads** in addition to CSV files!

---

## 📁 What is GeoJSON?

GeoJSON is a standard format for encoding geographic data structures using JSON. It supports various geometry types beyond simple points.

**Example GeoJSON:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [36.8219, -1.2921]
      },
      "properties": {
        "name": "Nairobi",
        "population": 4397073,
        "type": "Capital City"
      }
    }
  ]
}
```

---

## 🎯 Supported Geometry Types

✅ **Point** - Single coordinate
✅ **LineString** - Connected line segments (roads, paths)
✅ **Polygon** - Closed shapes (regions, boundaries, areas)
✅ **MultiPoint** - Multiple points
✅ **MultiLineString** - Multiple lines
✅ **MultiPolygon** - Multiple polygons

---

## 📊 How It Works

### 1. Upload GeoJSON File

**Frontend:** Click **"Upload GeoJSON File"** button in sidebar

**What happens:**
- File is parsed and validated
- Preview shows:
  - Number of features
  - Geometry type
  - Available properties
- User provides a table name

### 2. Backend Processing

**Endpoint:** `POST /api/upload/geojson`

**Processing Steps:**

#### Step 1: Parse & Validate
```typescript
const geoJsonData = JSON.parse(fileContent);

// Validate structure
if (geoJsonData.type !== 'FeatureCollection') {
  throw new Error('Must be a FeatureCollection');
}
```

#### Step 2: Extract Properties
```typescript
// Get all unique property keys from all features
const allProperties = new Set();
geoJsonData.features.forEach(feature => {
  Object.keys(feature.properties).forEach(key => {
    allProperties.add(key);
  });
});
```

#### Step 3: Create PostgreSQL Table
```sql
CREATE TABLE IF NOT EXISTS "kenya_cities" (
  id SERIAL PRIMARY KEY,
  "name" TEXT,
  "population" TEXT,
  "type" TEXT,
  "country" TEXT,
  geom GEOMETRY(Point, 4326),        -- Geometry type from GeoJSON
  geojson_properties JSONB,           -- Full properties as JSON
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Differences from CSV:**
- `GEOMETRY` type matches GeoJSON geometry type (Point, LineString, Polygon, etc.)
- `geojson_properties` column stores complete original properties as JSONB

#### Step 4: Insert with PostGIS Function
```sql
INSERT INTO "kenya_cities" (
  "name", "population", "type", "country", geom, geojson_properties
)
VALUES (
  'Nairobi',
  '4397073',
  'Capital City',
  'Kenya',
  ST_SetSRID(
    ST_GeomFromGeoJSON('{"type":"Point","coordinates":[36.8219,-1.2921]}'),
    4326
  ),
  '{"name":"Nairobi","population":4397073,...}'::JSONB
);
```

**PostGIS Function:**
- **`ST_GeomFromGeoJSON(json)`**: Converts GeoJSON geometry directly to PostGIS geometry
- Supports all geometry types automatically!
- More efficient than manually parsing coordinates

---

## 🔄 Data Flow Comparison

### CSV Upload Flow:
```
CSV → Parse → Extract lat/lng → ST_MakePoint(lng, lat) → GEOMETRY(Point)
```

### GeoJSON Upload Flow:
```
GeoJSON → Parse → ST_GeomFromGeoJSON(geometry) → GEOMETRY(Any Type)
```

**Advantages of GeoJSON:**
- Direct geometry conversion (no coordinate extraction needed)
- Supports complex shapes (polygons, lines)
- Preserves exact geometry from source
- Industry-standard format

---

## 📋 Usage Examples

### Example 1: Point Data (Cities)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [36.8219, -1.2921]
      },
      "properties": {
        "name": "Nairobi",
        "population": 4397073
      }
    }
  ]
}
```

**Result:**
- Table created with Point geometry
- Can visualize with all 5 map types (heatmap, scatter, contour, choropleth, path)

### Example 2: LineString Data (Roads)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [36.8, -1.28],
          [36.82, -1.29],
          [36.85, -1.30]
        ]
      },
      "properties": {
        "name": "Mombasa Road",
        "type": "Highway"
      }
    }
  ]
}
```

**Result:**
- Table created with LineString geometry
- Can visualize as paths/routes

### Example 3: Polygon Data (Regions)
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [36.7, -1.25],
          [36.9, -1.25],
          [36.9, -1.35],
          [36.7, -1.35],
          [36.7, -1.25]
        ]]
      },
      "properties": {
        "name": "Nairobi County",
        "area_km2": 696
      }
    }
  ]
}
```

**Result:**
- Table created with Polygon geometry
- Perfect for choropleth visualizations

---

## 🎨 Visualization Support

### For Point Geometries:
✅ All 5 visualization types work:
- Heatmap
- Scatter Map
- Contour Map
- Choropleth (grid-based)
- Path Map (connects points)

### For LineString Geometries:
✅ Path Map - Shows routes/roads
✅ Custom visualizations can be added

### For Polygon Geometries:
✅ Choropleth - Perfect for regional data
✅ Custom polygon renderers can be added

---

## 🔍 Data Retrieval

When fetching data from a GeoJSON-uploaded table:

**For Point geometries:**
```sql
SELECT *, 
  ST_X(geom) as longitude,
  ST_Y(geom) as latitude
FROM kenya_cities;
```

**For LineString/Polygon geometries:**
```sql
SELECT *,
  ST_AsGeoJSON(geom) as geometry_json
FROM kenya_roads;
```

**Response format:**
```json
{
  "id": 1,
  "name": "Nairobi",
  "population": "4397073",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "geojson_properties": {
    "name": "Nairobi",
    "population": 4397073,
    "type": "Capital City"
  }
}
```

---

## 📦 Sample GeoJSON File

A sample file (`sample_geojson.json`) has been created with Kenya cities data:

```json
{
  "type": "FeatureCollection",
  "features": [
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [36.8219, -1.2921]}, 
     "properties": {"name": "Nairobi", "population": 4397073}},
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [39.6682, -4.0435]}, 
     "properties": {"name": "Mombasa", "population": 1208333}},
    // ... more cities
  ]
}
```

---

## 🚀 How to Use

### Step 1: Get GeoJSON Data
- Export from QGIS, ArcGIS, or other GIS software
- Download from geojson.io
- Use the provided `sample_geojson.json`
- Get from open data portals

### Step 2: Upload
1. Click **"Upload GeoJSON File"** in sidebar
2. Select your `.geojson` or `.json` file
3. Preview will show:
   - Feature count
   - Geometry type
   - Properties list
4. Enter a table name (e.g., `kenya_cities`)
5. Click **"Upload"**

### Step 3: Visualize
1. Click **"Create New Chart"**
2. Select library (D3, Plotly, DeckGL, or Leaflet)
3. Choose your uploaded table
4. Select visualization type
5. Create!

---

## 🆚 CSV vs GeoJSON

| Feature | CSV | GeoJSON |
|---------|-----|---------|
| **Geometry Types** | Points only | All types |
| **Setup** | Specify lat/lng columns | Auto-detected |
| **Data Structure** | Flat table | Hierarchical |
| **Industry Standard** | Yes (tabular) | Yes (geospatial) |
| **File Size** | Smaller | Larger |
| **Complex Shapes** | ❌ | ✅ |
| **Coordinate Precision** | Limited by TEXT | Full precision |
| **Metadata** | Limited | Rich (JSONB) |

**Use CSV when:**
- You have simple point data
- Data is already in spreadsheet format
- File size matters

**Use GeoJSON when:**
- You need polygons or lines
- Data comes from GIS software
- You want to preserve exact geometry
- You have complex properties

---

## 🔧 Technical Details

### PostGIS Functions Used

**`ST_GeomFromGeoJSON(json)`**
- Converts GeoJSON geometry to PostGIS geometry
- Automatically handles all geometry types
- Validates geometry structure

```sql
-- Example
SELECT ST_GeomFromGeoJSON('{"type":"Point","coordinates":[36.8,-1.3]}');
```

**`ST_SetSRID(geometry, srid)`**
- Sets the spatial reference system
- 4326 = WGS84 (GPS coordinates)

```sql
-- Complete conversion
ST_SetSRID(ST_GeomFromGeoJSON('...'), 4326)
```

### Storage Format

**Geometry Column:**
```
geom: GEOMETRY(Point, 4326)
geom: GEOMETRY(LineString, 4326)
geom: GEOMETRY(Polygon, 4326)
```

**Properties Column:**
```
geojson_properties: JSONB
```
- Queryable with PostgreSQL JSON operators
- Can index specific properties
- Full-text search capable

---

## 💡 Advanced Queries

### Query 1: Find cities by population
```sql
SELECT name, 
       geojson_properties->>'population' as pop
FROM kenya_cities
WHERE (geojson_properties->>'population')::int > 500000
ORDER BY (geojson_properties->>'population')::int DESC;
```

### Query 2: Get polygon area
```sql
SELECT name,
       ST_Area(geom::geography) / 1000000 as area_km2
FROM regions;
```

### Query 3: Find nearest city
```sql
SELECT name,
       ST_Distance(
         geom::geography,
         ST_SetSRID(ST_MakePoint(37.0, -1.0), 4326)::geography
       ) / 1000 as distance_km
FROM kenya_cities
ORDER BY distance_km
LIMIT 5;
```

---

## ✅ Summary

**GeoJSON support adds:**
1. ✅ Support for all geometry types
2. ✅ Direct GeoJSON → PostGIS conversion
3. ✅ Rich property storage (JSONB)
4. ✅ Preview before upload
5. ✅ Industry-standard format
6. ✅ Works with existing visualization system

**Try it now:**
1. Upload `sample_geojson.json`
2. Create a scatter map visualization
3. See Kenya cities plotted instantly!

🎉 **Your geospatial dashboard now handles professional GIS data!**



