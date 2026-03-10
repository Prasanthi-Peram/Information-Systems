import mlflow.pyfunc
import numpy as np
from db import get_db_cursor
from mlflow.tracking import MlflowClient
from maintenance_engine import evaluate_maintenance
from alert_engine import generate_alerts, insert_alert
from service_logic import compute_next_service
from db import get_db_cursor

perf_model = mlflow.pyfunc.load_model("models:/AC_Performance/Production")
health_model = mlflow.pyfunc.load_model("models:/AC_Health/Production")
state_model = mlflow.pyfunc.load_model("models:/AC_State/Production")

client = MlflowClient()

def get_model_version(model_name):

    latest = client.get_latest_versions(model_name, stages=["Production"])

    if latest:
        return latest[0].version

    return "unknown"

issue, criticality = evaluate_maintenance(prediction)

prediction["issue"] = issue
prediction["criticality"] = criticality

alerts = generate_alerts(data, prediction)

for alert in alerts:

    insert_alert(
        data["device_id"],
        data["time_stamp"],
        alert
    )

def run_prediction(data):

    features = create_features(data)

    perf = perf_model.predict([features])[0]
    health = health_model.predict([features])[0]
    state = state_model.predict([features])[0]

    # Get last service date
    with get_db_cursor() as cur:

        cur.execute(
            """
            SELECT last_service
            FROM ac_device
            WHERE device_id = %s
            """,
            (data["device_id"],)
        )

        last_service = cur.fetchone()[0]

    # Compute next service date
    next_service = compute_next_service(
        data["time_stamp"],
        last_service,
        health,
        perf
    )

    prediction = {
        "device_id": data["device_id"],
        "time_stamp": data["time_stamp"],
        "predicted_state": int(state),
        "health_score": float(health),
        "performance_score": float(perf),
        "predicted_service_date": next_service
    }

    return prediction