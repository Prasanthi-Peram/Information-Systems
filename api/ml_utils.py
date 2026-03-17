import mlflow.pyfunc
import mlflow.sklearn
from mlflow.tracking import MlflowClient
import numpy as np
import pandas as pd
from db import insert_live_prediction, insert_live_device_telemetry, insert_live_ac_device, get_recent_live_telemetry, insert_alert

def load_all_models():
    print("Starting load_all_models", flush=True)
    client = MlflowClient()
    
    print("Searching for latest version from Tracking Server", flush=True)
    filter_string = "name='AC_Health'"
    latest_versions = client.search_model_versions(
        filter_string, 
        order_by=["version_number DESC"], 
        max_results=1
    )
    
    version_str = f"v{latest_versions[0].version}" if latest_versions else "v0"
    print(f"Found Version: {version_str}. Now downloading files from S3", flush=True)

    models = {
        "performance": mlflow.pyfunc.load_model("models:/AC_Performance/latest"),
        "health": mlflow.pyfunc.load_model("models:/AC_Health/latest"),
        "state": mlflow.pyfunc.load_model("models:/AC_State/latest"),
        # Online anomaly detection + shared scaler (loaded from MLflow, not local disk)
        "anomaly": mlflow.sklearn.load_model("models:/AC_Anomaly/latest"),
        "scaler": mlflow.sklearn.load_model("models:/AC_Scaler/latest"),
        "version": version_str
    }

    print("All models downloaded and loaded", flush=True)
    return models

def generate_alerts(data, prediction):
    """
    Generates alerts based on telemetry data and ML predictions.
    """
    alerts = []

    if data.get("external_temp", 0) > 40:
        alerts.append({
            "text": "High Temperature Alert",
            "criticality": "Warning",
            "recommendation": "Check cooling load"
        })

    if data.get("real_power", 0) > 2000:
        alerts.append({
            "text": "Power Consumption Spike",
            "criticality": "Critical",
            "recommendation": "Inspect compressor"
        })

    if prediction.get("health_score", 100) < 60:
        alerts.append({
            "text": "Maintenance Required",
            "criticality": "Critical",
            "recommendation": "Immediate servicing recommended"
        })

    return alerts

def run_prediction(data, models):
    print("I run the model for prediction")
    location = data.get("location", data["device_id"][:4])
    insert_live_ac_device(data["device_id"], location)
    print("I insert live ac device")
    insert_live_device_telemetry(data)
    print("live log insert")

    features = create_features(data)

    # Core predictions (performance, health, state)
    perf = models["performance"].predict([features])[0]
    health = models["health"].predict([features])[0]
    state = models["state"].predict([features])[0]

    # ============================================================
    # REAL-TIME ANOMALY DETECTION (ISOLATION FOREST)
    # ============================================================
    anomaly_flag = 0
    anomaly_score = None

    scaler = models.get("scaler")
    anomaly_model = models.get("anomaly")

    if scaler is not None and anomaly_model is not None:
        try:
            X = np.array(features, dtype=float).reshape(1, -1)
            X_scaled = scaler.transform(X)

            pred_anom = anomaly_model.predict(X_scaled)[0]
            anomaly_score = float(anomaly_model.decision_function(X_scaled)[0])
            anomaly_flag = 1 if pred_anom == -1 else 0

            if anomaly_flag == 1:
                # Map anomaly severity based on score (lower → more anomalous)
                severity = "Info"
                if anomaly_score < -0.2:
                    severity = "Critical"
                elif anomaly_score < -0.1:
                    severity = "Warning"

                alert = {
                    "text": "Anomaly detected by Isolation Forest",
                    "criticality": severity,
                    "recommendation": "Investigate device behaviour; abnormal telemetry pattern detected"
                }
                insert_alert(data["device_id"], data["time_stamp"], alert)
                print(f"Anomaly alert inserted with severity: {severity}", flush=True)
        except Exception as e:
            print(f"Error during anomaly detection: {e}", flush=True)

    print("All predictions done")

    prediction = {
        "device_id": data["device_id"],
        "time_stamp": data["time_stamp"],
        "predicted_state": int(state),
        "health_score": float(health),
        "performance_score": float(perf),
        "model_version": models["version"],
        "anomaly_flag": int(anomaly_flag),
        "anomaly_score": float(anomaly_score) if anomaly_score is not None else None
    }

    insert_live_prediction(prediction)
    print("prediction inserted")

    # Generate and insert alerts
    alerts = generate_alerts(data, prediction)
    for alert in alerts:
        insert_alert(data["device_id"], data["time_stamp"], alert)
        print(f"Alert inserted: {alert['text']}")

    return prediction

def create_features(data):
    """
    Transforms raw JSON telemetry into the feature vector used during training.
    """
    apparent_power = data["voltage"] * data["current"]
    load_ratio = data["real_power"] / apparent_power if apparent_power != 0 else 1.0
    thermal_stress = data["external_temp"] - data["room_temp"]
    env_load_index = data["external_temp"] * data["humidity"]

    # 2. Time-based Features
    ts = pd.to_datetime(data["time_stamp"])
    hour_sin = np.sin(2 * np.pi * ts.hour / 24)
    hour_cos = np.cos(2 * np.pi * ts.hour / 24)

    # 3. Fetch recent data for rolling features
    recent_data = get_recent_live_telemetry(data["device_id"], limit=2)
    
    # Create a DataFrame with recent data + current data
    # Note: recent_data is ordered by time_stamp DESC, so we reverse it
    history_df = pd.DataFrame(recent_data[::-1])
    current_row = pd.DataFrame([data])
    df = pd.concat([history_df, current_row], ignore_index=True)

    # 4. Calculate Advanced Features
    # Rolling stats (window=3)
    rolling_std_power = df["real_power"].rolling(3, min_periods=1).std().iloc[-1]
    rolling_mean_power = df["real_power"].rolling(3, min_periods=1).mean().iloc[-1]
    
    power_variability = (
        rolling_std_power / rolling_mean_power if rolling_mean_power != 0 else 0.0
    )
    
    current_diff = df["current"].diff().iloc[-1] if len(df) > 1 else 0.0
    
    electrical_instability = df["current"].rolling(3, min_periods=1).std().iloc[-1]

    # Fill NaNs (std of 1 element is NaN)
    rolling_std_power = 0.0 if pd.isna(rolling_std_power) else rolling_std_power
    electrical_instability = 0.0 if pd.isna(electrical_instability) else electrical_instability
    current_diff = 0.0 if pd.isna(current_diff) else current_diff

    # 4. Construct the Vector in the EXACT order as training
    feature_vector = [
        data["current"],
        data["voltage"],
        data["power_factor"],
        data["real_power"],
        load_ratio,
        data["room_temp"],
        data["external_temp"],
        data["humidity"],
        thermal_stress,
        env_load_index,
        hour_sin,
        hour_cos,
        rolling_std_power,
        rolling_mean_power,
        power_variability,
        current_diff,
        electrical_instability
    ]

    return np.array(feature_vector)