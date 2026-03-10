from db import get_db_cursor


def generate_alerts(data, prediction):

    alerts = []

    if data["external_temp"] > 40:

        alerts.append({
            "text": "High Temperature Alert",
            "criticality": "Warning",
            "recommendation": "Check cooling load"
        })

    if data["real_power"] > 2000:

        alerts.append({
            "text": "Power Consumption Spike",
            "criticality": "Critical",
            "recommendation": "Inspect compressor"
        })

    if prediction["health_score"] < 60:

        alerts.append({
            "text": "Maintenance Required",
            "criticality": "Critical",
            "recommendation": "Immediate servicing recommended"
        })

    return alerts


def insert_alert(device_id, time_stamp, alert):

    with get_db_cursor() as cur:

        cur.execute(
            """
            INSERT INTO alerts(
                device_id,
                time_stamp,
                alert_text,
                alert_criticality,
                recommendation
            )
            VALUES (%s,%s,%s,%s,%s)
            """,
            (
                device_id,
                time_stamp,
                alert["text"],
                alert["criticality"],
                alert["recommendation"]
            )
        )