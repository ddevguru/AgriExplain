# Quick Start Guide - Backend Server

## Windows PowerShell में Server Start करने के लिए:

### Option 1: PowerShell Script (Recommended)
```powershell
cd backend
.\start_server.ps1
```

### Option 2: Batch File
```cmd
cd backend
start_server.bat
```

### Option 3: Direct Command
```powershell
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Important Notes:

1. **Python Path Issue**: अगर `uvicorn` command नहीं चल रहा, तो `python -m uvicorn` use करें

2. **Port Check**: अगर port 8000 already use हो रहा है:
   ```powershell
   python -m uvicorn main:app --reload --port 8001
   ```
   फिर frontend में `.env.local` में URL change करें

3. **Database Setup**: पहले database setup करें:
   ```sql
   mysql -u root -p < schema.sql
   ```

4. **Models Training**: पहली बार models train करें:
   ```powershell
   python train_all_models.py
   ```

## Server Running होने के बाद:

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Troubleshooting:

**Error: Module not found**
```powershell
pip install -r requirements.txt
```

**Error: Port already in use**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000
# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Error: Database connection failed**
- MySQL service check करें
- `.env` file में DATABASE_URL verify करें

