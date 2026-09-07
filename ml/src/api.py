from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from .risk_service import get_risk_score, get_risk_forecast

app = FastAPI()

class RiskRequest(BaseModel):
    segment_id: str
    rainfall_mm: float
    slope_degrees: float
    historical_closure_count: int
    road_type: str
    active_weather_warning: bool
    current_disruption_reported: bool
    use_ml: bool = False

@app.post("/predict")
async def predict_risk(request: RiskRequest):
    return get_risk_score(
        request.segment_id,
        request.rainfall_mm,
        request.slope_degrees,
        request.historical_closure_count,
        request.road_type,
        request.active_weather_warning,
        request.current_disruption_reported,
        request.use_ml
    )
