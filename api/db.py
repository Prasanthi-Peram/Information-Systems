import os
import psycopg
from contextlib import contextmanager


def get_db_connection():
    """Get a database connection using environment variables"""
    return psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "postgres"),
        # Prefer DB_PASSWORD (used in docker-compose), fall back to DB_PASS for local runs
        password=os.getenv("DB_PASSWORD") or os.getenv("DB_PASS", ""),
        dbname=os.getenv("DB_NAME", "postgres")
    )


@contextmanager
def get_db_cursor():
    """Context manager for database cursor"""
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def insert_ac_device(device_id: int, location: str):
    """Insert or upsert a device into ac_device."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO ac_device (device_id, location)
            VALUES (%s, %s)
            ON CONFLICT (device_id) DO UPDATE SET location = EXCLUDED.location;
            """,
            (device_id, location),
        )


def insert_device_telemetry(data: dict):
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO device_telemetry (
                time_stamp,
                device_id,
                current,
                voltage,
                power_factor,
                real_power,
                room_temp,
                external_temp,
                humidity,
                unit_consumption
            ) VALUES (
                %(time_stamp)s,
                %(device_id)s,
                %(current)s,
                %(voltage)s,
                %(power_factor)s,
                %(real_power)s,
                %(room_temp)s,
                %(external_temp)s,
                %(humidity)s,
                %(unit_consumption)s
            )
            """,
            data,
        )

def insert_alert(device_id, text, criticality, service_date):

    with get_db_cursor() as cur:

        cur.execute(
            """
            INSERT INTO alerts(
                time_stamp,
                device_id,
                alert_text,
                alert_criticality,
                predicted_service_date
            )
            VALUES(now(), %s, %s, %s, %s)
            """,
            (
                device_id,
                text,
                criticality,
                service_date
            )
        )
