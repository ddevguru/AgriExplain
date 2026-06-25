from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Float, DateTime, func
from ..db import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    temperature_c: Mapped[float] = mapped_column(Float)
    humidity_pct: Mapped[float] = mapped_column(Float)
    rainfall_mm: Mapped[float] = mapped_column(Float)
    soil_moisture_pct: Mapped[float] = mapped_column(Float)
    soil_ph: Mapped[float] = mapped_column(Float)
    water_flow_lpm: Mapped[float] = mapped_column(Float)
    light_intensity_lux: Mapped[float] = mapped_column(Float)
