from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
import os
from dotenv import load_dotenv

from database import SessionLocal, engine, Base
from sqlalchemy import inspect, text
from models import User, SensorReading, Farm, PredictionHistory
from schemas import (
    UserCreate, UserResponse, Token, SensorData, PredictionResponse,
    DashboardResponse, SHAPResponse, AdvisoryResponse, ModelComparisonResponse,
    HistoricalDataResponse, WeatherResponse, SensorDataResponse, PredictionDataResponse,
    UserLocationUpdate
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, authenticate_user
)
from ml_models import MLModelManager
from weather_api import WeatherService
from advisories import AdvisoryService
from admin_endpoints import router as admin_router
from camera_processor import apply_thermal_colormap, diagnose_plant, get_temperature_zones
from stream_processor import process_stream_frame, apply_thermal_to_frame
from fastapi.responses import StreamingResponse, JSONResponse
import cv2
import numpy as np
import requests
from io import BytesIO
import threading
from collections import deque
from models import CameraImage, PlantDiagnosis
from schemas import CameraUploadRequest, CameraResponse, PlantDiagnosisRequest, PlantDiagnosisResponse

load_dotenv()

app = FastAPI(title="AgriXplain API", version="1.0.0")

# Include admin router
app.include_router(admin_router)

# CORS — include 127.0.0.1 variants (browsers treat them as a different origin than "localhost")
_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    # LAN access (so the app works when opened via PC IPv4)
    "http://10.119.60.137:3000",
    "http://10.119.60.137:3001",
]
_ORIGIN_SET = frozenset(_CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Ensure browser clients still receive CORS headers on 500 (otherwise the
    console shows a misleading 'blocked by CORS' while the real fault is a
    server-side error).
    """
    import logging

    logging.exception("Unhandled API error: %s", exc)
    headers = {}
    origin = request.headers.get("origin")
    if origin and origin in _ORIGIN_SET:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers,
    )

# Initialize database
Base.metadata.create_all(bind=engine)


def ensure_user_location_columns():
    """Best-effort auto-migration for user location columns on existing DBs."""
    inspector = inspect(engine)
    try:
        existing = {col["name"] for col in inspector.get_columns("users")}
    except Exception:
        return

    dialect = engine.dialect.name
    if dialect == "mysql":
        type_float = "FLOAT"
        type_datetime = "DATETIME"
        type_varchar = "VARCHAR(30)"
    elif dialect == "postgresql":
        type_float = "DOUBLE PRECISION"
        type_datetime = "TIMESTAMP"
        type_varchar = "VARCHAR(30)"
    else:
        type_float = "REAL"
        type_datetime = "DATETIME"
        type_varchar = "TEXT"

    required = {
        "location_lat": type_float,
        "location_lng": type_float,
        "location_accuracy": type_float,
        "location_source": type_varchar,
        "location_updated_at": type_datetime,
    }

    with engine.begin() as conn:
        for col_name, col_type in required.items():
            if col_name in existing:
                continue
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
            except Exception:
                # Ignore if migration cannot be applied automatically
                pass


ensure_user_location_columns()

# Initialize ML models and services
ml_manager = MLModelManager()
weather_service = WeatherService()
advisory_service = AdvisoryService()

# Stream diagnosis cache (thread-safe)
stream_diagnosis_cache = {}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def resolve_npk(sensor_data: SensorData):
    """Use device-provided NPK if available, otherwise fallback to crop defaults."""
    if (
        sensor_data.npk_n is not None
        and sensor_data.npk_p is not None
        and sensor_data.npk_k is not None
    ):
        return {
            "N": float(sensor_data.npk_n),
            "P": float(sensor_data.npk_p),
            "K": float(sensor_data.npk_k),
        }
    return ml_manager.get_npk_for_crop(sensor_data.crop)


def get_camera_ip_for_farm(farm_id: str) -> Optional[str]:
    """
    Resolve ESP32 camera IP per farm.
    Priority:
    1) ESP32_CAMERA_IP_<FARM_ID> (e.g., ESP32_CAMERA_IP_FARM1)
    2) ESP32_CAMERA_IP (global fallback)
    """
    normalized = farm_id.upper().replace("-", "_")
    # Hardcoded defaults (EDIT THESE with your ESP32-CAM IPs)
    # Example farm ids used by the frontend: farm1, farm2
    hardcoded_ips = {
        "FARM1": "10.119.60.75",
        "FARM2": "10.119.60.201",
    }

    # If available, use hardcoded IP first (so you don't need env vars).
    if normalized in hardcoded_ips:
        return hardcoded_ips[normalized]

    # Fallback to env vars (keeps current deployment flexible).
    per_farm_env = f"ESP32_CAMERA_IP_{normalized}"
    return os.getenv(per_farm_env) or os.getenv("ESP32_CAMERA_IP")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== AUTHENTICATION ====================

@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """User registration"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role=user_data.role or "farmer",
        phone=user_data.phone,
        location_lat=user_data.location_lat,
        location_lng=user_data.location_lng,
        location_accuracy=user_data.location_accuracy,
        location_source=user_data.location_source or ("signup" if user_data.location_lat is not None else None),
        location_updated_at=datetime.utcnow() if user_data.location_lat is not None else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role=new_user.role,
        phone=new_user.phone,
        location_lat=new_user.location_lat,
        location_lng=new_user.location_lng,
        location_accuracy=new_user.location_accuracy,
        location_source=new_user.location_source,
        location_updated_at=new_user.location_updated_at
    )


@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """User login"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        phone=current_user.phone,
        location_lat=current_user.location_lat,
        location_lng=current_user.location_lng,
        location_accuracy=current_user.location_accuracy,
        location_source=current_user.location_source,
        location_updated_at=current_user.location_updated_at
    )


@app.post("/api/auth/location")
def update_user_location(
    location_data: UserLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's latest location after login/session start."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.location_lat = location_data.location_lat
    user.location_lng = location_data.location_lng
    user.location_accuracy = location_data.location_accuracy
    user.location_source = location_data.location_source or "login"
    user.location_updated_at = datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "location_lat": user.location_lat,
        "location_lng": user.location_lng,
        "location_updated_at": user.location_updated_at.isoformat()
    }


# ==================== SENSOR DATA ====================

@app.post("/api/sensors", status_code=status.HTTP_201_CREATED)
def receive_sensor_data(sensor_data: SensorData, db: Session = Depends(get_db)):
    """Receive and process sensor data from IoT devices"""
    try:
        # Prefer live NPK from device when available.
        npk = resolve_npk(sensor_data)
        
        # Prepare features for ML
        features = [
            npk['N'], npk['P'], npk['K'],
            sensor_data.temperature,
            sensor_data.humidity,
            sensor_data.ph,
            sensor_data.rainfall,
            sensor_data.soil_moisture,
            sensor_data.light_intensity
        ]
        
        # Get predictions from all models
        predictions = ml_manager.predict_all(features)
        
        # Save to database
        reading = SensorReading(
            farm_id=sensor_data.farm_id,
            crop=sensor_data.crop,
            timestamp=sensor_data.timestamp or datetime.utcnow(),
            temperature=sensor_data.temperature,
            humidity=sensor_data.humidity,
            soil_moisture=sensor_data.soil_moisture,
            rainfall=sensor_data.rainfall,
            ph=sensor_data.ph,
            light_lux=sensor_data.light_intensity,
            water_level=sensor_data.water_level,
            npk_n=npk['N'],
            npk_p=npk['P'],
            npk_k=npk['K'],
            water_flow=sensor_data.water_flow,
            yield_prediction=predictions['ensemble']['yield'],
            confidence=predictions['ensemble']['confidence'],
            shap_values=predictions['shap_values']
        )
        
        db.add(reading)
        db.commit()
        db.refresh(reading)
        
        return {
            "status": "success",
            "prediction": predictions['ensemble']['yield'],
            "confidence": predictions['ensemble']['confidence']
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sensors/latest")
def get_latest_sensors(farm_id: str, db: Session = Depends(get_db)):
    """Get latest sensor readings"""
    latest = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id
    ).order_by(SensorReading.timestamp.desc()).first()
    
    if not latest:
        raise HTTPException(status_code=404, detail="No sensor data found")
    
    return {
        "temperature": latest.temperature,
        "humidity": latest.humidity,
        "soil_moisture": latest.soil_moisture,
        "rainfall": latest.rainfall,
        "ph": latest.ph,
        "light_intensity": latest.light_lux,
        "water_level": latest.water_level,
        "water_flow": latest.water_flow,
        "npk": {
            "N": latest.npk_n,
            "P": latest.npk_p,
            "K": latest.npk_k
        },
        "timestamp": latest.timestamp.isoformat()
    }


# ==================== PREDICTIONS ====================

@app.post("/api/predictions", response_model=PredictionResponse)
def predict_yield(
    sensor_data: SensorData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get yield prediction with all model outputs"""
    npk = resolve_npk(sensor_data)
    features = [
        npk['N'], npk['P'], npk['K'],
        sensor_data.temperature,
        sensor_data.humidity,
        sensor_data.ph,
        sensor_data.rainfall,
        sensor_data.soil_moisture,
        sensor_data.light_intensity
    ]
    
    predictions = ml_manager.predict_all(features)
    
    # Save prediction history
    history = PredictionHistory(
        user_id=current_user.id,
        farm_id=sensor_data.farm_id,
        crop=sensor_data.crop,
        yield_prediction=predictions['ensemble']['yield'],
        confidence=predictions['ensemble']['confidence'],
        uncertainty=predictions['bayesian']['uncertainty'],
        model_used="ensemble"
    )
    db.add(history)
    db.commit()
    
    return PredictionResponse(
        crop=sensor_data.crop,
        yield_forecast=predictions['ensemble']['yield'],
        confidence=predictions['ensemble']['confidence'],
        uncertainty=predictions['bayesian']['uncertainty'],
        risk_level=predictions['bayesian']['risk_level'],
        rf_prediction=predictions['rf']['yield'],
        rf_confidence=predictions['rf']['confidence'],
        xgb_prediction=predictions['xgb']['yield'],
        xgb_confidence=predictions['xgb']['confidence'],
        bayesian_prediction=predictions['bayesian']['yield'],
        bayesian_confidence=predictions['bayesian']['confidence']
    )


@app.get("/api/predictions/latest")
def get_latest_prediction(farm_id: str, db: Session = Depends(get_db)):
    """Get latest prediction for a farm"""
    latest = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id
    ).order_by(SensorReading.timestamp.desc()).first()
    
    if not latest:
        raise HTTPException(status_code=404, detail="No prediction found")
    
    return {
        "crop": latest.crop,
        "yield_forecast": latest.yield_prediction,
        "confidence": latest.confidence,
        "timestamp": latest.timestamp.isoformat()
    }


# ==================== SHAP EXPLAINABILITY ====================

@app.post("/api/shap", response_model=SHAPResponse)
def get_shap_explanation(sensor_data: SensorData):
    """Get SHAP-based feature importance"""
    npk = resolve_npk(sensor_data)
    features = [
        npk['N'], npk['P'], npk['K'],
        sensor_data.temperature,
        sensor_data.humidity,
        sensor_data.ph,
        sensor_data.rainfall,
        sensor_data.soil_moisture,
        sensor_data.light_intensity
    ]
    
    shap_values = ml_manager.get_shap_values(features)
    
    return SHAPResponse(
        feature_importance=shap_values,
        explanation=ml_manager.get_shap_explanation(features, shap_values)
    )


# ==================== DASHBOARD ====================

@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(
    farm_id: str,
    crop: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete dashboard data"""
    try:
        # Use provided crop or get from latest sensor reading
        selected_crop = crop or "Rice"

        # Latest sensors
        latest = db.query(SensorReading).filter(
            SensorReading.farm_id == farm_id
        ).order_by(SensorReading.timestamp.desc()).first()

        if not latest:
            # Return fallback demo data instead of error
            npk = ml_manager.get_npk_for_crop(selected_crop)
            demo_features = [
                npk['N'], npk['P'], npk['K'],
                28.5,
                72.0,
                6.8,
                12.5,
                65.0,
                1200.0
            ]

            predictions = ml_manager.predict_all(demo_features)
            shap_values = ml_manager.get_shap_values(demo_features)
            weather = weather_service.get_weather_data(farm_id)
            advisories = advisory_service.generate_advisories(
                selected_crop,
                28.5,
                72.0,
                65.0,
                12.5,
                6.8,
                predictions['ensemble']['yield']
            )

            return DashboardResponse(
                sensors=SensorDataResponse(
                    temperature=28.5,
                    humidity=72.0,
                    rainfall=12.5,
                    soil_moisture=65.0,
                    ph=6.8,
                    water_flow=5.2,
                    water_level=39.5,
                    light_intensity=1200.0,
                    npk={"N": npk['N'], "P": npk['P'], "K": npk['K']}
                ),
                prediction=PredictionDataResponse(
                    crop=selected_crop,
                    yield_forecast=predictions['ensemble']['yield'],
                    confidence=predictions['ensemble']['confidence'],
                    uncertainty=predictions['bayesian']['uncertainty'],
                    risk_level=predictions['bayesian']['risk_level']
                ),
                shap_values=shap_values,
                advisories=advisories,
                weather=weather
            )

        # Get predictions - use selected crop if provided, otherwise use crop from latest reading
        crop_for_prediction = selected_crop if crop else (latest.crop or selected_crop)
        npk = ml_manager.get_npk_for_crop(crop_for_prediction)
        features = [
            npk['N'], npk['P'], npk['K'],
            latest.temperature or 0.0,
            latest.humidity or 0.0,
            latest.ph or 7.0,
            latest.rainfall or 0.0,
            latest.soil_moisture or 0.0,
            latest.light_lux or 0.0
        ]

        predictions = ml_manager.predict_all(features)
        shap_values = ml_manager.get_shap_values(features)

        weather = weather_service.get_weather_data(latest.farm_id)

        advisories = advisory_service.generate_advisories(
            crop_for_prediction,
            latest.temperature or 0.0,
            latest.humidity or 0.0,
            latest.soil_moisture or 0.0,
            latest.rainfall or 0.0,
            latest.ph or 7.0,
            predictions['ensemble']['yield']
        )

        return DashboardResponse(
            sensors=SensorDataResponse(
                temperature=latest.temperature or 0.0,
                humidity=latest.humidity or 0.0,
                rainfall=latest.rainfall or 0.0,
                soil_moisture=latest.soil_moisture or 0.0,
                ph=latest.ph or 0.0,
                water_flow=latest.water_flow or 0.0,
                water_level=latest.water_level,
                light_intensity=latest.light_lux or 0.0,
                npk={"N": latest.npk_n or 0.0, "P": latest.npk_p or 0.0, "K": latest.npk_k or 0.0}
            ),
            prediction=PredictionDataResponse(
                crop=crop_for_prediction,
                yield_forecast=predictions['ensemble']['yield'],
                confidence=predictions['ensemble']['confidence'],
                uncertainty=predictions['bayesian']['uncertainty'],
                risk_level=predictions['bayesian']['risk_level']
            ),
            shap_values=shap_values,
            advisories=advisories,
            weather=weather
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")


# ==================== MODEL COMPARISON ====================

@app.get("/api/models/comparison", response_model=ModelComparisonResponse)
def get_model_comparison():
    """Get model performance comparison"""
    return ml_manager.get_model_comparison()


# ==================== HISTORICAL DATA ====================

@app.get("/api/history", response_model=HistoricalDataResponse)
def get_historical_data(
    farm_id: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get historical sensor and prediction data"""
    since = datetime.utcnow() - timedelta(days=days)
    readings = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id,
        SensorReading.timestamp >= since
    ).order_by(SensorReading.timestamp).all()
    
    data = []
    for r in readings:
        data.append({
            "timestamp": r.timestamp.isoformat(),
            "temperature": r.temperature,
            "humidity": r.humidity,
            "soil_moisture": r.soil_moisture,
            "ph": r.ph,
            "rainfall": r.rainfall,
            "water_flow": r.water_flow,
            "yield_prediction": r.yield_prediction,
            "confidence": r.confidence
        })
    
    return HistoricalDataResponse(data=data, days=days)


# ==================== WEATHER ====================

@app.get("/api/weather", response_model=WeatherResponse)
def get_weather(farm_id: str):
    """Get weather forecast data"""
    return weather_service.get_weather_data(farm_id)


# ==================== ADVISORIES ====================

@app.get("/api/advisories", response_model=List[AdvisoryResponse])
def get_advisories(
    farm_id: str,
    language: str = "en",
    db: Session = Depends(get_db)
):
    """Get farmer-friendly advisories"""
    latest = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id
    ).order_by(SensorReading.timestamp.desc()).first()
    
    if not latest:
        raise HTTPException(status_code=404, detail="No data found")
    
    npk = ml_manager.get_npk_for_crop(latest.crop)
    features = [
        npk['N'], npk['P'], npk['K'],
        latest.temperature,
        latest.humidity,
        latest.ph,
        latest.rainfall,
        latest.soil_moisture,
        latest.light_lux
    ]
    
    predictions = ml_manager.predict_all(features)
    
    advisories = advisory_service.generate_advisories(
        latest.crop,
        latest.temperature,
        latest.humidity,
        latest.soil_moisture,
        latest.rainfall,
        latest.ph,
        predictions['ensemble']['yield'],
        language
    )
    
    return advisories


# ==================== CAMERA ENDPOINTS ====================

@app.post("/api/camera/upload", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def upload_camera_image(camera_data: CameraUploadRequest, db: Session = Depends(get_db)):
    """Upload camera image and generate thermal visualization"""
    try:
        # Process thermal visualization
        thermal_base64 = apply_thermal_colormap(camera_data.image_base64)
        
        # Save to database
        camera_image = CameraImage(
            farm_id=camera_data.farm_id,
            image_base64=camera_data.image_base64,
            thermal_image_base64=thermal_base64
        )
        db.add(camera_image)
        db.commit()
        db.refresh(camera_image)
        
        return CameraResponse(
            id=camera_image.id,
            farm_id=camera_image.farm_id,
            image_url=f"data:image/jpeg;base64,{camera_image.image_base64}",
            thermal_image_url=f"data:image/jpeg;base64,{camera_image.thermal_image_base64}",
            timestamp=camera_image.timestamp
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/api/camera/latest")
def get_latest_camera_image(farm_id: str, db: Session = Depends(get_db)):
    """Get latest camera image for a farm"""
    latest = db.query(CameraImage).filter(
        CameraImage.farm_id == farm_id
    ).order_by(CameraImage.timestamp.desc()).first()
    
    if not latest:
        # Return fallback message
        return {
            "status": "no_data",
            "message": "No camera data available. Camera may be offline or not yet initialized.",
            "fallback": True,
            "thermal_image_url": None,
            "image_url": None
        }
    
    # Get temperature zones
    temp_zones = get_temperature_zones(latest.thermal_image_base64)
    
    return {
        "id": latest.id,
        "farm_id": latest.farm_id,
        "image_url": f"data:image/jpeg;base64,{latest.image_base64}",
        "thermal_image_url": f"data:image/jpeg;base64,{latest.thermal_image_base64}",
        "timestamp": latest.timestamp.isoformat(),
        "temperature_zones": temp_zones,
        "fallback": False
    }

@app.post("/api/camera/diagnose", response_model=PlantDiagnosisResponse)
def diagnose_plant_health(
    diagnosis_request: PlantDiagnosisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Diagnose plant health from camera image with leaf disease detection"""
    try:
        # Get image
        if diagnosis_request.image_id:
            camera_image = db.query(CameraImage).filter(
                CameraImage.id == diagnosis_request.image_id
            ).first()
            if not camera_image:
                raise HTTPException(status_code=404, detail="Image not found")
            image_base64 = camera_image.image_base64
        elif diagnosis_request.image_base64:
            image_base64 = diagnosis_request.image_base64
        else:
            raise HTTPException(status_code=400, detail="Either image_id or image_base64 required")
        
        # Get latest sensor data for context
        latest_sensor = db.query(SensorReading).filter(
            SensorReading.farm_id == diagnosis_request.farm_id
        ).order_by(SensorReading.timestamp.desc()).first()
        
        sensor_data = None
        if latest_sensor:
            sensor_data = {
                "temperature": latest_sensor.temperature,
                "humidity": latest_sensor.humidity,
                "soil_moisture": latest_sensor.soil_moisture,
                "ph": latest_sensor.ph
            }
        
        # Perform leaf disease detection
        from camera_processor import detect_leaf_diseases
        disease_result = detect_leaf_diseases(image_base64, sensor_data)
        
        # Also perform general plant diagnosis
        diagnosis_result = diagnose_plant(image_base64, sensor_data)
        
        # Combine results
        if disease_result.get("diseases") and len(disease_result["diseases"]) > 0:
            # Prioritize disease detection
            diagnosis_result = {
                "diagnosis": disease_result["diagnosis"],
                "confidence": disease_result["confidence"],
                "details": {
                    **diagnosis_result.get("details", {}),
                    **disease_result.get("details", {}),
                    "diseases_detected": disease_result["diseases"]
                },
                "recommendations": disease_result["recommendations"]
            }
        
        # Get thermal image if available
        thermal_image_url = None
        if diagnosis_request.image_id:
            camera_image = db.query(CameraImage).filter(
                CameraImage.id == diagnosis_request.image_id
            ).first()
            if camera_image and camera_image.thermal_image_base64:
                thermal_image_url = f"data:image/jpeg;base64,{camera_image.thermal_image_base64}"
        
        # Save diagnosis to database
        diagnosis_record = PlantDiagnosis(
            farm_id=diagnosis_request.farm_id,
            image_id=diagnosis_request.image_id,
            diagnosis=diagnosis_result["diagnosis"],
            confidence=diagnosis_result["confidence"],
            details=diagnosis_result["details"],
            recommendations=diagnosis_result["recommendations"]
        )
        db.add(diagnosis_record)
        db.commit()
        
        return PlantDiagnosisResponse(
            diagnosis=diagnosis_result["diagnosis"],
            confidence=diagnosis_result["confidence"],
            details=diagnosis_result["details"],
            recommendations=diagnosis_result["recommendations"],
            thermal_image_url=thermal_image_url,
            diseases=diagnosis_result.get("details", {}).get("diseases_detected")
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error in diagnosis: {str(e)}")

@app.get("/api/camera/stream")
def get_camera_stream(farm_id: str):
    """
    Live camera stream with real-time disease detection
    Proxies MJPEG stream from ESP32-S and adds disease detection overlay
    """
    # Resolve per-farm camera IP from env
    esp32_ip = get_camera_ip_for_farm(farm_id) or "192.168.1.100"
    stream_url = f"http://{esp32_ip}/stream"
    
    def generate_stream():
        try:
            # Connect to ESP32-S stream
            response = requests.get(stream_url, stream=True, timeout=5)
            if response.status_code != 200:
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + b""
                return
            
            # Get latest sensor data for context
            db = next(get_db())
            latest_sensor = db.query(SensorReading).filter(
                SensorReading.farm_id == farm_id
            ).order_by(SensorReading.timestamp.desc()).first()
            
            sensor_data = None
            if latest_sensor:
                sensor_data = {
                    "temperature": latest_sensor.temperature,
                    "humidity": latest_sensor.humidity,
                    "soil_moisture": latest_sensor.soil_moisture,
                    "ph": latest_sensor.ph
                }
            
            # Process stream frames
            buffer = b""
            for chunk in response.iter_content(chunk_size=1024):
                buffer += chunk
                
                # Find JPEG boundaries
                while b"\xff\xd8" in buffer and b"\xff\xd9" in buffer:
                    start = buffer.find(b"\xff\xd8")
                    end = buffer.find(b"\xff\xd9", start) + 2
                    
                    if end > start:
                        jpeg_data = buffer[start:end]
                        buffer = buffer[end:]
                        
                        try:
                            # Decode JPEG
                            nparr = np.frombuffer(jpeg_data, np.uint8)
                            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                            
                            if frame is not None:
                                # Process frame with disease detection
                                processed_frame, diagnosis = process_stream_frame(
                                    frame, sensor_data
                                )
                                
                                # Cache diagnosis for API endpoint
                                stream_diagnosis_cache[farm_id] = diagnosis
                                
                                # Apply thermal colormap
                                thermal_frame = apply_thermal_to_frame(processed_frame)
                                
                                # Encode back to JPEG
                                _, encoded = cv2.imencode('.jpg', thermal_frame, 
                                                         [cv2.IMWRITE_JPEG_QUALITY, 85])
                                
                                # Yield MJPEG frame
                                yield (b"--frame\r\n"
                                      b"Content-Type: image/jpeg\r\n"
                                      b"Content-Length: " + str(len(encoded)).encode() + b"\r\n\r\n" +
                                      encoded.tobytes() + b"\r\n")
                        except Exception as e:
                            print(f"Error processing frame: {e}")
                            continue
        
        except Exception as e:
            print(f"Stream error: {e}")
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + b""
    
    return StreamingResponse(
        generate_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/camera/stream/diagnosis")
def get_stream_diagnosis(farm_id: str):
    """
    Get current diagnosis from live stream
    Returns latest diagnosis data
    """
    # Get cached diagnosis from stream processor
    diagnosis = stream_diagnosis_cache.get(farm_id, {
        "status": "Monitoring",
        "confidence": 0.0,
        "has_issue": False,
        "issues": []
    })
    
    return diagnosis

@app.get("/api/camera/history")
def get_camera_history(farm_id: str, limit: int = 10, db: Session = Depends(get_db)):
    """Get camera image history for a farm"""
    images = db.query(CameraImage).filter(
        CameraImage.farm_id == farm_id
    ).order_by(CameraImage.timestamp.desc()).limit(limit).all()
    
    if not images:
        return {
            "images": [],
            "message": "No camera images found",
            "fallback": True
        }
    
    result = []
    for img in images:
        result.append({
            "id": img.id,
            "farm_id": img.farm_id,
            "image_url": f"data:image/jpeg;base64,{img.image_base64}",
            "thermal_image_url": f"data:image/jpeg;base64,{img.thermal_image_base64}",
            "timestamp": img.timestamp.isoformat()
        })
    
    return {
        "images": result,
        "fallback": False
    }

# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "models_loaded": ml_manager.models_loaded()}

