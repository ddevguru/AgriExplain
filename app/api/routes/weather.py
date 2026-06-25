from fastapi import APIRouter

router = APIRouter(prefix="/api/weather", tags=["weather"])

@router.get("/forecast")
def forecast():
    # Placeholder static forecast
    return {"temperature_c": 31.5, "humidity_pct": 58, "rainfall_mm": 2.4}
