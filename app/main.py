from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from .api.routes import auth, sensors, predictions, advisories, trends, models_compare, export, weather
from .db import Base, engine

app = FastAPI(title="AgriXplain")

# Mount static and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Create tables (for demo; in prod use Alembic migrations)
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router)
app.include_router(sensors.router)
app.include_router(predictions.router)
app.include_router(advisories.router)
app.include_router(trends.router)
app.include_router(models_compare.router)
app.include_router(export.router)
app.include_router(weather.router)

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
