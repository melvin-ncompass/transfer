import { useMemo } from 'react';

// Custom lightweight CSV parser to correctly respect commas inside quoted columns
function parseCSV(csvString: string): string[][] {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentVal = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvString.length; i++) {
        const char = csvString[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < csvString.length && csvString[i + 1] === '"') {
                    currentVal += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentVal += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentLine.push(currentVal);
                currentVal = '';
            } else if (char === '\n' || char === '\r') {
                if (char === '\r' && i + 1 < csvString.length && csvString[i + 1] === '\n') {
                    i++;
                }
                currentLine.push(currentVal);
                lines.push(currentLine);
                currentLine = [];
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
    }
    currentLine.push(currentVal);
    // Push final line if non-empty
    if (currentLine.length > 0 && currentLine.some(v => v !== '')) {
        lines.push(currentLine);
    }
    return lines;
}

export function CsvViewer({ data }: { data: string }) {
    const rows = useMemo(() => parseCSV(data), [data]);
    if (rows.length === 0) return null;

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const handleDownload = () => {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,255,170,0.03) 100%)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(0,255,170,0.12)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: '16px',
            overflowX: 'auto',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* TOOLBAR */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <span className="text-white/40 text-xs font-semibold">
                    {dataRows.length} rows &middot; {headers.length} columns
                </span>
                <button 
                    onClick={handleDownload}
                    className="hover:bg-teal-500/10 transition-colors"
                    style={{
                        border: '1px solid rgba(0,255,170,0.4)',
                        color: '#a8ffd8',
                        background: 'rgba(0,255,170,0.06)',
                        borderRadius: '20px',
                        padding: '5px 14px',
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}
                >
                    Download CSV
                </button>
            </div>

            {/* TABLE CONTAINER */}
            <div className="overflow-auto flex-1 rounded-lg border border-white/5 custom-scrollbar">
                <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
                    <thead className="sticky top-0 z-10" style={{ background: 'rgba(0,255,170,0.08)' }}>
                        <tr>
                            {headers.map((header, idx) => (
                                <th 
                                    key={idx} 
                                    style={{
                                        color: '#a8ffd8',
                                        fontWeight: 600,
                                        fontSize: '12px',
                                        textTransform: 'uppercase',
                                        padding: '10px 14px',
                                        borderBottom: '1px solid rgba(255,255,255,0.04)'
                                    }}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dataRows.map((row, rowIdx) => (
                            <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                {headers.map((_, colIdx) => (
                                    <td 
                                        key={colIdx} 
                                        style={{
                                            color: 'rgba(255,255,255,0.85)',
                                            fontSize: '13px',
                                            padding: '10px 14px'
                                        }}
                                    >
                                        {row[colIdx]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
