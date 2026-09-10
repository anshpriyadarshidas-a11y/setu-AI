import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.risk_service import get_risk_score

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
    ml_model_name: Optional[str] = "random_forest"

@app.post("/predict")
async def predict(request: RiskRequest):
    try:
        result = get_risk_score(
            segment_id=request.segment_id,
            rainfall_mm=request.rainfall_mm,
            slope_degrees=request.slope_degrees,
            historical_closure_count=request.historical_closure_count,
            road_type=request.road_type,
            active_weather_warning=request.active_weather_warning,
            current_disruption_reported=request.current_disruption_reported,
            use_ml=request.use_ml,
            ml_model_name=request.ml_model_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
