"""
Run all ML phases: generate data, train models, evaluate, save artifacts.
Usage:  python -m ml.run_pipeline  (from repo root)
        python run_pipeline.py     (from ml/ directory)
"""
from __future__ import annotations
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from src.data.synthetic_generator import generate_synthetic_dataset
from src.data.preprocessing import split_dataset
from src.models.trainer import train_all
from src.evaluation.metrics import evaluate_model, extract_feature_importances, compare_models

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)


def main():
    print("=== Phase 3: Generating synthetic dataset ===")
    df = generate_synthetic_dataset(n_samples=5000, seed=42)
    csv_path = os.path.join(ARTIFACTS_DIR, "synthetic_dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"Dataset: {len(df)} rows | disrupted={df['disrupted'].sum()} ({df['disrupted'].mean()*100:.1f}%)")

    print("\n=== Phase 4: Training models ===")
    result = train_all(n_samples=5000, seed=42)
    models = result["models"]
    data = result["data"]
    print(f"Trained: {list(models.keys())}")

    print("\n=== Phase 5: Evaluation (test set) ===")
    all_results = []
    for name, model in models.items():
        metrics = evaluate_model(model, data["X_test"], data["y_test"], model_name=name)
        all_results.append(metrics)
        fi = extract_feature_importances(model, name)
        print(f"\n--- {name} ---")
        print(f"  Precision: {metrics['precision_disruption']}  Recall: {metrics['recall_disruption']}  F1: {metrics['f1_disruption']}  Brier: {metrics['brier_score']}")
        if fi:
            print("  Top-3 features:", [(f["feature"], f"{f['relative_pct']}%") for f in fi[:3]])

    print("\n=== Model Comparison ===")
    df_compare = compare_models(all_results)
    print(df_compare.to_string(index=False))

    compare_path = os.path.join(ARTIFACTS_DIR, "model_comparison.csv")
    df_compare.to_csv(compare_path, index=False)
    print(f"\nSaved comparison to {compare_path}")

    print("\n=== Phase 8: Demo scenario (Stage A) ===")
    from src.demo import run_demo_scenario
    demo = run_demo_scenario(use_ml=False)
    print(f"  Before: {demo['level_before']} ({demo['before_disruption']['risk_score']})")
    print(f"  After:  {demo['level_after']} ({demo['after_disruption']['risk_score']})")
    print(f"  Delta: {demo['risk_delta']}  Alert: {demo['risk_delta_alert']}")
    print(f"  Forecast hours: {len(demo['forecast']['forecast'])}")

    print("\nAll phases complete. Artifacts saved to:", ARTIFACTS_DIR)


if __name__ == "__main__":
    main()
