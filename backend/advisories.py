from typing import List, Dict
from schemas import AdvisoryResponse

class AdvisoryService:
    def __init__(self):
        self.advisories_marathi = {
            "irrigation_optimal": "आज की सलाह: सिंचाई जारी रखें, मिट्टी नम है",
            "irrigation_needed": "सिंचाई आवश्यक: मिट्टी सूख रही है",
            "temperature_high": "तापमान बढ़ रहा है. निगरानी करें",
            "temperature_low": "तापमान कम है. फसल की सुरक्षा करें",
            "rainfall_high": "भारी वर्षा की चेतावनी",
            "ph_optimal": "pH स्तर इष्टतम है",
            "ph_low": "pH स्तर कम है. चूना लगाएं",
            "yield_high": "उत्पादन अच्छा होने की संभावना है"
        }
    
    def generate_advisories(
        self,
        crop: str,
        temperature: float,
        humidity: float,
        soil_moisture: float,
        rainfall: float,
        ph: float,
        yield_prediction: str,
        language: str = "en"
    ) -> List[AdvisoryResponse]:
        """Generate farmer-friendly advisories"""
        advisories = []
        
        # Irrigation advisory
        if soil_moisture < 40:
            if language == "mr":
                advisories.append(AdvisoryResponse(
                    title="सिंचाई",
                    message=self.advisories_marathi["irrigation_needed"],
                    priority="high",
                    action="Irrigation required",
                    language="mr"
                ))
            else:
                advisories.append(AdvisoryResponse(
                    title="Irrigation",
                    message="Soil moisture is low. Irrigation required today",
                    priority="high",
                    action="Start irrigation",
                    language="en"
                ))
        elif soil_moisture > 70 and rainfall > 10:
            if language == "mr":
                advisories.append(AdvisoryResponse(
                    title="सिंचाई",
                    message="वर्षा के कारण सिंचाई कम करें",
                    priority="medium",
                    action="Reduce irrigation",
                    language="mr"
                ))
            else:
                advisories.append(AdvisoryResponse(
                    title="Irrigation",
                    message="Reduce irrigation due to recent rainfall",
                    priority="medium",
                    action="Adjust schedule",
                    language="en"
                ))
        else:
            if language == "mr":
                advisories.append(AdvisoryResponse(
                    title="सिंचाई",
                    message=self.advisories_marathi["irrigation_optimal"],
                    priority="low",
                    action="Continue monitoring",
                    language="mr"
                ))
            else:
                advisories.append(AdvisoryResponse(
                    title="Irrigation",
                    message="Irrigation optimal. No action required today",
                    priority="low",
                    action="Continue monitoring",
                    language="en"
                ))
        
        # Temperature advisory
        if temperature > 35:
            if language == "mr":
                advisories.append(AdvisoryResponse(
                    title="तापमान",
                    message=self.advisories_marathi["temperature_high"],
                    priority="high",
                    action="Monitor closely",
                    language="mr"
                ))
            else:
                advisories.append(AdvisoryResponse(
                    title="Temperature",
                    message="Temperature rising. Monitor closely",
                    priority="high",
                    action="Increase irrigation",
                    language="en"
                ))
        elif temperature < 15:
            if language == "mr":
                advisories.append(AdvisoryResponse(
                    title="तापमान",
                    message=self.advisories_marathi["temperature_low"],
                    priority="medium",
                    action="Protect crops",
                    language="mr"
                ))
            else:
                advisories.append(AdvisoryResponse(
                    title="Temperature",
                    message="Low temperature detected. Protect crops",
                    priority="medium",
                    action="Cover crops",
                    language="en"
                ))
        
        # pH advisory
        if ph < 6.0:
            if language == "mr":
                advisories.append(AdvisoryResponse(
                    title="मिट्टी pH",
                    message=self.advisories_marathi["ph_low"],
                    priority="medium",
                    action="Apply lime",
                    language="mr"
                ))
            else:
                advisories.append(AdvisoryResponse(
                    title="Soil pH",
                    message="pH level is low. Apply lime to improve soil",
                    priority="medium",
                    action="Apply lime",
                    language="en"
                ))
        elif 6.5 <= ph <= 7.5:
            if language == "mr":
                advisories.append(AdvisoryResponse(
                    title="मिट्टी pH",
                    message=self.advisories_marathi["ph_optimal"],
                    priority="low",
                    action="No action needed",
                    language="mr"
                ))
            else:
                advisories.append(AdvisoryResponse(
                    title="Soil pH",
                    message="pH level is optimal for crop growth",
                    priority="low",
                    action="No action needed",
                    language="en"
                ))
        
        # Yield prediction advisory
        if yield_prediction == "High":
            if language == "mr":
                advisories.append(AdvisoryResponse(
                    title="उत्पादन पूर्वानुमान",
                    message=self.advisories_marathi["yield_high"],
                    priority="low",
                    action="Maintain current practices",
                    language="mr"
                ))
            else:
                advisories.append(AdvisoryResponse(
                    title="Yield Forecast",
                    message="High yield predicted. Maintain current farming practices",
                    priority="low",
                    action="Continue monitoring",
                    language="en"
                ))
        
        return advisories

