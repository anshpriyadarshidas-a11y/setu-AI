from __future__ import annotations
import joblib
import os
from typing import Any, Dict

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from ..data.preprocessing import FEATURE_COLS, prepare_features, split_dataset
from ..data.synthetic_generator import generate_synthetic_dataset


ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "artifacts")


def _get_xy(df: pd.DataFrame):
    df = prepare_features(df)
    X = df[FEATURE_COLS].values.astype(float)
    y = df["disrupted"].values.astype(int)
    return X, y


def train_all(n_samples: int = 5000, seed: int = 42) -> Dict[str, Any]:
    df = generate_synthetic_dataset(n_samples=n_samples, seed=seed)
    train_df, val_df, test_df = split_dataset(df, seed=seed)

    X_train, y_train = _get_xy(train_df)
    X_val, y_val = _get_xy(val_df)
    X_test, y_test = _get_xy(test_df)

    scale_pos = int((y_train == 0).sum()) / max(int((y_train == 1).sum()), 1)

    models = {
        "logistic_regression": LogisticRegression(
            max_iter=1000, class_weight="balanced", random_state=seed
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            class_weight="balanced",
            random_state=seed,
            n_jobs=-1,
        ),
        "xgboost": XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            scale_pos_weight=scale_pos,
            eval_metric="logloss",
            random_state=seed,
            n_jobs=-1,
        ),
    }

    trained = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        trained[name] = model
        path = os.path.join(ARTIFACTS_DIR, f"{name}.joblib")
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)
        joblib.dump(model, path)

    return {
        "models": trained,
        "data": {
            "X_train": X_train,
            "y_train": y_train,
            "X_val": X_val,
            "y_val": y_val,
            "X_test": X_test,
            "y_test": y_test,
        },
    }


def load_model(name: str) -> Any:
    path = os.path.join(ARTIFACTS_DIR, f"{name}.joblib")
    return joblib.load(path)
