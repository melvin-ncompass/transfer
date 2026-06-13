# Data Format Requirements: GeoJSON vs Lat/Long

## Overview

This document explains the data format requirements for different map visualization types across Leaflet, D3.js, Deck.GL, and Plotly.

---

## Data Format Requirements by Visualization Type

| Visualization Type | Required Data Format | Example Data Structure |
|-------------------|---------------------|------------------------|
| **Choropleth** | 🗺️ **GeoJSON Required** (Polygon/MultiPolygon) | Need region boundaries + properties for coloring |
| **Contour** | 📍 **Lat/Long Points** (with values) | Array of {lat, lon, value} - library generates contours |
| **Heatmap** | 📍 **Lat/Long Points** (optional intensity) | Array of {lat, lon, intensity} |
| **Path Map** | 📍 **Lat/Long Arrays** OR 🗺️ GeoJSON LineString | Array of coordinate pairs or GeoJSON |
| **Scatter Map** | 📍 **Lat/Long Points** | Array of {lat, lon, properties} |

---

## Detailed Format Requirements by Library

| Library | Choropleth | Contour | Heatmap | Path Map | Scatter Map |
|---------|------------|---------|---------|----------|-------------|
| **Leaflet** | 🗺️ GeoJSON | 📍 Lat/Long | 📍 Lat/Long | 📍 Lat/Long or 🗺️ GeoJSON | 📍 Lat/Long |
| **D3.js** | 🗺️ GeoJSON or TopoJSON | 📍 Lat/Long | 📍 Lat/Long | 📍 Lat/Long or 🗺️ GeoJSON | 📍 Lat/Long |
| **Deck.GL** | 🗺️ GeoJSON | 📍 Lat/Long | 📍 Lat/Long | 📍 Lat/Long or 🗺️ GeoJSON | 📍 Lat/Long |
| **Plotly** | 🗺️ GeoJSON | 📍 Lat/Long | 📍 Lat/Long | 📍 Lat/Long | 📍 Lat/Long |

---

## Data Format Examples

### 📍 Lat/Long Format (Simple Points)

**Used for**: Scatter, Heatmap, Contour

```json
[
  {"lat": 40.7128, "lon": -74.0060, "value": 25},
  {"lat": 34.0522, "lon": -118.2437, "value": 30},
  {"lat": 41.8781, "lon": -87.6298, "value": 20}
]
```

---

### 📍 Lat/Long Arrays (Paths/Lines)

**Used for**: Path Maps, Lines

```json
[
  [40.7128, -74.0060],
  [34.0522, -118.2437],
  [41.8781, -87.6298]
]
```

**Alternative Format:**
```json
{
  "path1": [
    {"lat": 40.7128, "lng": -74.0060},
    {"lat": 34.0522, "lng": -118.2437}
  ]
}
```

---

### 🗺️ GeoJSON Format (Polygons/Regions)

**Used for**: Choropleth (required)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-74.0, 40.7],
          [-74.1, 40.7],
          [-74.1, 40.8],
          [-74.0, 40.8],
          [-74.0, 40.7]
        ]]
      },
      "properties": {
        "name": "Region Name",
        "value": 100,
        "population": 5000000
      }
    }
  ]
}
```

---

## Quick Decision Guide
