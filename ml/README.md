# SetuAI — ML Component

## What This Module Does

Turns raw signals (weather, terrain, history, live reports) into a **risk score per road segment, per hour**, with a confidence value. The routing engine consumes this output; it does not need to know how the score was produced.

---

## Model Stage Used in the Demo

**Stage A (rule-based) is the primary model for the demo.**

Stage B (trained ML) is implemented, trained, and evaluated, but Stage A is wired as the default because:

- Stage A is fully explainable, fast, and produces well-calibrated risk scores without any training data dependency.
- Stage B (Logistic Regression, Random Forest, XGBoost) was trained on a **synthetic dataset** — not verified historical disruption records. Its F1 scores (~0.52–0.58) are reasonable for a hackathon but do not clearly outperform Stage A on the demo scenarios.
- The architecture is designed so Stage A and Stage B are **swappable behind the same interface** — set `use_ml=True` on any `get_risk_score` / `get_risk_forecast` call to switch to Stage B instantly.

Stage B is framed honestly in the pitch as **prototyped and functional, but requiring real historical data before production use.**

---

## Quick Start

```bash
cd ml
pip install -r requirements.txt

# Run the full pipeline (data gen → train → evaluate → demo)
python run_pipeline.py

# Run all tests
pytest tests/ -v
```

---

## Project Structure

```
ml/
├── src/
│   ├── models/
│   │   ├── rule_based.py        # Stage A — pure weighted formula
│   │   ├── forecaster.py        # Stage A hourly forecast + confidence decay
│   │   ├── ml_forecaster.py     # Stage B hourly forecast using trained model
│   │   └── trainer.py           # Trains LR, RF, XGBoost; saves .joblib artifacts
│   ├── data/
│   │   ├── synthetic_generator.py  # Generates plausible synthetic disruption dataset
│   │   └── preprocessing.py        # Feature engineering + train/val/test split
│   ├── evaluation/
│   │   └── metrics.py           # Precision, recall, F1, Brier, feature importances
│   ├── risk_service.py          # Unified entry point for Backend (Stage A or B)
│   └── demo.py                  # Demo scenario: before/after disruption + forecast
├── tests/
│   ├── test_rule_based.py
│   ├── test_forecaster.py
│   ├── test_risk_service.py
│   ├── test_demo.py
│   └── test_ml_vs_stage_a_comparison.py   # Phase 6: Side-by-side comparison
├── artifacts/
│   ├── synthetic_dataset.csv
│   ├── logistic_regression.joblib
│   ├── random_forest.joblib
│   ├── xgboost.joblib
│   └── model_comparison.csv
├── run_pipeline.py
├── requirements.txt
└── SetuAI_ML_Development_Doc.md
```

---

## Interface for the Backend

All Backend calls go through `src/risk_service.py`. Two functions:

### `get_risk_score(...)` — current risk for one segment

```python
from src.risk_service import get_risk_score

result = get_risk_score(
    segment_id="SEG_DIST_AR1",
    rainfall_mm=75.0,
    slope_degrees=30.0,
    historical_closure_count=8,
    road_type="district",
    active_weather_warning=True,
    current_disruption_reported=False,
    use_ml=False,          # True to use Stage B
    ml_model_name="random_forest",
)
```

Returns:

```json
{
  "segment_id": "SEG_DIST_AR1",
  "risk_score": 0.712,
  "risk_level": "High",
  "confidence": 0.95,
  "contributing_factors": { ... },
  "computed_for_hour": 0,
  "model_stage": "A"
}
```

### `get_risk_forecast(...)` — per-hour forecast (feeds Offline Mode)

```python
from src.risk_service import get_risk_forecast

result = get_risk_forecast(
    segment_id="SEG_DIST_AR1",
    slope_degrees=30.0,
    historical_closure_count=8,
    road_type="district",
    hourly_weather=[
        {"hour_offset": 0, "rainfall_mm": 10.0, "active_weather_warning": False},
        {"hour_offset": 1, "rainfall_mm": 30.0, "active_weather_warning": False},
        {"hour_offset": 2, "rainfall_mm": 65.0, "active_weather_warning": True},
        ...
    ],
    use_ml=False,
)
```

Each entry in `result["forecast"]` maps directly to a row in the Backend's `risk_scores` table:
`risk_score`, `risk_level`, `confidence`, `contributing_factors`, `computed_for_hour`.

---

## Explainability

Every risk score, Stage A or B, returns `contributing_factors`:

- **Stage A**: named factors (rainfall, terrain, historical\_closures, road\_status) with raw value, normalised value, weight, weighted contribution, and impact label.
- **Stage B**: feature importances (relative %) for each model input feature.

This powers the "why this route?" explanation shown in the app.

---

## Stage B Model Evaluation (test set, synthetic data)

| Model | Precision | Recall | F1 | Brier Score |
|---|---|---|---|---|
| Logistic Regression | 0.541 | 0.623 | 0.579 | 0.227 |
| XGBoost | 0.517 | 0.535 | 0.526 | 0.243 |
| Random Forest | 0.526 | 0.513 | 0.519 | 0.229 |

Evaluated on precision, recall, F1, and Brier score — **not raw accuracy** — because disruption events are rare (class imbalance). A model predicting "no disruption" every time would score ~70%+ accuracy while being useless.

---

## Confidence Values

Confidence decays with forecast hour-offset:

- Hour 0: 0.95
- Each additional hour: −0.06 (floor: 0.10)

Stage B additionally factors in the model's own probability spread (closer to 0 or 1 → more confident). This reflects the app's honesty claim: **we show confidence, not false certainty.**

---

## Known Limitations (for Judge Q&A)

1. **Synthetic training data.** Stage B was trained on a procedurally generated dataset with plausible correlations (high rainfall + steep slope + prior closures → higher disruption probability). It has not been validated against real historical road closure records from NER. Real data would be needed before production deployment.

2. **Class imbalance.** Disruption events are rare. Models are trained with `class_weight="balanced"` / `scale_pos_weight` to avoid the "always predict normal" failure mode, but class imbalance remains a challenge — reflected in moderate recall scores.

3. **Confidence is not a formal statistical guarantee.** The confidence value is a useful, honest signal that decreases with forecast distance and model uncertainty. It is not a calibrated 95% credible interval in the statistical sense.

4. **Static terrain features.** Slope, river distance, and road type are fixed per segment profile. In production these would come from the live `road_segments` table joined with elevation APIs.

5. **No temporal leakage guard beyond split.** The train/val/test split is random (shuffled), not time-ordered. A production system would split by time to prevent future data leaking into historical training windows.

---

## Fallback Plan

Stage A is always wired and ready. If Stage B is unavailable or unreliable, the system degrades gracefully:

- `get_risk_score(..., use_ml=False)` — returns a fully explainable Stage A score instantly.
- No model artifact required; Stage A is a pure Python function with zero external dependencies beyond the standard library.
- The pitch frames Stage B as **"prototyped, functional, and ready to improve with real data"** rather than production-ready.
