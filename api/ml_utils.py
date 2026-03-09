import mlflow.pyfunc
import numpy as np
from db import get_db_cursor

perf_model = mlflow.pyfunc.load_model("models:/AC_Performance/Production")
health_model = mlflow.pyfunc.load_model("models:/AC_Health/Production")
state_model = mlflow.pyfunc.load_model("models:/AC_State/Production")

def run_prediction(data):

    features = create_features(data)

    perf = perf_model.predict([features])[0]
    health = health_model.predict([features])[0]
    state = state_model.predict([features])[0]

    prediction = {
        "device_id": data["device_id"],
        "time_stamp": data["time_stamp"],
        "predicted_state": int(state),
        "health_score": float(health),
        "performance_score": float(perf),
        "model_version": "v1.0.0"
    }

    insert_prediction(prediction)

    return prediction