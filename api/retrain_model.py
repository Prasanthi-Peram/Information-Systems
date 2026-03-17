import os
from datetime import datetime

import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
import psycopg

from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler


# ============================================================
# CONFIGURATION
# ============================================================

MLFLOW_URI = "http://mlflow:5000"

mlflow.set_tracking_uri(MLFLOW_URI)
mlflow.set_experiment("SmartAC_Production_Models")


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    return psycopg.connect(
        host="db",
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASS", "postgres123"),
        dbname=os.getenv("DB_NAME", "ac_sys"),
        port=int(os.getenv("DB_PORT", "5432")),
    )


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    query = "SELECT * FROM device_telemetry ORDER BY time_stamp ASC"

    with get_connection() as conn:
        df = pd.read_sql(query, conn)

    return df


# ============================================================
# FEEDBACK / FALSE-ALARM STATS
# ============================================================

def get_false_alarm_count(hours: int = 24) -> int:
    """
    Count how many alerts were marked as false in the recent window.
    This is logged to MLflow so retraining runs are tied to feedback.
    """
    sql = """
        SELECT COUNT(*) 
        FROM alerts 
        WHERE is_true_alarm = FALSE 
          AND created_at > NOW() - %s::interval
    """
    interval = f"{hours} hours"

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (interval,))
            row = cur.fetchone()
            return int(row[0]) if row else 0


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def engineer_features(df):

    df = df.copy()

    df["time_stamp"] = pd.to_datetime(df["time_stamp"])

    df = df.sort_values(["device_id", "time_stamp"]).reset_index(drop=True)

    df["apparent_power"] = df["voltage"] * df["current"]

    df["load_ratio"] = df["real_power"] / df["apparent_power"].replace(0, 1)

    df["thermal_stress"] = df["external_temp"] - df["room_temp"]

    df["env_load_index"] = df["external_temp"] * df["humidity"]

    df["hour"] = df["time_stamp"].dt.hour

    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    df["rolling_std_power"] = (
        df.groupby("device_id")["real_power"]
        .rolling(3, min_periods=1)
        .std()
        .reset_index(0, drop=True)
    )

    df["rolling_mean_power"] = (
        df.groupby("device_id")["real_power"]
        .rolling(3, min_periods=1)
        .mean()
        .reset_index(0, drop=True)
    )

    df["power_variability"] = (
        df["rolling_std_power"]
        / df["rolling_mean_power"].replace(0, 1)
    )

    df["current_diff"] = (
        df.groupby("device_id")["current"]
        .diff()
        .fillna(0)
    )

    df["electrical_instability"] = (
        df.groupby("device_id")["current"]
        .rolling(3, min_periods=1)
        .std()
        .reset_index(0, drop=True)
    )

    return df


# ============================================================
# TARGET CREATION
# ============================================================

def create_targets(df):

    df["perf_target"] = (
        df["thermal_stress"] /
        df["real_power"].replace(0, 1)
    ).rank(pct=True) * 100

    df["health_target"] = (
    0.4 * (df["thermal_stress"].rank(pct=True)) +        # cooling ability
    0.3 * (df["power_factor"]) +                         # electrical efficiency
    0.3 * (1 - df["power_variability"].rank(pct=True))   # stability
) * 100

    df["state_target"] = (df["real_power"] > 500).astype(int)

    return df


# ============================================================
# TRAINING
# ============================================================

def main():

    print("Starting SmartCool Training Pipeline...")

    raw_df = load_data()

    if raw_df.empty:
        print("No telemetry data found.")
        return

    df = create_targets(engineer_features(raw_df))

    # Drop rows with invalid targets to avoid NaNs in y during training
    df = df.dropna(subset=["perf_target", "health_target", "state_target"])
    if df.empty:
        print("No valid rows left after dropping NaNs in targets.")
        return

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
        "env_load_index",
        "hour_sin",
        "hour_cos",
        "rolling_std_power",
        "rolling_mean_power",
        "power_variability",
        "current_diff",
        "electrical_instability"
    ]

    X = df[features]

    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(X)

    y_perf = df["perf_target"]
    y_health = df["health_target"]
    y_state = df["state_target"]

    # ============================================================
    # TRAIN ANOMALY DETECTION MODEL (ISOLATION FOREST)
    # ============================================================

    model_anomaly = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    ).fit(X_scaled)

    # ============================================================
    # TRAIN MODELS (TREE SIZE CONTROLLED)
    # ============================================================

    model_perf = RandomForestRegressor(
        n_estimators=80,
        max_depth=12,
        min_samples_leaf=20,
        max_features="sqrt",
        n_jobs=-1,
        random_state=42
    ).fit(X_scaled, y_perf)

    model_health = RandomForestRegressor(
        n_estimators=80,
        max_depth=12,
        min_samples_leaf=20,
        max_features="sqrt",
        n_jobs=-1,
        random_state=42
    ).fit(X_scaled, y_health)

    model_state = RandomForestClassifier(
        n_estimators=80,
        max_depth=12,
        min_samples_leaf=20,
        max_features="sqrt",
        n_jobs=-1,
        random_state=42
    ).fit(X_scaled, y_state)

    # ============================================================
    # MLFLOW LOGGING
    # ============================================================

    version = f"v_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    # Capture feedback signal (false alarms) at retrain time
    false_alarm_count_24h = get_false_alarm_count(24)

    with mlflow.start_run(run_name="AC_Training"):

        mlflow.log_param("model_version", version)

        mlflow.log_metric("avg_performance", float(df["perf_target"].mean()))
        mlflow.log_metric("false_alarm_count_24h", false_alarm_count_24h)

        # Core models
        mlflow.sklearn.log_model(
            model_perf,
            artifact_path="performance_model",
            registered_model_name="AC_Performance"
        )

        mlflow.sklearn.log_model(
            model_health,
            artifact_path="health_model",
            registered_model_name="AC_Health"
        )

        mlflow.sklearn.log_model(
            model_state,
            artifact_path="state_model",
            registered_model_name="AC_State"
        )

        # Anomaly detection model
        mlflow.sklearn.log_model(
            model_anomaly,
            artifact_path="anomaly_model",
            registered_model_name="AC_Anomaly"
        )

        # Shared scaler for online inference
        mlflow.sklearn.log_model(
            scaler,
            artifact_path="scaler_model",
            registered_model_name="AC_Scaler"
        )

    print(" Training completed successfully")


if __name__ == "__main__":
    main()