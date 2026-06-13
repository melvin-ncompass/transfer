# PostgreSQL Database Operations PowerShell Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Database Operations Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Set the Python executable path
$PythonExe = "C:/Users/Melvin M Shajan/AppData/Local/Programs/Python/Python313/python.exe"

# Set the working directory
Set-Location "c:\Users\Melvin M Shajan\Desktop\test"

# Function to run Python script with error handling
function Run-PythonScript {
    param(
        [string]$ScriptName,
        [string]$Description
    )
    
    Write-Host "[$Description]" -ForegroundColor Yellow
    Write-Host "------------------------------------------------" -ForegroundColor Gray
    
    try {
        & $PythonExe $ScriptName
        if ($LASTEXITCODE -ne 0) {
            throw "Python script exited with code $LASTEXITCODE"
        }
        Write-Host "✓ $Description completed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ ERROR: $Description failed" -ForegroundColor Red
        Write-Host "Error details: $_" -ForegroundColor Red
        Read-Host "Press Enter to continue or Ctrl+C to exit"
        return $false
    }
    Write-Host ""
    return $true
}

# Step 1: List databases and tables
$step1Success = Run-PythonScript "main.py" "Step 1 - Listing all databases and tables"

if (-not $step1Success) {
    Write-Host "Stopping execution due to Step 1 failure" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Upload CSV data
$step2Success = Run-PythonScript "upload_csv.py" "Step 2 - Uploading CSV data to datastuff database"

if (-not $step2Success) {
    Write-Host "Stopping execution due to Step 2 failure" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Verify upload
$step3Success = Run-PythonScript "main.py" "Step 3 - Verifying upload by listing databases and tables"

if (-not $step3Success) {
    Write-Host "Warning: Step 3 failed, but upload may have been successful" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "All operations completed!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "- ✓ Connected to PostgreSQL database" -ForegroundColor Green
Write-Host "- ✓ Listed all databases and tables" -ForegroundColor Green
Write-Host "- ✓ Uploaded sales.csv to datastuff database" -ForegroundColor Green
Write-Host "- ✓ Verified the upload was successful" -ForegroundColor Green
Write-Host ""

# Optional: Show final statistics
Write-Host "Would you like to see detailed sales data statistics? (y/n): " -NoNewline -ForegroundColor Yellow
$response = Read-Host
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "Fetching detailed statistics..." -ForegroundColor Yellow
    
    # Create a quick stats query script
    $statsScript = @"
import psycopg2

def show_detailed_stats():
    conn_params = {
        'host': 'localhost',
        'port': '5432',
        'user': 'postgres',
        'password': 'Password',
        'database': 'datastuff'
    }
    
    try:
        connection = psycopg2.connect(**conn_params)
        cursor = connection.cursor()
        
        # Detailed statistics
        cursor.execute('''
            SELECT 
                COUNT(*) as total_records,
                COUNT(DISTINCT customer_id) as unique_customers,
                COUNT(DISTINCT product_id) as unique_products,
                COUNT(DISTINCT store_id) as unique_stores,
                MIN(sale_date) as earliest_sale,
                MAX(sale_date) as latest_sale,
                SUM(quantity) as total_quantity_sold,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_sale_amount,
                MIN(total_amount) as min_sale,
                MAX(total_amount) as max_sale
            FROM sales;
        ''')
        
        stats = cursor.fetchone()
        
        print("\n" + "="*60)
        print("DETAILED SALES DATA STATISTICS")
        print("="*60)
        print(f"Total Records: {stats[0]:,}")
        print(f"Unique Customers: {stats[1]:,}")
        print(f"Unique Products: {stats[2]:,}")
        print(f"Unique Stores: {stats[3]:,}")
        print(f"Date Range: {stats[4]} to {stats[5]}")
        print(f"Total Quantity Sold: {stats[6]:,} units")
        print(f"Total Revenue: ${stats[7]:,.2f}")
        print(f"Average Sale Amount: ${stats[8]:.2f}")
        print(f"Smallest Sale: ${stats[9]:.2f}")
        print(f"Largest Sale: ${stats[10]:.2f}")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"Error fetching statistics: {e}")

if __name__ == "__main__":
    show_detailed_stats()
"@
    
    $statsScript | Out-File -FilePath "temp_stats.py" -Encoding UTF8
    & $PythonExe "temp_stats.py"
    Remove-Item "temp_stats.py" -Force
}

Write-Host ""
Read-Host "Press Enter to exit"