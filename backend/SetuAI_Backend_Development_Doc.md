# SetuAI — Backend Development Document

> Purpose: this document is written so an AI coding assistant (e.g. Claude Code) can be pointed at it and build the backend **in the correct sequence**, phase by phase, checking items off as it goes. Each phase assumes the previous phase is complete before starting.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend framework | Python (FastAPI) | Async support, auto-generated OpenAPI docs, fast to prototype |
| Database | PostgreSQL + PostGIS | PostGIS needed for geospatial queries (segments, distances) |
| Routing engine | OSRM (Open Source Routing Machine) | Self-hosted or Docker container; consumes OpenStreetMap data |
| Map/road data | OpenStreetMap extracts (NER region) | |
| Caching / offline payloads | Redis (optional, for hot risk-score cache) or simple DB table | |
| Weather data | Any hourly-forecast weather API (e.g. Open-Meteo, OpenWeatherMap) | Needs **hourly forecast**, not just current conditions, for Predictive Offline Mode |
| Auth (if needed) | JWT-based auth via FastAPI | Only if user accounts are in scope for the hackathon build |
| Deployment | Docker Compose locally; any cloud VM/container host for demo | Keep it simple — this is a hackathon build |

Alternative backend: Node.js/Express, if the team is stronger in JS. This document assumes FastAPI; swap syntax accordingly if not.

---

## 2. Backend Responsibilities (Recap)

The backend must: accept route requests, calculate/serve risk scores per road segment, run the route optimization logic (cost function across time/risk/user constraints), serve mode-specific recommendations (Freight/Accessibility/Emergency), support offline sync payloads (including predictive hourly risk), and support risk-delta comparison on reconnect.

---

## 3. Database Schema

### `users`
| Field | Type | Notes |
|---|---|---|
| user_id | UUID / PK | |
| name | string | |
| contact | string | phone/email |
| user_type | enum | freight / accessibility / emergency |
| accessibility_requirements | JSON | e.g. wheelchair-friendly, avoid steep terrain |

### `road_segments`
| Field | Type | Notes |
|---|---|---|
| segment_id | UUID / PK | |
| start_lat, start_lon | float | |
| end_lat, end_lon | float | |
| road_type | string | |
| slope / terrain_score | float | static terrain risk input |
| accessibility_info | JSON | steepness, surface quality, etc. |

### `weather_data`
| Field | Type | Notes |
|---|---|---|
| weather_id | UUID / PK | |
| segment_id / location | FK / geo | |
| rainfall_current | float | |
| forecast_hourly | JSON array | **required for Predictive Offline Mode** — array of `{hour_offset, rainfall_forecast, confidence}` |
| timestamp | datetime | |

### `disruptions`
| Field | Type | Notes |
|---|---|---|
| disruption_id | UUID / PK | |
| segment_id | FK | |
| disruption_type | string | landslide / flood / blockage / accident |
| severity | enum | |
| status | enum | active / cleared / unverified |
| reported_at | datetime | |
| verified_at | datetime (nullable) | |

### `risk_scores`
| Field | Type | Notes |
|---|---|---|
| risk_id | UUID / PK | |
| segment_id | FK | |
| computed_for_hour | datetime | **key field** — this row represents a risk prediction for a specific hour, not just "now" |
| risk_score | float | 0–1 or 0–100 |
| risk_level | enum | Low / Moderate / High / Critical |
| confidence | float | decays as computed_for_hour moves further into the future |
| contributing_factors | JSON | breakdown of weighted inputs, for the "why this route" explanation |
| computed_at | datetime | when this row was generated |

### `routes`
| Field | Type | Notes |
|---|---|---|
| route_id | UUID / PK | |
| user_id | FK (nullable) | |
| source, destination | geo | |
| mode | enum | freight / accessibility / emergency |
| distance, estimated_time | float | |
| risk_score_at_departure | float | **stored explicitly** — needed later for risk-delta comparison |
| segments | JSON / array of FK | ordered list of segment_ids in the route |
| created_at | datetime | |

### `vehicles`
| Field | Type | Notes |
|---|---|---|
| vehicle_id | UUID / PK | |
| vehicle_type | string | |
| accessibility_features | JSON | shared with accessibility mode AND emergency dispatch matching (cross-mode data) |
| availability | bool | |
| current_location | geo | |

---

## 4. API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/routes` | POST | Input: source, destination, mode, user requirements. Output: recommended + alternative routes, distance, time, risk score, explanation. |
| `/api/risk/{segment_id}` | GET | Current risk score, level, contributing factors, last updated time. |
| `/api/risk/{segment_id}/forecast` | GET | **New** — hourly risk forecast array for the next N hours, with confidence per hour. Powers Predictive Offline Mode. |
| `/api/disruptions` | GET | Current known disruption records. |
| `/api/disruptions` | POST | Submit a new disruption report (for future crowd-sourcing; can stub for MVP). |
| `/api/weather` | GET | Weather info used by the risk engine. |
| `/api/accessibility/match` | POST | Match accessible vehicle/transport options. |
| `/api/offline/package` | GET | **New** — bundles map tiles + verified route + hourly risk forecast for a given route, for client-side caching before going offline. |
| `/api/routes/{route_id}/risk-delta` | GET | **New** — compares `risk_score_at_departure` (stored on the route) against the current/live risk score for the same segments; returns whether the change crosses an alert threshold. Powers Risk-Delta Re-Alerting. |

---

## 5. Core Backend Logic Modules

1. **Risk Engine module** — computes `Risk Score = 0.40×Rainfall + 0.30×HistoricalClosure + 0.20×Terrain + 0.10×CurrentStatus` per segment; also computes the hourly forecast version using `forecast_hourly` weather data, with confidence decaying by hour-offset.
2. **Route Optimization module** — computes `Route Cost = Travel Time + α×RiskPenalty + β×UserConstraintPenalty`, with α/β sets per mode (Freight / Accessibility / Emergency), and calls OSRM for base candidate routes before applying cost weighting.
3. **Offline Packaging module** — assembles the payload for `/api/offline/package`: verified route + relevant segment risk forecasts + confidence values + generation timestamp.
4. **Risk-Delta module** — on request, re-runs the risk engine for the route's segments and diffs against the stored `risk_score_at_departure`, returning an alert flag if the delta crosses a defined threshold (e.g., one full risk-level jump).

---

## 6. Build Checklist (Sequential)

Work through phases top to bottom. Do not start a phase until the previous phase's checklist is fully checked — later phases assume earlier ones are working and testable.

### Phase 0 — Project Setup
- [ ] Initialize FastAPI project structure (`app/`, `models/`, `routes/`, `services/`, `tests/`)
- [ ] Set up PostgreSQL + PostGIS locally (Docker Compose recommended)
- [ ] Set up environment config (`.env` for DB connection, weather API key, OSRM endpoint)
- [ ] Confirm FastAPI dev server runs with a health-check endpoint (`GET /health`)

### Phase 1 — Database Models
- [ ] Create ORM models (SQLAlchemy or similar) for: `users`, `road_segments`, `weather_data`, `disruptions`, `risk_scores`, `routes`, `vehicles`
- [ ] Write and run migrations
- [ ] Seed the database with a small sample set of segments covering the demo route (for the landslide demo scenario)
- [ ] Verify all tables are queryable via a simple script

### Phase 2 — Weather & External Data Ingestion
- [ ] Integrate weather API client; confirm it returns **current** conditions
- [ ] Extend integration to pull **hourly forecast** data (required for Phase 5)
- [ ] Store weather results into `weather_data` table on a scheduled or on-demand basis
- [ ] Manually verify forecast data looks sane for the demo region

### Phase 3 — Risk Engine (Current State)
- [ ] Implement the weighted risk formula as a standalone function, unit-testable independent of the API
- [ ] Wire it to read from `road_segments`, `weather_data`, `disruptions`
- [ ] Write results into `risk_scores` (with `computed_for_hour` = now)
- [ ] Build and test `GET /api/risk/{segment_id}` against seeded data
- [ ] Confirm `contributing_factors` breakdown is returned (needed later for "why this route" explanation)

### Phase 4 — Routing Engine Integration
- [ ] Stand up OSRM (Docker) with OSM data for the demo region
- [ ] Build a service wrapper that requests candidate routes from OSRM
- [ ] Implement the Route Cost function, combining OSRM output with `risk_scores`
- [ ] Build and test `POST /api/routes` returning a recommended route + at least one alternative, for a single mode (start with Emergency, since it's the demo's lead mode)

### Phase 5 — Predictive Risk Forecasting
- [ ] Extend the Risk Engine to compute hourly forecasted risk scores using `forecast_hourly` weather data
- [ ] Store forecast rows in `risk_scores` with `computed_for_hour` set per future hour, and `confidence` decreasing with hour-offset
- [ ] Build and test `GET /api/risk/{segment_id}/forecast`
- [ ] Sanity-check that confidence values decay sensibly and are never presented as certainty

### Phase 6 — Mode-Specific Logic
- [ ] Implement Freight mode: cargo spoilage pressure input into Route Cost
- [ ] Implement Accessibility mode: user constraint penalties (steep terrain avoidance, accessibility requirements) and vehicle matching via `/api/accessibility/match`
- [ ] Implement Emergency mode: priority-routing weighting, if not already covered in Phase 4
- [ ] Confirm `POST /api/routes` behaves correctly across all three modes with the same underlying engine (this is the core architectural claim — test it explicitly)

### Phase 7 — Offline Support
- [ ] Implement `GET /api/offline/package`: bundle route + segment risk forecasts + confidence + timestamp
- [ ] Confirm payload size is reasonable for client-side caching
- [ ] Store `risk_score_at_departure` on the `routes` row when a route is finalized/selected

### Phase 8 — Risk-Delta Re-Alerting
- [ ] Implement `GET /api/routes/{route_id}/risk-delta`: recompute current risk for the route's segments, diff against `risk_score_at_departure`
- [ ] Define and implement the alert threshold (e.g., any full risk-level jump, or a numeric delta above X)
- [ ] Test with a seeded scenario where risk is manually bumped up between "departure" and "reconnect" to confirm the alert fires

### Phase 9 — Disruptions & Simulation Support (for Demo)
- [ ] Implement `GET /api/disruptions`
- [ ] Implement a way to **manually trigger a simulated disruption** (e.g., a debug/admin endpoint or seed script) that flips a segment's status — this is what the demo's "landslide" step relies on
- [ ] Confirm triggering a simulated disruption correctly propagates into risk scores and route recommendations on the next request

### Phase 10 — Security & Reliability Basics
- [ ] Add input validation on all POST endpoints
- [ ] Add basic rate limiting
- [ ] Ensure HTTPS is used in any deployed/demo environment
- [ ] Add timestamping + a verification-status field on disruption reports (even if verification logic itself is stubbed)

### Phase 11 — Testing & Demo Readiness
- [ ] Write/run tests covering: risk calculation, route cost calculation, offline packaging, risk-delta detection
- [ ] Run through the full demo script end-to-end against the backend (Emergency → simulate blockage → reroute → Freight → Accessibility → offline package → risk-delta on reconnect)
- [ ] Confirm response times are acceptable for a live demo (pre-warm caches if needed)

### Phase 12 — Deployment
- [ ] Containerize backend (Dockerfile / Docker Compose including DB and OSRM)
- [ ] Deploy to a simple cloud host or run locally reliably for the demo
- [ ] Confirm the deployed/demo instance has the same seeded demo-route data as local testing

---

## 7. Notes for the AI Assistant Executing This

- Work phase by phase; do not skip ahead even if a later phase looks easy — later phases depend on data/structures created earlier.
- After each phase, produce a short summary of what was built and what was tested, before moving to the next phase.
- If a phase's checklist item can't be completed due to a missing dependency (e.g., no real weather API key yet), stub it clearly and flag it rather than silently skipping.
- Keep the Risk Engine and Route Optimization logic as pure, independently testable functions/services — the API layer should be a thin wrapper around them. This makes it easy to swap the rule-based risk model for an ML model later without touching the API contract.
