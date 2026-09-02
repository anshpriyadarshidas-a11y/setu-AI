# SetuAI — AI/ML Development Document

> Purpose: written so an AI coding assistant can work through the ML/risk-prediction component **in the correct sequence**, phase by phase. This covers the risk-prediction model only — routing logic, APIs, and general backend structure are covered in the Backend document.

---

## 1. Scope & Guiding Principle

SetuAI's ML component has one job: **turn raw signals (weather, terrain, history, current reports) into a risk score per road segment, per hour, with a confidence value.** Everything else (routing, modes, offline packaging) consumes this output — it does not need to know how the score was produced.

**Guiding principle for a 10-day hackathon:** start with the rule-based weighted model (already defined), get it fully working and integrated first, and only move to a trained ML model if time allows. A working rule-based system beats a half-trained model with no time left to integrate it. This checklist is sequenced accordingly — do not skip to Phase 4 (model training) before Phase 1–3 are solid.

---

## 2. Two-Stage Model Plan

### Stage A — Prototype (Rule-Based)
`Risk Score = 0.40 × Rainfall Risk + 0.30 × Historical Closure Risk + 0.20 × Terrain Risk + 0.10 × Current Road Status`

Advantages: fast to implement, fully explainable, needs no training data, good enough for a hackathon demo.

### Stage B — Advanced (Trained ML Model)
Only pursued once Stage A is integrated and working end-to-end.

**Candidate models:** Random Forest, XGBoost / Gradient Boosting, Logistic Regression (as a simple, explainable baseline).

**Candidate input features:**
- Rainfall (current + recent trend)
- Rainfall rate-of-change
- Slope / elevation
- Distance from rivers
- Historical closure count for the segment
- Previous incident records
- Road type
- Active weather warnings

**Target output:** probability of disruption within a specified future time window (e.g., next 1hr, next 6hr) — this is what feeds the Predictive Offline Mode's hourly forecast.

**Evaluation approach:** use precision, recall, F1-score, and calibration — **not raw accuracy**, since disruption events are rare (class imbalance) and a model that just predicts "no disruption" every time would score high on accuracy while being useless.

---

## 3. Data Requirements

| Data type | Purpose | Notes |
|---|---|---|
| Historical road closures/disruptions | Training labels | If real historical data isn't available for NER, simulate a plausible synthetic dataset for the hackathon — be upfront about this in the pitch |
| Historical + forecast weather (hourly) | Core features | Needed for both current risk and the predictive hourly forecast |
| Terrain/elevation/slope data | Static features | Can come from open elevation datasets |
| Road network data | Segment definitions | From OpenStreetMap, matching what the Backend/routing team is using |
| Current disruption reports | Real-time input | From the `disruptions` table (Backend doc) |

**If real historical disruption data is unavailable (likely, for a hackathon):** generate a synthetic dataset with plausible correlations (e.g., higher rainfall + steep terrain + prior closures → higher disruption probability) so Stage B has something to train and evaluate on. Document clearly in the pitch that this is simulated, not verified historical fact.

---

## 4. Predictive Forecasting & Confidence (feeds Offline Mode)

This is the ML-side counterpart to the Backend's Predictive Offline Mode:

- For each segment, produce a **risk score per future hour** (e.g., next 8–12 hours), not just a single "now" score.
- Each hourly prediction needs a **confidence value that decreases as the hour offset increases** — next-hour predictions should be visibly more trustworthy than +8hr ones.
- Confidence can start simple: a function of how far into the forecast window the prediction is, and/or the model's own predicted-probability spread. It does not need to be a fully calibrated statistical confidence interval for the hackathon — but it must be present and decay sensibly, since the app's honesty claim ("we show confidence, not false certainty") depends on it.
- This forecasting logic must output in a structure the Backend can consume directly (see Backend doc §3, `risk_scores` table: `computed_for_hour`, `confidence`, `risk_score`).

---

## 5. Explainability Requirement

Every risk score — rule-based or ML — must be able to return a **contributing-factors breakdown** (e.g., "Rainfall: high impact, Terrain: moderate impact, Historical closures: low impact"). This powers the "why this route is recommended" explanation, which is a stated MVP requirement. For Stage B, this means using feature importances (built-in for tree-based models) rather than a black-box output alone.

---

## 6. Build Checklist (Sequential)

### Phase 0 — Environment Setup
- [ ] Set up Python ML environment (Pandas, NumPy, Scikit-learn; add XGBoost if pursuing Stage B)
- [ ] Confirm access to weather data source and its hourly forecast fields
- [ ] Confirm access to (or plan for simulating) historical disruption data
- [ ] Agree on the data schema handoff with the Backend team (must match `road_segments`, `weather_data`, `disruptions` tables)

### Phase 1 — Stage A: Rule-Based Model
- [ ] Implement the weighted formula as a standalone, pure function (no framework dependencies) so it's trivially testable and swappable later
- [ ] Implement contributing-factors output alongside the score (see §5)
- [ ] Unit-test against a handful of hand-constructed scenarios (e.g., high rain + steep terrain should score higher than low rain + flat terrain) to sanity-check the weights
- [ ] Confirm output format matches what the Backend risk engine module expects

### Phase 2 — Rule-Based Hourly Forecasting
- [ ] Extend Stage A to accept hourly forecast weather data and produce a risk score **per future hour**, not just current
- [ ] Add a confidence value that decreases with hour-offset (simple linear or step decay is fine for the hackathon)
- [ ] Test that forecasted risk trends move sensibly with forecasted rainfall trends (e.g., a forecast showing increasing rain should show increasing risk + appropriately lower confidence far out)
- [ ] Hand off to Backend team for integration into `/api/risk/{segment_id}/forecast` and offline packaging

### Phase 3 — Data Preparation (only if pursuing Stage B)
- [ ] Assemble or simulate a historical dataset with the features listed in §2
- [ ] Clean data: remove duplicates, invalid coordinates/values, normalize formats
- [ ] Engineer derived features (rainfall rate-of-change, distance-from-river, etc.)
- [ ] Split into train/validation/test sets, being careful to avoid leakage (e.g., don't let the same segment's future data leak into training for its past)
- [ ] Document clearly which parts of the dataset are real vs. synthetic

### Phase 4 — Model Training (only if pursuing Stage B)
- [ ] Train a simple baseline first (Logistic Regression) before more complex models — this gives a sanity-check floor
- [ ] Train Random Forest and/or XGBoost
- [ ] Tune basic hyperparameters (keep this light — time-boxed, not exhaustive)
- [ ] Save the trained model artifact in a way the backend can load it (e.g., pickle/joblib + a clear loading function)

### Phase 5 — Evaluation
- [ ] Evaluate all trained models on precision, recall, F1-score, and calibration (not accuracy alone)
- [ ] Check performance specifically on the "disruption" class, given expected class imbalance
- [ ] Compare against the Stage A rule-based model as a baseline — if Stage B doesn't clearly outperform Stage A, be honest about that in the pitch rather than forcing it in
- [ ] Extract and sanity-check feature importances for explainability (§5)

### Phase 6 — ML-Based Hourly Forecasting (only if Stage B is proceeding well)
- [ ] Extend the trained model to output probability-of-disruption per future hour window, using forecasted weather as input
- [ ] Derive confidence from model output (e.g., prediction probability spread, or explicit decay by hour-offset if the model doesn't naturally provide this)
- [ ] Compare against the Stage A hourly forecast from Phase 2 on the same test scenarios

### Phase 7 — Integration Handoff
- [ ] Confirm the model (Stage A or B, whichever is being used for the demo) is wrapped in a single, clean function/service the Backend can call without needing to know internal details
- [ ] Confirm output schema exactly matches the Backend's `risk_scores` table fields (`risk_score`, `risk_level`, `confidence`, `contributing_factors`, `computed_for_hour`)
- [ ] Run an end-to-end test: Backend requests a risk score → ML module returns a correctly formatted response → Backend correctly computes a route around it

### Phase 8 — Demo Scenario Support
- [ ] Confirm the model responds correctly to the simulated disruption used in the demo (i.e., manually flipping a segment's disruption status visibly changes its risk score and forecast)
- [ ] Confirm the risk-level jump used in the demo (for Risk-Delta Re-Alerting, per Backend doc §Phase 8) is large enough to clearly cross the alert threshold

### Phase 9 — Documentation & Fallback Plan
- [ ] Document which stage (A or B) is being used in the final demo, and why
- [ ] If Stage B was attempted but isn't reliable in time, confirm Stage A is fully wired as the fallback and that the pitch explicitly frames Stage B as "future scope, prototyped" rather than claiming it's production-ready
- [ ] Prepare a short, honest explanation of model limitations for judge Q&A (data quality, class imbalance, synthetic data if used, confidence not being a formal statistical guarantee)

---

## 7. Notes for the AI Assistant Executing This

- Do not begin Stage B (Phases 3–6) until Stage A (Phases 1–2) is fully working and already integrated with the Backend — a working simple model beats an unfinished complex one.
- Keep the risk-computation function pure and stateless (input: segment + weather + history data → output: score, level, confidence, contributing factors) so Stage A and Stage B are interchangeable behind the same interface.
- After each phase, summarize what was built, what was tested, and flag anything stubbed due to missing data (e.g., synthetic historical data) before proceeding.
- Prioritize explainability output (§5) equally with the score itself — an unexplained risk number is a weaker deliverable than a slightly simpler but explainable one.
