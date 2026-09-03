from __future__ import annotations
import os
from typing import Dict, Any, List, Optional

from .models.rule_based import compute_risk
from .models.forecaster import forecast_risk
from .models.ml_forecaster import ml_forecast_risk


ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
_ML_MODEL_CACHE: Dict[str, Any] = {}


def _load_ml_model(model_name: str = "random_forest") -> Optional[Any]:
    if model_name in _ML_MODEL_CACHE:
        return _ML_MODEL_CACHE[model_name]
    try:
        import joblib

        path = os.path.join(ARTIFACTS_DIR, f"{model_name}.joblib")
        if os.path.exists(path):
            model = joblib.load(path)
            _ML_MODEL_CACHE[model_name] = model
            return model
    except Exception:
        pass
    return None


def get_risk_score(
    segment_id: str,
    rainfall_mm: float,
    slope_degrees: float,
    historical_closure_count: int,
    road_type: str,
    active_weather_warning: bool,
    current_disruption_reported: bool,
    use_ml: bool = False,
    ml_model_name: str = "random_forest",
    river_distance_km: float = 1.0,
    rainfall_prev_6h_mm: float = 0.0,
) -> Dict[str, Any]:
    if use_ml:
        model = _load_ml_model(ml_model_name)
        if model is not None:
            from .data.preprocessing import FEATURE_COLS
            from .models.ml_forecaster import _encode_road_type
            import numpy as np

            rate_change = rainfall_mm - rainfall_prev_6h_mm / 1.0
            row = [
                rainfall_mm,
                rainfall_prev_6h_mm,
                rate_change,
                slope_degrees,
                river_distance_km,
                historical_closure_count,
                int(active_weather_warning),
                _encode_road_type(road_type),
            ]
            X = np.array([row], dtype=float)
            prob = float(model.predict_proba(X)[0, 1])

            if prob < 0.25:
                level = "Low"
            elif prob < 0.50:
                level = "Moderate"
            elif prob < 0.75:
                level = "High"
            else:
                level = "Critical"

            fi = {}
            if hasattr(model, "feature_importances_"):
                total = model.feature_importances_.sum() or 1.0
                fi = {
                    feat: round(float(imp / total), 4)
                    for feat, imp in zip(FEATURE_COLS, model.feature_importances_)
                }

            return {
                "segment_id": segment_id,
                "risk_score": round(prob, 4),
                "risk_level": level,
                "confidence": 0.95,
                "contributing_factors": fi,
                "computed_for_hour": 0,
                "model_stage": "B",
            }

    result = compute_risk(
        rainfall_mm=rainfall_mm,
        slope_degrees=slope_degrees,
        historical_closure_count=historical_closure_count,
        road_type=road_type,
        active_weather_warning=active_weather_warning,
        current_disruption_reported=current_disruption_reported,
    )
    return {
        "segment_id": segment_id,
        "risk_score": result["risk_score"],
        "risk_level": result["risk_level"],
        "confidence": 0.95,
        "contributing_factors": result["contributing_factors"],
        "computed_for_hour": 0,
        "model_stage": "A",
    }


def get_risk_forecast(
    segment_id: str,
    slope_degrees: float,
    historical_closure_count: int,
    road_type: str,
    hourly_weather: List[Dict[str, Any]],
    current_disruption_reported: bool = False,
    use_ml: bool = False,
    ml_model_name: str = "random_forest",
    river_distance_km: float = 1.0,
    rainfall_prev_6h_mm: float = 0.0,
) -> Dict[str, Any]:
    if use_ml:
        model = _load_ml_model(ml_model_name)
        if model is not None:
            result = ml_forecast_risk(
                model=model,
                segment_id=segment_id,
                slope_degrees=slope_degrees,
                historical_closure_count=historical_closure_count,
                road_type=road_type,
                river_distance_km=river_distance_km,
                hourly_weather=hourly_weather,
                current_rainfall_prev_6h_mm=rainfall_prev_6h_mm,
            )
            result["model_stage"] = "B"
            return result

    result = forecast_risk(
        segment_id=segment_id,
        slope_degrees=slope_degrees,
        historical_closure_count=historical_closure_count,
        road_type=road_type,
        hourly_weather=hourly_weather,
        current_disruption_reported=current_disruption_reported,
    )
    result["model_stage"] = "A"
    return result
