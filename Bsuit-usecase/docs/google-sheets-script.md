# 📊 Google Sheets Formatting Script

Use this Google Apps Script to automatically format your benchmark CSV data after importing it into Google Sheets.

## ✨ Features
*   **Auto-formatting**: Bolds headers and applies a professional color scheme.
*   **Auto-resize**: Adjusts column widths to fit content.
*   **Heatmap**: Applies color scaling to the "Average" column (Green = Fast, Red = Slow).
*   **Chart Generation**: Automatically creates a bar chart comparing engine performance.

## 🚀 How to Use

1.  **Import CSV**: Open Google Sheets, go to `File > Import > Upload` and select your benchmark CSV.
2.  **Open Script Editor**: Go to `Extensions > Apps Script`.
3.  **Paste Code**: Delete any existing code and paste the script below.
4.  **Save & Run**: Click the Save icon (💾), then click "Run". You may need to authorize the script.
5.  **Enjoy**: Switch back to your sheet to see the formatted data and chart!

## 📜 The Script

```javascript
/**
 * Formats the benchmark results and creates a comparison chart.
 */
function formatBenchmarkResults() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow < 2) {
    Browser.msgBox("No data found to format.");
    return;
  }

  // --- 1. Header Formatting ---
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setFontWeight("bold")
             .setBackground("#2c3e50") // Dark Blue/Grey
             .setFontColor("#ffffff")
             .setHorizontalAlignment("center");
  
  // Freeze top row
  sheet.setFrozenRows(1);

  // --- 2. Column Auto-resize ---
  sheet.autoResizeColumns(1, lastCol);

  // --- 3. Conditional Formatting (Heatmap) for Average Column ---
  // Assuming "Average (ms)" is the 8th column (Column H)
  var avgColIndex = 8; 
  var avgRange = sheet.getRange(2, avgColIndex, lastRow - 1, 1);
  
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .setGradientMinpoint("#2ecc71") // Green (Fast)
    .setGradientMidpoint("#f1c40f") // Yellow
    .setGradientMaxpoint("#e74c3c") // Red (Slow)
    .setRanges([avgRange])
    .build();
    
  var rules = sheet.getConditionalFormatRules();
  rules.push(rule);
  sheet.setConditionalFormatRules(rules);

  // --- 4. Create Comparison Chart ---
  // Check if chart already exists to avoid duplicates
  var charts = sheet.getCharts();
  if (charts.length === 0) {
    var chart = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange(1, 2, lastRow, 1)) // Engine Name (Column B)
      .addRange(sheet.getRange(1, 8, lastRow, 1)) // Average Time (Column H)
      .setPosition(2, lastCol + 2, 0, 0) // Place chart to the right of data
      .setOption('title', 'Benchmark Results: Average Execution Time (ms)')
      .setOption('hAxis.title', 'Time (ms)')
      .setOption('vAxis.title', 'Engine')
      .setOption('legend', {position: 'none'})
      .build();
      
    sheet.insertChart(chart);
  }
}
```
