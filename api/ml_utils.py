import mlflow.pyfunc
from mlflow.tracking import MlflowClient
import numpy as np
import pandas as pd
from db import insert_prediction, insert_device_telemetry, insert_ac_device

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
        "version": version_str
    }
    print("All models downloaded and loaded", flush=True)
    return models

def run_prediction(data,models):

    print("I run the model for prediction")
    insert_ac_device(data["device_id"], data["device_id"][:4])
    print("I insert ac device")
    insert_device_telemetry(data)
    print("log insert")

    features = create_features(data)

    perf = models["performance"].predict([features])[0]
    health = models["health"].predict([features])[0]
    state = models["state"].predict([features])[0]
    print("All predictions done")

    prediction = {
        "device_id": data["device_id"],
        "time_stamp": data["time_stamp"],
        "predicted_state": int(state),
        "health_score": float(health),
        "performance_score": float(perf),
        "model_version": models["version"]
    }

    insert_prediction(prediction)
    print("prediction inserted")

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

    # 3. Handling Rolling/Diff Features for a Single Row
    rolling_mean_power = data["real_power"] 
    power_variability = 0.0
    current_diff = 0.0
    electrical_instability = 0.0

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