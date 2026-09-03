import pytest
from src.models.forecaster import forecast_risk, _confidence_for_hour, MAX_FORECAST_HOURS, BASE_CONFIDENCE


HOURLY_WEATHER = [
    {"hour_offset": 0, "rainfall_mm": 10.0, "active_weather_warning": False},
    {"hour_offset": 1, "rainfall_mm": 30.0, "active_weather_warning": False},
    {"hour_offset": 2, "rainfall_mm": 55.0, "active_weather_warning": True},
    {"hour_offset": 4, "rainfall_mm": 80.0, "active_weather_warning": True},
    {"hour_offset": 8, "rainfall_mm": 40.0, "active_weather_warning": False},
]


def test_forecast_returns_all_hours():
    result = forecast_risk(
        segment_id="SEG_TEST",
        slope_degrees=20.0,
        historical_closure_count=3,
        road_type="state",
        hourly_weather=HOURLY_WEATHER,
    )
    assert result["segment_id"] == "SEG_TEST"
    assert len(result["forecast"]) == len(HOURLY_WEATHER)


def test_forecast_sorted_by_hour():
    result = forecast_risk(
        segment_id="SEG_TEST",
        slope_degrees=20.0,
        historical_closure_count=3,
        road_type="state",
        hourly_weather=HOURLY_WEATHER,
    )
    hours = [h["computed_for_hour"] for h in result["forecast"]]
    assert hours == sorted(hours)


def test_confidence_decays_with_hour():
    result = forecast_risk(
        segment_id="SEG_TEST",
        slope_degrees=20.0,
        historical_closure_count=3,
        road_type="state",
        hourly_weather=HOURLY_WEATHER,
    )
    confidences = [h["confidence"] for h in result["forecast"]]
    for i in range(len(confidences) - 1):
        assert confidences[i] >= confidences[i + 1]


def test_confidence_hour0_is_base():
    assert _confidence_for_hour(0) == BASE_CONFIDENCE


def test_confidence_never_below_minimum():
    for hour in range(20):
        c = _confidence_for_hour(hour)
        assert c >= 0.10


def test_risk_increases_with_rain():
    low_rain = [{"hour_offset": i, "rainfall_mm": 5.0, "active_weather_warning": False} for i in range(4)]
    high_rain = [{"hour_offset": i, "rainfall_mm": 90.0, "active_weather_warning": True} for i in range(4)]

    low = forecast_risk("S", 10.0, 1, "state", low_rain)
    high = forecast_risk("S", 10.0, 1, "state", high_rain)

    avg_low = sum(h["risk_score"] for h in low["forecast"]) / 4
    avg_high = sum(h["risk_score"] for h in high["forecast"]) / 4
    assert avg_high > avg_low


def test_hours_beyond_max_excluded():
    weather = [
        {"hour_offset": 0, "rainfall_mm": 10.0, "active_weather_warning": False},
        {"hour_offset": MAX_FORECAST_HOURS + 5, "rainfall_mm": 10.0, "active_weather_warning": False},
    ]
    result = forecast_risk("S", 10.0, 1, "state", weather)
    hours = [h["computed_for_hour"] for h in result["forecast"]]
    assert max(hours) <= MAX_FORECAST_HOURS
