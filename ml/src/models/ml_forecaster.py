from __future__ import annotations
from typing import Any, Dict, List

import numpy as np

from ..data.preprocessing import FEATURE_COLS, prepare_features
from .forecaster import _confidence_for_hour, MAX_FORECAST_HOURS
import pandas as pd


ROAD_TYPE_ORDER = ["highway", "state", "district", "rural"]

RISK_LEVEL_THRESHOLDS = (0.25, 0.50, 0.75)


def _prob_to_risk_level(prob: float) -> str:
    if prob < RISK_LEVEL_THRESHOLDS[0]:
        return "Low"
    if prob < RISK_LEVEL_THRESHOLDS[1]:
        return "Moderate"
    if prob < RISK_LEVEL_THRESHOLDS[2]:
        return "High"
    return "Critical"


def _encode_road_type(road_type: str) -> int:
    t = road_type.lower()
    return ROAD_TYPE_ORDER.index(t) if t in ROAD_TYPE_ORDER else len(ROAD_TYPE_ORDER)


def ml_forecast_risk(
    model: Any,
    segment_id: str,
    slope_degrees: float,
    historical_closure_count: int,
    road_type: str,
    river_distance_km: float,
    hourly_weather: List[Dict],
    current_rainfall_prev_6h_mm: float = 0.0,
) -> Dict:
    forecast = []
    prev_rainfall = current_rainfall_prev_6h_mm

    for entry in hourly_weather:
        hour_offset = int(entry["hour_offset"])
        if hour_offset > MAX_FORECAST_HOURS:
            continue

        rainfall_mm = float(entry["rainfall_mm"])
        active_warning = int(bool(entry.get("active_weather_warning", False)))
        rate_change = rainfall_mm - prev_rainfall / max(hour_offset, 1)

        row = {
            "rainfall_mm": rainfall_mm,
            "rainfall_prev_6h_mm": prev_rainfall,
            "rainfall_rate_change_mm_per_h": rate_change,
            "slope_degrees": slope_degrees,
            "river_distance_km": river_distance_km,
            "historical_closure_count": historical_closure_count,
            "active_weather_warning": active_warning,
            "road_type_encoded": _encode_road_type(road_type),
        }

        X = np.array([[row[f] for f in FEATURE_COLS]], dtype=float)
        prob = float(model.predict_proba(X)[0, 1])

        model_confidence = _confidence_for_hour(hour_offset)

        if hasattr(model, "predict_proba"):
            proba_spread = abs(prob - 0.5) * 2
            combined_confidence = round(min(model_confidence, 0.5 + 0.5 * proba_spread), 4)
        else:
            combined_confidence = model_confidence

        feature_importances = None
        if hasattr(model, "feature_importances_"):
            raw_imp = model.feature_importances_
            total = raw_imp.sum() or 1.0
            feature_importances = {
                feat: round(float(imp / total), 4)
                for feat, imp in zip(FEATURE_COLS, raw_imp)
            }

        forecast.append(
            {
                "segment_id": segment_id,
                "computed_for_hour": hour_offset,
                "risk_score": round(prob, 4),
                "risk_level": _prob_to_risk_level(prob),
                "confidence": combined_confidence,
                "contributing_factors": feature_importances or {},
            }
        )
        prev_rainfall = rainfall_mm

    forecast.sort(key=lambda x: x["computed_for_hour"])
    return {"segment_id": segment_id, "forecast": forecast}
