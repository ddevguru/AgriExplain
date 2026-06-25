import requests
from typing import Dict, List
import os
from dotenv import load_dotenv

load_dotenv()

class WeatherService:
    def __init__(self):
        # You can use OpenWeatherMap API or any other weather service
        self.api_key = os.getenv("WEATHER_API_KEY", "")
        self.base_url = "https://api.openweathermap.org/data/2.5"
    
    def get_weather_data(self, farm_id: str) -> Dict:
        """Get weather forecast data"""
        # For demo purposes, return mock data
        # In production, integrate with actual weather API
        
        # Mock weather data
        return {
            "temperature": 28.5,
            "humidity": 72.0,
            "rainfall": 12.5,
            "forecast": [
                {
                    "date": "2024-01-15",
                    "temperature": 29.0,
                    "humidity": 70.0,
                    "rainfall": 5.0,
                    "condition": "Partly Cloudy"
                },
                {
                    "date": "2024-01-16",
                    "temperature": 27.0,
                    "humidity": 75.0,
                    "rainfall": 15.0,
                    "condition": "Rainy"
                },
                {
                    "date": "2024-01-17",
                    "temperature": 30.0,
                    "humidity": 65.0,
                    "rainfall": 0.0,
                    "condition": "Sunny"
                }
            ]
        }
    
    def get_real_weather(self, lat: float, lon: float) -> Dict:
        """Get real weather data from API (if API key is configured)"""
        if not self.api_key:
            return self.get_weather_data("")
        
        try:
            url = f"{self.base_url}/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric"
            }
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    "temperature": data["main"]["temp"],
                    "humidity": data["main"]["humidity"],
                    "rainfall": data.get("rain", {}).get("1h", 0),
                    "forecast": []
                }
        except Exception as e:
            print(f"Weather API error: {e}")
        
        return self.get_weather_data("")

