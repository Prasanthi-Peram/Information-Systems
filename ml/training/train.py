import os
from pathlib import Path

import joblib
import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
import psycopg
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler

# ============================================================
# CONFIGURATION
# ============================================================

MLFLOW_URI = "http://mlflow:5000"
mlflow.set_tracking_uri(MLFLOW_URI)

mlflow.set_experiment("SmartAC_Production_Models_S3")


def get_connection() -> psycopg.Connection:
    """Connect directly to TimescaleDB for training."""
    return psycopg.connect(
        host="db",
        user=os.getenv("DB_USER", "postgres"),
        password= os.getenv("DB_PASS", "postgres123"),
        dbname=os.getenv("DB_NAME", "ac_sys"),
        port=int(os.getenv("DB_PORT", "5432")),
    )


def load_data() -> pd.DataFrame:
    """Fetch from device_telemetry (Hypertable) for training."""
    query = "SELECT * FROM device_telemetry ORDER BY time_stamp ASC"
    with get_connection() as conn:
        return pd.read_sql(query, conn)


# ============================================================
# DATA INGESTION & FEATURE ENGINEERING
# ============================================================

def engineer_features(df: pd.DataFrame):
    """Calculates metrics based on your provided schema columns"""
    df["time_stamp"] = pd.to_datetime(df["time_stamp"])
    
    # Feature Engineering Logic
    df["apparent_power"] = df["voltage"] * df["current"]
    df["load_ratio"] = df["real_power"] / df["apparent_power"].replace(0, np.nan)
    df["thermal_diff"] = df["external_temp"] - df["room_temp"]
    
    # Rolling averages for stability analysis
    df["power_smooth"] = df.groupby("device_id")["real_power"].transform(lambda x: x.rolling(5, 1).mean())
    
    # Time cycles
    df["hour"] = df["time_stamp"].dt.hour
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    
    return df.fillna(0)

def create_targets(df: pd.DataFrame):
    """Generates ground truth for performance and health scores"""
    # Performance score based on temp diff vs power
    df["perf_target"] = (df["thermal_diff"] / df["real_power"].replace(0, 1)).rank(pct=True) * 100
    
    # Health score (inverse of power factor deviation)
    df["health_target"] = df["power_factor"] * 100
    
    # Predicted State: 1 (Active/High Load), 0 (Idle/Low)
    df["state_target"] = (df["real_power"] > 500).astype(int)
    
    return df

# ============================================================
# MODEL TRAINING & REGISTRY
# ============================================================

def main():
    print("Starting SmartCool Training Pipeline...")

    # 1. Load data from the database via shared api.db helper
    raw_df = load_data()
    if raw_df.empty:
        print("No data found in device_telemetry. Please run seed_complete.py first.")
        return

    df = create_targets(engineer_features(raw_df))
    
    features = [
        "current", "voltage", "power_factor", "real_power", "load_ratio",
        "room_temp", "external_temp", "humidity", "thermal_diff", "hour_sin", "hour_cos"
    ]
    
    X = df[features]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 2. Train Models (Matches ml_predictions schema)
    # Regression for Performance & Health
    model_perf = RandomForestRegressor(n_estimators=100).fit(X_scaled, df["perf_target"])
    model_health = RandomForestRegressor(n_estimators=100).fit(X_scaled, df["health_target"])
    
    # Classification for State
    model_state = RandomForestClassifier(n_estimators=100).fit(X_scaled, df["state_target"])

    # 3. Log to MLflow (Syncs to S3)
    model_dir = Path("/app/models")
    model_dir.mkdir(exist_ok=True)

    with mlflow.start_run(run_name="AC_Standard_Training"):
        # Save Scaler
        joblib.dump(scaler, model_dir / "scaler.joblib")
        
        # Log Models and Version
        version = "v1.0.0"
        mlflow.log_param("model_version", version)
        
        # Log as artifacts (pushed to S3)
        mlflow.log_artifacts(str(model_dir))
        
        # Log Metrics
        mlflow.log_metric("avg_performance", df["perf_target"].mean())
    
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
        
        print(f"Training Complete. Version {version} logged to MLflow and S3.")

if __name__ == "__main__":
    main()