import pytest
from src.risk_service import get_risk_score, get_risk_forecast


def test_get_risk_score_stage_a():
    result = get_risk_score(
        segment_id="SEG_TEST",
        rainfall_mm=45.0,
        slope_degrees=20.0,
        historical_closure_count=4,
        road_type="state",
        active_weather_warning=True,
        current_disruption_reported=False,
    )
    assert result["segment_id"] == "SEG_TEST"
    assert 0.0 <= result["risk_score"] <= 1.0
    assert result["risk_level"] in ("Low", "Moderate", "High", "Critical")
    assert "contributing_factors" in result
    assert result["computed_for_hour"] == 0
    assert result["model_stage"] == "A"


def test_get_risk_forecast_stage_a():
    weather = [
        {"hour_offset": i, "rainfall_mm": 10.0 + i * 5, "active_weather_warning": i > 3}
        for i in range(6)
    ]
    result = get_risk_forecast(
        segment_id="SEG_TEST",
        slope_degrees=25.0,
        historical_closure_count=3,
        road_type="district",
        hourly_weather=weather,
    )
    assert result["segment_id"] == "SEG_TEST"
    assert len(result["forecast"]) == 6
    assert result["model_stage"] == "A"


def test_output_schema_fields():
    result = get_risk_score(
        segment_id="SEG_X",
        rainfall_mm=20.0,
        slope_degrees=10.0,
        historical_closure_count=2,
        road_type="highway",
        active_weather_warning=False,
        current_disruption_reported=False,
    )
    required_keys = {"segment_id", "risk_score", "risk_level", "confidence", "contributing_factors", "computed_for_hour"}
    assert required_keys.issubset(result.keys())
