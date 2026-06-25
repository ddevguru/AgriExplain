from fastapi import APIRouter

router = APIRouter(prefix="/api/advisories", tags=["advisories"])

SIMPLE_ADVICE = [
    {"en": "Irrigation optimal. No action required today", "mr": "सिंचन योग्य आहे. आज कोणतीही कारवाई आवश्यक नाही"},
    {"en": "Temperature rising. Monitor closely", "mr": "तापमान वाढत आहे. लक्ष ठेवा"},
    {"en": "Rain expected. Plan drainage", "mr": "पावसाची शक्यता. निचरा नियोजित करा"},
]

@router.get("/today")
def today(lang: str = "en"):
    a = SIMPLE_ADVICE[0]
    return {"message": a.get(lang, a["en"]) }
