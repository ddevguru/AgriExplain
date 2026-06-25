# AgriXplain FastAPI Backend

Complete backend implementation for AgriXplain Smart Farming Platform with all ML models and features.

## Features

- ✅ User Authentication (Signup/Login with JWT)
- ✅ Real-time Sensor Data Processing
- ✅ Multi-Crop Yield Prediction (Random Forest, XGBoost, Bayesian)
- ✅ SHAP-based Explainability
- ✅ Bayesian Uncertainty Estimation
- ✅ Farmer-Friendly Advisories (English/Marathi)
- ✅ Weather API Integration
- ✅ Model Comparison
- ✅ Historical Data Tracking

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup MySQL Database

```bash
# Create database and tables
mysql -u root -p < schema.sql
```

Or manually:
```sql
CREATE DATABASE agrixplain;
USE agrixplain;
# Then run schema.sql
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=mysql+mysqlconnector://root:password@localhost/agrixplain
SECRET_KEY=your-secret-key-change-in-production
WEATHER_API_KEY=your-weather-api-key-optional
```

### 4. Train ML Models

```bash
python train_all_models.py
```

This will create:
- `rf_model.pkl` - Random Forest model
- `xgb_model.pkl` - XGBoost model
- `bayes_model.pkl` - Bayesian Ridge model
- `shap_rf.pkl` - SHAP explainer for RF
- `shap_xgb.pkl` - SHAP explainer for XGBoost
- `label_encoder.pkl` - Label encoder
- `training_data.csv` - Training dataset

### 5. Run the Server

```bash
# Development (0.0.0.0 lets ESP32 POST to your PC LAN IP)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production (no reload)
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login (returns JWT token)
- `GET /api/auth/me` - Get current user info

### Sensors
- `POST /api/sensors` - Receive sensor data from IoT
- `GET /api/sensors/latest?farm_id={id}` - Get latest sensor readings

### Predictions
- `POST /api/predictions` - Get yield prediction
- `GET /api/predictions/latest?farm_id={id}` - Get latest prediction

### Dashboard
- `GET /api/dashboard?farm_id={id}` - Get complete dashboard data

### SHAP
- `POST /api/shap` - Get SHAP feature importance

### Historical Data
- `GET /api/history?farm_id={id}&days=7` - Get historical data

### Model Comparison
- `GET /api/models/comparison` - Get model performance metrics

### Advisories
- `GET /api/advisories?farm_id={id}&language=en` - Get farmer advisories

### Weather
- `GET /api/weather?farm_id={id}` - Get weather forecast

## Testing

Test the API with curl:

```bash
# Signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -F "username=test@example.com" \
  -F "password=test123"

# Get dashboard (replace TOKEN with actual token)
curl -X GET http://localhost:8000/api/dashboard?farm_id=farm1 \
  -H "Authorization: Bearer TOKEN"
```

## Model Training

The training script generates 2200 synthetic samples for 7 crops:
- Rice, Wheat, Maize, Cotton, Tomato, Sugarcane, Potato

Features used:
- N, P, K (nutrients)
- Temperature, Humidity, pH
- Rainfall, Soil Moisture, Light Intensity

Output classes: High, Medium, Low yield

## Database Schema

- `users` - User accounts
- `farms` - Farm information
- `sensors` - Sensor readings with predictions
- `prediction_history` - Historical predictions

## Notes

- Models are loaded on startup
- SHAP explainers are created for tree-based models
- Bayesian model provides uncertainty estimates
- Advisories support English and Marathi languages

