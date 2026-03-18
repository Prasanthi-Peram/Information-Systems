import os
import psycopg
from contextlib import contextmanager
from datetime import timedelta


def get_db_connection():
    """Get a database connection using environment variables"""
    return psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "postgres"),
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
        # Ensure location exists and get its ID
        cur.execute(
            "INSERT INTO location (location_name) VALUES (%s) ON CONFLICT (location_name) DO NOTHING",
            (location,)
        )
        cur.execute("SELECT location_id FROM location WHERE location_name = %s", (location,))
        location_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO ac_device (device_id, location_id)
            VALUES (%s, %s)
            ON CONFLICT (device_id) DO UPDATE SET location_id = EXCLUDED.location_id;
            """,
            (device_id, location_id),
        )


def insert_live_ac_device(device_id: str, location: str):
    """Insert or upsert a device into live_ac_device."""
    with get_db_cursor() as cur:
        # Ensure location exists and get its ID
        cur.execute(
            "INSERT INTO live_location (location_name) VALUES (%s) ON CONFLICT (location_name) DO NOTHING",
            (location,)
        )
        cur.execute("SELECT location_id FROM live_location WHERE location_name = %s", (location,))
        location_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO live_ac_device (device_id, location_id)
            VALUES (%s, %s)
            ON CONFLICT (device_id) DO UPDATE SET location_id = EXCLUDED.location_id;
            """,
            (device_id, location_id),
        )

def create_room(name: str):
    """Create a new room in the live_location table."""
    with get_db_cursor() as cur:
        cur.execute(
            "INSERT INTO live_location (location_name) VALUES (%s) ON CONFLICT (location_name) DO NOTHING",
            (name.upper(),)
        )

def create_ac_device(device_id: str, room_name: str):
    """Create a new AC device in a specific room."""
    with get_db_cursor() as cur:
        # Ensure location exists and get its ID
        cur.execute(
            "INSERT INTO live_location (location_name) VALUES (%s) ON CONFLICT (location_name) DO NOTHING",
            (room_name.upper(),)
        )
        cur.execute("SELECT location_id FROM live_location WHERE UPPER(location_name) = UPPER(%s)", (room_name,))
        location_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO live_ac_device (device_id, location_id)
            VALUES (%s, %s)
            ON CONFLICT (device_id) DO NOTHING;
            """,
            (device_id.upper(), location_id),
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


def insert_live_device_telemetry(data: dict):
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO live_device_telemetry (
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
        
def insert_prediction(prediction: dict):
    """Inserts ML results into ml_predictions table."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO ml_predictions (
                time_stamp, 
                device_id, 
                predicted_state, 
                health_score, 
                performance_score, 
                model_version
            ) VALUES (
                %(time_stamp)s, 
                %(device_id)s, 
                %(predicted_state)s, 
                %(health_score)s, 
                %(performance_score)s, 
                %(model_version)s
            );
            """,
            prediction,
        )

def insert_live_prediction(prediction: dict):
    """Inserts live ML results into live_ml_predictions table."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO live_ml_predictions (
                time_stamp, 
                device_id, 
                predicted_state, 
                health_score, 
                performance_score, 
                model_version
            ) VALUES (
                %(time_stamp)s, 
                %(device_id)s, 
                %(predicted_state)s, 
                %(health_score)s, 
                %(performance_score)s, 
                %(model_version)s
            );
            """,
            prediction,
        )

def insert_alert(device_id, time_stamp, alert):
    with get_db_cursor() as cur:
        # Check if an identical alert already exists for this EXACT timestamp
        # This prevents processing the same data point twice while allowing 
        # logging of persistent issues across different telemetry points.
        cur.execute(
            """
            SELECT 1 FROM alerts 
            WHERE device_id = %s 
              AND time_stamp = %s
            LIMIT 1
            """,
            (device_id, time_stamp)
        )
        if cur.fetchone():
            return  # Skip insertion if any alert already exists for this timestamp

        # Calculate predicted_service_date based on criticality
        # Critical: 3 days, Warning: 7 days, others: 14 days
        days_to_add = 14
        if alert["criticality"] == "Critical":
            days_to_add = 3
        elif alert["criticality"] == "Warning":
            days_to_add = 7

        from datetime import datetime, timedelta
        
        # Ensure time_stamp is a datetime object
        if isinstance(time_stamp, str):
            # Handle ISO format with Z or offset
            try:
                ts_obj = datetime.fromisoformat(time_stamp.replace('Z', '+00:00'))
            except ValueError:
                # Fallback for other formats if necessary
                ts_obj = datetime.now()
        else:
            ts_obj = time_stamp

        predicted_date = ts_obj + timedelta(days=days_to_add)

        cur.execute(
            """
            INSERT INTO alerts(
                device_id,
                time_stamp,
                alert_text,
                alert_criticality,
                recommendation,
                predicted_service_date
            )
            VALUES (%s,%s,%s,%s,%s, %s)
            """,
            (
                device_id,
                time_stamp,
                alert["text"],
                alert["criticality"],
                alert["recommendation"],
                predicted_date
            )
        )


def get_false_alert_count(interval: str = "1 hour") -> int:
    """
    Count alerts that have been marked as false (is_true_alarm = FALSE)
    within the given time window (e.g. '1 hour', '24 hours').
    """
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*)
            FROM alerts
            WHERE is_true_alarm = FALSE
              AND created_at > NOW() - %s::interval;
            """,
            (interval,),
        )
        row = cur.fetchone()
        return int(row[0]) if row and row[0] is not None else 0

def get_total_false_alert_count() -> int:
    """Count all alerts that have been marked as false."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*)
            FROM alerts
            WHERE is_true_alarm = FALSE;
            """
        )
        row = cur.fetchone()
        return int(row[0]) if row and row[0] is not None else 0

def get_alerts(limit: int = 20):
    """Fetch the most recent true alerts."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT alert_id, time_stamp, device_id, alert_text, alert_criticality, recommendation, created_at
            FROM alerts a
            WHERE resolved_at IS NULL 
              AND alert_text LIKE 'Telemetry anomaly%%'
              AND NOT EXISTS (
                  SELECT 1 FROM maintenance_assignments ma 
                  WHERE ma.alert_id = a.alert_id
                    AND ma.status IN ('Pending', 'Accepted', 'Completed')
              )
            ORDER BY time_stamp DESC
            LIMIT %s;
            """,
            (limit,),
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]

def resolve_alert_by_device(device_id: str):
    """Mark all active alerts for a device as resolved."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            UPDATE alerts
            SET is_true_alarm = FALSE, resolved_at = now()
            WHERE device_id = %s AND is_true_alarm = TRUE AND resolved_at IS NULL;
            """,
            (device_id,),
        )

def resolve_alert(alert_id: int):
    """Mark a specific alert as resolved."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            UPDATE alerts
            SET is_true_alarm = FALSE, resolved_at = now()
            WHERE alert_id = %s AND is_true_alarm = TRUE AND resolved_at IS NULL;
            """,
            (alert_id,),
        )

def get_maintenance_tasks():
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT 
                alert_id as id,
                device_id as "deviceId",
                (SELECT location_name FROM live_location l JOIN live_ac_device d ON l.location_id = d.location_id WHERE d.device_id = a.device_id) as room,
                (SELECT TO_CHAR(last_service, 'YYYY-MM-DD') FROM live_ac_device d WHERE d.device_id = a.device_id) as "lastService",
                TO_CHAR(predicted_service_date, 'YYYY-MM-DD') as "nextService",
                alert_text as issue,
                alert_criticality as criticality,
                time_stamp as "timeStamp"
            FROM alerts a
            WHERE resolved_at IS NULL
              AND alert_text LIKE 'Telemetry anomaly%%'
              AND NOT EXISTS (
                  SELECT 1 FROM maintenance_assignments ma 
                  WHERE ma.alert_id = a.alert_id
                    AND ma.status IN ('Pending', 'Accepted', 'Completed')
              )
            ORDER BY time_stamp DESC
            """,
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]

def get_assigned_tasks():
    """Fetch all currently assigned (Pending/Accepted) tasks for admin view."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT 
                ma.assignment_id,
                a.device_id as "deviceId",
                (SELECT location_name FROM live_location l JOIN live_ac_device d ON l.location_id = d.location_id WHERE d.device_id = a.device_id) as room,
                (SELECT TO_CHAR(last_service, 'YYYY-MM-DD') FROM live_ac_device d WHERE d.device_id = a.device_id) as "lastService",
                TO_CHAR(a.predicted_service_date, 'YYYY-MM-DD') as "nextService",
                a.alert_text as issue,
                a.alert_criticality as criticality,
                ma.status,
                u.name as "technicianName",
                t.specialization
            FROM maintenance_assignments ma
            JOIN alerts a ON ma.alert_id = a.alert_id
            JOIN technicians t ON ma.technician_id = t.technician_id
            JOIN users u ON t.user_id = u.id
            WHERE ma.status IN ('Pending', 'Accepted', 'Rejected')
            ORDER BY ma.assigned_at DESC
            """,
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]

def get_completed_tasks_admin():
    """Fetch all completed tasks for admin view."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT 
                ma.assignment_id,
                a.device_id as "deviceId",
                (SELECT location_name FROM live_location l JOIN live_ac_device d ON l.location_id = d.location_id WHERE d.device_id = a.device_id) as room,
                (SELECT TO_CHAR(last_service, 'YYYY-MM-DD') FROM live_ac_device d WHERE d.device_id = a.device_id) as "lastService",
                TO_CHAR(a.predicted_service_date, 'YYYY-MM-DD') as "nextService",
                a.alert_text as issue,
                a.alert_criticality as criticality,
                ma.status,
                u.name as "technicianName",
                t.specialization,
                TO_CHAR(ma.updated_at, 'YYYY-MM-DD') as "completedAt"
            FROM maintenance_assignments ma
            JOIN alerts a ON ma.alert_id = a.alert_id
            JOIN technicians t ON ma.technician_id = t.technician_id
            JOIN users u ON t.user_id = u.id
            WHERE ma.status = 'Completed'
            ORDER BY ma.updated_at DESC
            """,
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]

def get_dashboard_stats():
    """Get dashboard statistics from the database using live predictions and telemetry."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            WITH latest_predictions AS (
                SELECT DISTINCT ON (device_id) device_id, predicted_state, performance_score, health_score
                FROM live_ml_predictions
                ORDER BY device_id, time_stamp DESC
            ),
            latest_telemetry AS (
                SELECT DISTINCT ON (device_id) device_id, real_power
                FROM live_device_telemetry
                ORDER BY device_id, time_stamp DESC
            )
            SELECT 
                (SELECT COUNT(*) FROM latest_predictions WHERE predicted_state = 1) as active_acs,
                (SELECT AVG(performance_score) FROM latest_predictions WHERE predicted_state = 1) as avg_performance,
                (SELECT AVG(health_score) FROM latest_predictions WHERE predicted_state = 1) as avg_health,
                (SELECT AVG(real_power) FROM latest_telemetry t JOIN latest_predictions p ON t.device_id = p.device_id WHERE p.predicted_state = 1) as avg_power,
                (
                    -- Unassigned or Rejected alerts
                    (SELECT COUNT(*) FROM alerts a WHERE resolved_at IS NULL AND alert_text LIKE 'Telemetry anomaly%%'
                     AND NOT EXISTS (SELECT 1 FROM maintenance_assignments ma WHERE ma.alert_id = a.alert_id AND ma.status IN ('Pending', 'Accepted', 'Completed')))
                    +
                    -- Assigned but not yet completed
                    (SELECT COUNT(*) FROM maintenance_assignments WHERE status IN ('Pending', 'Accepted'))
                ) as maintenance_tasks;
            """
        )

        result = cur.fetchone()

        if not result:
            return {
                "active_acs": 0,
                "avg_performance": 0.0,
                "avg_health": 0.0,
                "avg_power": 0.0,
                "maintenance_tasks": 0
            }

        active_acs, avg_performance, avg_health, avg_power, maintenance_tasks = result

        avg_power = (avg_power or 0) / 1000  # convert W → kW
        
        # Calculate health distribution
        cur.execute(
            """
            WITH latest_predictions AS (
                SELECT DISTINCT ON (device_id) device_id, health_score
                FROM live_ml_predictions
                WHERE predicted_state = 1
                ORDER BY device_id, time_stamp DESC
            )
            SELECT 
                COUNT(*) FILTER (WHERE health_score > 70) as good,
                COUNT(*) FILTER (WHERE health_score > 40 AND health_score <= 70) as fair,
                COUNT(*) FILTER (WHERE health_score <= 40) as poor
            FROM latest_predictions;
            """
        )
        health_dist = cur.fetchone()
        good, fair, poor = health_dist if health_dist else (0, 0, 0)

        return {
            "active_acs": int(active_acs or 0),
            "avg_performance": round(float(avg_performance or 0), 2),
            "avg_health": round(float(avg_health or 0), 2),
            "avg_power": round(float(avg_power or 0), 2),
            "maintenance_tasks": int(maintenance_tasks or 0),
            "health_distribution": {
                "good": int(good or 0),
                "fair": int(fair or 0),
                "poor": int(poor or 0)
            }
        }


def get_recent_live_telemetry(device_id: str, limit: int = 5):
    """Fetch the most recent telemetry records for a device."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT time_stamp, device_id, current, voltage, power_factor, real_power / 1000 as real_power, 
                   room_temp, external_temp, humidity, unit_consumption
            FROM live_device_telemetry
            WHERE device_id = %s
            ORDER BY time_stamp DESC
            LIMIT %s;
            """,
            (device_id, limit),
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]


def get_rooms_status():
    """Get the latest status for all AC devices."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            WITH latest_telemetry AS (
                SELECT DISTINCT ON (device_id) 
                    device_id, room_temp, humidity, real_power
                FROM live_device_telemetry
                ORDER BY device_id, time_stamp DESC
            ),
            latest_predictions AS (
                SELECT DISTINCT ON (device_id) 
                    device_id, predicted_state, performance_score, health_score
                FROM live_ml_predictions
                ORDER BY device_id, time_stamp DESC
            ),
            device_uptimes AS (
                WITH status_changes AS (
                    SELECT 
                        device_id,
                        time_stamp,
                        predicted_state,
                        LAG(predicted_state) OVER (PARTITION BY device_id ORDER BY time_stamp) as prev_state
                    FROM live_ml_predictions
                ),
                islands AS (
                    SELECT 
                        device_id,
                        time_stamp,
                        predicted_state,
                        SUM(CASE WHEN predicted_state = prev_state THEN 0 ELSE 1 END) OVER (PARTITION BY device_id ORDER BY time_stamp) as island_id
                    FROM status_changes
                ),
                island_bounds AS (
                    SELECT 
                        device_id,
                        island_id,
                        MIN(time_stamp) as start_ts,
                        MAX(time_stamp) as end_ts,
                        MAX(predicted_state) as state
                    FROM islands
                    GROUP BY device_id, island_id
                ),
                latest_islands AS (
                    SELECT DISTINCT ON (device_id) device_id, island_id, state 
                    FROM island_bounds 
                    ORDER BY device_id, island_id DESC
                ),
                durations AS (
                    SELECT 
                        ib.device_id,
                        ib.start_ts,
                        CASE 
                            WHEN ib.island_id = li.island_id AND li.state = 1 
                            THEN NOW() 
                            ELSE ib.end_ts 
                        END as adjusted_end_ts
                    FROM island_bounds ib
                    JOIN latest_islands li ON ib.device_id = li.device_id
                    WHERE ib.state = 1
                )
                SELECT 
                    device_id,
                    COALESCE(SUM(
                        CASE 
                            WHEN adjusted_end_ts < CURRENT_DATE THEN 0
                            ELSE EXTRACT(EPOCH FROM (adjusted_end_ts - GREATEST(start_ts, CURRENT_DATE))) / 3600.0
                        END
                    ), 0) as hours_today
                FROM durations
                GROUP BY device_id
            )
            SELECT 
                MAX(d.device_id) as device_id,
                l.location_name as name,
                AVG(COALESCE(t.room_temp, 0)) as temperature,
                AVG(COALESCE(t.humidity, 0)) as humidity,
                CASE WHEN MAX(COALESCE(p.predicted_state, 0)) = 1 THEN 'on' ELSE 'off' END as status,
                AVG(COALESCE(t.real_power, 0)) / 1000 as power_consumption,
                AVG(COALESCE(p.performance_score, 0)) as performance,
                AVG(COALESCE(p.health_score, 0)) as health,
                MAX(COALESCE(du.hours_today, 0)) as uptime,
                CASE 
                    WHEN AVG(COALESCE(p.health_score, 0)) > 70 THEN 'Good'
                    WHEN AVG(COALESCE(p.health_score, 0)) > 40 THEN 'Fair'
                    ELSE 'Poor'
                END as condition,
                CASE 
                    WHEN AVG(COALESCE(p.health_score, 0)) > 70 THEN 'text-green-600'
                    WHEN AVG(COALESCE(p.health_score, 0)) > 40 THEN 'text-yellow-600'
                    ELSE 'text-red-600'
                END as condition_color
            FROM live_location l
            LEFT JOIN live_ac_device d ON l.location_id = d.location_id
            LEFT JOIN latest_telemetry t ON d.device_id = t.device_id
            LEFT JOIN latest_predictions p ON d.device_id = p.device_id
            LEFT JOIN device_uptimes du ON d.device_id = du.device_id
            GROUP BY l.location_name;
            """
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]


def get_room_details(room_name: str):
    """Get detailed metrics for a specific room and its AC units."""
    with get_db_cursor() as cur:
        # Get all devices in this room
        cur.execute(
            "SELECT device_id FROM live_ac_device d JOIN live_location l ON d.location_id = l.location_id WHERE UPPER(l.location_name) = UPPER(%s)",
            (room_name,)
        )
        devices = [row[0] for row in cur.fetchall()]
        
        if not devices:
            return {
                "room_name": room_name.upper(),
                "avg_temp": 0,
                "avg_humidity": 0,
                "avg_performance": 0,
                "max_uptime": 0,
                "units": []
            }

        # Get latest telemetry and predictions for these devices
        cur.execute(
            """
            WITH latest_telemetry AS (
                SELECT DISTINCT ON (device_id) 
                    device_id, room_temp, humidity, current, voltage, real_power
                FROM live_device_telemetry
                WHERE device_id = ANY(%s)
                ORDER BY device_id, time_stamp DESC
            ),
            latest_predictions AS (
                SELECT DISTINCT ON (device_id) 
                    device_id, predicted_state, performance_score, health_score
                FROM live_ml_predictions
                WHERE device_id = ANY(%s)
                ORDER BY device_id, time_stamp DESC
            ),
            device_uptimes AS (
                WITH status_changes AS (
                    SELECT 
                        device_id,
                        time_stamp,
                        predicted_state,
                        LAG(predicted_state) OVER (PARTITION BY device_id ORDER BY time_stamp) as prev_state
                    FROM live_ml_predictions
                    WHERE device_id = ANY(%s)
                ),
                islands AS (
                    SELECT 
                        device_id,
                        time_stamp,
                        predicted_state,
                        SUM(CASE WHEN predicted_state = prev_state THEN 0 ELSE 1 END) OVER (PARTITION BY device_id ORDER BY time_stamp) as island_id
                    FROM status_changes
                ),
                island_bounds AS (
                    SELECT 
                        device_id,
                        island_id,
                        MIN(time_stamp) as start_ts,
                        MAX(time_stamp) as end_ts,
                        MAX(predicted_state) as state
                    FROM islands
                    GROUP BY device_id, island_id
                ),
                latest_islands AS (
                    SELECT DISTINCT ON (device_id) device_id, island_id, state 
                    FROM island_bounds 
                    ORDER BY device_id, island_id DESC
                ),
                durations AS (
                    SELECT 
                        ib.device_id,
                        ib.start_ts,
                        CASE 
                            WHEN ib.island_id = li.island_id AND li.state = 1 
                            THEN NOW() 
                            ELSE ib.end_ts 
                        END as adjusted_end_ts
                    FROM island_bounds ib
                    JOIN latest_islands li ON ib.device_id = li.device_id
                    WHERE ib.state = 1
                )
                SELECT 
                    device_id,
                    COALESCE(SUM(EXTRACT(EPOCH FROM (adjusted_end_ts - start_ts)) / 3600.0), 0) as total_runtime,
                    COALESCE(SUM(
                        CASE 
                            WHEN adjusted_end_ts < CURRENT_DATE THEN 0
                            ELSE EXTRACT(EPOCH FROM (adjusted_end_ts - GREATEST(start_ts, CURRENT_DATE))) / 3600.0
                        END
                    ), 0) as hours_today
                FROM durations
                GROUP BY device_id
            )
            SELECT 
                d.device_id,
                CASE WHEN p.predicted_state = 1 THEN 'on' ELSE 'off' END as status,
                COALESCE(t.room_temp, 0) as temperature,
                COALESCE(t.humidity, 0) as humidity,
                COALESCE(t.current, 0) as current,
                COALESCE(t.voltage, 0) as voltage,
                COALESCE(du.hours_today, 0) as hours_today,
                COALESCE(p.performance_score, 0) as performance,
                COALESCE(p.health_score, 0) as health,
                COALESCE(du.total_runtime, 0) as total_hours,
                CASE 
                    WHEN COALESCE(p.health_score, 0) > 70 THEN 'Good'
                    WHEN COALESCE(p.health_score, 0) > 40 THEN 'Fair'
                    ELSE 'Poor'
                END as condition,
                CASE 
                    WHEN COALESCE(p.health_score, 0) > 70 THEN 'text-green-600'
                    WHEN COALESCE(p.health_score, 0) > 40 THEN 'text-yellow-600'
                    ELSE 'text-red-600'
                END as condition_color
            FROM live_ac_device d
            INNER JOIN live_location l ON d.location_id = l.location_id
            LEFT JOIN latest_telemetry t ON d.device_id = t.device_id
            LEFT JOIN latest_predictions p ON d.device_id = p.device_id
            LEFT JOIN device_uptimes du ON d.device_id = du.device_id
            WHERE UPPER(l.location_name) = UPPER(%s);
            """,
            (devices, devices, devices, room_name)
        )
        
        columns = [desc[0] for desc in cur.description]
        units = [dict(zip(columns, row)) for row in cur.fetchall()]
        
        # Calculate room aggregates
        avg_temp = sum(u['temperature'] for u in units) / len(units) if units else 0
        avg_humidity = sum(u['humidity'] for u in units) / len(units) if units else 0
        avg_performance = sum(u['performance'] for u in units) / len(units) if units else 0
        max_uptime = max(u['hours_today'] for u in units) if units else 0
        
        return {
            "room_name": room_name,
            "avg_temp": round(avg_temp, 1),
            "avg_humidity": round(avg_humidity, 1),
            "avg_performance": round(avg_performance, 1),
            "max_uptime": round(max_uptime, 1),
            "units": units
        }

def get_continuous_uptime(cur, device_id: str):
    """Calculate the duration of the current continuous ON window in hours."""
    # Check if currently ON
    cur.execute(
        "SELECT predicted_state FROM live_ml_predictions WHERE UPPER(device_id) = UPPER(%s) ORDER BY time_stamp DESC LIMIT 1",
        (device_id,)
    )
    row = cur.fetchone()
    if not row or row[0] == 0:
        return None, 0.0

    # Find the latest OFF timestamp
    cur.execute(
        "SELECT MAX(time_stamp) FROM live_ml_predictions WHERE UPPER(device_id) = UPPER(%s) AND predicted_state = 0",
        (device_id,)
    )
    last_off = cur.fetchone()[0]

    # Find the earliest ON timestamp after the last OFF (or the very first ON if never OFF)
    if last_off:
        cur.execute(
            "SELECT MIN(time_stamp) FROM live_ml_predictions WHERE UPPER(device_id) = UPPER(%s) AND predicted_state = 1 AND time_stamp > %s",
            (device_id, last_off)
        )
    else:
        cur.execute(
            "SELECT MIN(time_stamp) FROM live_ml_predictions WHERE UPPER(device_id) = UPPER(%s) AND predicted_state = 1",
            (device_id,)
        )
    
    start_time = cur.fetchone()[0]
    if not start_time:
        return None, 0.0
        
    # Calculate duration until now
    cur.execute("SELECT EXTRACT(EPOCH FROM (NOW() - %s)) / 3600.0", (start_time,))
    uptime = cur.fetchone()[0]
    return start_time, float(uptime or 0)

def get_device_details(device_id: str):
    """Get comprehensive details for a specific AC device."""
    with get_db_cursor() as cur:
        # Check if device exists
        cur.execute(
            """
            SELECT d.device_id, l.location_name, d.last_service 
            FROM live_ac_device d 
            JOIN live_location l ON d.location_id = l.location_id 
            WHERE UPPER(d.device_id) = UPPER(%s)
            """, 
            (device_id,)
        )
        device = cur.fetchone()
        if not device:
            return None

        device_id, location, last_service = device

        # Get latest telemetry
        cur.execute(
            """
            SELECT room_temp, humidity, current, voltage, real_power
            FROM live_device_telemetry
            WHERE UPPER(device_id) = UPPER(%s)
            ORDER BY time_stamp DESC
            LIMIT 1;
            """,
            (device_id,)
        )
        telemetry = cur.fetchone()
        room_temp, humidity, current, voltage, real_power = telemetry if telemetry else (0, 0, 0, 0, 0)

        # Get latest prediction
        cur.execute(
            """
            SELECT predicted_state, performance_score, health_score
            FROM live_ml_predictions
            WHERE UPPER(device_id) = UPPER(%s)
            ORDER BY time_stamp DESC
            LIMIT 1;
            """,
            (device_id,)
        )
        prediction = cur.fetchone()
        predicted_state, performance, health = prediction if prediction else (0, 0, 0)

        # Window-based uptime calculation logic
        # 1. Identify all 'ON' islands
        # 2. For each island, duration = end_ts - start_ts
        # 3. For the current island (if active), end_ts = NOW()
        
        cur.execute(
            """
            WITH status_changes AS (
                SELECT 
                    time_stamp,
                    predicted_state,
                    LAG(predicted_state) OVER (ORDER BY time_stamp) as prev_state
                FROM live_ml_predictions
                WHERE UPPER(device_id) = UPPER(%s)
            ),
            islands AS (
                SELECT 
                    time_stamp,
                    predicted_state,
                    SUM(CASE WHEN predicted_state = prev_state THEN 0 ELSE 1 END) OVER (ORDER BY time_stamp) as island_id
                FROM status_changes
            ),
            island_bounds AS (
                SELECT 
                    island_id,
                    MIN(time_stamp) as start_ts,
                    MAX(time_stamp) as end_ts,
                    MAX(predicted_state) as state
                FROM islands
                GROUP BY island_id
            ),
            latest_island AS (
                SELECT island_id, state FROM island_bounds ORDER BY island_id DESC LIMIT 1
            ),
            durations AS (
                SELECT 
                    ib.start_ts,
                    CASE 
                        WHEN ib.island_id = (SELECT island_id FROM latest_island) AND (SELECT state FROM latest_island) = 1 
                        THEN NOW() 
                        ELSE ib.end_ts 
                    END as adjusted_end_ts
                FROM island_bounds ib
                WHERE ib.state = 1
            )
            SELECT 
                COALESCE(SUM(EXTRACT(EPOCH FROM (adjusted_end_ts - start_ts)) / 3600.0), 0) as total_runtime,
                COALESCE(SUM(
                    CASE 
                        WHEN adjusted_end_ts < CURRENT_DATE THEN 0
                        ELSE EXTRACT(EPOCH FROM (adjusted_end_ts - GREATEST(start_ts, CURRENT_DATE))) / 3600.0
                    END
                ), 0) as runtime_today
            FROM durations;
            """,
            (device_id,)
        )
        uptime_stats = cur.fetchone()
        total_hours, hours_today = uptime_stats if uptime_stats else (0, 0)

        # Map status
        status = 'on' if predicted_state == 1 else 'off'
        
        # Condition logic
        condition = 'Good' if health >= 70 else 'Fair' if health >= 40 else 'Poor'
        condition_color = 'text-green-600' if health >= 70 else 'text-yellow-600' if health >= 40 else 'text-red-600'

        # Maintenance info
        # next_service is 6 months after last_service
        next_service = None
        if last_service:
            next_service = last_service + timedelta(days=180)

        return {
            "deviceId": device_id,
            "location": location,
            "status": status,
            "temperature": round(float(room_temp), 1),
            "humidity": round(float(humidity), 1),
            "current": round(float(current), 2),
            "voltage": round(float(voltage), 1),
            "powerConsumption": round(float(real_power) / 1000, 2),
            "hoursToday": round(float(hours_today), 2),
            "totalHoursOperated": round(float(total_hours), 2),
            "performance": round(float(performance), 1),
            "health": round(float(health), 1),
            "condition": condition,
            "conditionColor": condition_color,
            "lastService": last_service.strftime("%Y-%m-%d") if last_service else "N/A",
            "nextServiceDue": next_service.strftime("%Y-%m-%d") if next_service else "N/A",
            "warrantyStatus": "Active" # Placeholder
        }
def get_device_history(device_id: str = None, time_range: str = "24h"):
    """Fetch historical telemetry for a device or entire system aggregated by time intervals."""
    interval = "1 hour"
    if time_range == "1h":
        interval = "5 minutes"
    elif time_range == "7d":
        interval = "6 hours"
    elif time_range == "30d":
        interval = "1 day"
    elif time_range == "1y":
        interval = "1 month"

    # Map time_range to postgres interval
    pg_range = "1 day"
    if time_range == "1h":
        pg_range = "1 hour"
    elif time_range == "7d":
        pg_range = "7 days"
    elif time_range == "30d":
        pg_range = "30 days"
    elif time_range == "1y":
        pg_range = "1 year"

    with get_db_cursor() as cur:
        where_clause = "WHERE time_stamp > NOW() - %s::interval"
        params = [interval, pg_range]
        
        if device_id:
            where_clause = "WHERE UPPER(device_id) = UPPER(%s) AND time_stamp > NOW() - %s::interval"
            params = [interval, device_id, pg_range]

        cur.execute(
            f"""
            SELECT 
                time_bucket(%s, time_stamp) AS bucket,
                AVG(voltage) as voltage,
                AVG(current) as current,
                AVG(real_power) / 1000 as power,
                AVG(room_temp) as temperature,
                AVG(humidity) as humidity
            FROM live_device_telemetry
            {where_clause}
            GROUP BY bucket
            ORDER BY bucket ASC;
            """,
            tuple(params)
        )
        columns = [desc[0] for desc in cur.description]
        results = []
        for row in cur.fetchall():
            d = dict(zip(columns, row))
            # Format bucket as ISO string for frontend
            if d['bucket']:
                d['date'] = d['bucket'].isoformat()
                del d['bucket']
            results.append(d)
        return results


def get_user_by_email(email: str):
    """Fetch a single user by email."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT id, email, password, name, role, campus_id, created_at
            FROM users
            WHERE email = %s
            """,
            (email,),
        )
        row = cur.fetchone()
        if not row:
            return None

        columns = [desc[0] for desc in cur.description]
        return dict(zip(columns, row))


def insert_user(user: dict):
    """
    Insert a user record.
    Expects keys: id, email, password, name, role, campus_id, created_at.
    If role is 'technician', also creates a record in technicians table.
    Password should already be hashed by the caller.
    """
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (id, email, password, name, role, campus_id, created_at)
            VALUES (%(id)s, %(email)s, %(password)s, %(name)s, %(role)s, %(campus_id)s, %(created_at)s)
            RETURNING id, email;
            """,
            user,
        )
        row = cur.fetchone()
        columns = [desc[0] for desc in cur.description]
        
        # If user is a technician, create a record in the technicians table
        if user.get('role') == 'technician':
            cur.execute(
                """
                INSERT INTO technicians (user_id, specialization, phone, is_available)
                VALUES (%s, %s, %s, TRUE)
                ON CONFLICT DO NOTHING;
                """,
                (user['id'], user.get('specialization'), user.get('phone'))
            )
            
        return dict(zip(columns, row))

def get_technician_by_user_id(user_id: str):
    """Fetch technician details by user ID, including user info."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT t.technician_id, t.user_id, t.specialization, t.phone, t.is_available, u.name, u.email
            FROM technicians t
            JOIN users u ON t.user_id = u.id
            WHERE t.user_id = %s
            """,
            (user_id,),
        )
        row = cur.fetchone()
        if not row:
            return None
        columns = [desc[0] for desc in cur.description]
        return dict(zip(columns, row))

def update_technician_profile(user_id: str, name: str, specialization: str, phone: str):
    """Update technician profile in both users and technicians tables."""
    with get_db_cursor() as cur:
        # Update users table
        cur.execute(
            "UPDATE users SET name = %s WHERE id = %s",
            (name, user_id)
        )
        # Update technicians table
        cur.execute(
            "UPDATE technicians SET specialization = %s, phone = %s WHERE user_id = %s",
            (specialization, phone, user_id)
        )

def get_technician_stats(technician_id: int):
    """Fetch stats for a specific technician."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT 
                (SELECT COUNT(*) FROM maintenance_assignments WHERE technician_id = %s) as assigned_acs,
                (SELECT COUNT(*) FROM maintenance_assignments WHERE technician_id = %s AND status = 'Pending') as pending,
                (SELECT COUNT(*) FROM maintenance_assignments WHERE technician_id = %s AND status = 'Accepted') as accepted,
                (SELECT COUNT(*) FROM maintenance_assignments WHERE technician_id = %s AND status = 'Rejected') as rejected
            """,
            (technician_id, technician_id, technician_id, technician_id),
        )
        row = cur.fetchone()
        columns = [desc[0] for desc in cur.description]
        return dict(zip(columns, row))

def get_technician_tasks(technician_id: int):
    """Fetch assigned tasks for a specific technician."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT 
                ma.assignment_id,
                a.device_id as "acName",
                (SELECT location_name FROM live_location l JOIN live_ac_device d ON l.location_id = d.location_id WHERE d.device_id = a.device_id) as location,
                a.alert_text as condition,
                a.alert_criticality as severity,
                ma.status
            FROM maintenance_assignments ma
            JOIN alerts a ON ma.alert_id = a.alert_id
            WHERE ma.technician_id = %s
            ORDER BY ma.assigned_at DESC
            """,
            (technician_id,),
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]

def update_assignment_status(assignment_id: int, status: str):
    """Update the status of a maintenance assignment."""
    with get_db_cursor() as cur:
        if status == 'Accepted':
            cur.execute(
                """
                UPDATE maintenance_assignments
                SET status = %s, updated_at = now(), accepted_at = now()
                WHERE assignment_id = %s
                """,
                (status, assignment_id),
            )
        else:
            cur.execute(
                """
                UPDATE maintenance_assignments
                SET status = %s, updated_at = now()
                WHERE assignment_id = %s
                """,
                (status, assignment_id),
            )

def assign_task(alert_id: int, technician_id: int):
    """Assign an alert to a technician."""
    with get_db_cursor() as cur:
        # Fetch technician details to store in assignment
        cur.execute(
            """
            SELECT u.name, t.specialization
            FROM technicians t
            JOIN users u ON t.user_id = u.id
            WHERE t.technician_id = %s
            """,
            (technician_id,)
        )
        tech_row = cur.fetchone()
        tech_name = tech_row[0] if tech_row else None
        specialization = tech_row[1] if tech_row else None

        cur.execute(
            """
            INSERT INTO maintenance_assignments (alert_id, technician_id, technician_name, specialization, status)
            VALUES (%s, %s, %s, %s, 'Pending')
            RETURNING assignment_id;
            """,
            (alert_id, technician_id, tech_name, specialization),
        )
        return cur.fetchone()[0]

def create_technician(user_id: str, specialization: str, phone: str):
    """Create a new technician record."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO technicians (user_id, specialization, phone)
            VALUES (%s, %s, %s)
            RETURNING technician_id;
            """,
            (user_id, specialization, phone),
        )
        return cur.fetchone()[0]

def get_all_technicians():
    """Fetch all technicians with their user details."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT t.technician_id, t.user_id, t.specialization, t.phone, t.is_available, u.name
            FROM technicians t
            JOIN users u ON t.user_id = u.id
            ORDER BY u.name ASC
            """
        )
        columns = [desc[0] for desc in cur.description]
        return [dict(zip(columns, row)) for row in cur.fetchall()]

def get_technician_performance_metrics(technician_id: int):
    """Fetch performance metrics for a specific technician."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT 
                COUNT(*) as total_completed,
                COALESCE(SUM(
                    CASE WHEN accepted_at IS NOT NULL
                    THEN EXTRACT(EPOCH FROM (updated_at - accepted_at))/3600
                    ELSE EXTRACT(EPOCH FROM (updated_at - assigned_at))/3600
                    END
                ), 0) as total_hours,
                COALESCE(AVG(
                    CASE WHEN accepted_at IS NOT NULL
                    THEN EXTRACT(EPOCH FROM (updated_at - accepted_at))/3600
                    ELSE EXTRACT(EPOCH FROM (updated_at - assigned_at))/3600
                    END
                ), 0) as avg_hours_per_task
            FROM maintenance_assignments
            WHERE technician_id = %s AND status = 'Completed'
            """,
            (technician_id,),
        )
        row = cur.fetchone()
        columns = [desc[0] for desc in cur.description]
        return dict(zip(columns, row))


def get_maintenance_stats():
    """
    Return pending (unassigned alerts) + assigned (Pending) + ongoing (Accepted) = total.
    Everything comes from the DB — no frontend computation.
    """
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT
                (
                    SELECT COUNT(*) FROM alerts
                    WHERE resolved_at IS NULL
                      AND alert_text LIKE 'Telemetry anomaly%%'
                      AND NOT EXISTS (
                          SELECT 1 FROM maintenance_assignments ma
                          WHERE ma.alert_id = alerts.alert_id
                      )
                ) AS pending,
                (
                    SELECT COUNT(*) FROM maintenance_assignments
                    WHERE status = 'Pending'
                ) AS assigned,
                (
                    SELECT COUNT(*) FROM maintenance_assignments
                    WHERE status = 'Accepted'
                ) AS ongoing,
                (
                    SELECT COUNT(*) FROM maintenance_assignments
                    WHERE status = 'Rejected'
                ) AS rejected
            """
        )
        row = cur.fetchone()
        pending, assigned, ongoing, rejected = row if row else (0, 0, 0, 0)
        pending = int(pending or 0)
        assigned = int(assigned or 0)
        ongoing = int(ongoing or 0)
        rejected = int(rejected or 0)
        return {
            "pending": pending,
            "assigned": assigned,
            "ongoing": ongoing,
            "rejected": rejected,
            "total": pending + assigned + ongoing,
        }


def reassign_task(assignment_id: int, technician_id: int):
    """
    Reassign a rejected task to a (potentially different) technician.
    Marks the existing assignment as Rejected (if not already) and creates a
    fresh Pending assignment for the same alert.
    """
    with get_db_cursor() as cur:
        # Get the alert_id from the existing assignment
        cur.execute(
            "SELECT alert_id FROM maintenance_assignments WHERE assignment_id = %s",
            (assignment_id,),
        )
        row = cur.fetchone()
        if not row:
            raise ValueError(f"Assignment {assignment_id} not found")
        alert_id = row[0]

        # Mark the old assignment as Rejected
        cur.execute(
            "UPDATE maintenance_assignments SET status = 'Rejected', updated_at = now() WHERE assignment_id = %s",
            (assignment_id,),
        )

        # Fetch the technician details
        cur.execute(
            """
            SELECT u.name, t.specialization
            FROM technicians t
            JOIN users u ON t.user_id = u.id
            WHERE t.technician_id = %s
            """,
            (technician_id,),
        )
        tech_row = cur.fetchone()
        tech_name = tech_row[0] if tech_row else None
        specialization = tech_row[1] if tech_row else None

        # Create a new Pending assignment
        cur.execute(
            """
            INSERT INTO maintenance_assignments (alert_id, technician_id, technician_name, specialization, status)
            VALUES (%s, %s, %s, %s, 'Pending')
            RETURNING assignment_id;
            """,
            (alert_id, technician_id, tech_name, specialization),
        )
        return cur.fetchone()[0]
