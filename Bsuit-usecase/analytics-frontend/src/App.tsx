import { useState } from 'react';
import { analyticsApi, EngineType, AnalyticsResponse, BenchmarkResponse } from './api/analytics';

type QueryType = 'revenue-by-merchant' | 'daily-transactions' | 'customer-spending' | 'category-distribution' | 'status-summary' | 'simple-1m' | 'simple-5' | 'simple-100k';

interface QueryOption {
    id: QueryType;
    title: string;
    description: string;
    rowsAffected: string;
}

interface EngineOption {
    id: EngineType;
    label: string;
    shortLabel: string;
    type: 'local' | 'docker';
    color: string;
}

const QUERY_OPTIONS: QueryOption[] = [
    { id: 'revenue-by-merchant', title: 'Revenue by Merchant', description: 'Top merchants by total revenue', rowsAffected: '~100K' },
    { id: 'daily-transactions', title: 'Daily Transactions', description: 'Transaction volume by day', rowsAffected: '~365' },
    { id: 'customer-spending', title: 'Customer Spending', description: 'Top customers by spending', rowsAffected: '~1M' },
    { id: 'category-distribution', title: 'Category Distribution', description: 'Transactions by category', rowsAffected: '~10' },
    { id: 'status-summary', title: 'Status Summary', description: 'Transaction status breakdown', rowsAffected: '~5' },
    { id: 'simple-1m', title: 'Simple SELECT 1M', description: 'Simple SELECT query', rowsAffected: '1M' },
    { id: 'simple-5', title: 'Simple SELECT 5', description: 'Simple SELECT query', rowsAffected: '5' },
    { id: 'simple-100k', title: 'Simple SELECT 100K', description: 'Simple SELECT query', rowsAffected: '100K' },
];

const ENGINES: EngineOption[] = [
    { id: 'postgresql-docker', label: 'PostgreSQL Docker', shortLabel: 'PG Docker', type: 'docker', color: 'postgresql' },
    { id: 'clickhouse-docker', label: 'ClickHouse Docker', shortLabel: 'CH Docker', type: 'docker', color: 'clickhouse' },
    { id: 'duckdb-docker', label: 'DuckDB Docker', shortLabel: 'Duck Docker', type: 'docker', color: 'duckdb' },
];

/**
 * SQL Query mapping for each query type
 */
const SQL_QUERIES: Record<string, string> = {
    'revenue-by-merchant': 'Includes join and aggregation on transaction and merchant table',
    'daily-transactions': 'Basic aggregation on a day transaction table',
    'customer-spending': 'Includes join and aggregation on transaction and customer table',
    'category-distribution': '~ 100k',
    'status-summary': '~ 10M basic aggregation on transaction table',
    'simple-1m': 'SELECT * FROM transactions LIMIT 1000000',
    'simple-5': 'SELECT * FROM transactions LIMIT 5',
    'simple-100k': 'SELECT * FROM transactions LIMIT 100000',
};

/**
 * Generates a Google Apps Script to format and visualize benchmark results.
 * Includes data directly in the script to allow for easy copy-pasting.
 */
const generateGoogleAppsScript = (benchmarkResult: BenchmarkResponse): string => {
    const queryOption = QUERY_OPTIONS.find(q => q.id === benchmarkResult.queryType);
    const queryName = queryOption?.title || benchmarkResult.queryType;
    const rowsAffected = queryOption?.rowsAffected || '';
    const sqlQuery = SQL_QUERIES[benchmarkResult.queryType] || 'N/A';

    // Prepare data rows with SQL query column
    const dataRows = benchmarkResult.results.map(result => {
        const engineLabel = ENGINES.find(e => e.id === result.engine)?.label || result.engine;
        const runs = result.runs || [];
        const run1 = runs[0] || '';
        const run2 = runs[1] || '';
        const run3 = runs[2] || '';
        const run4 = runs[3] || '';
        const run5 = runs[4] || '';
        const average = result.average ? Number(result.average.toFixed(2)) : '';

        return [`${queryName} (${rowsAffected})`, sqlQuery, engineLabel, run1, run2, run3, run4, run5, average];
    });

    // Serialize data for injection into the script
    const serializedData = JSON.stringify(dataRows);

    return `function formatBenchmarkResults() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  // Data to append
  var data = ${serializedData};
  
  if (lastRow <= 1) {
    // --- INITIAL SETUP (Headers + Data + Formatting + Chart) ---
    
    // 1. Add Headers with professional formatting
    var headers = [['Query Type (Rows Affected)', 'SQL Query', 'Engine', 'Run 1 (ms)', 'Run 2 (ms)', 'Run 3 (ms)', 'Run 4 (ms)', 'Run 5 (ms)', 'Average (ms)']];
    sheet.getRange(1, 1, 1, 9).setValues(headers);
    
    // 2. Add Data
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, 9).setValues(data);
    }
    
    var lastCol = 9;
    var newLastRow = sheet.getLastRow();

    // 3. Header Formatting - Purple background with white text
    var headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange.setFontWeight("bold")
      .setBackground("#5b4a9c")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);
    
    sheet.setFrozenRows(1);
    
    // Auto-resize columns for optimal display
    sheet.autoResizeColumns(1, 2); // Auto-resize Query Type and SQL Query
    sheet.setColumnWidth(3, 150); // Engine column
    sheet.setColumnWidths(4, 5, 80); // Run columns (4-8)
    sheet.setColumnWidth(9, 100); // Average column

    // 4. Apply borders to all cells
    if (newLastRow > 1) {
      var allDataRange = sheet.getRange(2, 1, newLastRow - 1, lastCol);
      allDataRange.setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);
    }

    // 5. Merge Query Type and SQL Query cells for each benchmark group
    // Each query produces 3 rows (one per engine), so merge vertically
    var currentRow = 2;
    var groupIndex = 0; // Counter for alternating colors
    
    while (currentRow <= newLastRow) {
      var queryType = sheet.getRange(currentRow, 1).getValue();
      var groupSize = 0;
      
      // Count consecutive rows with same query type
      for (var i = currentRow; i <= newLastRow; i++) {
        if (sheet.getRange(i, 1).getValue() === queryType) {
          groupSize++;
        } else {
          break;
        }
      }
      
      if (groupSize > 1) {
        // Merge Query Type column (column 1)
        sheet.getRange(currentRow, 1, groupSize, 1).merge();
        
        // Merge SQL Query column (column 2)
        sheet.getRange(currentRow, 2, groupSize, 1).merge();
        
        // Center align merged cells
        sheet.getRange(currentRow, 1, groupSize, 1).setVerticalAlignment("middle");
        sheet.getRange(currentRow, 2, groupSize, 1).setVerticalAlignment("middle");
        
        // Apply alternating background color to group for visual separation
        // Apply to columns 1-8 only (not Average column 9, which needs green highlighting)
        var groupColor = (groupIndex % 2 === 0) ? "#ffffff" : "#f3f3f3";
        sheet.getRange(currentRow, 1, groupSize, 8).setBackground(groupColor);
      }
      
      currentRow += groupSize;
      groupIndex++; // Increment for next group
    }

    // 6. Find and highlight fastest average per query group with green background
    var uniqueQueries = {};
    for (var i = 2; i <= newLastRow; i++) {
      var queryType = sheet.getRange(i, 1).getValue();
      var avgValue = sheet.getRange(i, 9).getValue();
      
      if (!uniqueQueries[queryType] || avgValue < uniqueQueries[queryType].min) {
        uniqueQueries[queryType] = { min: avgValue, row: i };
      }
    }
    
    for (var query in uniqueQueries) {
      var fastestRow = uniqueQueries[query].row;
      sheet.getRange(fastestRow, 9).setBackground("#d9ead3");
    }

    // 7. Heatmap for Average (Column I) - 3-color gradient scale PER GROUP
    // Apply gradient separately to each query group for better visualization
    var rules = sheet.getConditionalFormatRules();
    
    // Reset to row 2 and loop through each group again to apply gradients
    currentRow = 2;
    groupIndex = 0;
    
    while (currentRow <= newLastRow) {
      var queryType = sheet.getRange(currentRow, 1).getValue();
      var groupSize = 0;
      
      // Count consecutive rows with same query type
      for (var i = currentRow; i <= newLastRow; i++) {
        if (sheet.getRange(i, 1).getValue() === queryType) {
          groupSize++;
        } else {
          break;
        }
      }
      
      // Apply gradient to this group's average column only
      if (groupSize > 0) {
        var avgRange = sheet.getRange(currentRow, 9, groupSize, 1);
        
        var rule = SpreadsheetApp.newConditionalFormatRule()
          .setGradientMinpointWithValue("#2ecc71", SpreadsheetApp.InterpolationType.MIN, "")
          .setGradientMidpointWithValue("#f1c40f", SpreadsheetApp.InterpolationType.PERCENTILE, "50")
          .setGradientMaxpointWithValue("#e74c3c", SpreadsheetApp.InterpolationType.MAX, "")
          .setRanges([avgRange])
          .build();
          
        rules.push(rule);
      }
      
      currentRow += groupSize;
      groupIndex++;
    }
    
    sheet.setConditionalFormatRules(rules);

    // 8. Create Professional Chart
    var chart = sheet.newChart().setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange(1, 3, newLastRow, 1))  // Engine column
      .addRange(sheet.getRange(1, 9, newLastRow, 1))  // Average column
      .setPosition(2, lastCol + 2, 0, 0)
      .setOption('title', 'Performance Comparison: Average Execution Time')
      .setOption('hAxis', {title: 'Time (milliseconds)'})
      .setOption('legend', {position: 'none'})
      .setOption('colors', ['#6366f1'])
      .build();
    sheet.insertChart(chart);
    
    SpreadsheetApp.getUi().alert(
      '✅ Success!',
      'Benchmark results formatted successfully!\\n\\n' +
      '📊 Features Applied:\\n' +
      '  • Professional headers with purple theme\\n' +
      '  • Cell merging for query groups\\n' +
      '  • Alternating row colors\\n' +
      '  • Green highlight for fastest times\\n' +
      '  • 3-color gradient heatmap\\n' +
      '  • Performance comparison chart\\n\\n' +
      'You can now run this script again to append more benchmark data!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } else {
    // --- APPEND MODE (Data Only) ---
    
    if (data.length > 0) {
      var appendStartRow = lastRow + 1;
      sheet.getRange(appendStartRow, 1, data.length, 9).setValues(data);
      
      // Apply borders to newly appended data
      var newDataRange = sheet.getRange(appendStartRow, 1, data.length, 9);
      newDataRange.setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);
      
      // Process merging and coloring for the ENTIRE sheet from scratch
      var updatedLastRow = sheet.getLastRow();
      
      // First, unmerge all cells in columns 1 and 2 to avoid conflicts
      var col1Range = sheet.getRange(2, 1, updatedLastRow - 1, 1);
      var col2Range = sheet.getRange(2, 2, updatedLastRow - 1, 1);
      
      // Unmerge if there are any merged cells
      try {
        col1Range.breakApart();
        col2Range.breakApart();
      } catch (e) {
        // No merged cells, skip
      }
      
      // Now merge and color groups
      var currentRow = 2;
      var groupIndex = 0;
      
      while (currentRow <= updatedLastRow) {
        var queryType = sheet.getRange(currentRow, 1).getValue();
        var groupSize = 0;
        
        // Count consecutive rows with same query type
        for (var i = currentRow; i <= updatedLastRow; i++) {
          if (sheet.getRange(i, 1).getValue() === queryType) {
            groupSize++;
          } else {
            break;
          }
        }
        
        if (groupSize > 1) {
          // Merge Query Type column (column 1)
          sheet.getRange(currentRow, 1, groupSize, 1).merge();
          
          // Merge SQL Query column (column 2)
          sheet.getRange(currentRow, 2, groupSize, 1).merge();
          
          // Center align merged cells
          sheet.getRange(currentRow, 1, groupSize, 1).setVerticalAlignment("middle");
          sheet.getRange(currentRow, 2, groupSize, 1).setVerticalAlignment("middle");
          
          // Apply alternating background color (columns 1-8 only, not Average column)
          var groupColor = (groupIndex % 2 === 0) ? "#ffffff" : "#f3f3f3";
          sheet.getRange(currentRow, 1, groupSize, 8).setBackground(groupColor);
        }
        
        currentRow += groupSize;
        groupIndex++;
      }
      
      // Re-apply fastest highlighting logic after append
      var uniqueQueries = {};
      
      for (var i = 2; i <= updatedLastRow; i++) {
        var queryType = sheet.getRange(i, 1).getValue();
        var avgValue = sheet.getRange(i, 9).getValue();
        
        if (!uniqueQueries[queryType] || avgValue < uniqueQueries[queryType].min) {
          uniqueQueries[queryType] = { min: avgValue, row: i };
        }
      }
      
      // Clear previous green highlights in average column
      sheet.getRange(2, 9, updatedLastRow - 1, 1).setBackground(null);
      
      // Apply new green highlights
      for (var query in uniqueQueries) {
        var fastestRow = uniqueQueries[query].row;
        sheet.getRange(fastestRow, 9).setBackground("#d9ead3");
      }
      
      // Re-apply gradient heatmap PER GROUP (not entire column)
      var rules = sheet.getConditionalFormatRules();
      
      // Clear existing gradient rules and rebuild
      var newRules = [];
      
      // Loop through each group and apply gradient
      currentRow = 2;
      groupIndex = 0;
      
      while (currentRow <= updatedLastRow) {
        var queryType = sheet.getRange(currentRow, 1).getValue();
        var groupSize = 0;
        
        for (var i = currentRow; i <= updatedLastRow; i++) {
          if (sheet.getRange(i, 1).getValue() === queryType) {
            groupSize++;
          } else {
            break;
          }
        }
        
        if (groupSize > 0) {
          var avgRange = sheet.getRange(currentRow, 9, groupSize, 1);
          
          var rule = SpreadsheetApp.newConditionalFormatRule()
            .setGradientMinpointWithValue("#2ecc71", SpreadsheetApp.InterpolationType.MIN, "")
            .setGradientMidpointWithValue("#f1c40f", SpreadsheetApp.InterpolationType.PERCENTILE, "50")
            .setGradientMaxpointWithValue("#e74c3c", SpreadsheetApp.InterpolationType.MAX, "")
            .setRanges([avgRange])
            .build();
            
          newRules.push(rule);
        }
        
        currentRow += groupSize;
        groupIndex++;
      }
      
      sheet.setConditionalFormatRules(newRules);
      
      SpreadsheetApp.getUi().alert(
        '✅ Data Appended!',
        '' + data.length + ' new rows added successfully!\\n\\n' +
        'All formatting has been refreshed:\\n' +
        '  • Merged cells updated\\n' +
        '  • Row colors reapplied\\n' +
        '  • Fastest times recalculated',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert('⚠️ No data to append.');
    }
  }
}`;
};


/**
 * Main application component.
 * Orchestrates the analytics dashboard, including engine selection, query execution, and result visualization.
 */
function App() {
    const [selectedEngine, setSelectedEngine] = useState<EngineType>('postgresql-docker');
    const [selectedQuery, setSelectedQuery] = useState<QueryType>('status-summary');
    const [result, setResult] = useState<AnalyticsResponse | null>(null);
    const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [benchmarking, setBenchmarking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, engine: '' });

    /**
     * Executes the selected query on the selected engine.
     */
    const executeQuery = async () => {
        setLoading(true);
        setError(null);
        setBenchmarkResult(null);
        setProgress({ current: 0, total: 1, engine: selectedEngine });

        try {
            let response: AnalyticsResponse;

            switch (selectedQuery) {
                case 'revenue-by-merchant':
                    response = await analyticsApi.getRevenueByMerchant(selectedEngine);
                    break;
                case 'daily-transactions':
                    response = await analyticsApi.getDailyTransactions(selectedEngine);
                    break;
                case 'customer-spending':
                    response = await analyticsApi.getCustomerSpending(selectedEngine);
                    break;
                case 'category-distribution':
                    response = await analyticsApi.getCategoryDistribution(selectedEngine);
                    break;
                case 'status-summary':
                    response = await analyticsApi.getStatusSummary(selectedEngine);
                    break;
                case 'simple-1m':
                    response = await analyticsApi.getSimple1M(selectedEngine);
                    break;
                case 'simple-5':
                    response = await analyticsApi.getSimple5(selectedEngine);
                    break;
                case 'simple-100k':
                    response = await analyticsApi.getSimple100K(selectedEngine);
                    break;
                default:
                    throw new Error('Unknown query type');
            }

            setProgress({ current: 1, total: 1, engine: selectedEngine });
            setResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Runs the selected query across all available engines to benchmark performance.
     */
    const runBenchmark = async () => {
        setBenchmarking(true);
        setError(null);
        setResult(null);
        const totalRuns = ENGINES.length * 5; // 3 engines × 5 runs each
        setProgress({ current: 0, total: totalRuns, engine: '' });

        try {
            const results: any[] = [];
            let currentRun = 0;

            // Run each engine 5 times
            for (let i = 0; i < ENGINES.length; i++) {
                const engine = ENGINES[i];
                const runs: number[] = [];

                for (let runNum = 1; runNum <= 5; runNum++) {
                    setProgress({
                        current: currentRun,
                        total: totalRuns,
                        engine: `${engine.label} (Run ${runNum}/5)`
                    });

                    try {
                        let response: AnalyticsResponse;
                        switch (selectedQuery) {
                            case 'revenue-by-merchant':
                                response = await analyticsApi.getRevenueByMerchant(engine.id);
                                break;
                            case 'daily-transactions':
                                response = await analyticsApi.getDailyTransactions(engine.id);
                                break;
                            case 'customer-spending':
                                response = await analyticsApi.getCustomerSpending(engine.id);
                                break;
                            case 'category-distribution':
                                response = await analyticsApi.getCategoryDistribution(engine.id);
                                break;
                            case 'status-summary':
                                response = await analyticsApi.getStatusSummary(engine.id);
                                break;
                            case 'simple-1m':
                                response = await analyticsApi.getSimple1M(engine.id);
                                break;
                            case 'simple-5':
                                response = await analyticsApi.getSimple5(engine.id);
                                break;
                            case 'simple-100k':
                                response = await analyticsApi.getSimple100K(engine.id);
                                break;
                            default:
                                response = await analyticsApi.getStatusSummary(engine.id);
                                break;
                        }

                        if (!response.error && response.executionTimeMs) {
                            runs.push(response.executionTimeMs);
                        }
                    } catch (err) {
                        console.error(`Run ${runNum} failed for ${engine.label}: `, err);
                    }

                    currentRun++;
                }

                // Calculate average
                const average = runs.length > 0
                    ? runs.reduce((sum, time) => sum + time, 0) / runs.length
                    : null;

                results.push({
                    engine: engine.id,
                    runs: runs,
                    average: average,
                    success: runs.length > 0,
                    error: runs.length === 0 ? 'All runs failed' : null,
                });
            }

            setProgress({ current: totalRuns, total: totalRuns, engine: 'Complete' });

            // Find fastest average
            const successfulResults = results.filter(r => r.success && r.average);
            successfulResults.sort((a, b) => a.average - b.average);

            setBenchmarkResult({
                queryType: selectedQuery,
                timestamp: new Date().toISOString(),
                results,
                fastest: successfulResults.length > 0 ? successfulResults[0].engine : null,
                comparison: generateComparison(results),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Benchmark failed');
        } finally {
            setBenchmarking(false);
        }
    };

    /**
     * Exports benchmark results to CSV format
     */
    const exportBenchmarkToCSV = () => {
        if (!benchmarkResult) return;

        const queryName = QUERY_OPTIONS.find(q => q.id === benchmarkResult.queryType)?.title || benchmarkResult.queryType;
        const rows = benchmarkResult.results.map(result => {
            const engineLabel = getEngineLabel(result.engine);
            const runs = result.runs || [];
            const run1 = runs[0] || '';
            const run2 = runs[1] || '';
            const run3 = runs[2] || '';
            const run4 = runs[3] || '';
            const run5 = runs[4] || '';
            const average = result.average ? result.average.toFixed(2) : '';

            return `${queryName},${engineLabel},${run1},${run2},${run3},${run4},${run5},${average} `;
        });

        const csvContent = [
            'Query Type,Engine,Run 1 (ms),Run 2 (ms),Run 3 (ms),Run 4 (ms),Run 5 (ms),Average (ms)',
            ...rows
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

        link.setAttribute('href', url);
        link.setAttribute('download', `benchmark_${benchmarkResult.queryType}_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Generates a text summary comparing benchmark results.
     */
    const generateComparison = (results: any[]): string => {
        const successful = results.filter(r => r.success && r.average);
        if (successful.length === 0) return 'No successful executions';

        const fastest = Math.min(...successful.map(r => r.average));
        const fastestEngine = successful.find(r => r.average === fastest);

        return `Fastest Average: ${getEngineLabel(fastestEngine?.engine)} at ${fastest.toFixed(2)} ms`;
    };

    const getEngineLabel = (engineId: string | undefined): string => {
        if (!engineId) return 'Unknown';
        const engine = ENGINES.find(e => e.id === engineId);
        return engine ? engine.label : engineId;
    };

    const getEngineShortLabel = (engineId: string): string => {
        const engine = ENGINES.find(e => e.id === engineId);
        return engine ? engine.shortLabel : engineId;
    };

    const formatNumber = (num: number | string | null | undefined): string => {
        if (num === null || num === undefined) return 'N/A';
        const n = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(n)) return String(num);
        return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    };

    const formatCurrency = (num: number | string | null | undefined): string => {
        if (num === null || num === undefined) return 'N/A';
        const n = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(n)) return String(num);
        return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const renderDataTable = (data: any[]) => {
        if (!data || data.length === 0) {
            return <div className="empty-state">No data to display</div>;
        }

        const columns = Object.keys(data[0]);

        return (
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col}>{col.replace(/_/g, ' ')}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 50).map((row, idx) => (
                            <tr key={idx}>
                                {columns.map((col) => (
                                    <td key={col}>
                                        {typeof row[col] === 'number' || (typeof row[col] === 'string' && !isNaN(parseFloat(row[col])))
                                            ? col.includes('amount') || col.includes('revenue') || col.includes('spent')
                                                ? formatCurrency(row[col])
                                                : formatNumber(row[col])
                                            : row[col] instanceof Date
                                                ? row[col].toLocaleDateString()
                                                : String(row[col] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    // Get query icon
    const getQueryIcon = (queryId: QueryType): string => {
        const icons: Record<QueryType, string> = {
            'revenue-by-merchant': '💰',
            'daily-transactions': '📊',
            'customer-spending': '👤',
            'category-distribution': '🏷️',
            'status-summary': '📋',
            'simple-1m': '⚡',
            'simple-5': '⚡',
            'simple-100k': '⚡'
        };
        return icons[queryId] || '📊';
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">⚡ Analytics Engine Benchmark</h1>
                <p className="app-subtitle">Compare PostgreSQL, ClickHouse & DuckDB Performance</p>

                {/* Stats Summary */}
                <div style={{
                    display: 'flex',
                    gap: '24px',
                    justifyContent: 'center',
                    marginTop: '24px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        padding: '12px 24px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>{ENGINES.length}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Engines</div>
                    </div>
                    <div style={{
                        padding: '12px 24px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{QUERY_OPTIONS.length}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Query Types</div>
                    </div>
                    <div style={{
                        padding: '12px 24px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>5</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Benchmark Runs</div>
                    </div>
                </div>
            </header>

            <div className="main-grid">
                <div className="controls-panel">
                    {/* Engine Selector */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Select Engine</h2>
                        </div>

                        <div className="engine-group">
                            <span className="engine-group-label">🐳 Docker</span>
                            <div className="engine-selector">
                                {ENGINES.map((engine) => (
                                    <button
                                        key={engine.id}
                                        className={`engine-button ${selectedEngine === engine.id ? `active ${engine.color}` : ''} `}
                                        onClick={() => setSelectedEngine(engine.id)}
                                        title={engine.label}
                                    >
                                        <span className="engine-indicator" />
                                        {engine.shortLabel}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Query Selector */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Select Query</h2>
                        </div>
                        <div className="query-grid">
                            {QUERY_OPTIONS.map((query) => (
                                <button
                                    key={query.id}
                                    className={`query-button ${selectedQuery === query.id ? 'active' : ''} `}
                                    onClick={() => setSelectedQuery(query.id)}
                                >
                                    <span className="query-button-title">
                                        <span style={{ fontSize: '20px', marginRight: '8px' }}>{getQueryIcon(query.id)}</span>
                                        {query.title}
                                        <span className="rows-badge">{query.rowsAffected}</span>
                                    </span>
                                    <span className="query-button-desc">{query.description}</span>
                                </button>
                            ))}
                        </div>

                        <div className="action-buttons">
                            <button
                                className="btn btn-primary"
                                onClick={executeQuery}
                                disabled={loading || benchmarking}
                            >
                                {loading ? 'Executing...' : '▶ Execute Query'}
                            </button>
                            <button
                                className="btn btn-benchmark"
                                onClick={runBenchmark}
                                disabled={loading || benchmarking}
                            >
                                {benchmarking ? 'Running...' : '🏁 Benchmark All 3'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="results-panel">
                    {error && (
                        <div className="card">
                            <div className="error-message">{error}</div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {(loading || benchmarking) && (
                        <div className="card progress-card">
                            <div className="progress-header">
                                <span className="progress-title">
                                    {benchmarking ? `Testing: ${progress.engine} ` : `Querying: ${getEngineLabel(selectedEngine)} `}
                                </span>
                                <span className="progress-text">
                                    {benchmarking ? `${progress.current} / ${progress.total} engines` : 'Processing...'}
                                </span >
                            </div >
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${loading ? 100 : progressPercentage}%` }}
                                />
                            </div>
                            <div className="progress-details">
                                <span className="spinner-small" />
                                <span>{benchmarking ? 'Running benchmark across all engines...' : 'Executing query...'}</span>
                            </div>
                        </div >
                    )}

                    {/* Benchmark Results */}
                    {
                        benchmarkResult && !benchmarking && (
                            <div className="card">
                                <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                                    <h2 className="card-title" style={{ marginRight: 'auto' }}>🏆 Benchmark Results</h2>
                                    <button
                                        className="btn btn-primary"
                                        onClick={exportBenchmarkToCSV}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <span>📥</span>Export to CSV
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            if (!benchmarkResult) return;
                                            const script = generateGoogleAppsScript(benchmarkResult);
                                            navigator.clipboard.writeText(script).then(() => {
                                                alert("✅ Apps Script copied to clipboard!\n\n1. Open Google Sheets\n2. Go to Extensions > Apps Script\n3. Paste and Run");
                                            });
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <span>📜</span>Get Apps Script
                                    </button>
                                </div>
                                <div className="benchmark-grid">
                                    {benchmarkResult.results.map((res: any) => {
                                        const isFastest = res.success && res.engine === benchmarkResult.fastest;
                                        return (
                                            <div
                                                key={res.engine}
                                                className={`benchmark-card ${isFastest ? 'fastest' : ''} ${!res.success ? 'error' : ''}`}
                                            >
                                                {isFastest && <div className="fastest-badge">🏆 FASTEST</div>}
                                                <div className="benchmark-engine-name">
                                                    {getEngineShortLabel(res.engine)}
                                                </div>
                                                <div className="benchmark-engine-type">
                                                    {res.engine.includes('docker') ? 'Docker' : 'Local'}
                                                </div>
                                                {res.success ? (
                                                    <>
                                                        <div className="benchmark-time">
                                                            {res.average ? formatNumber(res.average) : 'N/A'}
                                                            <span className="benchmark-time-unit">ms avg</span>
                                                        </div>
                                                        <div className="benchmark-rows">
                                                            {res.runs?.length || 0} runs
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="benchmark-error-text">
                                                        {res.error?.substring(0, 50) || 'Failed'}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="benchmark-summary">
                                    {benchmarkResult.comparison}
                                </div>
                            </div>
                        )
                    }

                    {/* Single Query Results */}
                    {
                        result && !loading && !benchmarkResult && (
                            <div className="card results-section">
                                <div className="results-header">
                                    <h2 className="card-title">Query Results</h2>
                                    <div className="results-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">Engine</span>
                                            <span className="meta-value engine">{getEngineLabel(result.engine)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">Time</span>
                                            <span className="meta-value time">{result.executionTimeMs}ms</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">Rows</span>
                                            <span className="meta-value">{formatNumber(result.rowCount)}</span>
                                        </div>
                                    </div>
                                </div>
                                {result.error ? (
                                    <div className="error-message">{result.error}</div>
                                ) : (
                                    renderDataTable(result.data)
                                )}
                            </div>
                        )
                    }

                    {
                        !result && !benchmarkResult && !loading && !benchmarking && !error && (
                            <div className="card empty-card">
                                <div className="empty-state">
                                    <div className="empty-icon">📊</div>
                                    <h3>Ready to Benchmark</h3>
                                    <p>Select an engine and query, then click Execute or Benchmark</p>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >
        </div >
    );
}

export default App;
