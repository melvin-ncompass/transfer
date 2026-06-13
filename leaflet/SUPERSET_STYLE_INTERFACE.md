# Superset-Style Chart Builder Interface

## Overview
Completely redesigned chart builder to match Apache Superset's professional interface with a split-view layout, live preview, and organized configuration panels.

## Key Features

### 1. **Split-View Layout**
- **Left Panel (400px)**: Configuration controls
- **Right Panel (Full remaining width)**: Live chart preview
- **Top Bar**: Dataset/Chart type selection and Save button
- **Full-screen dialog** for maximum workspace

### 2. **Configuration Panels**

#### Top Section: Dataset & Chart Selection
```
┌─────────────────────────────────────────┐
│ Dataset:    [Select Dataset ▼]         │
│             nyc  [Geo]                  │
│                                         │
│ Chart Type: [Heatmap (Deck.GL) ▼]      │
└─────────────────────────────────────────┘
```
- Dropdown for dataset selection
- Geo badge for geospatial tables
- Chart type dropdown with all visualization options

#### Tabbed Interface
**Two Tabs:**
1. **Data** - Configure data sources and metrics
2. **Customize** - Visual appearance settings

---

### 3. **Data Tab**

#### ▶ Columns (Expandable Accordion)
```
┌─────────────────────────────────────────┐
│ ▼ Columns                               │
├─────────────────────────────────────────┤
│ Longitude: [raw_longitude ▼]           │
│ Latitude:  [raw_latitude ▼]            │
└─────────────────────────────────────────┘
```
- Auto-detects lat/lng columns
- Required fields

#### ▶ Metrics (Expandable Accordion)
```
┌─────────────────────────────────────────┐
│ ▼ Metrics                               │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Function: [AVG ▼]  [🗑️]            │ │
│ │ Column:   [raw_tp ▼]               │ │
│ │ Label:    Average Precipitation     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Add Metric]                          │
└─────────────────────────────────────────┘
```
- Multiple metrics supported
- Functions: AVG, SUM, COUNT, MIN, MAX
- Custom labels
- Add/remove metrics dynamically

#### ▶ Filters (Expandable Accordion)
```
┌─────────────────────────────────────────┐
│ ▼ Filters                               │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Column: [raw_valid_time ▼]         │ │
│ │ [>=]  [2024-11-05]  [🗑️]           │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Column: [raw_valid_time ▼]         │ │
│ │ [<=]  [2024-11-06]  [🗑️]           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Add Filter]                          │
└─────────────────────────────────────────┘
```
- Multiple filters
- Operators: =, !=, >, <, >=, <=, LIKE, IN
- Column types shown
- Dynamic add/remove

#### ▶ Row Limit (Expandable Accordion)
```
┌─────────────────────────────────────────┐
│ ▶ Row Limit                             │
├─────────────────────────────────────────┤
│ [10000]                                 │
└─────────────────────────────────────────┘
```
- Performance control
- Default: 10,000 rows

---

### 4. **Customize Tab**

**For Heatmaps:**
```
┌─────────────────────────────────────────┐
│ ▼ Intensity                             │
├─────────────────────────────────────────┤
│ [1.0]                                   │
│ Controls the brightness (0.1 - 10)      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ▼ Intensity Radius                      │
├─────────────────────────────────────────┤
│ [70]                                    │
│ Radius in pixels (1 - 500)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ▶ Data Options                          │
├─────────────────────────────────────────┤
│ ☑ Ignore null locations                │
└─────────────────────────────────────────┘
```

**For Scatter Maps:**
```
┌─────────────────────────────────────────┐
│ ▼ Color Column                          │
├─────────────────────────────────────────┤
│ [Column ▼]                              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ▶ Size Column                           │
├─────────────────────────────────────────┤
│ [Column ▼]                              │
└─────────────────────────────────────────┘
```

---

### 5. **Bottom Action Button**
```
┌─────────────────────────────────────────┐
│ [▶ Run Query]                           │
└─────────────────────────────────────────┘
```
- Fetches data and updates preview
- Disabled until required fields filled
- Shows "Running..." during execution

---

### 6. **Top Bar**
```
┌────────────────────────────────────────────────────────┐
│ Create Chart         [💾 Save Chart]  [✕]             │
└────────────────────────────────────────────────────────┘
```
- **Save Chart**: Creates the configured chart
  - Disabled until all required fields complete
- **Close (X)**: Cancel and close builder

---

### 7. **Right Panel - Live Preview**

**States:**

1. **No Preview**
```
┌─────────────────────────────────────────┐
│                                         │
│         No Preview Available            │
│                                         │
│ Configure your chart and click          │
│ "Run Query" to see a preview            │
│                                         │
└─────────────────────────────────────────┘
```

2. **Loading**
```
┌─────────────────────────────────────────┐
│                                         │
│               ⏳                        │
│                                         │
└─────────────────────────────────────────┘
```

3. **Chart Preview**
```
┌─────────────────────────────────────────┐
│                                         │
│  [Live Interactive Chart Rendering]     │
│                                         │
│  - Pan/Zoom enabled                     │
│  - Full visualization                   │
│  - Updates when "Run Query" clicked     │
│                                         │
└─────────────────────────────────────────┘
```

---

## User Workflow

1. **Click "Create Chart"** in dashboard
2. **Select Dataset** from dropdown
   - Auto-detects lat/lng columns
3. **Select Chart Type** (Heatmap, Scatter, etc.)
4. **Configure Data** (Data Tab)
   - Verify/adjust columns
   - Add metrics (optional)
   - Add filters (optional)
   - Set row limit
5. **Customize Appearance** (Customize Tab)
   - Adjust visualization-specific settings
6. **Click "Run Query"**
   - See live preview on the right
7. **Iterate** - Adjust settings and re-run
8. **Click "Save Chart"** when satisfied

---

## Comparison to Original

### Before (Wizard Style):
- 4-step linear wizard
- Can't see chart until saved
- Navigate back/forth through steps
- All configuration on one screen

### After (Superset Style):
- ✅ Split-view with live preview
- ✅ Organized accordion sections
- ✅ Two focused tabs (Data vs. Customize)
- ✅ Run Query for instant feedback
- ✅ Save only when satisfied
- ✅ Professional interface
- ✅ More intuitive organization

---

## Technical Implementation

### Component: `SupersetChartBuilder.tsx`

**State Management:**
```typescript
- selectedTable: string
- selectedChartType: string
- columns: Column[]
- config: ChartConfiguration
  - longitudeColumn
  - latitudeColumn
  - metrics: Metric[]
  - filters: Filter[]
  - rowLimit
  - intensity, intensityRadius
  - colorColumn, sizeColumn
- previewData: any[]
- activeTab: 0 | 1 (Data | Customize)
```

**Key Methods:**
- `fetchTables()`: Load available datasets
- `fetchColumns()`: Load columns for selected dataset
- `addMetric()` / `updateMetric()` / `removeMetric()`
- `addFilter()` / `updateFilter()` / `removeFilter()`
- `handleRunQuery()`: Fetch data and show preview
- `handleSaveChart()`: Save configuration to dashboard

---

## Benefits

### For Users:
✅ **Professional Interface** - Looks and feels like enterprise BI tools
✅ **Live Preview** - See results before saving
✅ **Better Organization** - Logical grouping in accordions
✅ **Faster Iteration** - Run Query → Adjust → Run again
✅ **More Control** - Multiple metrics and filters
✅ **Clear Workflow** - Data configuration separate from customization

### For Developers:
✅ **Clean Architecture** - Separated concerns
✅ **Reusable** - Easy to extend with new chart types
✅ **Type Safe** - Full TypeScript support
✅ **Maintainable** - Well-organized code structure

---

## Future Enhancements

- [ ] Add SQL query view tab
- [ ] Save as template functionality
- [ ] Chart preview thumbnails
- [ ] Advanced filter UI with AND/OR grouping
- [ ] Time series specific controls
- [ ] Export preview data
- [ ] Keyboard shortcuts
- [ ] Undo/Redo configuration changes


