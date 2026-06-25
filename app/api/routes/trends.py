from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db import get_db
from ...models.prediction import Prediction
from ...models.sensor import SensorReading

router = APIRouter(prefix="/api/trends", tags=["trends"])

@router.get("/predictions")
def prediction_trends(limit: int = 50, db: Session = Depends(get_db)):
    rows = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).all()
    return [{"timestamp": r.timestamp, "confidence": r.confidence, "label": r.label, "crop": r.crop} for r in reversed(rows)]

@router.get("/sensors")
def sensor_trends(limit: int = 168, db: Session = Depends(get_db)):
    rows = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(limit).all()
    return [{
        "timestamp": r.timestamp,
        "temperature_c": r.temperature_c,
        "humidity_pct": r.humidity_pct,
        "rainfall_mm": r.rainfall_mm,
        "soil_moisture_pct": r.soil_moisture_pct,
        "soil_ph": r.soil_ph,
        "water_flow_lpm": r.water_flow_lpm,
        "light_intensity_lux": r.light_intensity_lux,
    } for r in reversed(rows)]
