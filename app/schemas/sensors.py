from pydantic import BaseModel
from datetime import datetime

class SensorReadingOut(BaseModel):
    id: int
    timestamp: datetime
    temperature_c: float
    humidity_pct: float
    rainfall_mm: float
    soil_moisture_pct: float
    soil_ph: float
    water_flow_lpm: float
    light_intensity_lux: float

    class Config:
        from_attributes = True
