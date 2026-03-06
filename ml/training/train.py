"""
Training Pipeline for SmartCool AC Monitoring System

Steps:
1. Load telemetry data from TimescaleDB
2. Perform feature engineering
3. Create ML targets
4. Train ML models
5. Save models locally
6. Log models to MLflow
"""

import os
import psycopg
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler

import mlflow
import mlflow.sklearn


# ============================================================
# LOAD ENV VARIABLES
# ============================================================

def load_env_file():

    env_file = Path(__file__).parent.parent / ".env"

    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()

                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)

                    if key not in os.environ:
                        os.environ[key] = value


load_env_file()


# ============================================================
# MLFLOW CONFIGURATION
# ============================================================

mlflow_uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
mlflow.set_tracking_uri(mlflow_uri)


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    conn = psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD") or os.getenv("DB_PASS", "postgres"),
        dbname=os.getenv("DB_NAME", "smartac"),
        port=int(os.getenv("DB_PORT", "5432"))
    )

    print("Connected to database")

    return conn


# ============================================================
# LOAD TELEMETRY DATA
# ============================================================

def load_telemetry():

    query = """
    SELECT *
    FROM device_telemetry
    """

    with get_connection() as conn:
        df = pd.read_sql(query, conn)

    return df


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def build_features(df):

    df["time_stamp"] = pd.to_datetime(df["time_stamp"])

    df = df.sort_values(["device_id", "time_stamp"])

    df["apparent_power"] = df["voltage"] * df["current"]

    df["load_ratio"] = df["real_power"] / df["apparent_power"].replace(0, np.nan)

    df["thermal_stress"] = df["external_temp"] - df["room_temp"]

    df["env_load_index"] = df["external_temp"] * df["humidity"]

    hour = df["time_stamp"].dt.hour

    df["hour_sin"] = np.sin(2*np.pi*hour/24)
    df["hour_cos"] = np.cos(2*np.pi*hour/24)

    df["rolling_std_power"] = (
        df.groupby("device_id")["real_power"]
        .transform(lambda x: x.rolling(3,1).std())
        .fillna(0)
    )

    df["rolling_mean_power"] = (
        df.groupby("device_id")["real_power"]
        .transform(lambda x: x.rolling(3,1).mean())
        .replace(0,np.nan)
    )

    df["power_variability"] = (
        df["rolling_std_power"] / df["rolling_mean_power"]
    ).fillna(0)

    return df


# ============================================================
# TARGET CREATION
# ============================================================

def build_targets(df):

    df["temp_drop"] = df["room_temp"] - df["external_temp"]

    df["cooling_efficiency"] = df["temp_drop"] / df["real_power"].replace(0,np.nan)

    df["performance_score"] = (
        df["cooling_efficiency"].rank(pct=True)*0.4
        + (1-df["power_variability"].rank(pct=True))*0.3
        + df["temp_drop"].rank(pct=True)*0.3
    )*100

    df["condition"] = np.select(
        [
            df["performance_score"] >= 90,
            (df["performance_score"] >= 75) & (df["performance_score"] < 90),
            df["performance_score"] < 75
        ],
        ["Excellent","Good","Maintenance"],
        default="Unknown"
    )

    return df


# ============================================================
# TRAIN MODELS
# ============================================================

def train_models(df):

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
        "hour_cos"
    ]

    X = df[features].fillna(0)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    y_perf = df["performance_score"]
    y_cond = df["condition"]

    y_state = (df["real_power"] > 1000).astype(int)

    X_train, X_test, y_perf_train, y_perf_test = train_test_split(
        X_scaled, y_perf, test_size=0.2, random_state=42
    )

    _, _, y_cond_train, y_cond_test = train_test_split(
        X_scaled, y_cond, test_size=0.2, random_state=42
    )

    _, _, y_state_train, y_state_test = train_test_split(
        X_scaled, y_state, test_size=0.2, random_state=42
    )

    model_state = RandomForestClassifier(n_estimators=150)
    model_perf = RandomForestRegressor(n_estimators=200)
    model_cond = RandomForestClassifier(n_estimators=150)
    iso_model = IsolationForest()

    model_state.fit(X_train, y_state_train)
    model_perf.fit(X_train, y_perf_train)
    model_cond.fit(X_train, y_cond_train)
    iso_model.fit(X_scaled)

    return scaler, model_state, model_perf, model_cond, iso_model


# ============================================================
# SAVE MODELS
# ============================================================

def save_models(models):

    scaler, model_state, model_perf, model_cond, iso_model = models

    model_dir = Path(__file__).parent.parent / "models"

    model_dir.mkdir(exist_ok=True)

    joblib.dump(scaler, model_dir / "scaler.joblib")
    joblib.dump(model_state, model_dir / "model_state.joblib")
    joblib.dump(model_perf, model_dir / "model_perf.joblib")
    joblib.dump(model_cond, model_dir / "model_cond.joblib")
    joblib.dump(iso_model, model_dir / "iso_model.joblib")

    return model_dir


# ============================================================
# LOG MODELS TO MLFLOW
# ============================================================

def log_to_mlflow(model_dir):
    """
    Log trained models to MLflow. 
    Uses simple artifact logging to ensure compatibility.
    """
    
    # Ensure absolute path
    model_dir = Path(model_dir).resolve()
    
    print(f"Logging models from: {model_dir}")
    
    if not model_dir.exists():
        print(f"ERROR: Model directory not found: {model_dir}")
        return
    
    mlflow.set_experiment("SmartAC")

    with mlflow.start_run():
        # Log all model files as artifacts
        for model_file in model_dir.glob("*.joblib"):
            try:
                # Use file system directly with MLflow
                mlflow.log_artifact(str(model_file))
                print(f"✓ Logged {model_file.name}")
            except Exception as e:
                print(f"✗ Failed to log {model_file.name}: {e}")
        
        mlflow.log_param("model_type", "RandomForest")
        mlflow.log_param("training_timestamp", pd.Timestamp.now().isoformat())
        mlflow.log_metric("num_models", len(list(model_dir.glob("*.joblib"))))
        
        print("✓ All models logged to MLflow successfully")


# ============================================================
# MAIN PIPELINE
# ============================================================

def main():

    print("Loading telemetry data...")
    df = load_telemetry()

    print("Building features...")
    df = build_features(df)

    print("Creating targets...")
    df = build_targets(df)

    print("Training models...")
    models = train_models(df)

    print("Saving models...")
    model_dir = save_models(models)

    print("Logging models to MLflow...")
    log_to_mlflow(model_dir)

    print("Training complete")


if __name__ == "__main__":
    main()