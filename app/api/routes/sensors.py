from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db import get_db
from ...schemas.sensors import SensorReadingOut
from ...models.sensor import SensorReading
from typing import List

router = APIRouter(prefix="/api/sensors", tags=["sensors"])

@router.get("/latest", response_model=SensorReadingOut)
def get_latest(db: Session = Depends(get_db)):
    row = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
    if not row:
        # return defaults if no data yet
        return SensorReadingOut(id=0, timestamp=None, temperature_c=25, humidity_pct=60, rainfall_mm=0, soil_moisture_pct=40, soil_ph=6.5, water_flow_lpm=0.5, light_intensity_lux=500)
    return row

@router.get("/history", response_model=List[SensorReadingOut])
def get_history(limit: int = 168, db: Session = Depends(get_db)):
    rows = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(limit).all()
    return list(reversed(rows))
