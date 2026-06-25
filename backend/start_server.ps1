# AgriXplain FastAPI Backend Startup Script for PowerShell

Write-Host "Starting AgriXplain FastAPI Backend..." -ForegroundColor Green
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
python --version
Write-Host ""

# Start server
Write-Host "Starting server on 0.0.0.0:8000 (reachable from ESP32 / LAN). Local: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

