from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
import joblib
import pandas as pd
import numpy as np
import shap
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
limiter = Limiter(get_remote_address, app=app)

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+mysqlconnector://user:password@localhost/agrixplain')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Flask-SQLAlchemy
db = SQLAlchemy(app)

# Define models using Flask-SQLAlchemy
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

class Farm(db.Model):
    __tablename__ = "farms"
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100))
    location = db.Column(db.String(100))
    farmer_phone = db.Column(db.String(15))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

# Load ML model
try:
    model = joblib.load('rf_model.pkl')
    explainer = shap.TreeExplainer(model)
except:
    model = None
    explainer = None

# Static NPK values
NPK_VALUES = {
    'Rice': {'N': 90, 'P': 42, 'K': 43},
    'Wheat': {'N': 80, 'P': 40, 'K': 40}
}

@app.route('/api/sensors', methods=['POST'])
@limiter.limit("10 per minute")
def receive_sensor_data():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        sensors = data.get('sensors', {})
        farm_id = data.get('farm_id', 'farm1')
        crop = data.get('crop', 'Rice')

        # Get or set NPK from static values
        npk = NPK_VALUES.get(crop, NPK_VALUES['Rice'])

        # Prepare features for ML
        features = [
            npk['N'], npk['P'], npk['K'],
            sensors.get('temperature', 25),
            sensors.get('humidity', 60),
            sensors.get('ph', 7),
            sensors.get('rainfall_mm', 0),
            sensors.get('soil_moisture', 50),
            sensors.get('light_lux', 1000)
        ]

        # ML Prediction
        yield_pred = "Medium"
        confidence = 0.5
        shap_vals = {}

        if model:
            pred_proba = model.predict_proba([features])[0]
            pred_class = model.predict([features])[0]
            yield_pred = pred_class
            confidence = max(pred_proba)

            # SHAP values
            shap_values = explainer.shap_values([features])
            feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_moisture', 'light']
            shap_vals = {name: float(val[0]) for name, val in zip(feature_names, shap_values[0])}

        # Save to DB
        reading = SensorReading(
            farm_id=farm_id,
            crop=crop,
            timestamp=datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00')),
            temperature=sensors.get('temperature'),
            humidity=sensors.get('humidity'),
            soil_moisture=sensors.get('soil_moisture'),
            rainfall=sensors.get('rainfall_mm'),
            ph=sensors.get('ph'),
            light_lux=sensors.get('light_lux'),
            water_level=sensors.get('water_level_cm'),
            npk_n=npk['N'],
            npk_p=npk['P'],
            npk_k=npk['K'],
            water_flow=sensors.get('water_flow_lph'),
            yield_prediction=yield_pred,
            confidence=confidence,
            shap_values=shap_vals
        )

        db.session.add(reading)
        db.session.commit()

        return jsonify({'status': 'success', 'prediction': yield_pred, 'confidence': confidence}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/farmer-dashboard', methods=['GET'])
def farmer_dashboard():
    farm_id = request.args.get('farm_id', 'farm1')
    try:
        # Latest reading
        latest = SensorReading.query.filter_by(farm_id=farm_id).order_by(SensorReading.timestamp.desc()).first()
        if not latest:
            return jsonify({'error': 'No data found'}), 404

        return jsonify({
            'latest': {
                'temperature': latest.temperature,
                'humidity': latest.humidity,
                'soil_moisture': latest.soil_moisture,
                'ph': latest.ph,
                'light_lux': latest.light_lux,
                'rainfall': latest.rainfall,
                'water_level': latest.water_level,
                'npk': {'N': latest.npk_n, 'P': latest.npk_p, 'K': latest.npk_k},
                'water_flow': latest.water_flow
            },
            'prediction': {
                'yield': latest.yield_prediction,
                'confidence': latest.confidence,
                'shap_values': latest.shap_values
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin-dashboard', methods=['GET'])
def admin_dashboard():
    try:
        # Aggregate data
        farms_data = db.session.query(
            SensorReading.farm_id,
            db.func.avg(SensorReading.temperature).label('avg_temp'),
            db.func.avg(SensorReading.soil_moisture).label('avg_moisture'),
            db.func.count(SensorReading.id).label('readings_count'),
            db.func.max(SensorReading.timestamp).label('last_update')
        ).group_by(SensorReading.farm_id).all()

        result = []
        for row in farms_data:
            farm = Farm.query.get(row.farm_id)
            result.append({
                'farm_id': row.farm_id,
                'name': farm.name if farm else 'Unknown',
                'avg_temperature': round(row.avg_temp, 1) if row.avg_temp else None,
                'avg_soil_moisture': round(row.avg_moisture, 1) if row.avg_moisture else None,
                'total_readings': row.readings_count,
                'last_update': row.last_update.isoformat() if row.last_update else None
            })

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def history():
    farm_id = request.args.get('farm_id', 'farm1')
    days = int(request.args.get('days', 7))
    try:
        since = datetime.utcnow() - timedelta(days=days)
        readings = SensorReading.query.filter(
            SensorReading.farm_id == farm_id,
            SensorReading.timestamp >= since
        ).order_by(SensorReading.timestamp).all()

        data = []
        for r in readings:
            data.append({
                'timestamp': r.timestamp.isoformat(),
                'temperature': r.temperature,
                'humidity': r.humidity,
                'soil_moisture': r.soil_moisture,
                'ph': r.ph,
                'rainfall': r.rainfall,
                'yield_prediction': r.yield_prediction,
                'confidence': r.confidence
            })

        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/farms', methods=['POST'])
def create_farm():
    try:
        data = request.get_json()
        farm = Farm(
            id=data['id'],
            name=data['name'],
            location=data.get('location'),
            farmer_phone=data.get('farmer_phone')
        )
        db.session.add(farm)
        db.session.commit()
        return jsonify({'status': 'success', 'id': farm.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)