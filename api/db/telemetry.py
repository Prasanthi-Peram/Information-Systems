from .connection import get_connection

def insert_device_telemetry(data: dict):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO telemetry (device_id, time_stamp, payload)
                VALUES (%s, %s, %s)
                """,
                (data["device_id"], data["time_stamp"], data),
            )
        conn.commit()
