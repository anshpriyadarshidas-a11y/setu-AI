import pytest
from src.demo import run_demo_scenario, RISK_DELTA_ALERT_THRESHOLD


def test_demo_risk_increases_after_disruption():
    result = run_demo_scenario(use_ml=False)
    assert result["after_disruption"]["risk_score"] > result["before_disruption"]["risk_score"]


def test_demo_level_changes():
    result = run_demo_scenario(use_ml=False)
    assert result["level_before"] != result["level_after"]


def test_demo_alert_fires():
    result = run_demo_scenario(use_ml=False)
    assert result["risk_delta_alert"] is True


def test_demo_delta_above_threshold():
    result = run_demo_scenario(use_ml=False)
    assert result["risk_delta"] >= RISK_DELTA_ALERT_THRESHOLD


def test_demo_forecast_has_entries():
    result = run_demo_scenario(use_ml=False)
    assert len(result["forecast"]["forecast"]) > 0


def test_demo_model_stage_a():
    result = run_demo_scenario(use_ml=False)
    assert result["model_stage"] == "A"
