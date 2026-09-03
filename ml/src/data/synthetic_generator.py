from __future__ import annotations
import random
import math
from typing import List, Dict, Any

import numpy as np
import pandas as pd


ROAD_TYPES = ["highway", "state", "district", "rural"]

SEGMENT_PROFILES = [
    {"id": "SEG_HWY_NH37", "road_type": "highway", "slope": 5.0, "river_dist_km": 3.0},
    {"id": "SEG_HWY_NH27", "road_type": "highway", "slope": 8.0, "river_dist_km": 5.0},
    {"id": "SEG_STATE_AS1", "road_type": "state", "slope": 18.0, "river_dist_km": 1.5},
    {"id": "SEG_STATE_MN2", "road_type": "state", "slope": 22.0, "river_dist_km": 2.0},
    {"id": "SEG_DIST_AR1", "road_type": "district", "slope": 30.0, "river_dist_km": 0.8},
    {"id": "SEG_DIST_MZ1", "road_type": "district", "slope": 35.0, "river_dist_km": 0.5},
    {"id": "SEG_RURAL_NL1", "road_type": "rural", "slope": 40.0, "river_dist_km": 0.3},
    {"id": "SEG_RURAL_TR1", "road_type": "rural", "slope": 45.0, "river_dist_km": 0.2},
]


def _disruption_probability(
    rainfall_mm: float,
    slope_deg: float,
    historical_closures: int,
    river_dist_km: float,
    active_warning: bool,
) -> float:
    rain_factor = min(1.0, rainfall_mm / 100.0)
    slope_factor = min(1.0, slope_deg / 50.0)
    history_factor = min(1.0, historical_closures / 15.0)
    proximity_factor = min(1.0, 1.0 / max(river_dist_km, 0.1))
    warning_boost = 0.15 if active_warning else 0.0

    raw = (
        0.35 * rain_factor
        + 0.25 * slope_factor
        + 0.20 * history_factor
        + 0.15 * proximity_factor
        + 0.05 * warning_boost
        + warning_boost
    )
    return min(1.0, raw)


def generate_synthetic_dataset(
    n_samples: int = 5000,
    seed: int = 42,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    random.seed(seed)

    records: List[Dict[str, Any]] = []

    for _ in range(n_samples):
        profile = random.choice(SEGMENT_PROFILES)

        rainfall_mm = float(rng.gamma(shape=2, scale=15))
        rainfall_mm = min(rainfall_mm, 200.0)

        rainfall_prev_6h = float(rng.gamma(shape=1.5, scale=10))
        rainfall_rate_change = rainfall_mm - rainfall_prev_6h / 6

        slope_deg = float(
            np.clip(
                profile["slope"] + rng.normal(0, 5),
                0,
                60,
            )
        )

        river_dist_km = float(
            np.clip(
                profile["river_dist_km"] + rng.normal(0, 0.3),
                0.05,
                10.0,
            )
        )

        historical_closures = int(rng.negative_binomial(2, 0.4))
        historical_closures = min(historical_closures, 20)

        active_warning = bool(rng.random() < (0.1 + 0.3 * (rainfall_mm > 50)))

        p_disrupt = _disruption_probability(
            rainfall_mm,
            slope_deg,
            historical_closures,
            river_dist_km,
            active_warning,
        )
        noise = rng.normal(0, 0.05)
        p_disrupt = float(np.clip(p_disrupt + noise, 0, 1))
        disrupted = int(rng.random() < p_disrupt)

        records.append(
            {
                "segment_id": profile["id"],
                "road_type": profile["road_type"],
                "rainfall_mm": round(rainfall_mm, 2),
                "rainfall_prev_6h_mm": round(rainfall_prev_6h, 2),
                "rainfall_rate_change_mm_per_h": round(rainfall_rate_change, 2),
                "slope_degrees": round(slope_deg, 2),
                "river_distance_km": round(river_dist_km, 3),
                "historical_closure_count": historical_closures,
                "active_weather_warning": int(active_warning),
                "disrupted": disrupted,
            }
        )

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    df = generate_synthetic_dataset(n_samples=5000)
    out_path = "artifacts/synthetic_dataset.csv"
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} rows to {out_path}")
    print(df["disrupted"].value_counts())
