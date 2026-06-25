from pydantic import BaseModel
from typing import Dict
from datetime import datetime

class PredictionRequest(BaseModel):
    crop: str

class PredictionOut(BaseModel):
    id: int | None = None
    timestamp: datetime | None = None
    crop: str
    label: str
    confidence: float
    uncertainty_pct: float
    shap_importance: Dict[str, float]

    class Config:
        from_attributes = True
