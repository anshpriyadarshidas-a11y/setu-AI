from __future__ import annotations
from typing import Dict, Any, List

from .risk_service import get_risk_score, get_risk_forecast

DEMO_SEGMENTS = {
    "normal": {
        "segment_id": "SEG_STATE_MN2",
        "slope_degrees": 22.0,
        "historical_closure_count": 3,
        "road_type": "state",
        "river_distance_km": 2.0,
    },
    "blocked": {
        "segment_id": "SEG_DIST_AR1",
        "slope_degrees": 30.0,
        "historical_closure_count": 8,
        "road_type": "district",
        "river_distance_km": 0.8,
    },
}

DEMO_WEATHER_NORMAL = {
    "rainfall_mm": 10.0,
    "active_weather_warning": False,
    "current_disruption_reported": False,
}

DEMO_WEATHER_DISRUPTED = {
    "rainfall_mm": 85.0,
    "active_weather_warning": True,
    "current_disruption_reported": True,
}

DEMO_HOURLY_FORECAST = [
    {"hour_offset": 0, "rainfall_mm": 10.0, "active_weather_warning": False},
    {"hour_offset": 1, "rainfall_mm": 20.0, "active_weather_warning": False},
    {"hour_offset": 2, "rainfall_mm": 40.0, "active_weather_warning": True},
    {"hour_offset": 3, "rainfall_mm": 65.0, "active_weather_warning": True},
    {"hour_offset": 4, "rainfall_mm": 80.0, "active_weather_warning": True},
    {"hour_offset": 6, "rainfall_mm": 70.0, "active_weather_warning": True},
    {"hour_offset": 8, "rainfall_mm": 50.0, "active_weather_warning": False},
]

RISK_DELTA_ALERT_THRESHOLD = 0.20


def run_demo_scenario(use_ml: bool = False, ml_model_name: str = "random_forest") -> Dict[str, Any]:
    seg = DEMO_SEGMENTS["blocked"]
    common = {
        "segment_id": seg["segment_id"],
        "slope_degrees": seg["slope_degrees"],
        "historical_closure_count": seg["historical_closure_count"],
        "road_type": seg["road_type"],
        "river_distance_km": seg["river_distance_km"],
        "use_ml": use_ml,
        "ml_model_name": ml_model_name,
    }

    before = get_risk_score(
        **common,
        rainfall_mm=DEMO_WEATHER_NORMAL["rainfall_mm"],
        active_weather_warning=DEMO_WEATHER_NORMAL["active_weather_warning"],
        current_disruption_reported=DEMO_WEATHER_NORMAL["current_disruption_reported"],
    )

    after = get_risk_score(
        **common,
        rainfall_mm=DEMO_WEATHER_DISRUPTED["rainfall_mm"],
        active_weather_warning=DEMO_WEATHER_DISRUPTED["active_weather_warning"],
        current_disruption_reported=DEMO_WEATHER_DISRUPTED["current_disruption_reported"],
    )

    forecast = get_risk_forecast(
        segment_id=seg["segment_id"],
        slope_degrees=seg["slope_degrees"],
        historical_closure_count=seg["historical_closure_count"],
        road_type=seg["road_type"],
        hourly_weather=DEMO_HOURLY_FORECAST,
        current_disruption_reported=True,
        river_distance_km=seg["river_distance_km"],
        use_ml=use_ml,
        ml_model_name=ml_model_name,
    )

    delta = after["risk_score"] - before["risk_score"]
    alert = delta >= RISK_DELTA_ALERT_THRESHOLD

    return {
        "before_disruption": before,
        "after_disruption": after,
        "risk_delta": round(delta, 4),
        "risk_delta_alert": alert,
        "level_before": before["risk_level"],
        "level_after": after["risk_level"],
        "forecast": forecast,
        "model_stage": after["model_stage"],
    }
