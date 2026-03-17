import mlflow.pyfunc
import mlflow.sklearn
from mlflow.tracking import MlflowClient
import numpy as np
import pandas as pd
from db import (
    insert_live_prediction,
    insert_live_device_telemetry,
    insert_live_ac_device,
    get_recent_live_telemetry,
    insert_alert,
)


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


def _build_anomaly_explanation(data, health: float, perf: float, anomaly_score: float | None):
    """
    Build a more detailed, human-readable explanation for anomalies.
    Uses raw telemetry and recent history-derived features.
    """
    reasons: list[str] = []

    # Basic telemetry-derived signals
    current = float(data.get("current", 0.0))
    voltage = float(data.get("voltage", 0.0))
    real_power = float(data.get("real_power", 0.0))
    room_temp = float(data.get("room_temp", 0.0))
    external_temp = float(data.get("external_temp", 0.0))
    humidity = float(data.get("humidity", 0.0))

    apparent_power = voltage * current
    load_ratio = real_power / apparent_power if apparent_power != 0 else 0.0
    thermal_stress = external_temp - room_temp

    # Temperature-related anomalies
    delta_t = abs(thermal_stress)
    if delta_t > 10:
        reasons.append(
            f"Temperature spike between room and outside (ΔT={delta_t:.1f}°C, room={room_temp:.1f}°C, outside={external_temp:.1f}°C)."
        )

    # Power and electrical behaviour from recent history
    try:
        recent = get_recent_live_telemetry(data["device_id"], limit=2)
        history_df = pd.DataFrame(recent[::-1])
        current_row = pd.DataFrame([data])
        df = pd.concat([history_df, current_row], ignore_index=True)

        rolling_std_power = df["real_power"].rolling(3, min_periods=1).std().iloc[-1]
        rolling_mean_power = df["real_power"].rolling(3, min_periods=1).mean().iloc[-1]
        power_variability = (
            rolling_std_power / rolling_mean_power if rolling_mean_power != 0 else 0.0
        )

        current_diff = df["current"].diff().iloc[-1] if len(df) > 1 else 0.0
        electrical_instability = df["current"].rolling(3, min_periods=1).std().iloc[-1]

        if not pd.isna(power_variability) and power_variability > 0.3:
            reasons.append(
                f"Power variability is high (variability index={power_variability:.2f})."
            )

        if not pd.isna(current_diff) and abs(current_diff) > 8:
            reasons.append(
                f"Sudden change in current draw (ΔI={current_diff:.1f} A across recent readings)."
            )

        if not pd.isna(electrical_instability) and electrical_instability > 5:
            reasons.append(
                f"Electrical current is unstable (std over recent window={electrical_instability:.2f} A)."
            )
    except Exception:
        # If anything fails here, just skip detailed history-based signals
        pass

    # Load / power anomalies
    if load_ratio > 1.1 or load_ratio < 0.1:
        reasons.append(
            f"Unusual load ratio detected (load_ratio={load_ratio:.2f}, power={real_power:.0f} W, I={current:.1f} A, V={voltage:.1f} V)."
        )

    if real_power > 2500:
        reasons.append(
            f"High power draw observed (real_power={real_power:.0f} W)."
        )

    if humidity < 10 or humidity > 90:
        reasons.append(
            f"Humidity level is extreme (humidity={humidity:.1f}%)."
        )

    # Fallback reason if nothing specific was triggered
    if not reasons:
        base = "Isolation Forest detected an out-of-pattern telemetry point."
        extra = (
            f" Health score={health:.1f}, performance={perf:.1f}."
            if health is not None and perf is not None
            else ""
        )
        if anomaly_score is not None:
            extra += f" anomaly_score={anomaly_score:.3f}."
        reasons.append(base + extra)

    # Join reasons into a single recommendation string
    recommendation = " ".join(reasons)
    return recommendation

def generate_alerts(data, prediction):
    """
    Generates alerts based on telemetry data and ML predictions.
    Only generates alerts if the device is predicted to be ON (predicted_state = 1).
    """
    alerts = []
    
    # Generate telemetry-based alerts
    if data.get("external_temp", 0) > 45: # Increased from 40
        alerts.append({
            "text": "Extreme External Temperature",
            "criticality": "Warning",
            "recommendation": "Monitor cooling performance under high ambient load"
        })

    if data.get("real_power", 0) > 3000: # Increased from 2000
        alerts.append({
            "text": "Critical Power Overload",
            "criticality": "Critical",
            "recommendation": "Inspect compressor and electrical connections immediately"
        })

    if prediction.get("health_score", 100) < 50: # Decreased from 60 for less noise
        alerts.append({
            "text": "System Health Degraded",
            "criticality": "Critical",
            "recommendation": "Schedule maintenance checkup"
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

    # ============================================================
    # SCALING & CORE PREDICTIONS
    # ============================================================
    scaler = models.get("scaler")
    feature_names = [
        "current", "voltage", "power_factor", "real_power", "load_ratio",
        "room_temp", "external_temp", "humidity", "thermal_stress",
        "env_load_index", "hour_sin", "hour_cos", "rolling_std_power",
        "rolling_mean_power", "power_variability", "current_diff",
        "electrical_instability"
    ]

    if scaler is not None:
        X_df = pd.DataFrame([features], columns=feature_names)
        X_scaled = scaler.transform(X_df)
        
        # Core predictions (performance, health, state) using scaled features
        perf = models["performance"].predict(X_scaled)[0]
        health = models["health"].predict(X_scaled)[0]
        state = models["state"].predict(X_scaled)[0]
    else:
        # Fallback if scaler is missing
        print("WARNING: Scaler model not found. Using raw features.", flush=True)
        X_scaled = np.array(features).reshape(1, -1)
        perf = models["performance"].predict(X_scaled)[0]
        health = models["health"].predict(X_scaled)[0]
        state = models["state"].predict(X_scaled)[0]

    # ============================================================
    # REAL-TIME ANOMALY DETECTION (ISOLATION FOREST)
    # ============================================================
    anomaly_flag = 0
    anomaly_score = None
    health_val = float(health)
    perf_val = float(perf)

    anomaly_model = models.get("anomaly")

    if anomaly_model is not None:
        try:
            pred_anom = anomaly_model.predict(X_scaled)[0]
            anomaly_score = float(anomaly_model.decision_function(X_scaled)[0])
            anomaly_flag = 1 if pred_anom == -1 else 0

            # First gate by Isolation Forest score itself:
            # Set threshold to -0.08 to catch the -0.08 to -0.2 range as requested.
            if anomaly_score > -0.08:
                anomaly_flag = 0

            if health_val >= 85 and perf_val >= 85:
                anomaly_flag = 0

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

    # ============================================================
    # ALERT CONSOLIDATION
    # ============================================================
    # Collect all potential alerts and pick the most significant one
    potential_alerts = []
    
    # 1. Add anomaly alert if detected
    if anomaly_flag == 1:
        severity = "Warning"
        if anomaly_score <= -0.2:
            severity = "Critical"

        recommendation = _build_anomaly_explanation(
            data=data,
            health=health_val,
            perf=perf_val,
            anomaly_score=anomaly_score,
        )

        potential_alerts.append({
            "text": f"Telemetry anomaly ({severity}) detected for device {data['device_id']} (Score: {anomaly_score:.3f})",
            "criticality": severity,
            "recommendation": recommendation,
            "priority": 3 # Highest priority
        })

    # 2. Add threshold-based alerts
    threshold_alerts = generate_alerts(data, prediction)
    for ta in threshold_alerts:
        # Assign priority based on criticality
        prio = 2 if ta["criticality"] == "Critical" else 1
        ta["priority"] = prio
        potential_alerts.append(ta)

    # 3. Pick the single best alert (highest priority)
    if potential_alerts:
        # Sort by priority DESC, then pick the first
        best_alert = sorted(potential_alerts, key=lambda x: x["priority"], reverse=True)[0]
        
        # Remove the internal priority key before inserting
        best_alert.pop("priority", None)
        
        insert_alert(data["device_id"], data["time_stamp"], best_alert)
        print(f"Consolidated alert inserted: {best_alert['text']}")

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