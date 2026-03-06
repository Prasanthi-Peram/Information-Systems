"""
ML Inference Utilities for SmartAC Monitoring System

Responsibilities
----------------
1. Load trained models
2. Perform feature engineering
3. Generate ML predictions
4. Produce health score and alerts
"""

from pathlib import Path
import joblib
import pandas as pd
import numpy as np


# ============================================================
# MODEL DIRECTORY
# ============================================================

MODEL_DIR = Path(__file__).resolve().parents[1] / "ml" / "models"


MODELS_AVAILABLE = True

try:
    scaler = joblib.load(MODEL_DIR / "scaler.joblib")
    model_state = joblib.load(MODEL_DIR / "model_state.joblib")
    model_perf = joblib.load(MODEL_DIR / "model_perf.joblib")
    model_cond = joblib.load(MODEL_DIR / "model_cond.joblib")
    iso_model = joblib.load(MODEL_DIR / "iso_model.joblib")

except Exception:

    print("WARNING: ML models not found. Using fallback predictions.")
    print(f"Expected location: {MODEL_DIR}")

    MODELS_AVAILABLE = False

    scaler = None
    model_state = None
    model_perf = None
    model_cond = None
    iso_model = None


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def build_features(df: pd.DataFrame) -> pd.DataFrame:

    df = df.copy()

    df["time_stamp"] = pd.to_datetime(df["time_stamp"])

    df["apparent_power"] = df["voltage"] * df["current"]

    df["load_ratio"] = df["real_power"] / df["apparent_power"].replace(0, np.nan)

    df["thermal_stress"] = df["external_temp"] - df["room_temp"]

    df["env_load_index"] = df["external_temp"] * df["humidity"]

    hour = df["time_stamp"].dt.hour

    df["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    df["hour_cos"] = np.cos(2 * np.pi * hour / 24)

    # rolling stats not available in real-time single record
    df["rolling_std_power"] = 0
    df["power_variability"] = 0

    return df


# ============================================================
# ML INFERENCE
# ============================================================

def run_inference(df: pd.DataFrame) -> pd.DataFrame:

    if not MODELS_AVAILABLE:
        return _default_predictions(df)

    features = [
        "current",
        "voltage",
        "power_factor",
        "real_power",
        "load_ratio",
        "room_temp",
        "external_temp",
        "humidity",
        "thermal_stress",
        "rolling_std_power",
        "power_variability",
        "env_load_index",
        "hour_sin",
        "hour_cos",
    ]

    df_features = build_features(df)

    X = df_features[features].fillna(0)

    X_scaled = scaler.transform(X)

    pred_state = model_state.predict(X_scaled)

    pred_perf = model_perf.predict(X_scaled)

    pred_cond = model_cond.predict(X_scaled)

    anomaly = iso_model.predict(X_scaled)

    critical_alert = (anomaly == -1).astype(int)

    health_score = np.clip(pred_perf, 0, 100)

    maintenance_advice = np.where(
        pred_cond == "Maintenance",
        "Maintenance recommended",
        "System operating normally",
    )

    result = pd.DataFrame(
        {
            "pred_state": pred_state,
            "pred_perf": pred_perf,
            "pred_condition": pred_cond,
            "health_score": health_score,
            "critical_alert": critical_alert,
            "maintenance_advice": maintenance_advice,
            "model_version": "1.0",
        }
    )

    return result


# ============================================================
# DEFAULT PREDICTIONS (FALLBACK)
# ============================================================

def _default_predictions(df: pd.DataFrame) -> pd.DataFrame:

    result = pd.DataFrame(
        {
            "pred_state": ["normal"] * len(df),
            "pred_perf": [85.0] * len(df),
            "pred_condition": ["good"] * len(df),
            "health_score": [85.0] * len(df),
            "critical_alert": [0] * len(df),
            "maintenance_advice": ["System operating normally"] * len(df),
            "model_version": ["dev-default"] * len(df),
        }
    )

    return result