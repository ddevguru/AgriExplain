@echo off
echo Starting AgriXplain FastAPI Backend...
echo.

cd /d %~dp0

echo Checking Python...
python --version
echo.

echo Starting server on all interfaces LAN can reach — use your PC LAN IP from ipconfig .
echo Local browser: http://localhost:8000   ESP32: http://YOUR_PC_IP:8000
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause

