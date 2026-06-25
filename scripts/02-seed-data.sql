-- Insert sample users
INSERT INTO users (email, phone, role, name) VALUES
('farmer@agrixplain.com', '+919876543210', 'farmer', 'Rajesh Sharma'),
('admin@agrixplain.com', '+919876543211', 'admin', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Insert sample farms
INSERT INTO farms (name, crop, location_lat, location_lng, farmer_id)
SELECT 'Sharma Rice Farm', 'Rice', 28.5355, 77.3910, id FROM users WHERE email = 'farmer@agrixplain.com'
ON CONFLICT DO NOTHING;

-- Insert sensors
INSERT INTO sensors (farm_id, sensor_type, name, status)
SELECT id, 'temperature', 'Temp Sensor 1', 'active' FROM farms WHERE name = 'Sharma Rice Farm'
ON CONFLICT DO NOTHING;

-- Add more sensor types and sample readings
INSERT INTO sensors (farm_id, sensor_type, name, status)
SELECT id, 'humidity', 'Humidity Sensor 1', 'active' FROM farms WHERE name = 'Sharma Rice Farm' 
WHERE NOT EXISTS (SELECT 1 FROM sensors WHERE sensor_type = 'humidity' AND farm_id IN (SELECT id FROM farms WHERE name = 'Sharma Rice Farm'));

INSERT INTO sensors (farm_id, sensor_type, name, status)
SELECT id, 'soil_moisture', 'Soil Moisture Sensor 1', 'active' FROM farms WHERE name = 'Sharma Rice Farm'
WHERE NOT EXISTS (SELECT 1 FROM sensors WHERE sensor_type = 'soil_moisture' AND farm_id IN (SELECT id FROM farms WHERE name = 'Sharma Rice Farm'));

-- Insert sample sensor readings
INSERT INTO sensor_readings (sensor_id, farm_id, temperature, humidity, soil_moisture, ph_level, light_intensity, rainfall)
SELECT 
  s.id,
  f.id,
  28.5,
  65.0,
  55.0,
  6.8,
  1200.0,
  0.5
FROM sensors s
JOIN farms f ON s.farm_id = f.id
WHERE f.name = 'Sharma Rice Farm' AND s.sensor_type = 'temperature'
LIMIT 1;

-- Insert sample predictions
INSERT INTO predictions (farm_id, crop, yield_prediction, confidence_score, recommendation)
SELECT 
  id,
  'Rice',
  85.5,
  0.87,
  'Current conditions are optimal for growth. Monitor water levels weekly.'
FROM farms 
WHERE name = 'Sharma Rice Farm';

-- Insert sample alerts
INSERT INTO alerts (farm_id, alert_type, message, severity, is_resolved)
SELECT 
  id,
  'heat_stress',
  'Temperature above optimal range. Consider irrigation.',
  'medium',
  FALSE
FROM farms 
WHERE name = 'Sharma Rice Farm';

INSERT INTO alerts (farm_id, alert_type, message, severity, is_resolved)
SELECT 
  id,
  'moisture_optimal',
  'Soil moisture levels are in optimal range.',
  'low',
  FALSE
FROM farms 
WHERE name = 'Sharma Rice Farm';
