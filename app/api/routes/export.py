import io
import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ...db import get_db
from ...models.sensor import SensorReading
from ...models.prediction import Prediction

router = APIRouter(prefix="/api/export", tags=["export"])

@router.get("/csv")
def export_csv(kind: str = "sensors", limit: int = 200, db: Session = Depends(get_db)):
    if kind == "predictions":
        rows = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).all()
        data = [{
            "timestamp": r.timestamp,
            "crop": r.crop,
            "label": r.label,
            "confidence": r.confidence,
            "uncertainty_pct": r.uncertainty_pct,
        } for r in rows]
    else:
        rows = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(limit).all()
        data = [{
            "timestamp": r.timestamp,
            "temperature_c": r.temperature_c,
            "humidity_pct": r.humidity_pct,
            "rainfall_mm": r.rainfall_mm,
            "soil_moisture_pct": r.soil_moisture_pct,
            "soil_ph": r.soil_ph,
            "water_flow_lpm": r.water_flow_lpm,
            "light_intensity_lux": r.light_intensity_lux,
        } for r in rows]

    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return StreamingResponse(iter([stream.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={kind}.csv"})
