# SetuAI — AI-Based Smart Logistics and Accessibility Intelligence Platform for NER

> Core project knowledge only. Frontend, backend, and ML/AI implementation details live in separate dedicated documents.

## 1. Overview

**Project:** SetuAI — a unified logistics, accessibility, and emergency-response routing platform for the North Eastern Region (NER) of India, where terrain, rainfall, floods, and landslides frequently disrupt transport.

Instead of separate apps for each use case, SetuAI runs **one shared Risk Prediction and Routing Engine** behind three modes:

1. **Freight** — cargo routing that accounts for disruption risk and spoilage.
2. **Accessibility** — routing that accounts for real usability for elderly/disabled users.
3. **Emergency** — routing that accounts for current road passability for time-critical travel.

Its core differentiators: **risk-aware routing** (not just distance/time), an **offline-first design with predictive fallback** (see §6), and one shared engine driving all three modes.

---

## 2. Problem

Roads in NER are disrupted by landslides, floods, and heavy rain. This causes: cargo spoilage and delay, navigation apps not reflecting new blockages, unsafe/inaccessible routing for elderly and disabled users, lost time for ambulances/relief teams, unreliable connectivity exactly when routing info matters most, and disruption data scattered across sources.

**Core need:** a unified platform combining weather, terrain, and historical/road-status data to estimate route risk and recommend suitable routes per user type.

---

## 3. Solution & Objectives

**Flow:** Data Sources → Data Processing → Risk Prediction Engine → Route Optimization → Mode-Specific Recommendation → Offline Cache → User Interface

**Objectives:** predict disruption probability on key segments; give risk-aware route recommendations; cut delays/spoilage for freight; improve mobility options for elderly/disabled users; help emergency vehicles find safer/faster routes; work with poor/no connectivity; stay scalable toward government and crowd-sourced data integration.

---

## 4. Target Users

- **Freight:** truck drivers, logistics companies, agricultural/pharma suppliers.
- **Accessibility:** elderly people, wheelchair users, people with mobility limitations, caregivers.
- **Emergency:** ambulance operators, disaster-response teams, relief orgs, local authorities.

---

## 5. Risk Prediction Model

Each road segment gets a risk score from rainfall, weather forecast, terrain/slope, flood-prone status, historical closures, and current road-condition reports.

**Prototype formula:**
`Risk Score = 0.40 × Rainfall Risk + 0.30 × Historical Closure Risk + 0.20 × Terrain Risk + 0.10 × Current Road Status`
(Weights are placeholders, to be calibrated with real data.)

**Risk levels:** Low → Moderate → High → Critical. This is a decision-support indicator, not a safety guarantee.

**Multi-hazard extension:** NER is also seismically active. A seismic-risk term can be added to the formula as a future/placeholder input alongside rainfall and terrain, to avoid the platform reading as "just a monsoon app."

---

## 6. Offline-First & Predictive Fallback

**Why it matters:** connectivity is often worst exactly when disruption risk is highest (floods, storms) — precisely when routing info is most needed.

**Basic workflow:** while online, SetuAI caches map tiles and the latest verified route → user goes offline → app serves cached data → on reconnect, it syncs and checks for updates.

**Limitation of basic caching:** a cached route can't reflect a closure that happened *after* the last sync — stale data risks being trusted as current.

**Enhancement — Predictive Offline Mode:** instead of caching a single static risk score, SetuAI pre-computes an hourly risk forecast per segment (using forecasted, not just current, weather) before going offline. Offline mode then serves the predicted risk for the user's *actual current travel hour*, not just the last-known reading — e.g., a user offline at 4pm sees the prediction computed for 4pm, not the 11am snapshot.

- Works well for **forecastable, weather-driven risk**. Does **not** help with sudden discrete events (e.g., a landslide at 2pm was not predictable at 10am) — this distinction should be stated plainly in the demo.
- Confidence should **decay with distance into the future** (next-hour prediction more reliable than +8hr) and be shown in the UI alongside the risk level, not just the risk level alone.
- Basic "last verified route" caching remains the fallback floor; prediction is a layer on top where forecast confidence is high.

**Enhancement — Risk-Delta Re-Alerting:** on reconnect, compare the new risk score against what the user was shown at departure. If it changed meaningfully (e.g., Moderate → Critical), surface an active alert rather than silently updating a number — this is what makes stale-vs-current data visible to the user in the moment it matters.

---

## 7. Route Optimization Logic

`Route Cost = Travel Time + α × Risk Penalty + β × User Constraint Penalty`

Weights (α, β) shift per mode:
- **Freight** prioritizes travel time, spoilage pressure, road reliability.
- **Accessibility** prioritizes accessibility, safety, road condition, reduced steepness.
- **Emergency** prioritizes reliability, travel time, current passability, priority routing.

**Example:** A perishable-cargo truck facing heavy rain gets rerouted from a shorter, historically closure-prone segment to a slightly longer, lower-risk one — the route is cached, so if connectivity drops mid-journey the driver still has it.

---

## 8. Cross-Mode Data Synergy

The three modes aren't silos — they share underlying data. E.g., accessibility-mode vehicle data (wheelchair-accessible, capacity) is the same data an emergency dispatcher needs for evacuation-vehicle matching. This shared-data-layer point reinforces the "one engine, three modes" architecture claim and is worth stating explicitly in the pitch.

---

## 9. Security & Reliability Principles

HTTPS and API authentication where required; input validation and rate limiting; protection against fake disruption reports via timestamping and verification levels; backup and recovery. The app should never claim a route is guaranteed safe — only present risk estimates with source/freshness (and now, confidence).

---

## 10. Advantages & Limitations

**Advantages:** one platform for three use cases; risk-aware (not distance-only) routing; NER-specific design; supports perishable logistics, accessibility, and emergency response; offline-first with predictive fallback; explainable scoring; scalable toward richer data sources.

**Limitations:** real-time road status isn't always available; weather API accuracy varies; historical data may be incomplete; predictions degrade in accuracy further into the future and can't anticipate sudden events; routing quality depends on map data; government data access may need authorization; accessibility data for roads/vehicles is hard to collect.

---

## 11. Future Scope

Regional language support (Assamese, Bengali, Hindi, Khasi, Mizo, Manipuri, etc.); voice assistance; SMS/USSD fallback for low-connectivity users; crowd-sourced disruption reports with confidence/verification scoring; government/SDMA data integration; predictive logistics (delay/spoilage/demand forecasting); fleet dashboards.

---

## 12. Hackathon MVP

**Must-have:** interactive map, source/destination selection, three modes, risk score per route, at least one live weather input, simulated road disruption, alternative route generation, offline route caching, clear "why this route" explanation.

**Optional if time allows:** ML model, accessible vehicle matching, crowd reports, regional-language UI, fleet dashboard, voice input, predictive offline mode / risk-delta alerting (strong stretch goals if core MVP is solid early).

A working core MVP beats a partially-built feature list.

---

## 13. Demonstration Plan

**Scenario:** heavy rainfall causes a simulated landslide on a major route.

1. Open app → select Emergency Mode → enter source/destination → show normal route.
2. Trigger simulated blockage → risk engine updates affected segment → app generates alternative route with risk/time comparison.
3. Switch to Freight Mode → show cargo-sensitive recommendation.
4. Switch to Accessibility Mode → show accessibility-based route choice.
5. Go offline → show cached/predicted route with last-sync time and confidence.
6. Reconnect → show a risk-delta alert if the score changed while offline.

Have one quantifiable metric ready (e.g., "avoided X hours delay" or "Y% risk reduction" on the demo route) — judges remember numbers more than diagrams.

---

## 14. Expected Outcomes

Better route decisions during disruptions; fewer avoidable logistics delays; reduced perishable-cargo loss; more accessibility-aware transport; faster emergency route planning; continued usefulness during connectivity loss. Measure via travel-time difference, risk reduction, delay avoidance, and successful offline access.

---

## 15. Business Model & Social Impact

**Customers/partners:** logistics and e-commerce companies, agricultural supply chains, pharma distributors, hospitals/emergency services, NGOs, government agencies, local transport operators.
**Revenue:** B2B SaaS, fleet-management subscriptions, API usage, enterprise dashboards, institutional/government contracts.

**Social impact:** better mobility choices for accessibility users; faster alternative-route identification in emergencies; reduced losses for agricultural/perishable goods; better digital inclusion via offline-first design in low-connectivity areas.

---

## 16. Conclusion & Tagline

SetuAI's central idea: **predict road risk → understand the user's needs → calculate the best available route → keep essential route information available offline, with prediction filling the gap where data can't update live.**

By combining Freight, Accessibility, and Emergency modes on one shared risk-and-routing engine, SetuAI avoids building disconnected solutions for related problems. The hackathon prototype starts with explainable, simulated risk scoring and can evolve toward ML-based prediction, real-time data, regional-language support, crowd reporting, and government integration.

**Tagline:** SetuAI — Connecting People, Cargo and Emergencies Through Intelligent, Risk-Aware Routes.
*(Alt: SetuAI — Smarter Routes. Safer Journeys. Stronger Connectivity.)*
