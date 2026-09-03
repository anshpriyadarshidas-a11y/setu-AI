import pytest
from src.models.rule_based import compute_risk


def test_high_rain_steep_terrain_scores_higher():
    high = compute_risk(
        rainfall_mm=90.0,
        slope_degrees=40.0,
        historical_closure_count=8,
        road_type="rural",
        active_weather_warning=True,
        current_disruption_reported=True,
    )
    low = compute_risk(
        rainfall_mm=5.0,
        slope_degrees=3.0,
        historical_closure_count=0,
        road_type="highway",
        active_weather_warning=False,
        current_disruption_reported=False,
    )
    assert high["risk_score"] > low["risk_score"]


def test_score_bounds():
    result = compute_risk(
        rainfall_mm=200.0,
        slope_degrees=60.0,
        historical_closure_count=20,
        road_type="rural",
        active_weather_warning=True,
        current_disruption_reported=True,
    )
    assert 0.0 <= result["risk_score"] <= 1.0


def test_zero_inputs_low_risk():
    result = compute_risk(
        rainfall_mm=0.0,
        slope_degrees=0.0,
        historical_closure_count=0,
        road_type="highway",
        active_weather_warning=False,
        current_disruption_reported=False,
    )
    assert result["risk_level"] == "Low"


def test_critical_level_high_inputs():
    result = compute_risk(
        rainfall_mm=200.0,
        slope_degrees=60.0,
        historical_closure_count=20,
        road_type="rural",
        active_weather_warning=True,
        current_disruption_reported=True,
    )
    assert result["risk_level"] == "Critical"


def test_contributing_factors_present():
    result = compute_risk(
        rainfall_mm=30.0,
        slope_degrees=15.0,
        historical_closure_count=3,
        road_type="state",
        active_weather_warning=False,
        current_disruption_reported=False,
    )
    cf = result["contributing_factors"]
    assert "rainfall" in cf
    assert "historical_closures" in cf
    assert "terrain" in cf
    assert "road_status" in cf


def test_weighted_contributions_sum_to_score():
    result = compute_risk(
        rainfall_mm=40.0,
        slope_degrees=20.0,
        historical_closure_count=4,
        road_type="district",
        active_weather_warning=True,
        current_disruption_reported=False,
    )
    cf = result["contributing_factors"]
    total = sum(v["weighted_contribution"] for v in cf.values())
    assert abs(total - result["risk_score"]) < 1e-3


def test_disruption_reported_increases_score():
    without = compute_risk(
        rainfall_mm=30.0,
        slope_degrees=15.0,
        historical_closure_count=2,
        road_type="state",
        active_weather_warning=False,
        current_disruption_reported=False,
    )
    with_disruption = compute_risk(
        rainfall_mm=30.0,
        slope_degrees=15.0,
        historical_closure_count=2,
        road_type="state",
        active_weather_warning=False,
        current_disruption_reported=True,
    )
    assert with_disruption["risk_score"] > without["risk_score"]


def test_unknown_road_type_handled():
    result = compute_risk(
        rainfall_mm=20.0,
        slope_degrees=10.0,
        historical_closure_count=1,
        road_type="unknown",
        active_weather_warning=False,
        current_disruption_reported=False,
    )
    assert "risk_score" in result
