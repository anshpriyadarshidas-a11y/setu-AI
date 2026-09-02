# SetuAI — Frontend Specification

Reference document for building the SetuAI web frontend. Use this as the source of truth for screens, components, design system, data shapes, and behavior. Derived from the SetuAI Project Documentation and the Emergency Dashboard mockup.

---

## 1. Product Summary

SetuAI is an AI-based smart logistics, accessibility, and emergency-response routing platform for India's North Eastern Region (NER). One shared risk-prediction and routing engine powers three modes:

- **Freight Mode** — cargo movement, spoilage-aware routing
- **Accessibility Mode** — routes suited to elderly/disabled users, accessible vehicle matching
- **Emergency Mode** — priority routing for ambulances/relief teams around disruptions

A core differentiator is **offline-first behavior**: cached routes and map data remain usable when connectivity drops, with clear freshness timestamps shown to the user at all times.

---

## 2. Tech Stack

- **Framework:** React.js (functional components + hooks)
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **Map:** Mapbox GL JS or Leaflet + OpenStreetMap tiles
- **Data:** Local/mock JSON matching the backend API shapes in Section 8, so a real backend can be swapped in later
- **Offline simulation:** local storage / in-memory cache standing in for Service Worker caching

---

## 3. Design System

### 3.1 Principles
Minimalistic, professional, map-first. No decorative clutter, no unnecessary animation. Every number, label, and message on screen should come from data, not be hardcoded.

### 3.2 Layout
- Fixed dark top navigation bar across all screens
- Light neutral (off-white/very light gray) canvas
- Card-based content: white rounded cards with soft shadows
- Primary dashboard: two-column layout (map left, info-panel stack right) on desktop; collapses to a single stacked column on mobile

### 3.3 Color System (semantic, not decorative)
| Color | Meaning |
|---|---|
| Green | Low risk / synced / offline-safe / success |
| Amber/Yellow | Moderate risk |
| Red | High/critical risk, blocked route, alert |
| Blue | Active mode, recommended route, links |
| Black | Primary call-to-action buttons |

### 3.4 Typography
- Bold, large numerals for key stats (route name, distance, ETA, risk)
- Smaller gray uppercase-style labels above each value
- This label/value pattern repeats across every card for consistency

### 3.5 Shape & Spacing
- Rounded corners (~12px) on cards, chips, and buttons
- Generous internal padding
- Clear visual separation between card types by background tint (white = neutral, red tint = warning, green tint = positive/offline)

---

## 4. Global Shell

Present on every screen.

**Top Navigation Bar**
- Left: circular "S" brand mark + "SetuAI" wordmark (white text, dark background)
- Center: 3-way mode switcher (segmented pill) — Emergency / Freight / Accessibility. Active mode = filled blue pill; inactive = plain text. Switching modes swaps dashboard content without a full reload.
- Right: sync status (colored dot + "Synced X min ago" or "Working offline") + circular user avatar with initials

---

## 5. Screens

### Screen 1 — Home / Mode Selection
- SetuAI logo/name
- Clear entry point for selecting one of the three modes before entering the location screen

### Screen 2 — Location Input
- Current location field (auto-detect or manual)
- Destination field
- Small map preview
- "Find route" action → leads to Screen 3

### Screen 3 — Main Dashboard (primary screen, build in full detail)

**Left: Route Map Panel**
- Start marker: hollow circle outline
- End marker: solid filled circle
- Recommended route: solid colored polyline
- Blocked/alternate route: dashed line (when relevant)
- Hazard marker: warning pin icon at the disruption point, with a text label beneath it (e.g., "Landslide reported")
- Floating chip in a corner: "Last update HH:MM IST"

**Right: Info Panel (stacked cards, top → bottom)**
1. **Recommended Route card** — route name, risk-level dot + label, distance, ETA on one line
2. **Stat tiles** — Distance and ETA side by side, bold values with gray labels
3. **Blocked-route/disruption alert card** — red-tinted, e.g. "Route A blocked" + reason + reroute note. Only rendered when a disruption exists.
4. **"Why this route" explanation card** — plain-language reasoning (what was avoided, time trade-off, % risk reduction)
5. **Offline status banner** — green-tinted, shown when offline: "Working offline" + "Showing cached route data from HH:MM"
6. **Primary action button** — full-width black button, "Start navigation"

**Mode-specific additions to the same shell:**
- **Emergency Mode:** disruption alert card + explanation card prioritized (as in the reference mockup)
- **Freight Mode:** add a **Cargo/Spoilage card** — cargo type, remaining shelf-life estimate, spoilage-risk indicator, delay-impact note
- **Accessibility Mode:** add a **Requirements card** — selected filters (wheelchair-friendly, elderly-friendly, avoid steep terrain, accessible vehicle required) and why the route satisfies them

### Screen 4 — Live Disruption Map
- Full-screen map showing all current disruptions: blocked roads, flood areas, landslide reports, high-risk segments — color-coded by severity
- Legend explaining marker colors

### Screen 5 — Offline Status
- Online/offline indicator
- Last synchronization timestamp
- List/summary of which routes or areas are currently available from cache
- Visually consistent with the dashboard's offline banner

---

## 6. Component Inventory

| Component | Used in | Notes |
|---|---|---|
| `TopNav` | All screens | Mode switcher, sync status, avatar |
| `ModeSwitcher` | TopNav | 3-way segmented pill |
| `RouteMap` | Screen 2, 3 | Polyline(s), markers, hazard pin, last-update chip |
| `RouteSummaryCard` | Screen 3 | Route name, risk, distance, ETA |
| `StatTile` / `StatTilesRow` | Screen 3 | Label/value tiles |
| `AlertCard` | Screen 3 | Blocked route / disruption, red-tinted |
| `ExplanationCard` | Screen 3 | "Why this route" |
| `OfflineBanner` | Screen 3, 5 | Green-tinted offline state |
| `CargoSpoilageCard` | Screen 3 (Freight only) | Spoilage pressure, shelf life, delay impact |
| `AccessibilityRequirementsCard` | Screen 3 (Accessibility only) | Selected filters, why route fits |
| `PrimaryButton` | Screen 3 | Full-width black CTA |
| `DisruptionLegend` | Screen 4 | Marker color key |

---

## 7. Data Model (mock, matches backend API shapes below)

```json
{
  "mode": "emergency",
  "user": { "initials": "RK" },
  "syncStatus": {
    "isOffline": true,
    "lastSyncedMinutesAgo": 4,
    "cachedAt": "08:42"
  },
  "route": {
    "name": "Route B",
    "riskLevel": "low",
    "distanceKm": 205,
    "etaText": "4h 30m",
    "recommendedPath": [[lat, lon]],
    "blockedPath": [[lat, lon]],
    "explanation": "Route B avoids the flagged landslide zone near KM 42, adding 25 minutes but cutting overall risk exposure by roughly 70% compared to Route A."
  },
  "alert": {
    "title": "Route A blocked",
    "message": "Landslide reported near KM 42. Rerouted automatically via Route B."
  },
  "hazard": {
    "type": "landslide",
    "label": "Landslide reported",
    "coordinates": [lat, lon]
  },
  "cargo": {
    "type": "perishable",
    "shelfLifeHoursRemaining": 18,
    "spoilagePressure": "moderate",
    "delayImpactNote": "1.5h added delay puts cargo at moderate spoilage risk."
  },
  "accessibility": {
    "requirements": ["wheelchair-friendly", "avoid-steep-terrain"],
    "matchNote": "Route B has no segments above the steep-terrain threshold."
  }
}
```

---

## 8. Backend API Shapes to Design Against

(From project documentation — mock data should mirror these so a real backend is a drop-in replacement.)

- `POST /api/routes` — input: source, destination, mode, user requirements → output: recommended route, alternatives, distance, estimated time, risk score
- `GET /api/risk/{road_id}` — risk score, risk level, contributing factors, last updated time
- `GET /api/disruptions` — current known disruption records
- `GET /api/weather` — weather data feeding the risk engine
- `POST /api/accessibility/match` — suitable accessible transport options

---

## 9. Interactive Behavior Requirements

- Switching modes (Freight/Accessibility/Emergency) re-renders the right-panel cards with mode-specific content, reusing the same shell and map.
- A "simulate disruption" trigger (button or timer) flips the route from normal to blocked→rerouted state: map updates with dashed red line + hazard marker, alert card appears — recreating the demo scenario from the project plan.
- An "offline mode" toggle swaps the sync-status dot from green/"Synced" to the offline banner state, freezing the map/route to the last cached data and its timestamp.
- All card content is driven by the data model in Section 7, not hardcoded strings.

---

## 10. Constraints

- No unnecessary animations, gradients, or decorative elements
- No hardcoded text for values that should come from data (route names, risk levels, timestamps, alert messages)
- Keep map markers/lines clean and legible; avoid UI chrome overload on the map
- Must remain fully responsive (desktop two-column → mobile stacked single column)

---

## 11. Deliverable Definition

A working, navigable React app covering all five screens, wired to the mock data model, demonstrating the full Emergency-mode disruption → reroute → offline flow shown in the reference mockup, plus the Freight and Accessibility variations of the same dashboard shell.
