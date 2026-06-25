# Flask-SQLAlchemy Models (for app.py)
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# This will be initialized in app.py
db = None

def init_models(database):
    global db
    db = database
    
    class User(db.Model):
        __tablename__ = "users"
        
        id = db.Column(db.Integer, primary_key=True, index=True)
        email = db.Column(db.String(100), unique=True, index=True, nullable=False)
        name = db.Column(db.String(100), nullable=False)
        hashed_password = db.Column(db.String(255), nullable=False)
        role = db.Column(db.String(20), default="farmer")
        phone = db.Column(db.String(15))
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    class Farm(db.Model):
        __tablename__ = "farms"
        
        id = db.Column(db.String(50), primary_key=True)
        name = db.Column(db.String(100))
        location = db.Column(db.String(100))
        farmer_phone = db.Column(db.String(15))
        user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
        
        user = db.relationship("User", backref="farms")
    
    class SensorReading(db.Model):
        __tablename__ = "sensors"
        
        id = db.Column(db.Integer, primary_key=True, index=True)
        farm_id = db.Column(db.String(50), nullable=False, index=True)
        crop = db.Column(db.String(50))
        timestamp = db.Column(db.DateTime, nullable=False, index=True)
        temperature = db.Column(db.Float)
        humidity = db.Column(db.Float)
        soil_moisture = db.Column(db.Float)
        rainfall = db.Column(db.Float)
        ph = db.Column(db.Float)
        light_lux = db.Column(db.Float)
        water_level = db.Column(db.Float)
        npk_n = db.Column(db.Float)
        npk_p = db.Column(db.Float)
        npk_k = db.Column(db.Float)
        water_flow = db.Column(db.Float)
        yield_prediction = db.Column(db.String(20))
        confidence = db.Column(db.Float)
        shap_values = db.Column(db.JSON)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    return User, Farm, SensorReading

