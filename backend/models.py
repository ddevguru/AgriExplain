from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="farmer")  # farmer, admin
    phone = Column(String(15))
    location_lat = Column(Float)
    location_lng = Column(Float)
    location_accuracy = Column(Float)
    location_source = Column(String(30))  # signup, login, manual
    location_updated_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class Farm(Base):
    __tablename__ = "farms"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100))
    location = Column(String(100))
    farmer_phone = Column(String(15))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    user = relationship("User", backref="farms")

class SensorReading(Base):
    __tablename__ = "sensors"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(50), nullable=False, index=True)
    crop = Column(String(50))
    timestamp = Column(DateTime, nullable=False, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    soil_moisture = Column(Float)
    rainfall = Column(Float)
    ph = Column(Float)
    light_lux = Column(Float)
    water_level = Column(Float)
    npk_n = Column(Float)
    npk_p = Column(Float)
    npk_k = Column(Float)
    water_flow = Column(Float)
    yield_prediction = Column(String(20))
    confidence = Column(Float)
    shap_values = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class PredictionHistory(Base):
    __tablename__ = "prediction_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(String(50), nullable=False)
    crop = Column(String(50))
    yield_prediction = Column(String(20))
    confidence = Column(Float)
    uncertainty = Column(Float)
    model_used = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", backref="predictions")

class CameraImage(Base):
    __tablename__ = "camera_images"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(50), nullable=False, index=True)
    image_base64 = Column(Text)  # Base64 encoded image
    thermal_image_base64 = Column(Text)  # Base64 encoded thermal visualization
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PlantDiagnosis(Base):
    __tablename__ = "plant_diagnosis"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(String(50), nullable=False, index=True)
    image_id = Column(Integer, ForeignKey("camera_images.id"))
    diagnosis = Column(String(100))  # Healthy, Disease, Pest, Nutrient Deficiency
    confidence = Column(Float)
    details = Column(JSON)  # Additional diagnosis details
    recommendations = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    image = relationship("CameraImage", backref="diagnoses")