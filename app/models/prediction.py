from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Float, DateTime, func, JSON
from ..db import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    crop: Mapped[str] = mapped_column(String(50), index=True)
    label: Mapped[str] = mapped_column(String(20))  # e.g., HIGH/MEDIUM/LOW
    confidence: Mapped[float] = mapped_column(Float)
    uncertainty_pct: Mapped[float] = mapped_column(Float)
    shap_importance: Mapped[dict] = mapped_column(JSON)
