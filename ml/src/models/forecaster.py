from __future__ import annotations
from typing import List, Dict, Any

from .rule_based import compute_risk


MAX_FORECAST_HOURS = 12
BASE_CONFIDENCE = 0.95
CONFIDENCE_DECAY_PER_HOUR = 0.06
MIN_CONFIDENCE = 0.10


def _confidence_for_hour(hour_offset: int) -> float:
    confidence = BASE_CONFIDENCE - CONFIDENCE_DECAY_PER_HOUR * hour_offset
    return round(max(MIN_CONFIDENCE, confidence), 4)


def forecast_risk(
    segment_id: str,
    slope_degrees: float,
    historical_closure_count: int,
    road_type: str,
    hourly_weather: List[Dict[str, Any]],
    current_disruption_reported: bool = False,
) -> Dict[str, Any]:
    forecast = []
    for entry in hourly_weather:
        hour_offset = int(entry["hour_offset"])
        if hour_offset > MAX_FORECAST_HOURS:
            continue

        result = compute_risk(
            rainfall_mm=float(entry["rainfall_mm"]),
            slope_degrees=slope_degrees,
            historical_closure_count=historical_closure_count,
            road_type=road_type,
            active_weather_warning=bool(entry.get("active_weather_warning", False)),
            current_disruption_reported=(
                current_disruption_reported if hour_offset == 0 else False
            ),
        )

        forecast.append(
            {
                "segment_id": segment_id,
                "computed_for_hour": hour_offset,
                "risk_score": result["risk_score"],
                "risk_level": result["risk_level"],
                "confidence": _confidence_for_hour(hour_offset),
                "contributing_factors": result["contributing_factors"],
            }
        )

    forecast.sort(key=lambda x: x["computed_for_hour"])
    return {"segment_id": segment_id, "forecast": forecast}
