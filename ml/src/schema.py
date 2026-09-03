from typing import TypedDict, List, Optional


class SegmentInput(TypedDict):
    segment_id: str
    rainfall_mm: float
    slope_degrees: float
    historical_closure_count: int
    road_type: str
    active_weather_warning: bool
    current_disruption_reported: bool


class HourlyWeather(TypedDict):
    hour_offset: int
    rainfall_mm: float
    active_weather_warning: bool


class RiskOutput(TypedDict):
    segment_id: str
    risk_score: float
    risk_level: str
    confidence: float
    contributing_factors: dict
    computed_for_hour: int


class ForecastOutput(TypedDict):
    segment_id: str
    forecast: List[RiskOutput]
