CREATE DATABASE IF NOT EXISTS agrixplain;
USE agrixplain;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'farmer',
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100),
    farmer_phone VARCHAR(15),
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Sensors table
CREATE TABLE IF NOT EXISTS sensors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    farm_id VARCHAR(50) NOT NULL,
    crop VARCHAR(50),
    timestamp DATETIME NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    soil_moisture FLOAT,
    rainfall FLOAT,
    ph FLOAT,
    light_lux FLOAT,
    water_level FLOAT,
    npk_n FLOAT,
    npk_p FLOAT,
    npk_k FLOAT,
    water_flow FLOAT,
    yield_prediction VARCHAR(20),
    confidence FLOAT,
    shap_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_farm_id (farm_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_crop (crop)
);

-- Prediction history table
CREATE TABLE IF NOT EXISTS prediction_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    farm_id VARCHAR(50) NOT NULL,
    crop VARCHAR(50),
    yield_prediction VARCHAR(20),
    confidence FLOAT,
    uncertainty FLOAT,
    model_used VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_farm_id (farm_id),
    INDEX idx_timestamp (timestamp)
);

-- Insert sample farms
INSERT INTO farms (id, name, location, farmer_phone) VALUES
('farm1', 'Sharma Rice Farm', 'Delhi, India', '+919876543210'),
('farm2', 'Gupta Wheat Farm', 'Punjab, India', '+919876543211')
ON DUPLICATE KEY UPDATE name=name;

-- Insert default admin user (password: admin123456)
-- Password hash is for "admin123456"
INSERT INTO users (email, name, hashed_password, role, phone) VALUES
('admin@agrixplain.com', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYq5q5q5q5q', 'admin', '+919876543210')
ON DUPLICATE KEY UPDATE email=email;
