"""
Live Stream Processor
Handles MJPEG streaming from ESP32-S and real-time disease detection
"""

import cv2
import numpy as np
from typing import Generator, Tuple, Dict, Any
import requests
from io import BytesIO
from PIL import Image
import base64

def process_stream_frame(frame: np.ndarray, sensor_data: Dict[str, Any] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Process a single frame from the stream and detect plant diseases
    Returns processed frame with annotations and diagnosis data
    """
    try:
        # Convert to RGB if needed
        if len(frame.shape) == 3 and frame.shape[2] == 3:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        else:
            rgb_frame = frame
        
        # Create a copy for annotations
        annotated_frame = frame.copy()
        
        # Disease detection
        diagnosis = detect_diseases_realtime(rgb_frame, sensor_data)
        
        # Draw annotations on frame
        if diagnosis['has_issue']:
            # Draw bounding boxes for detected issues
            for issue in diagnosis['issues']:
                x, y, w, h = issue['bbox']
                cv2.rectangle(annotated_frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                cv2.putText(annotated_frame, 
                           f"{issue['type']} ({issue['confidence']:.0%})",
                           (x, y-10),
                           cv2.FONT_HERSHEY_SIMPLEX,
                           0.5, (0, 0, 255), 2)
        
        # Add status text
        status_text = f"Status: {diagnosis['status']}"
        cv2.putText(annotated_frame, status_text, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        if diagnosis['confidence'] > 0:
            conf_text = f"Confidence: {diagnosis['confidence']:.0%}"
            cv2.putText(annotated_frame, conf_text, (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        return annotated_frame, diagnosis
    
    except Exception as e:
        print(f"Error processing frame: {e}")
        return frame, {
            'status': 'Unknown',
            'confidence': 0.0,
            'has_issue': False,
            'issues': []
        }

def detect_diseases_realtime(frame: np.ndarray, sensor_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Real-time disease detection on video frame
    Uses color analysis and pattern detection
    """
    try:
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(frame, cv2.COLOR_RGB2HSV)
        
        # Analyze green channel (healthy plants)
        green_channel = frame[:, :, 1]
        green_mean = np.mean(green_channel)
        green_std = np.std(green_channel)
        
        # Analyze color variance (disease spots)
        color_variance = np.var(frame, axis=2).mean()
        
        # Analyze brightness
        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
        brightness = np.mean(gray)
        
        # Detect yellow/brown spots (disease indicators)
        # Yellow range in HSV
        lower_yellow = np.array([20, 100, 100])
        upper_yellow = np.array([30, 255, 255])
        yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
        yellow_pixels = np.sum(yellow_mask > 0)
        yellow_ratio = yellow_pixels / (frame.shape[0] * frame.shape[1])
        
        # Detect brown spots (disease/rot)
        lower_brown = np.array([10, 50, 20])
        upper_brown = np.array([20, 255, 200])
        brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
        brown_pixels = np.sum(brown_mask > 0)
        brown_ratio = brown_pixels / (frame.shape[0] * frame.shape[1])
        
        # Detect white spots (powdery mildew)
        lower_white = np.array([0, 0, 200])
        upper_white = np.array([180, 30, 255])
        white_mask = cv2.inRange(hsv, lower_white, upper_white)
        white_pixels = np.sum(white_mask > 0)
        white_ratio = white_pixels / (frame.shape[0] * frame.shape[1])
        
        # Disease detection logic
        issues = []
        has_issue = False
        status = "Healthy"
        confidence = 0.85
        
        # Yellow spots detection (nutrient deficiency or early disease)
        if yellow_ratio > 0.05:
            has_issue = True
            # Find contours for yellow spots
            contours, _ = cv2.findContours(yellow_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for contour in contours:
                if cv2.contourArea(contour) > 100:  # Filter small noise
                    x, y, w, h = cv2.boundingRect(contour)
                    issues.append({
                        'type': 'Yellow Spots',
                        'confidence': min(yellow_ratio * 10, 0.95),
                        'bbox': (x, y, w, h),
                        'severity': 'moderate'
                    })
            status = "Nutrient Deficiency Detected"
            confidence = min(yellow_ratio * 10, 0.90)
        
        # Brown spots detection (disease/rot)
        if brown_ratio > 0.03:
            has_issue = True
            contours, _ = cv2.findContours(brown_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for contour in contours:
                if cv2.contourArea(contour) > 100:
                    x, y, w, h = cv2.boundingRect(contour)
                    issues.append({
                        'type': 'Brown Spots',
                        'confidence': min(brown_ratio * 15, 0.95),
                        'bbox': (x, y, w, h),
                        'severity': 'high'
                    })
            if status == "Healthy":
                status = "Disease Detected"
            confidence = max(confidence, min(brown_ratio * 15, 0.95))
        
        # White spots detection (powdery mildew)
        if white_ratio > 0.02:
            has_issue = True
            contours, _ = cv2.findContours(white_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for contour in contours:
                if cv2.contourArea(contour) > 100:
                    x, y, w, h = cv2.boundingRect(contour)
                    issues.append({
                        'type': 'Powdery Mildew',
                        'confidence': min(white_ratio * 20, 0.95),
                        'bbox': (x, y, w, h),
                        'severity': 'high'
                    })
            if status == "Healthy":
                status = "Powdery Mildew Detected"
            confidence = max(confidence, min(white_ratio * 20, 0.95))
        
        # Low green (unhealthy)
        if green_mean < 80 and not has_issue:
            has_issue = True
            status = "Plant Stress Detected"
            confidence = 0.75
            issues.append({
                'type': 'Low Chlorophyll',
                'confidence': 0.75,
                'bbox': (0, 0, frame.shape[1], frame.shape[0]),
                'severity': 'moderate'
            })
        
        # High variance (irregular patterns)
        if color_variance > 5000 and not has_issue:
            has_issue = True
            status = "Irregular Patterns Detected"
            confidence = 0.70
        
        # Use sensor data for additional context
        if sensor_data:
            if sensor_data.get('soil_moisture', 100) < 30:
                if not has_issue:
                    has_issue = True
                    status = "Water Stress"
                    confidence = 0.90
                else:
                    status += " + Water Stress"
            
            if sensor_data.get('temperature', 25) > 35:
                if not has_issue:
                    has_issue = True
                    status = "Heat Stress"
                    confidence = 0.85
        
        return {
            'status': status,
            'confidence': confidence,
            'has_issue': has_issue,
            'issues': issues,
            'metrics': {
                'green_mean': float(green_mean),
                'color_variance': float(color_variance),
                'brightness': float(brightness),
                'yellow_ratio': float(yellow_ratio),
                'brown_ratio': float(brown_ratio),
                'white_ratio': float(white_ratio)
            }
        }
    
    except Exception as e:
        print(f"Error in disease detection: {e}")
        return {
            'status': 'Unknown',
            'confidence': 0.0,
            'has_issue': False,
            'issues': [],
            'metrics': {}
        }

def apply_thermal_to_frame(frame: np.ndarray) -> np.ndarray:
    """
    Apply thermal colormap to frame for visualization
    """
    try:
        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
        normalized = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
        thermal = cv2.applyColorMap(normalized, cv2.COLORMAP_HOT)
        return cv2.cvtColor(thermal, cv2.COLOR_BGR2RGB)
    except Exception as e:
        print(f"Error applying thermal colormap: {e}")
        return frame

