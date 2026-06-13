# 🗺️ Geospatial Data Visualization Dashboard - Complete Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Frontend Deep Dive](#frontend-deep-dive)
5. [Backend Deep Dive](#backend-deep-dive)
6. [Database & PostGIS](#database--postgis)
7. [Data Flow](#data-flow)
8. [Key Features Explained](#key-features-explained)
9. [API Endpoints](#api-endpoints)
10. [Component Breakdown](#component-breakdown)

---

## 🎯 Project Overview

This is a **professional geospatial data visualization platform** similar to Apache Superset, built specifically for working with geographic/location data stored in PostgreSQL with PostGIS extension.

### What Does It Do?
- **Upload CSV files** with latitude/longitude columns
- **Store data** in PostgreSQL/PostGIS with proper geometry types
- **Create dynamic visualizations** (maps, charts, tables)
- **Filter data** interactively with smart dropdown/text filters
- **Display multiple chart types** including Leaflet maps, deck.gl 3D visualizations, D3 charts

### Target Use Case
Perfect for visualizing:
- Healthcare facility locations
- Store/branch locations
- Sensor data with GPS coordinates
- Any dataset with geographic coordinates

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  Port: 3000                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │ Chart Builder│  │  CSV Upload  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Leaflet Map  │  │  deck.gl 3D  │  │  D3 Charts   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Express/Node.js)                │
│  Port: 5000                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API Routes │  │  Multer CSV  │  │  SQL Builder │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL Queries
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL + PostGIS)                 │
│  Port: 5432                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Tables  │  │  Geometry    │  │ GIST Indexes │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### **Frontend**
| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **React 18** | UI Framework | Component-based, reactive UI |
| **TypeScript** | Type Safety | Catch errors at compile time |
| **Vite** | Build Tool | Fast dev server, instant HMR |
| **Material-UI (MUI)** | UI Components | Professional, customizable components |
| **Zustand** | State Management | Simple, minimal global state |
| **Axios** | HTTP Client | Promise-based API calls |
| **Leaflet** | 2D Maps | Traditional interactive maps |
| **deck.gl** | 3D WebGL Maps | High-performance 3D visualizations |
| **D3.js** | Charts/Graphs | Powerful data visualization |
| **MapLibre GL** | Basemap Rendering | Open-source map rendering |

### **Backend**
| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Node.js** | Runtime | JavaScript on server |
| **Express** | Web Framework | Fast, minimal REST API |
| **TypeScript** | Type Safety | Type-safe backend code |
| **pg (node-postgres)** | Database Driver | Connect to PostgreSQL |
| **Multer** | File Uploads | Handle multipart/form-data |
| **csv-parser** | CSV Parsing | Parse CSV files to JSON |
| **Helmet** | Security | HTTP security headers |
| **CORS** | Cross-Origin | Allow frontend to call API |

### **Database**
| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **PostgreSQL 14+** | Database | Robust, SQL database |
| **PostGIS** | GIS Extension | Store/query geographic data |
| **GIST Indexes** | Spatial Indexing | Fast spatial queries |

---

## 🎨 Frontend Deep Dive

### **File Structure**
```
client/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component
│   ├── components/
│   │   ├── Dashboard.tsx           # Main dashboard layout
│   │   ├── Filters.tsx             # Sidebar filters
│   │   ├── CSVUpload.tsx           # CSV upload dialog
│   │   ├── ChartBuilder.tsx        # Chart creation wizard
│   │   ├── StatisticsPanel.tsx     # Stats display
│   │   └── visualizations/
│   │       ├── DynamicChart.tsx    # Smart chart router with filters
│   │       ├── LeafletMap.tsx      # Leaflet map component
│   │       ├── D3GeoMap.tsx        # D3 geographic projection
│   │       ├── Heatmap.tsx         # Leaflet heatmap
│   │       ├── DeckGLHexagonMap.tsx    # 3D hexagon aggregation
│   │       ├── DeckGLArcMap.tsx        # Arc/flow visualization
│   │       ├── DeckGLGridMap.tsx       # Grid aggregation
│   │       ├── DeckGLContourMap.tsx    # Contour lines
│   │       ├── DeckGLPathMap.tsx       # Path trajectories
│   │       ├── D3BarChart.tsx      # Bar chart
│   │       └── D3PieChart.tsx      # Pie chart
│   ├── services/
│   │   └── api.ts                  # API client functions
│   ├── store/
│   │   └── useDataStore.ts         # Zustand global state
│   └── styles/
│       └── global.css              # Global styles
├── index.html                      # HTML template
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
└── vite.config.ts                  # Vite config
```

### **Key Frontend Components Explained**

#### **1. Dashboard.tsx - The Main Hub**
```typescript
// Purpose: Central component that manages the entire app

Key Responsibilities:
- Layout (AppBar, Sidebar, Main Content)
- Chart management (create, display, remove, fullscreen)
- State management (loading, errors, snackbar notifications)
- Dialog management (CSV upload, Chart builder)
- Filter state per chart

State Variables:
- drawerOpen: Toggle sidebar
- createdCharts: Array of chart configs
- fullscreenChart: Currently fullscreened chart
- uploadDialogOpen: CSV upload dialog state
- chartBuilderOpen: Chart builder dialog state

Key Functions:
- handleCreateChart(): Add new chart to dashboard
- handleUpdateChartFilters(): Update filters for specific chart
- fetchData(): Get data from backend
```

#### **2. ChartBuilder.tsx - The Chart Wizard**
```typescript
// Purpose: 3-step wizard to create visualizations

Step 1: Choose Dataset
- Fetches all tables from database
- Shows table metadata (columns, size, has_geometry)

Step 2: Choose Chart Type
- Dynamically shows compatible chart types
- Filters based on data availability:
  * Maps require geometry columns
  * Charts require numeric columns
- 12 total chart types available

Step 3: Configure & Create
- Shows available columns
- Creates chart configuration
- Calls onCreateChart callback

Chart Types Array:
[
  'leaflet',           // Leaflet map
  'd3-geo',            // D3 geo projection
  'heatmap',           // Density heatmap
  'deckgl-scatter',    // Scatter plot
  'deckgl-hexagon',    // 3D hexagons
  'deckgl-grid',       // Screen grid
  'deckgl-arc',        // Arc lines
  'deckgl-path',       // Paths
  'deckgl-contour',    // Contour lines
  'bar-chart',         // Bar chart
  'pie-chart',         // Pie chart
  'table'              // Data table
]
```

#### **3. DynamicChart.tsx - Smart Chart Component**
```typescript
// Purpose: Renders any chart type with built-in filtering

Key Features:
1. Dynamic Chart Rendering
   - Switch statement routes to correct visualization
   - Validates data requirements (geometry, numeric)

2. Built-in Filter System
   - Fetches column values from backend
   - Smart filter UI:
     * Dropdown for ≤100 unique values
     * Text input for >100 values
   - Apply/Clear filter buttons
   - Shows filter count and record count

3. Data Fetching
   - Fetches table data with applied filters
   - Supports pagination (limit/offset)
   - Passes filters as URL params

Filter Logic:
- showFilters: Toggle filter panel
- localFilters: Temporary filter state
- columnValues: Unique values per column
- textColumns: Filterable columns
```

#### **4. CSVUpload.tsx - File Upload Handler**
```typescript
// Purpose: Upload CSV files and create database tables

Workflow:
1. User selects CSV file
2. Preview first 5 rows
3. Auto-detect lat/lng columns
4. User provides table name
5. Send to backend via FormData
6. Backend creates table with PostGIS geometry

Key Features:
- File validation
- CSV preview
- Auto-detect coordinates
- Progress indicator
- Error handling
```

---

## 🔧 Backend Deep Dive

### **File Structure**
```
server/
├── src/
│   └── index.ts                    # Main Express app
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript config
```

### **server/src/index.ts - Complete Breakdown**

#### **1. Setup & Configuration**
```typescript
// Import dependencies
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import multer from 'multer';

// Environment variables
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),  // Store in RAM
  limits: { fileSize: 50 * 1024 * 1024 }  // 50MB limit
});
```

#### **2. API Endpoints**

##### **Health Check**
```typescript
GET /api/health
// Returns: { status: 'ok', database: 'connected' }
// Purpose: Check if API and database are working
```

##### **Geospatial Data**
```typescript
GET /api/geospatial/data
Query Params:
  - county?: string
  - subCounty?: string
  - dataType?: 'all' | 'raw' | 'cleaned'

Response: {
  success: boolean,
  data: Array<{
    id, name, latitude, longitude, county, sub_county, ...
  }>
}

// SQL Query:
SELECT 
  id, name,
  ST_Y(geom) as latitude,    // Extract latitude from geometry
  ST_X(geom) as longitude,   // Extract longitude from geometry
  county, sub_county, type, data_quality
FROM facilities
WHERE [filters]
```

##### **Filter Values**
```typescript
GET /api/geospatial/filter-values/:column
// Returns unique values for a column
// Used to populate filter dropdowns

Example: /api/geospatial/filter-values/county
Response: ['Nairobi', 'Kajiado', 'Kiambu']
```

##### **Statistics**
```typescript
GET /api/geospatial/statistics
Response: {
  total_records: number,
  raw_count: number,
  cleaned_count: number,
  unique_counties: number
}
```

##### **Table Management**
```typescript
// List all tables
GET /api/tables/list
Response: [{
  table_name: string,
  column_count: number,
  has_geometry: boolean,
  size: string
}]

// Get table columns
GET /api/tables/:tableName/columns
Response: [{
  column_name: string,
  data_type: string,
  udt_name: string,
  is_nullable: string
}]

// Get column unique values (NEW!)
GET /api/tables/:tableName/column-values
Response: {
  county: ['Nairobi', 'Kajiado'],
  type: ['Hospital', 'Clinic']
}

// Get table data with filters
GET /api/tables/:tableName/data?county=Nairobi&type=Hospital
Response: {
  success: true,
  count: number,
  data: Array<any>,
  hasGeometry: boolean
}
```

##### **CSV Upload**
```typescript
POST /api/upload/csv
Content-Type: multipart/form-data
Body:
  - file: CSV file
  - tableName: string
  - latColumn: string
  - lngColumn: string

Process:
1. Parse CSV file
2. Filter empty columns
3. Sanitize column names
4. Create table with geometry column
5. Create GIST spatial index
6. Insert data with ST_MakePoint()

SQL:
CREATE TABLE tableName (
  id SERIAL PRIMARY KEY,
  column1 TEXT,
  column2 TEXT,
  geom GEOMETRY(Point, 4326),  // SRID 4326 = WGS84
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tableName_geom 
ON tableName USING GIST (geom);

INSERT INTO tableName (column1, geom)
VALUES ($1, ST_SetSRID(ST_MakePoint(lng, lat), 4326));
```

---

## 🗄️ Database & PostGIS

### **What is PostGIS?**
PostGIS is a PostgreSQL extension that adds support for geographic objects.

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Check PostGIS version
SELECT PostGIS_Version();
```

### **Geometry Types**
```sql
-- POINT - Single location
GEOMETRY(Point, 4326)

-- SRID 4326 = WGS84 (GPS coordinates)
-- Format: POINT(longitude latitude)
```

### **Spatial Functions**
```sql
-- Create a point from coordinates
ST_MakePoint(longitude, latitude)

-- Set the Spatial Reference ID
ST_SetSRID(geometry, 4326)

-- Extract coordinates
ST_X(geometry)  -- Get longitude
ST_Y(geometry)  -- Get latitude

-- Example:
INSERT INTO facilities (name, geom)
VALUES (
  'Hospital A',
  ST_SetSRID(ST_MakePoint(36.8219, -1.2921), 4326)
);

-- Query with coordinates
SELECT 
  name,
  ST_X(geom) as longitude,
  ST_Y(geom) as latitude
FROM facilities;
```

### **Spatial Indexing**
```sql
-- GIST Index for fast spatial queries
CREATE INDEX idx_facilities_geom 
ON facilities USING GIST (geom);

-- This makes these queries FAST:
-- - Distance calculations
-- - Bounding box searches
-- - Point-in-polygon queries
```

### **Example Table Structure**
```sql
CREATE TABLE kajiado_health_facilities (
  id SERIAL PRIMARY KEY,
  facility_name VARCHAR(255),
  facility_type VARCHAR(100),
  county VARCHAR(100),
  sub_county VARCHAR(100),
  geom GEOMETRY(Point, 4326),  -- PostGIS geometry
  beds INTEGER,
  staff INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Data Flow

### **CSV Upload Flow**
```
1. USER: Selects CSV file in browser
   └─> CSVUpload.tsx

2. FRONTEND: Parses CSV preview
   └─> Detects lat/lng columns
   └─> User confirms table name

3. FRONTEND: Creates FormData
   └─> Sends POST to /api/upload/csv

4. BACKEND: Receives file (Multer)
   └─> Parses CSV (csv-parser)
   └─> Sanitizes column names
   └─> Creates SQL CREATE TABLE query

5. DATABASE: Creates table
   └─> Adds GEOMETRY column
   └─> Creates GIST index

6. BACKEND: Inserts rows
   └─> Converts lat/lng to ST_Point
   └─> Returns success

7. FRONTEND: Shows success message
   └─> User can now create charts from this table
```

### **Chart Creation Flow**
```
1. USER: Clicks "Create New Chart"
   └─> ChartBuilder opens

2. STEP 1: Choose Dataset
   └─> GET /api/tables/list
   └─> Shows all tables

3. USER: Selects table
   └─> GET /api/tables/:tableName/columns
   └─> Detects has_geometry, numeric columns

4. STEP 2: Choose Chart Type
   └─> Filters compatible chart types
   └─> User selects "Leaflet Map"

5. STEP 3: Configure & Create
   └─> Calls onCreateChart(config)

6. DASHBOARD: Creates chart config
   └─> Adds to createdCharts array
   └─> Renders DynamicChart component

7. DYNAMICCHART: Fetches data
   └─> GET /api/tables/:tableName/data
   └─> Renders LeafletMap with data
```

### **Filter Flow**
```
1. USER: Clicks "Show Filters"
   └─> DynamicChart sets showFilters=true

2. DYNAMICCHART: Fetches column values
   └─> GET /api/tables/:tableName/column-values
   └─> Backend queries: SELECT DISTINCT column FROM table

3. FRONTEND: Renders filter UI
   └─> Dropdown if ≤100 values
   └─> Text input if >100 values

4. USER: Changes filter value
   └─> Updates localFilters state

5. USER: Clicks "Apply Filters"
   └─> Calls onFilterChange(localFilters)
   └─> Dashboard updates chart config

6. DYNAMICCHART: Re-fetches data
   └─> GET /api/tables/:tableName/data?county=Nairobi
   └─> Backend adds WHERE county = 'Nairobi'

7. FRONTEND: Re-renders chart
   └─> Shows filtered data
```

---

## 🎯 Key Features Explained

### **1. Dynamic Chart Type Detection**
```typescript
// In ChartBuilder.tsx
const getAvailableChartTypes = () => {
  const hasGeometry = selectedTable?.has_geometry;
  const hasNumeric = columns.some(c => 
    ['integer', 'numeric', 'real'].includes(c.data_type)
  );

  return chartTypes.filter(chart => {
    if (chart.requiresGeometry && !hasGeometry) return false;
    if (chart.requiresNumeric && !hasNumeric) return false;
    return true;
  });
};

// Result: Only shows compatible chart types!
```

### **2. Smart Filter System**
```typescript
// In DynamicChart.tsx

// Fetch unique values
GET /api/tables/:tableName/column-values

// Backend response:
{
  county: ['Nairobi', 'Kajiado', 'Kiambu'],  // 3 values
  name: ['Hosp A', 'Hosp B', ...],           // 500 values
  type: ['Hospital', 'Clinic']               // 2 values
}

// Frontend logic:
if (values.length > 0 && values.length <= 100) {
  // Render dropdown
  <Select>
    <MenuItem value="">All</MenuItem>
    {values.map(v => <MenuItem value={v}>{v}</MenuItem>)}
  </Select>
} else {
  // Render text input
  <TextField placeholder="Search..." />
}
```

### **3. Spatial Data Handling**
```typescript
// Backend converts geometry to lat/lng
if (geometryCol) {
  selectCols += `, 
    ST_X(${geometryCol.column_name}) as longitude, 
    ST_Y(${geometryCol.column_name}) as latitude`;
}

// Frontend receives:
{
  id: 1,
  name: 'Hospital',
  longitude: 36.8219,  // From ST_X
  latitude: -1.2921,   // From ST_Y
  county: 'Nairobi'
}

// Visualization uses longitude/latitude
<Marker position={[latitude, longitude]} />
```

### **4. Modular Visualization System**
```typescript
// Each visualization is a separate component
// DynamicChart routes to the right one

switch (chartType) {
  case 'leaflet':
    return <CustomLeafletMap data={data} />;
  
  case 'deckgl-hexagon':
    return <DeckGLHexagonMap data={data} />;
  
  case 'bar-chart':
    return <CustomBarChart data={data} />;
  
  // ... etc
}

// Each component receives data and renders independently
```

---

## 📊 Component Breakdown

### **Visualization Components**

#### **LeafletMap.tsx**
```typescript
Purpose: Traditional 2D interactive map with markers

Technology: Leaflet.js (in iframe)

Features:
- OpenStreetMap tiles
- Circle markers for each point
- Click popups with data
- Auto-zoom to fit all points
- Clustering for many points

Data Required:
- latitude: number
- longitude: number
```

#### **DeckGLHexagonMap.tsx**
```typescript
Purpose: 3D hexagonal aggregation visualization

Technology: deck.gl HexagonLayer

Features:
- Aggregates points into hexagons
- 3D height based on density
- Color gradient (blue → red)
- Rotatable 3D view
- Pitch/bearing controls

Best For:
- Visualizing density
- Large datasets (1000+ points)
- Understanding clusters
```

#### **Heatmap.tsx**
```typescript
Purpose: Density heatmap overlay

Technology: Leaflet + leaflet.heat plugin

Features:
- Color gradient (blue → red)
- Intensity based on data
- Blur effect
- Adjustable radius

Best For:
- Showing concentration areas
- Heat distribution
- Identifying hotspots
```

#### **D3GeoMap.tsx**
```typescript
Purpose: Geographic projection map with D3

Technology: D3.js geoMercator projection

Features:
- SVG-based rendering
- Zoom and pan
- Graticule (grid lines)
- Custom projections
- Tooltips

Best For:
- Custom map projections
- SVG-based rendering
- Print-quality maps
```

---

## 🔐 Security & Best Practices

### **Backend Security**
```typescript
// 1. Helmet - HTTP security headers
app.use(helmet());

// 2. CORS - Restrict origins
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

// 3. SQL Injection Prevention
// Using parameterized queries
pool.query(
  'SELECT * FROM table WHERE id = $1',
  [userId]  // Prevents SQL injection
);

// 4. File Upload Limits
limits: { fileSize: 50 * 1024 * 1024 }  // 50MB

// 5. Column Name Sanitization
columnName.replace(/[^a-zA-Z0-9_]/g, '_')
```

### **Error Handling**
```typescript
try {
  const result = await pool.query(query);
  res.json({ success: true, data: result.rows });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  });
}
```

---

## 🚀 Performance Optimizations

### **1. Database Indexing**
```sql
-- GIST index for spatial queries
CREATE INDEX idx_geom ON facilities USING GIST (geom);

-- B-tree indexes for filters
CREATE INDEX idx_county ON facilities(county);
CREATE INDEX idx_type ON facilities(type);
```

### **2. Query Limits**
```typescript
// Always limit results
LIMIT $1 OFFSET $2

// Default: 1000 rows
const { limit = '1000', offset = '0' } = req.query;
```

### **3. Connection Pooling**
```typescript
// PostgreSQL connection pool
const pool = new Pool({
  max: 20,  // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### **4. Frontend Optimizations**
```typescript
// React.memo for expensive components
const LeafletMap = React.memo(({ data }) => {
  // Only re-renders if data changes
});

// useEffect dependencies
useEffect(() => {
  fetchData();
}, [tableName, filters]);  // Only refetch when these change
```

---

## 📝 Summary

### **What You Built**
✅ Full-stack TypeScript application  
✅ PostgreSQL + PostGIS integration  
✅ CSV upload with automatic table creation  
✅ 12 different visualization types  
✅ Dynamic filtering system  
✅ Professional UI with Material-UI  
✅ Responsive design  
✅ Real-time data visualization  

### **Key Technologies Mastered**
- React with TypeScript
- Express REST API
- PostgreSQL/PostGIS spatial queries
- Leaflet & deck.gl mapping
- D3.js data visualization
- File upload handling
- Dynamic SQL query building
- State management with Zustand

### **Architecture Patterns Used**
- **Component-Based UI**: Modular, reusable React components
- **RESTful API**: Standard HTTP methods and endpoints
- **Connection Pooling**: Efficient database connections
- **Error Boundaries**: Graceful error handling
- **Responsive Design**: Mobile-friendly layouts
- **Type Safety**: TypeScript throughout

---

## 🎓 Next Steps

To extend this project, you could add:
1. User authentication & authorization
2. Dashboard saving/sharing
3. Real-time data updates (WebSockets)
4. Export to PDF/PNG
5. Advanced spatial queries (within polygon, distance)
6. Data transformation pipelines
7. Custom color schemes
8. Chart annotations
9. Multiple data source support
10. Scheduled data refreshes

**You now have a production-ready geospatial visualization platform!** 🎉

