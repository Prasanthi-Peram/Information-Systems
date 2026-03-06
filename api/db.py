import os
import psycopg
import pandas as pd
from contextlib import contextmanager
from datetime import datetime, timedelta


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

"""
This module handles ALL database interactions for the backend.

Responsibilities of this file:
--------------------------------
1. Create database connections
2. Execute SQL queries
3. Insert telemetry data
4. Insert ML predictions
5. Fetch maintenance schedules
6. Store ML feedback
7. Support retraining triggers

Important architectural rule:
------------------------------
ML models must NEVER directly access the database.

Instead:
    main.py → calls db.py functions
"""


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():
    """
    Create a new PostgreSQL connection using environment variables.

    Environment variables come from docker-compose:

        DB_HOST=db
        DB_USER=postgres
        DB_PASSWORD=<password>
        DB_NAME=<database>

    Docker networking allows the API container to connect to the
    database container using the hostname "db".
    """

    return psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        dbname=os.getenv("DB_NAME", "postgres"),
    )


@contextmanager
def get_db_cursor():
    """
    Context manager that provides a database cursor.

    It automatically handles:
        - opening connection
        - committing transactions
        - rolling back on error
        - closing connection
    """

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


# ============================================================
# TELEMETRY INSERTION
# ============================================================

def insert_device_telemetry(data: dict):
    """
    Store raw IoT telemetry data in the TimescaleDB database.

    Called by:
        main.py

    Data flow:
        AC sensor → FastAPI → insert_device_telemetry() → database

    The telemetry table stores ONLY raw sensor measurements.

    Feature engineering is performed later inside the ML pipeline.
    """

    with get_db_cursor() as cur:
        device_id = data.get("device_id")
        
        # Ensure device exists in ac_device table (required by foreign key)
        # If the device doesn't exist, create it with a default location
        cur.execute(
            """
            INSERT INTO ac_device (device_id, location)
            VALUES (%s, %s)
            ON CONFLICT (device_id) DO NOTHING
            """,
            (device_id, "Unknown Location"),
        )
        
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
            )
            VALUES (
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


# ============================================================
# ML PREDICTION INSERTION
# ============================================================

def insert_ac_prediction(data: dict):
    """
    Store ML prediction results in the ac_predictions table.

    Called by:
        main.py after smartcool_predict()

    Data flow:
        telemetry → ML pipeline → prediction → database

    This allows the system to:
        - track prediction history
        - monitor model performance
        - build retraining datasets
        - analyze AC efficiency over time
    """

    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO ac_predictions (
                time_stamp,
                device_id,
                pred_state,
                pred_perf,
                pred_condition,
                health_score,
                critical_alert,
                maintenance_advice,
                model_version
            )
            VALUES (
                %(time_stamp)s,
                %(device_id)s,
                %(pred_state)s,
                %(pred_perf)s,
                %(pred_condition)s,
                %(health_score)s,
                %(critical_alert)s,
                %(maintenance_advice)s,
                %(model_version)s
            )
            """,
            data,
        )


# ============================================================
# SERVICE SCHEDULE QUERIES
# ============================================================

def fetch_service_dates():
    """
    Fetch AC service schedules.

    Used by the dashboard to display:

        last_service_date
        next_service_date
    """

    try:
        with get_db_connection() as conn:
            return pd.read_sql("SELECT * FROM ac_service", conn)

    except Exception as e:
        print("DB Error fetching service dates:", e)

        return pd.DataFrame(
            columns=["device_id", "last_service_date", "next_service_date"]
        )


# ============================================================
# SERVICE SCHEDULING LOGIC
# ============================================================

def update_service_schedule(device_id: str, health_score: float, critical_alert: int):
    """
    Update maintenance schedule based on ML predictions.

    Logic:
        critical alert → service in 3 days
        poor health → service in 7 days
        moderate health → service in 30 days
        good health → service in 90 days
    """

    today = datetime.utcnow().date()

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
                INSERT INTO ac_service (
                    device_id,
                    last_service_date,
                    next_service_date
                )
                VALUES (%s, %s, %s)

                ON CONFLICT (device_id)
                DO UPDATE SET
                    last_service_date = EXCLUDED.last_service_date,
                    next_service_date = EXCLUDED.next_service_date
                """,
                (device_id, today, next_service),
            )

    except Exception as e:
        print("Service scheduling error:", e)


# ============================================================
# ML FEEDBACK STORAGE
# ============================================================

def save_ml_feedback(device_id, time_stamp, feedback):
    """
    Store user feedback about model predictions.

    Example feedback:
        correct
        false_alarm

    This data is later used for retraining the model.
    """

    try:
        with get_db_cursor() as cur:

            cur.execute(
                """
                INSERT INTO ml_feedback (
                    device_id,
                    time_stamp,
                    feedback
                )
                VALUES (%s, %s, %s)
                """,
                (device_id, time_stamp, feedback),
            )

    except Exception as e:
        print("Error saving feedback:", e)


# ============================================================
# FEEDBACK STATISTICS
# ============================================================

def get_false_alarm_count():
    """
    Count number of false alarms stored in the database.

    Used to trigger automatic model retraining.
    """

    try:
        with get_db_connection() as conn:

            result = pd.read_sql(
                """
                SELECT COUNT(*) as count
                FROM ml_feedback
                WHERE feedback = 'false_alarm'
                """,
                conn,
            )

            return int(result.iloc[0]["count"])

    except Exception as e:
        print("Error getting false alarm count:", e)
        return 0


def get_all_feedback_stats():
    """
    Get statistics about all feedback types.
    """

    try:
        with get_db_connection() as conn:

            return pd.read_sql(
                """
                SELECT
                    feedback,
                    COUNT(*) as count,
                    COUNT(DISTINCT device_id) as devices
                FROM ml_feedback
                GROUP BY feedback
                """,
                conn,
            )

    except Exception as e:
        print("Error fetching feedback stats:", e)

        return pd.DataFrame(columns=["feedback", "count", "devices"])


# ============================================================
# RESET FEEDBACK AFTER RETRAIN
# ============================================================

def reset_feedback_for_retrain():
    """
    After retraining the model, false alarms are cleared.

    This resets the retraining counter.
    """

    try:
        with get_db_cursor() as cur:

            cur.execute(
                """
                DELETE FROM ml_feedback
                WHERE feedback = 'false_alarm'
                """
            )

    except Exception as e:
        print("Error resetting feedback:", e)

def insert_ac_prediction(data: dict):
    """
    Store ML prediction results in the ac_predictions table.
    """

    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO ac_predictions (
                time_stamp,
                device_id,
                pred_state,
                pred_perf,
                pred_condition,
                health_score,
                critical_alert,
                maintenance_advice,
                model_version
            )
            VALUES (
                %(time_stamp)s,
                %(device_id)s,
                %(pred_state)s,
                %(pred_perf)s,
                %(pred_condition)s,
                %(health_score)s,
                %(critical_alert)s,
                %(maintenance_advice)s,
                %(model_version)s
            )
            """,
            data,
        )