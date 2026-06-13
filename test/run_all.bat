@echo off
echo ================================================
echo PostgreSQL Database Operations Script
echo ================================================
echo.

REM Set the Python executable path
set PYTHON_EXE="C:/Users/Melvin M Shajan/AppData/Local/Programs/Python/Python313/python.exe"

REM Set the working directory
cd /d "c:\Users\Melvin M Shajan\Desktop\test"

echo [Step 1] Listing all databases and tables...
echo ------------------------------------------------
%PYTHON_EXE% "main.py"

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to list databases and tables
    pause
    exit /b 1
)

echo.
echo [Step 2] Uploading CSV data to datastuff database...
echo ------------------------------------------------
%PYTHON_EXE% "upload_csv.py"

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to upload CSV data
    pause
    exit /b 1
)

echo.
echo [Step 3] Verifying upload by listing databases and tables again...
echo ------------------------------------------------
%PYTHON_EXE% "main.py"

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to verify upload
    pause
    exit /b 1
)

echo.
echo ================================================
echo All operations completed successfully!
echo ================================================
echo.
echo Summary:
echo - Connected to PostgreSQL database
echo - Listed all databases and tables
echo - Uploaded sales.csv to datastuff database
echo - Verified the upload was successful
echo.
pause