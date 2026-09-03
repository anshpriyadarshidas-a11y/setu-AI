from __future__ import annotations
from typing import Dict, Any


RAINFALL_THRESHOLDS = (20.0, 50.0, 80.0)
SLOPE_THRESHOLDS = (10.0, 25.0, 40.0)
ROAD_TYPE_RISK = {
    "highway": 0.2,
    "state": 0.4,
    "district": 0.6,
    "rural": 0.8,
    "unknown": 0.5,
}


def _normalise_rainfall(mm: float) -> float:
    low, mid, high = RAINFALL_THRESHOLDS
    if mm <= 0:
        return 0.0
    if mm <= low:
        return mm / low * 0.25
    if mm <= mid:
        return 0.25 + (mm - low) / (mid - low) * 0.35
    if mm <= high:
        return 0.60 + (mm - mid) / (high - mid) * 0.30
    return 1.0


def _normalise_slope(degrees: float) -> float:
    low, mid, high = SLOPE_THRESHOLDS
    if degrees <= 0:
        return 0.0
    if degrees <= low:
        return degrees / low * 0.2
    if degrees <= mid:
        return 0.2 + (degrees - low) / (mid - low) * 0.4
    if degrees <= high:
        return 0.6 + (degrees - mid) / (high - mid) * 0.3
    return 1.0


def _normalise_history(closure_count: int) -> float:
    if closure_count <= 0:
        return 0.0
    if closure_count <= 2:
        return 0.3
    if closure_count <= 5:
        return 0.6
    if closure_count <= 10:
        return 0.85
    return 1.0


def _normalise_road_status(
    active_warning: bool,
    current_disruption: bool,
    road_type: str,
) -> float:
    base = ROAD_TYPE_RISK.get(road_type.lower(), 0.5)
    if current_disruption:
        base = min(1.0, base + 0.5)
    elif active_warning:
        base = min(1.0, base + 0.2)
    return base


def compute_risk(
    rainfall_mm: float,
    slope_degrees: float,
    historical_closure_count: int,
    road_type: str,
    active_weather_warning: bool,
    current_disruption_reported: bool,
) -> Dict[str, Any]:
    rainfall_risk = _normalise_rainfall(rainfall_mm)
    terrain_risk = _normalise_slope(slope_degrees)
    history_risk = _normalise_history(historical_closure_count)
    road_status_risk = _normalise_road_status(
        active_weather_warning, current_disruption_reported, road_type
    )

    score = (
        0.40 * rainfall_risk
        + 0.30 * history_risk
        + 0.20 * terrain_risk
        + 0.10 * road_status_risk
    )
    score = round(min(1.0, max(0.0, score)), 4)

    if score < 0.25:
        level = "Low"
    elif score < 0.50:
        level = "Moderate"
    elif score < 0.75:
        level = "High"
    else:
        level = "Critical"

    contributing_factors = {
        "rainfall": {
            "raw_mm": rainfall_mm,
            "normalised": round(rainfall_risk, 4),
            "weight": 0.40,
            "weighted_contribution": round(0.40 * rainfall_risk, 4),
            "impact": _impact_label(rainfall_risk),
        },
        "historical_closures": {
            "raw_count": historical_closure_count,
            "normalised": round(history_risk, 4),
            "weight": 0.30,
            "weighted_contribution": round(0.30 * history_risk, 4),
            "impact": _impact_label(history_risk),
        },
        "terrain": {
            "raw_slope_degrees": slope_degrees,
            "normalised": round(terrain_risk, 4),
            "weight": 0.20,
            "weighted_contribution": round(0.20 * terrain_risk, 4),
            "impact": _impact_label(terrain_risk),
        },
        "road_status": {
            "road_type": road_type,
            "active_weather_warning": active_weather_warning,
            "current_disruption_reported": current_disruption_reported,
            "normalised": round(road_status_risk, 4),
            "weight": 0.10,
            "weighted_contribution": round(0.10 * road_status_risk, 4),
            "impact": _impact_label(road_status_risk),
        },
    }

    return {
        "risk_score": score,
        "risk_level": level,
        "contributing_factors": contributing_factors,
    }


def _impact_label(value: float) -> str:
    if value < 0.25:
        return "low"
    if value < 0.55:
        return "moderate"
    if value < 0.80:
        return "high"
    return "very high"
