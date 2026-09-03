from __future__ import annotations
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder


FEATURE_COLS = [
    "rainfall_mm",
    "rainfall_prev_6h_mm",
    "rainfall_rate_change_mm_per_h",
    "slope_degrees",
    "river_distance_km",
    "historical_closure_count",
    "active_weather_warning",
    "road_type_encoded",
]

ROAD_TYPE_ORDER = ["highway", "state", "district", "rural"]


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["road_type_encoded"] = df["road_type"].apply(
        lambda x: ROAD_TYPE_ORDER.index(x.lower())
        if x.lower() in ROAD_TYPE_ORDER
        else len(ROAD_TYPE_ORDER)
    )
    return df


def split_dataset(
    df: pd.DataFrame,
    test_size: float = 0.15,
    val_size: float = 0.15,
    seed: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    n = len(df)
    n_test = int(n * test_size)
    n_val = int(n * val_size)
    test = df.iloc[:n_test]
    val = df.iloc[n_test : n_test + n_val]
    train = df.iloc[n_test + n_val :]
    return train, val, test
