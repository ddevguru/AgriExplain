# Backend Deployment Guide

## Local Development

### 1. Setup Python Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure MySQL Database
```bash
mysql -u root -p
CREATE DATABASE agrixplain;
EXIT;

mysql -u root -p agrixplain < schema.sql
```

### 3. Environment Variables (.env)
```
DATABASE_URL=mysql+mysqlconnector://root:your_password@localhost:3306/agrixplain
SECRET_KEY=your-secret-key-change-this
FLASK_ENV=development
```

### 4. Train ML Model
```bash
python train_model.py
# Generates: rf_model.pkl, explainer.pkl, training_data.csv
```

### 5. Run Flask App
```bash
python app.py
# Access: http://localhost:5000
```

## Production Deployment

### Option 1: Render.com
1. Create Render account
2. Connect GitHub repository
3. Create Web Service, select Python
4. Set build command: `pip install -r requirements.txt && python train_model.py`
5. Set start command: `gunicorn -c gunicorn.conf.py app:app`
6. Add environment variables in Render dashboard
7. Connect MySQL database (Railway or Render)

### Option 2: Heroku (Legacy)
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set DATABASE_URL="mysql+..."
heroku run python train_model.py
```

### Option 3: Railway.app
1. Connect GitHub repo
2. Select Python
3. Add MySQL plugin for database
4. Set environment variables
5. Deploy automatically on push

### Option 4: AWS EC2 + RDS
1. Launch EC2 instance (Ubuntu 22.04)
2. SSH into instance:
```bash
sudo apt update && sudo apt install python3-pip python3-venv mysql-client
git clone your-repo
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 train_model.py
gunicorn -c gunicorn.conf.py app:app
```
3. Use AWS RDS for MySQL database
4. Set security groups to allow port 5000

## Database Backup & Restore

### Backup
```bash
mysqldump -u root -p agrixplain > backup.sql
```

### Restore
```bash
mysql -u root -p agrixplain < backup.sql
```

## Monitoring

### Health Check
```bash
curl http://localhost:5000/health
# Response: {"status": "healthy"}
```

### Check API
```bash
curl -X GET "http://localhost:5000/api/admin-dashboard"
```

### Post Test Data
```bash
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-12-30T23:00:00Z",
    "farm_id": "farm1",
    "crop": "Rice",
    "sensors": {
      "temperature": 28.5,
      "humidity": 75.2,
      "soil_moisture": 45,
      "rainfall_mm": 2.3,
      "ph": 6.8,
      "light_lux": 850,
      "water_level_cm": 65,
      "npk": {"N": 90, "P": 42, "K": 43},
      "water_flow_lph": 12.5,
      "wind_kmh": 8.2
    }
  }'
```

## Troubleshooting

### MySQL Connection Error
- Check credentials in .env
- Verify MySQL is running: `mysql -u root -p -e "SELECT 1"`
- Test connection string

### Model File Not Found
- Ensure `train_model.py` was run successfully
- Check `rf_model.pkl` exists in backend folder
- If missing, run training script again

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### CORS Errors
- Ensure Flask-CORS is installed: `pip install flask-cors`
- Verify `CORS(app)` in app.py before routes

### Rate Limiting
- Default: 10 requests per minute per IP
- Change in app.py: `@limiter.limit("20 per minute")`

## Security Checklist

- [ ] Change SECRET_KEY in .env
- [ ] Use strong database password
- [ ] Enable HTTPS in production
- [ ] Set FLASK_ENV=production
- [ ] Use environment variables for all secrets
- [ ] Enable SQL injection protection (SQLAlchemy parameterized queries)
- [ ] Set CORS to specific domains, not "*"
- [ ] Enable firewall rules
- [ ] Regular database backups
- [ ] Monitor error logs