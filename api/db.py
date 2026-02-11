import os
import psycopg
import pandas as pd
from contextlib import contextmanager
from datetime import datetime, timedelta

# Enable database only if connection details are provided
DB_ENABLED = bool(os.getenv("DB_HOST") and os.getenv("DB_USER"))


# CONNECTION


def get_db_connection():
    return psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        dbname=os.getenv("DB_NAME", "postgres"),
    )

@contextmanager
def get_db_cursor():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


# TELEMETRY


def insert_device_telemetry(data: dict):
    if not DB_ENABLED:
        return

    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO device_telemetry (
                time_stamp, device_id,
                current, voltage, power_factor, real_power,
                room_temp, external_temp, humidity, unit_consumption
            ) VALUES (
                %(time_stamp)s, %(device_id)s,
                %(current)s, %(voltage)s, %(power_factor)s, %(real_power)s,
                %(room_temp)s, %(external_temp)s, %(humidity)s, %(unit_consumption)s
            )
            """,
            data,
        )


# SERVICE DATES


def fetch_service_dates():
    if not DB_ENABLED:
        return pd.DataFrame(columns=[
            "device_id", "last_service_date", "next_service_date"
        ])

    try:
        with get_db_connection() as conn:
            return pd.read_sql("SELECT * FROM ac_service", conn)
    except Exception as e:
        print("DB Error fetching service dates:", e)
        return pd.DataFrame(columns=[
            "device_id", "last_service_date", "next_service_date"
        ])


# 🔥 SMART SERVICE SCHEDULER


def update_service_schedule(device_id: str, health_score: float, critical_alert: int):
    """
    ML-based adaptive service scheduling
    """

    if not DB_ENABLED:
        print(f"[Schedule] {device_id} | Health={health_score} | Critical={critical_alert}")
        return

    today = datetime.utcnow().date()

    # Intelligent scheduling logic
    if critical_alert == 1:
        next_service = today + timedelta(days=3)
    elif health_score < 40:
        next_service = today + timedelta(days=7)
    elif health_score < 70:
        next_service = today + timedelta(days=30)
    else:
        next_service = today + timedelta(days=90)

    try:
        with get_db_cursor() as cur:
            cur.execute(
                """
                INSERT INTO ac_service (device_id, last_service_date, next_service_date)
                VALUES (%s, %s, %s)
                ON CONFLICT (device_id)
                DO UPDATE SET
                    last_service_date = EXCLUDED.last_service_date,
                    next_service_date = EXCLUDED.next_service_date
                """,
                (device_id, today, next_service),
            )

        print(f"Service updated for {device_id} → {next_service}")

    except Exception as e:
        print("Service scheduling error:", e)


# ML FEEDBACK


def save_ml_feedback(device_id, time_stamp, feedback):
    if not DB_ENABLED:
        print(f"Feedback: {device_id} | {time_stamp} | {feedback}")
        return

    try:
        with get_db_cursor() as cur:
            cur.execute(
                """
                INSERT INTO ml_feedback (device_id, time_stamp, feedback)
                VALUES (%s, %s, %s)
                """,
                (device_id, time_stamp, feedback),
            )
        print(f"Feedback saved: {device_id} - {feedback}")

    except Exception as e:
        print("Error saving feedback:", e)