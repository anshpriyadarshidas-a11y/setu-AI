from __future__ import annotations
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.metrics import (
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    brier_score_loss,
)

from ..data.preprocessing import FEATURE_COLS


def evaluate_model(
    model: Any,
    X: np.ndarray,
    y: np.ndarray,
    model_name: str = "model",
) -> Dict[str, Any]:
    y_pred = model.predict(X)

    if hasattr(model, "predict_proba"):
        y_proba = model.predict_proba(X)[:, 1]
    else:
        y_proba = y_pred.astype(float)

    metrics = {
        "model": model_name,
        "precision_disruption": round(precision_score(y, y_pred, zero_division=0), 4),
        "recall_disruption": round(recall_score(y, y_pred, zero_division=0), 4),
        "f1_disruption": round(f1_score(y, y_pred, zero_division=0), 4),
        "brier_score": round(brier_score_loss(y, y_proba), 4),
        "support_disrupted": int(y.sum()),
        "support_total": len(y),
        "class_report": classification_report(y, y_pred, target_names=["normal", "disrupted"]),
    }
    return metrics


def extract_feature_importances(model: Any, model_name: str = "model") -> List[Dict]:
    importances = None

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_[0])

    if importances is None:
        return []

    total = importances.sum() or 1.0
    result = [
        {
            "feature": feat,
            "importance": round(float(imp), 6),
            "relative_pct": round(float(imp / total) * 100, 2),
        }
        for feat, imp in zip(FEATURE_COLS, importances)
    ]
    result.sort(key=lambda x: x["importance"], reverse=True)
    return result


def compare_models(results: List[Dict[str, Any]]) -> pd.DataFrame:
    rows = []
    for r in results:
        rows.append(
            {
                "model": r["model"],
                "precision": r["precision_disruption"],
                "recall": r["recall_disruption"],
                "f1": r["f1_disruption"],
                "brier_score": r["brier_score"],
            }
        )
    return pd.DataFrame(rows).sort_values("f1", ascending=False).reset_index(drop=True)
