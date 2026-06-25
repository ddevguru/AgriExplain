from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, List, Any
from datetime import datetime

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Optional[str] = "farmer"
    phone: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_accuracy: Optional[float] = None
    location_source: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_accuracy: Optional[float] = None
    location_source: Optional[str] = None
    location_updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserLocationUpdate(BaseModel):
    location_lat: float
    location_lng: float
    location_accuracy: Optional[float] = None
    location_source: Optional[str] = "login"

class Token(BaseModel):
    access_token: str
    token_type: str

# Sensor Schemas
class SensorData(BaseModel):
    farm_id: str
    crop: str
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    soil_moisture: float
    light_intensity: float
    water_level: Optional[float] = None
    water_flow: Optional[float] = None
    npk_n: Optional[float] = None
    npk_p: Optional[float] = None
    npk_k: Optional[float] = None
    timestamp: Optional[datetime] = None

# Prediction Schemas
class PredictionResponse(BaseModel):
    crop: str
    yield_forecast: str  # HIGH, MEDIUM, LOW
    confidence: float
    uncertainty: float
    risk_level: str
    rf_prediction: str
    rf_confidence: float
    xgb_prediction: str
    xgb_confidence: float
    bayesian_prediction: str
    bayesian_confidence: float

# SHAP Schemas
class SHAPResponse(BaseModel):
    feature_importance: Dict[str, float]
    explanation: Dict[str, str]

# Dashboard Schemas
class SensorDataResponse(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    soil_moisture: float
    ph: float
    water_flow: float
    water_level: Optional[float] = None  # Ultrasonic sensor - water level in cm
    light_intensity: float
    npk: Dict[str, float]

class PredictionDataResponse(BaseModel):
    crop: str
    yield_forecast: str
    confidence: float
    uncertainty: float
    risk_level: str

class AdvisoryResponse(BaseModel):
    title: str
    message: str
    priority: str  # high, medium, low
    action: str
    language: str = "en"

class WeatherResponse(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    forecast: List[Dict[str, Any]]

class DashboardResponse(BaseModel):
    sensors: SensorDataResponse
    prediction: PredictionDataResponse
    shap_values: Dict[str, float]
    advisories: List[AdvisoryResponse]
    weather: WeatherResponse

# Model Comparison Schema
class ModelComparisonResponse(BaseModel):
    models: List[Dict[str, Any]]

# Historical Data Schema
class HistoricalDataResponse(BaseModel):
    data: List[Dict[str, Any]]
    days: int

# Camera Schemas
class CameraUploadRequest(BaseModel):
    farm_id: str
    image_base64: str
    timestamp: Optional[int] = None

class CameraResponse(BaseModel):
    id: int
    farm_id: str
    image_url: str
    thermal_image_url: str
    timestamp: datetime

class PlantDiagnosisRequest(BaseModel):
    farm_id: str
    image_base64: Optional[str] = None
    image_id: Optional[int] = None

class PlantDiagnosisResponse(BaseModel):
    diagnosis: str  # Healthy, Disease, Pest, Nutrient Deficiency
    confidence: float
    details: Dict[str, Any]
    recommendations: str
    thermal_image_url: Optional[str] = None
    diseases: Optional[List[Dict[str, Any]]] = None  # List of detected diseases

