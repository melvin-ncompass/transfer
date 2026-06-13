/**
 * Creates and downloads a CSV file with the provided headers and rows
 * @param filename Name of the file to download
 * @param headers Array of column headers
 * @param rows Array of row data (each row is an array of values)
 */
export function downloadCSV(filename: string, headers: string[], rows: Array<Array<unknown>>): void {
    // Convert headers and rows to CSV format
    const csvContent = [
        headers.join(','),
        ...rows.map(row => 
            row.map(cell => {
                // Handle special characters and commas in cell values
                const value = String(cell ?? '');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
