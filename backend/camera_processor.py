"""
Camera Processing Module
Handles thermal visualization and plant diagnosis
"""

import base64
import io
import numpy as np
from PIL import Image, ImageEnhance
from typing import Tuple, Dict, Any
import cv2

def apply_thermal_colormap(image_base64: str) -> str:
    """
    Convert regular image to thermal-like visualization
    Uses color mapping to simulate thermal camera output
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Convert to grayscale for thermal simulation
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Normalize to 0-255
        normalized = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
        
        # Apply thermal colormap (COLORMAP_HOT or COLORMAP_JET)
        thermal = cv2.applyColorMap(normalized, cv2.COLORMAP_HOT)
        
        # Convert back to PIL Image
        thermal_image = Image.fromarray(cv2.cvtColor(thermal, cv2.COLOR_BGR2RGB))
        
        # Enhance contrast for better visualization
        enhancer = ImageEnhance.Contrast(thermal_image)
        thermal_image = enhancer.enhance(1.5)
        
        # Convert back to base64
        buffer = io.BytesIO()
        thermal_image.save(buffer, format='JPEG', quality=85)
        thermal_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return thermal_base64
    except Exception as e:
        print(f"Error in thermal processing: {e}")
        return image_base64  # Return original if processing fails

def detect_leaf_diseases(image_base64: str, sensor_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Detect specific leaf diseases from image
    Returns disease type, confidence, and recommendations
    """
    try:
        # Decode image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        img_array = np.array(image)
        
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Disease detection results
        diseases_detected = []
        overall_status = "Healthy"
        max_confidence = 0.0
        
        # 1. Bacterial Leaf Blight (Yellow-brown spots with water-soaked appearance)
        lower_yellow_brown = np.array([10, 50, 50])
        upper_yellow_brown = np.array([25, 255, 255])
        yellow_brown_mask = cv2.inRange(hsv, lower_yellow_brown, upper_yellow_brown)
        yellow_brown_ratio = np.sum(yellow_brown_mask > 0) / (img_array.shape[0] * img_array.shape[1])
        
        if yellow_brown_ratio > 0.05:
            confidence = min(yellow_brown_ratio * 12, 0.95)
            diseases_detected.append({
                "disease": "Bacterial Leaf Blight",
                "confidence": confidence,
                "severity": "high" if confidence > 0.7 else "moderate",
                "symptoms": "Yellow-brown spots with water-soaked appearance"
            })
            if confidence > max_confidence:
                max_confidence = confidence
                overall_status = "Bacterial Leaf Blight Detected"
        
        # 2. Brown Spot Disease (Circular brown spots)
        lower_brown = np.array([10, 100, 20])
        upper_brown = np.array([20, 255, 200])
        brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
        brown_ratio = np.sum(brown_mask > 0) / (img_array.shape[0] * img_array.shape[1])
        
        if brown_ratio > 0.04:
            confidence = min(brown_ratio * 15, 0.95)
            diseases_detected.append({
                "disease": "Brown Spot Disease",
                "confidence": confidence,
                "severity": "high" if confidence > 0.7 else "moderate",
                "symptoms": "Circular brown spots on leaves"
            })
            if confidence > max_confidence:
                max_confidence = confidence
                overall_status = "Brown Spot Disease Detected"
        
        # 3. Leaf Blast (Grayish-white lesions)
        lower_white_gray = np.array([0, 0, 150])
        upper_white_gray = np.array([180, 50, 255])
        white_gray_mask = cv2.inRange(hsv, lower_white_gray, upper_white_gray)
        white_gray_ratio = np.sum(white_gray_mask > 0) / (img_array.shape[0] * img_array.shape[1])
        
        if white_gray_ratio > 0.03:
            confidence = min(white_gray_ratio * 18, 0.95)
            diseases_detected.append({
                "disease": "Leaf Blast",
                "confidence": confidence,
                "severity": "high" if confidence > 0.7 else "moderate",
                "symptoms": "Grayish-white diamond-shaped lesions"
            })
            if confidence > max_confidence:
                max_confidence = confidence
                overall_status = "Leaf Blast Detected"
        
        # 4. Sheath Blight (Irregular brown lesions)
        # Detect irregular patterns
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (img_array.shape[0] * img_array.shape[1])
        
        if edge_density > 0.15 and brown_ratio > 0.02:
            confidence = min((edge_density + brown_ratio) * 8, 0.90)
            diseases_detected.append({
                "disease": "Sheath Blight",
                "confidence": confidence,
                "severity": "moderate",
                "symptoms": "Irregular brown lesions on leaf sheath"
            })
            if confidence > max_confidence:
                max_confidence = confidence
                overall_status = "Sheath Blight Detected"
        
        # 5. Powdery Mildew (White powdery spots)
        lower_white = np.array([0, 0, 200])
        upper_white = np.array([180, 30, 255])
        white_mask = cv2.inRange(hsv, lower_white, upper_white)
        white_ratio = np.sum(white_mask > 0) / (img_array.shape[0] * img_array.shape[1])
        
        if white_ratio > 0.02:
            confidence = min(white_ratio * 20, 0.95)
            diseases_detected.append({
                "disease": "Powdery Mildew",
                "confidence": confidence,
                "severity": "high" if confidence > 0.7 else "moderate",
                "symptoms": "White powdery spots on leaves"
            })
            if confidence > max_confidence:
                max_confidence = confidence
                overall_status = "Powdery Mildew Detected"
        
        # 6. Rust Disease (Orange-brown pustules)
        lower_rust = np.array([5, 100, 100])
        upper_rust = np.array([15, 255, 255])
        rust_mask = cv2.inRange(hsv, lower_rust, upper_rust)
        rust_ratio = np.sum(rust_mask > 0) / (img_array.shape[0] * img_array.shape[1])
        
        if rust_ratio > 0.03:
            confidence = min(rust_ratio * 16, 0.95)
            diseases_detected.append({
                "disease": "Rust Disease",
                "confidence": confidence,
                "severity": "moderate",
                "symptoms": "Orange-brown pustules on leaves"
            })
            if confidence > max_confidence:
                max_confidence = confidence
                overall_status = "Rust Disease Detected"
        
        # Generate recommendations
        recommendations = ""
        if len(diseases_detected) > 0:
            recommendations = "Immediate Action Required:\n"
            for disease in diseases_detected:
                recommendations += f"- {disease['disease']}: "
                if disease['disease'] == "Bacterial Leaf Blight":
                    recommendations += "Apply copper-based fungicide. Remove infected leaves. Improve air circulation.\n"
                elif disease['disease'] == "Brown Spot Disease":
                    recommendations += "Apply mancozeb or propiconazole. Reduce nitrogen fertilizer. Ensure proper spacing.\n"
                elif disease['disease'] == "Leaf Blast":
                    recommendations += "Apply tricyclazole or isoprothiolane. Avoid excessive nitrogen. Use resistant varieties.\n"
                elif disease['disease'] == "Sheath Blight":
                    recommendations += "Apply validamycin or propiconazole. Reduce plant density. Improve drainage.\n"
                elif disease['disease'] == "Powdery Mildew":
                    recommendations += "Apply sulfur-based fungicide or tebuconazole. Increase air circulation. Reduce humidity.\n"
                elif disease['disease'] == "Rust Disease":
                    recommendations += "Apply propiconazole or azoxystrobin. Remove infected leaves. Use resistant varieties.\n"
        else:
            recommendations = "Plant appears healthy. Continue regular monitoring and maintenance."
        
        return {
            "diagnosis": overall_status,
            "confidence": max_confidence if max_confidence > 0 else 0.85,
            "diseases": diseases_detected,
            "details": {
                "total_diseases": len(diseases_detected),
                "yellow_brown_ratio": float(yellow_brown_ratio),
                "brown_ratio": float(brown_ratio),
                "white_ratio": float(white_ratio),
                "rust_ratio": float(rust_ratio),
                "edge_density": float(edge_density)
            },
            "recommendations": recommendations
        }
    
    except Exception as e:
        print(f"Error in leaf disease detection: {e}")
        return {
            "diagnosis": "Unknown",
            "confidence": 0.0,
            "diseases": [],
            "details": {"error": str(e)},
            "recommendations": "Unable to detect diseases. Please check image quality and try again."
        }

def diagnose_plant(image_base64: str, sensor_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Diagnose plant health from image and sensor data
    Returns diagnosis, confidence, details, and recommendations
    """
    try:
        # Decode image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        img_array = np.array(image)
        
        # Simple color-based analysis
        # Analyze green color (healthy plants)
        green_channel = img_array[:, :, 1]
        green_mean = np.mean(green_channel)
        green_std = np.std(green_channel)
        
        # Analyze overall brightness
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        brightness = np.mean(gray)
        
        # Analyze color variance (disease/pest spots)
        color_variance = np.var(img_array, axis=2).mean()
        
        # Diagnosis logic
        diagnosis = "Healthy"
        confidence = 0.85
        details = {}
        recommendations = ""
        
        # Check for low green (unhealthy)
        if green_mean < 80:
            diagnosis = "Nutrient Deficiency"
            confidence = 0.75
            details = {
                "green_level": float(green_mean),
                "issue": "Low chlorophyll content detected",
                "severity": "moderate"
            }
            recommendations = "Apply nitrogen-rich fertilizer. Check soil pH levels. Ensure adequate sunlight."
        
        # Check for high variance (spots/patches)
        elif color_variance > 5000:
            diagnosis = "Disease or Pest Infestation"
            confidence = 0.70
            details = {
                "color_variance": float(color_variance),
                "issue": "Irregular color patterns detected",
                "severity": "moderate to high"
            }
            recommendations = "Inspect leaves for pests or disease symptoms. Apply appropriate pesticide or fungicide. Isolate affected plants if possible."
        
        # Check for low brightness (wilting)
        elif brightness < 100:
            diagnosis = "Water Stress"
            confidence = 0.80
            details = {
                "brightness": float(brightness),
                "issue": "Plant appears wilted or dehydrated",
                "severity": "moderate"
            }
            recommendations = "Increase irrigation frequency. Check soil moisture levels. Ensure proper drainage."
        
        # Use sensor data for additional context
        if sensor_data:
            if sensor_data.get('soil_moisture', 100) < 30:
                if diagnosis == "Healthy":
                    diagnosis = "Water Stress"
                    confidence = 0.90
                details["soil_moisture"] = sensor_data['soil_moisture']
                recommendations += " Soil moisture is low. Increase irrigation."
            
            if sensor_data.get('temperature', 25) > 35:
                details["temperature"] = sensor_data['temperature']
                if "Heat stress" not in recommendations:
                    recommendations += " High temperature detected. Provide shade or increase ventilation."
        
        # If all checks pass, plant is healthy
        if diagnosis == "Healthy":
            details = {
                "green_level": float(green_mean),
                "brightness": float(brightness),
                "color_variance": float(color_variance),
                "status": "All indicators normal"
            }
            recommendations = "Plant appears healthy. Continue regular monitoring and maintenance."
        
        return {
            "diagnosis": diagnosis,
            "confidence": confidence,
            "details": details,
            "recommendations": recommendations
        }
    
    except Exception as e:
        print(f"Error in plant diagnosis: {e}")
        return {
            "diagnosis": "Unknown",
            "confidence": 0.0,
            "details": {"error": str(e)},
            "recommendations": "Unable to diagnose. Please check image quality and try again."
        }

def get_temperature_zones(image_base64: str) -> Dict[str, Any]:
    """
    Extract temperature-like zones from thermal visualization
    Returns min, max, and average "temperature" values
    """
    try:
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        img_array = np.array(image)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Simulate temperature range (20-40°C)
        normalized = cv2.normalize(gray, None, 20, 40, cv2.NORM_MINMAX)
        
        return {
            "min_temp": float(np.min(normalized)),
            "max_temp": float(np.max(normalized)),
            "avg_temp": float(np.mean(normalized)),
            "hot_spots": int(np.sum(normalized > 35))  # Count of hot pixels
        }
    except Exception as e:
        print(f"Error in temperature zone extraction: {e}")
        return {
            "min_temp": 25.0,
            "max_temp": 30.0,
            "avg_temp": 27.5,
            "hot_spots": 0
        }

