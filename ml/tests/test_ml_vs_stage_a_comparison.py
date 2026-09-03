import pytest
import joblib
import os

from src.models.forecaster import forecast_risk
from src.models.ml_forecaster import ml_forecast_risk

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")

SEGMENT_ID = "SEG_DIST_AR1"
SEGMENT_SLOPE = 30.0
SEGMENT_CLOSURES = 8
SEGMENT_ROAD_TYPE = "district"
SEGMENT_RIVER_KM = 0.8

HOURLY_WEATHER = [
    {"hour_offset": 0, "rainfall_mm": 10.0, "active_weather_warning": False},
    {"hour_offset": 1, "rainfall_mm": 25.0, "active_weather_warning": False},
    {"hour_offset": 2, "rainfall_mm": 50.0, "active_weather_warning": True},
    {"hour_offset": 4, "rainfall_mm": 75.0, "active_weather_warning": True},
    {"hour_offset": 6, "rainfall_mm": 60.0, "active_weather_warning": True},
    {"hour_offset": 8, "rainfall_mm": 35.0, "active_weather_warning": False},
]

ESCALATING_WEATHER = [
    {"hour_offset": i, "rainfall_mm": 10.0 + i * 12.0, "active_weather_warning": i >= 4}
    for i in range(8)
]

LOW_RAIN_WEATHER = [
    {"hour_offset": i, "rainfall_mm": 3.0, "active_weather_warning": False}
    for i in range(8)
]

HIGH_RAIN_WEATHER = [
    {"hour_offset": i, "rainfall_mm": 90.0, "active_weather_warning": True}
    for i in range(8)
]


def _load_model(name: str):
    path = os.path.join(ARTIFACTS_DIR, f"{name}.joblib")
    if not os.path.exists(path):
        pytest.skip(f"Artifact {name}.joblib not found — run run_pipeline.py first")
    return joblib.load(path)


def _stage_a_forecast(hourly_weather=None):
    return forecast_risk(
        segment_id=SEGMENT_ID,
        slope_degrees=SEGMENT_SLOPE,
        historical_closure_count=SEGMENT_CLOSURES,
        road_type=SEGMENT_ROAD_TYPE,
        hourly_weather=hourly_weather if hourly_weather is not None else HOURLY_WEATHER,
    )


def _stage_b_forecast(model_name: str = "random_forest", hourly_weather=None):
    model = _load_model(model_name)
    return ml_forecast_risk(
        model=model,
        segment_id=SEGMENT_ID,
        slope_degrees=SEGMENT_SLOPE,
        historical_closure_count=SEGMENT_CLOSURES,
        road_type=SEGMENT_ROAD_TYPE,
        river_distance_km=SEGMENT_RIVER_KM,
        hourly_weather=hourly_weather if hourly_weather is not None else HOURLY_WEATHER,
    )


def test_both_forecasts_same_segment_id():
    a = _stage_a_forecast()
    b = _stage_b_forecast()
    assert a["segment_id"] == b["segment_id"] == SEGMENT_ID


def test_both_forecasts_same_number_of_hours():
    a = _stage_a_forecast()
    b = _stage_b_forecast()
    assert len(a["forecast"]) == len(b["forecast"])


def test_both_forecasts_sorted_by_hour():
    a = _stage_a_forecast()
    b = _stage_b_forecast()
    a_hours = [h["computed_for_hour"] for h in a["forecast"]]
    b_hours = [h["computed_for_hour"] for h in b["forecast"]]
    assert a_hours == sorted(a_hours)
    assert b_hours == sorted(b_hours)


def test_both_have_required_schema_fields():
    required = {"segment_id", "computed_for_hour", "risk_score", "risk_level", "confidence", "contributing_factors"}
    a = _stage_a_forecast()
    b = _stage_b_forecast()
    for entry in a["forecast"]:
        assert required.issubset(entry.keys()), f"Stage A missing keys: {required - entry.keys()}"
    for entry in b["forecast"]:
        assert required.issubset(entry.keys()), f"Stage B missing keys: {required - entry.keys()}"


def test_both_risk_scores_in_bounds():
    a = _stage_a_forecast()
    b = _stage_b_forecast()
    for entry in a["forecast"]:
        assert 0.0 <= entry["risk_score"] <= 1.0
    for entry in b["forecast"]:
        assert 0.0 <= entry["risk_score"] <= 1.0


def test_both_confidence_values_in_bounds():
    a = _stage_a_forecast()
    b = _stage_b_forecast()
    for entry in a["forecast"]:
        assert 0.0 < entry["confidence"] <= 1.0
    for entry in b["forecast"]:
        assert 0.0 < entry["confidence"] <= 1.0


def test_stage_a_confidence_strictly_decays_over_hours():
    a = _stage_a_forecast()
    a_conf = [h["confidence"] for h in a["forecast"]]
    for i in range(len(a_conf) - 1):
        assert a_conf[i] >= a_conf[i + 1], f"Stage A confidence did not decay at index {i}"


def test_stage_b_confidence_lower_at_last_hour_than_first():
    b = _stage_b_forecast()
    b_conf = [h["confidence"] for h in b["forecast"]]
    assert b_conf[-1] <= b_conf[0], "Stage B overall confidence should be lower at last hour than first"


def test_both_risk_levels_are_valid():
    valid_levels = {"Low", "Moderate", "High", "Critical"}
    a = _stage_a_forecast()
    b = _stage_b_forecast()
    for entry in a["forecast"]:
        assert entry["risk_level"] in valid_levels
    for entry in b["forecast"]:
        assert entry["risk_level"] in valid_levels


def test_escalating_rain_increases_risk_stage_a():
    low = _stage_a_forecast(hourly_weather=LOW_RAIN_WEATHER)
    high = _stage_a_forecast(hourly_weather=HIGH_RAIN_WEATHER)
    avg_low = sum(h["risk_score"] for h in low["forecast"]) / len(low["forecast"])
    avg_high = sum(h["risk_score"] for h in high["forecast"]) / len(high["forecast"])
    assert avg_high > avg_low


def test_escalating_rain_increases_risk_stage_b():
    low = _stage_b_forecast(hourly_weather=LOW_RAIN_WEATHER)
    high = _stage_b_forecast(hourly_weather=HIGH_RAIN_WEATHER)
    avg_low = sum(h["risk_score"] for h in low["forecast"]) / len(low["forecast"])
    avg_high = sum(h["risk_score"] for h in high["forecast"]) / len(high["forecast"])
    assert avg_high > avg_low


def test_stage_a_contributing_factors_named():
    a = _stage_a_forecast()
    for entry in a["forecast"]:
        cf = entry["contributing_factors"]
        assert "rainfall" in cf
        assert "terrain" in cf
        assert "historical_closures" in cf
        assert "road_status" in cf


def test_stage_b_contributing_factors_present():
    b = _stage_b_forecast()
    for entry in b["forecast"]:
        assert isinstance(entry["contributing_factors"], dict)
        assert len(entry["contributing_factors"]) > 0


def test_all_three_ml_models_produce_valid_forecasts():
    for model_name in ("logistic_regression", "random_forest", "xgboost"):
        result = _stage_b_forecast(model_name=model_name)
        assert len(result["forecast"]) == len(HOURLY_WEATHER)
        for entry in result["forecast"]:
            assert 0.0 <= entry["risk_score"] <= 1.0
            assert entry["risk_level"] in {"Low", "Moderate", "High", "Critical"}


def test_stage_b_hour0_confidence_not_above_stage_a_hour0():
    a = _stage_a_forecast()
    b = _stage_b_forecast()
    a_h0 = next(h for h in a["forecast"] if h["computed_for_hour"] == 0)
    b_h0 = next(h for h in b["forecast"] if h["computed_for_hour"] == 0)
    assert b_h0["confidence"] <= a_h0["confidence"]


def test_escalating_forecast_risk_trend_stage_a():
    result = _stage_a_forecast(hourly_weather=ESCALATING_WEATHER)
    scores = [h["risk_score"] for h in result["forecast"]]
    assert scores[-1] > scores[0], "Risk should be higher at last hour than hour 0 with escalating rain"


def test_escalating_forecast_risk_trend_stage_b():
    result = _stage_b_forecast(hourly_weather=ESCALATING_WEATHER)
    scores = [h["risk_score"] for h in result["forecast"]]
    assert scores[-1] > scores[0], "ML risk should be higher at last hour than hour 0 with escalating rain"
