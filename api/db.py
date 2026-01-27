import os
import psycopg
from contextlib import contextmanager


def get_db_connection():
    """Get a database connection using environment variables"""
    return psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
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


