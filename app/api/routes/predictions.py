from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db import get_db
from ...schemas.prediction import PredictionRequest, PredictionOut
from ...models.prediction import Prediction
from typing import Dict
import random, time

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

CROPS = [
    "Rice", "Wheat", "Maize", "Cotton", "Tomato", "Sugarcane", "Potato",
    "Onion", "Banana", "Mango", "Chickpea", "Soybean", "Groundnut",
    "Turmeric", "Chili", "Brinjal", "Cabbage", "Cauliflower", "Okra",
    "Cucumber", "Watermelon", "Pomegranate", "Grapes", "Apple", "Orange", "Lemon"
]

@router.post("/predict", response_model=PredictionOut)
def predict(req: PredictionRequest, db: Session = Depends(get_db)):
    crop = req.crop if req.crop in CROPS else "Rice"
    # Stub model logic
    conf = round(random.uniform(0.75, 0.95), 2)
    label = random.choice(["HIGH", "MEDIUM", "LOW"]) if conf < 0.8 else "HIGH"
    uncert = round(random.uniform(0.08, 0.18), 2) * 100
    shap: Dict[str, float] = {
        "Temperature": 25.0,
        "Rainfall": 18.2,
        "Soil Moisture": 12.5,
        "Humidity": 11.3,
        "pH": 8.7,
        "Water Flow": 7.5,
        "Light": 6.8,
    }
    p = Prediction(crop=crop, label=label, confidence=conf, uncertainty_pct=uncert, shap_importance=shap)
    db.add(p)
    db.commit()
    db.refresh(p)
    return PredictionOut.model_validate(p)

@router.get("/history", response_model=list[PredictionOut])
def history(limit: int = 20, db: Session = Depends(get_db)):
    rows = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).all()
    return list(reversed([PredictionOut.model_validate(r) for r in rows]))
