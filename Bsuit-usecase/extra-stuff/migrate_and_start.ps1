$ErrorActionPreference = "Stop"

Write-Host "Starting Docker environment..."
docker-compose down -v # Ensure clean slate
docker-compose up -d --build

Write-Host "Waiting for Postgres Docker to be ready..."
Start-Sleep -Seconds 15

Write-Host "Seeding Docker Database with synthetic data..."
# Check if python is available
if (Get-Command python -ErrorAction SilentlyContinue) {
    python seed_docker.py
} else {
    Write-Warning "Python not found. Please run 'python seed_docker.py' manually to seed the database."
}

Write-Host "Environment Setup Complete."
docker-compose ps
