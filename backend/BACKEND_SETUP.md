# Backend Setup Guide

## 🎯 Important: Which Backend to Use?

Project mein **2 backend files** hain:

1. **`main.py`** - FastAPI backend (Main/Recommended) ✅
2. **`app.py`** - Flask backend (Legacy/Optional)

**Recommendation:** `main.py` (FastAPI) use karein - yeh main backend hai.

---

## 🚀 FastAPI Backend Setup (`main.py`)

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Environment Variables

`.env` file create karein:

```env
DATABASE_URL=mysql+mysqlconnector://root:password@localhost/agrixplain
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Step 3: Database Setup

```bash
# MySQL database create karein
mysql -u root -p
CREATE DATABASE agrixplain;
exit;
```

### Step 4: Run Backend

```bash
# Option 1: Uvicorn directly (host 0.0.0.0 so ESP32 / phones on LAN can POST)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Option 2: Using script
python main.py

# Option 3: Using start script (Windows)
.\start_server.bat
```

### Step 5: Verify

- Browser mein: http://localhost:8000/docs
- API documentation dikhna chahiye

---

## 🔧 Flask Backend Setup (`app.py`) - Optional

Agar Flask backend use karna ho to:

### Step 1: Install Flask Dependencies

```bash
pip install flask flask-cors flask-sqlalchemy flask-limiter
```

Ya requirements.txt se:

```bash
pip install -r requirements.txt
```

### Step 2: Run Flask Backend

```bash
python app.py
```

### Step 3: Verify

- Browser mein: http://localhost:5000/health
- `{"status": "healthy"}` response dikhna chahiye

---

## 🐛 Common Issues & Solutions

### Issue 1: Import Error - `db` from models

**Problem:**
```
ImportError: cannot import name 'db' from 'models'
```

**Solution:**
- `main.py` use karein (FastAPI) - recommended
- Ya `app.py` ko fix karein (already fixed)

### Issue 2: Database Connection Error

**Problem:**
```
Error connecting to database
```

**Solution:**
- MySQL server running hona chahiye
- `.env` file mein correct DATABASE_URL
- Database create karein

### Issue 3: Module Not Found

**Problem:**
```
ModuleNotFoundError: No module named 'xxx'
```

**Solution:**
```bash
pip install -r requirements.txt
```

### Issue 4: Port Already in Use

**Problem:**
```
Address already in use
```

**Solution:**
- Different port use karein: `--port 8001`
- Ya running process ko stop karein

---

## 📋 Quick Start Commands

### FastAPI (Recommended)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Flask (Optional)

```bash
cd backend
pip install flask flask-cors flask-sqlalchemy flask-limiter
python app.py
```

---

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] `.env` file created
- [ ] Database created
- [ ] Backend running
- [ ] API accessible (http://localhost:8000/docs)
- [ ] No import errors
- [ ] Database connection working

---

**Main Backend:** `main.py` (FastAPI) ✅
**Legacy Backend:** `app.py` (Flask) - Optional

