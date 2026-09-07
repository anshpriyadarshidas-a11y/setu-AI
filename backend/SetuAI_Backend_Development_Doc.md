# SetuAI — Backend Development Document (Node.js + MongoDB)

> Purpose: this document is written so an AI coding assistant (e.g. Claude Code) can be pointed at it and build the backend **in the correct sequence**, phase by phase, checking items off as it goes. Each phase assumes the previous phase is complete before starting.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend framework | Node.js + Express | REST API layer |
| Database | MongoDB (with Mongoose ODM) | Document store; geospatial queries via Mongo's `2dsphere` indexes |
| Routing engine | OSRM (Open Source Routing Machine) | Self-hosted or Docker container; consumes OpenStreetMap data |
| Map/road data | OpenStreetMap extracts (NER region) | |
| Caching / offline payloads | Redis (optional, for hot risk-score cache) or a Mongo collection | |
| Weather data | Any hourly-forecast weather API (e.g. Open-Meteo, OpenWeatherMap) | Needs **hourly forecast**, not just current conditions, for Predictive Offline Mode |
| Auth (if needed) | JWT-based auth (e.g. `jsonwebtoken` + `bcrypt`) | Only if user accounts are in scope for the hackathon build |
| Deployment | Docker Compose locally; any cloud VM/container host for demo | Keep it simple — this is a hackathon build |

Note: this stack swap only affects storage/framework choices — the risk formula, route cost logic, and API contract stay identical to the FastAPI/PostgreSQL version, so the ML and Frontend docs remain compatible without changes.

---

## 2. Backend Responsibilities (Recap)

The backend must: accept route requests, calculate/serve risk scores per road segment, run the route optimization logic (cost function across time/risk/user constraints), serve mode-specific recommendations (Freight/Accessibility/Emergency), support offline sync payloads (including predictive hourly risk), and support risk-delta comparison on reconnect.

---

## 3. Database Schema (MongoDB Collections)

Use Mongoose schemas. Where a relational design would use foreign keys, use either an `ObjectId` reference (for large/independent collections) or an embedded sub-document (for small, tightly-coupled data like hourly forecasts).

### `users`
```js
{
  _id: ObjectId,
  name: String,
  contact: String,
  userType: { type: String, enum: ['freight', 'accessibility', 'emergency'] },
  accessibilityRequirements: Object // e.g. { wheelchairFriendly: true, avoidSteepTerrain: true }
}
```

### `roadSegments`
```js
{
  _id: ObjectId,
  startPoint: { type: { type: String, default: 'Point' }, coordinates: [Number] }, // [lon, lat], 2dsphere indexed
  endPoint: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  roadType: String,
  terrainScore: Number,
  accessibilityInfo: Object // steepness, surface quality, etc.
}
```

### `weatherData`
```js
{
  _id: ObjectId,
  segmentId: ObjectId, // ref: roadSegments
  rainfallCurrent: Number,
  forecastHourly: [
    { hourOffset: Number, rainfallForecast: Number, confidence: Number }
  ], // required for Predictive Offline Mode
  timestamp: Date
}
```

### `disruptions`
```js
{
  _id: ObjectId,
  segmentId: ObjectId, // ref: roadSegments
  disruptionType: { type: String, enum: ['landslide', 'flood', 'blockage', 'accident'] },
  severity: String,
  status: { type: String, enum: ['active', 'cleared', 'unverified'] },
  reportedAt: Date,
  verifiedAt: Date // nullable
}
```

### `riskScores`
```js
{
  _id: ObjectId,
  segmentId: ObjectId, // ref: roadSegments
  computedForHour: Date, // key field — this row is a prediction FOR a specific hour, not just "now"
  riskScore: Number, // 0-1 or 0-100
  riskLevel: { type: String, enum: ['Low', 'Moderate', 'High', 'Critical'] },
  confidence: Number, // decays as computedForHour moves further into the future
  contributingFactors: Object, // breakdown of weighted inputs, for "why this route" explanation
  computedAt: Date
}
```
Recommend a compound index on `{ segmentId: 1, computedForHour: 1 }` for fast forecast lookups.

### `routes`
```js
{
  _id: ObjectId,
  userId: ObjectId, // nullable ref: users
  source: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  destination: { type: { type: String, default: 'Point' }, coordinates: [Number] },
  mode: { type: String, enum: ['freight', 'accessibility', 'emergency'] },
  distance: Number,
  estimatedTime: Number,
  riskScoreAtDeparture: Number, // stored explicitly — needed for risk-delta comparison later
  segments: [ObjectId], // ordered list, ref: roadSegments
  createdAt: Date
}
```

### `vehicles`
```js
{
  _id: ObjectId,
  vehicleType: String,
  accessibilityFeatures: Object, // shared with accessibility mode AND emergency dispatch matching (cross-mode data)
  availability: Boolean,
  currentLocation: { type: { type: String, default: 'Point' }, coordinates: [Number] }
}
```

---

## 4. API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/routes` | POST | Input: source, destination, mode, user requirements. Output: recommended + alternative routes, distance, time, risk score, explanation. |
| `/api/risk/:segmentId` | GET | Current risk score, level, contributing factors, last updated time. |
| `/api/risk/:segmentId/forecast` | GET | Hourly risk forecast array for the next N hours, with confidence per hour. Powers Predictive Offline Mode. |
| `/api/disruptions` | GET | Current known disruption records. |
| `/api/disruptions` | POST | Submit a new disruption report (for future crowd-sourcing; can stub for MVP). |
| `/api/weather` | GET | Weather info used by the risk engine. |
| `/api/accessibility/match` | POST | Match accessible vehicle/transport options. |
| `/api/offline/package` | GET | Bundles map tiles + verified route + hourly risk forecast for a given route, for client-side caching before going offline. |
| `/api/routes/:routeId/risk-delta` | GET | Compares `riskScoreAtDeparture` (stored on the route) against the current/live risk score for the same segments; returns whether the change crosses an alert threshold. Powers Risk-Delta Re-Alerting. |

---

## 5. Core Backend Logic Modules

1. **Risk Engine module** — computes `Risk Score = 0.40×Rainfall + 0.30×HistoricalClosure + 0.20×Terrain + 0.10×CurrentStatus` per segment; also computes the hourly forecast version using `forecastHourly` weather data, with confidence decaying by hour-offset. Keep this as a pure module (plain functions, no Express/Mongoose imports) so it stays independently testable and swappable for the ML team's model later.
2. **Route Optimization module** — computes `Route Cost = Travel Time + α×RiskPenalty + β×UserConstraintPenalty`, with α/β sets per mode (Freight / Accessibility / Emergency), and calls OSRM for base candidate routes before applying cost weighting.
3. **Offline Packaging module** — assembles the payload for `/api/offline/package`: verified route + relevant segment risk forecasts + confidence values + generation timestamp.
4. **Risk-Delta module** — on request, re-runs the risk engine for the route's segments and diffs against the stored `riskScoreAtDeparture`, returning an alert flag if the delta crosses a defined threshold (e.g., one full risk-level jump).

---

## 6. Build Checklist (Sequential)

Work through phases top to bottom. Do not start a phase until the previous phase's checklist is fully checked — later phases assume earlier ones are working and testable.

### Phase 0 — Project Setup
- [x] Initialize Node.js project (`npm init`), install Express, Mongoose, dotenv
- [x] Set up project structure (`src/models/`, `src/routes/`, `src/services/`, `src/tests/`)
- [ ] Set up MongoDB locally (Docker Compose recommended) and confirm connection via Mongoose
- [x] Set up environment config (`.env` for Mongo URI, weather API key, OSRM endpoint)
- [x] Confirm Express dev server runs with a health-check endpoint (`GET /health`)

### Phase 1 — Database Models
- [x] Create Mongoose schemas/models for: `users`, `roadSegments`, `weatherData`, `disruptions`, `riskScores`, `routes`, `vehicles`
- [x] Add `2dsphere` indexes on all geo fields (`startPoint`, `endPoint`, `source`, `destination`, `currentLocation`)
- [x] Add compound index on `riskScores` (`segmentId` + `computedForHour`)
- [x] Write a seed script populating a small sample set of segments covering the demo route (for the landslide demo scenario)
- [x] Verify all collections are queryable via a simple script or MongoDB Compass
- [ ] Write a seed script populating a small sample set of segments covering the demo route (for the landslide demo scenario)
- [ ] Verify all collections are queryable via a simple script or MongoDB Compass

### Phase 2 — Weather & External Data Ingestion
- [x] Integrate weather API client; confirm it returns **current** conditions
- [x] Extend integration to pull **hourly forecast** data (required for Phase 5)
- [x] Store weather results into `weatherData` on a scheduled or on-demand basis
- [x] Manually verify forecast data looks sane for the demo region

### Phase 3 — Risk Engine (Current State)
- [x] Implement the weighted risk formula as a standalone function, unit-testable independent of Express/Mongoose
- [x] Wire it to read from `roadSegments`, `weatherData`, `disruptions`
- [x] Write results into `riskScores` (with `computedForHour` = now)
- [x] Build and test `GET /api/risk/:segmentId` against seeded data
- [x] Confirm `contributingFactors` breakdown is returned (needed later for "why this route" explanation)

### Phase 4 — Routing Engine Integration
- [x] Integrate OpenRouteService public API (requires `ORS_API_KEY` in `.env`)
- [x] Build a service wrapper that requests candidate routes from ORS
- [x] Implement the Route Cost function, combining API output with `riskScores`
- [x] Build and test `POST /api/routes` returning a recommended route + at least one alternative, for a single mode (start with Emergency, since it's the demo's lead mode)

### Phase 5 — Predictive Risk Forecasting
- [x] Extend the Risk Engine to compute hourly forecasted risk scores using `forecastHourly` weather data
- [x] Store forecast documents in `riskScores` with `computedForHour` set per future hour, and `confidence` decreasing with hour-offset
- [x] Build and test `GET /api/risk/:segmentId/forecast`
- [x] Sanity-check that confidence values decay sensibly and are never presented as certainty

### Phase 6 — Mode-Specific Logic
- [x] Implement Freight mode: cargo spoilage pressure input into Route Cost
- [x] Implement Accessibility mode: user constraint penalties (steep terrain avoidance, accessibility requirements) and vehicle matching via `/api/accessibility/match` (stubbed)
- [x] Implement Emergency mode: priority-routing weighting, if not already covered in Phase 4
- [x] Confirm `POST /api/routes` behaves correctly across all three modes with the same underlying engine

### Phase 7 — Offline Support
- [x] Implement `GET /api/offline/package`: bundle route + segment risk forecasts + confidence + timestamp
- [x] Confirm payload size is reasonable for client-side caching
- [x] Store `riskScoreAtDeparture` on the `routes` document when a route is finalized/selected

### Phase 8 — Risk-Delta Re-Alerting
- [x] Implement `GET /api/routes/:routeId/risk-delta`: recompute current risk for the route's segments, diff against `riskScoreAtDeparture`
- [x] Define and implement the alert threshold (e.g., any full risk-level jump, or a numeric delta above X)
- [x] Test with a seeded scenario where risk is manually bumped up between "departure" and "reconnect" to confirm the alert fires

### Phase 9 — Disruptions & Simulation Support (for Demo)
- [x] Implement `GET /api/disruptions`
- [x] Implement a way to **manually trigger a simulated disruption** (e.g., a debug/admin endpoint or seed script) that flips a segment's status
- [x] Confirm triggering a simulated disruption correctly propagates into risk scores and route recommendations on the next request

### Phase 10 — Security & Reliability Basics
- [x] Add input validation on all POST endpoints (`express-validator` implemented)
- [x] Add basic rate limiting (`express-rate-limit` implemented)
- [ ] Ensure HTTPS is used in any deployed/demo environment
- [x] Add timestamping + a verification-status field on disruption reports

### Phase 11 — Testing & Demo Readiness
- [x] Write/run tests (e.g. Jest) covering: risk calculation, route cost calculation, offline packaging, risk-delta detection
- [ ] Run through the full demo script end-to-end
- [ ] Confirm response times are acceptable for a live demo

### Phase 12 — Deployment
- [ ] Containerize backend (Dockerfile / Docker Compose including MongoDB and OSRM)
- [ ] Deploy to a simple cloud host or run locally reliably for the demo
- [ ] Confirm the deployed/demo instance has the same seeded demo-route data as local testing

---

## 7. Notes for the AI Assistant Executing This

- Work phase by phase; do not skip ahead even if a later phase looks easy — later phases depend on data/structures created earlier.
- After each phase, produce a short summary of what was built and what was tested, before moving to the next phase.
- If a phase's checklist item can't be completed due to a missing dependency (e.g., no real weather API key yet), stub it clearly and flag it rather than silently skipping.
- Keep the Risk Engine and Route Optimization logic as pure, independently testable modules — the Express route handlers should be a thin wrapper around them. This makes it easy to swap the rule-based risk model for an ML model later without touching the API contract.
