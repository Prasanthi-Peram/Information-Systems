import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

import psycopg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from db import insert_device_telemetry
from db import insert_device_telemetry, get_db_cursor
from ml_utils import run_prediction


# Db migrations

def run_migrations():
    db_host = os.getenv("DB_HOST", "db")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASS", "")
    db_name = os.getenv("DB_NAME", "postgres")

    migrations_path = Path(__file__).parent / "migrations.sql"

    with psycopg.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        dbname=db_name,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute(migrations_path.read_text())
        conn.commit()


# Fastapi

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, run_migrations)
    except Exception:
        raise

    yield


app = FastAPI(lifespan=lifespan)


# Endpoints 

@app.get("/")
async def root():
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = json.loads(await websocket.receive_text())

            if "time_stamp" not in data or "device_id" not in data:
                await websocket.send_json(
                    {"status": "error", "message": "Missing required fields"}
                )
                continue

            if isinstance(data["time_stamp"], str):
                data["time_stamp"] = datetime.fromisoformat(
                    data["time_stamp"].replace("Z", "+00:00")
                )

            insert_device_telemetry(data)
            prediction=run_prediction(data)
            await websocket.send_json({"status": "success","prediction":prediction})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"status": "error", "message": str(e)})

@app.get("/maintenance")
def get_maintenance():

    with get_db_cursor() as cur:

        cur.execute(
            """
            SELECT
                d.device_id,
                d.location,
                d.last_service,
                COALESCE(a.predicted_service_date,
                        d.last_service + interval '180 days'
                        )  AS next_service,
                a.alert_text,
                a.alert_criticality
            FROM ac_device d
            LEFT JOIN LATERAL (
                SELECT alert_text, alert_criticality
                FROM alerts 
                WHERE device_id = d.device_id
                ORDER BY created_at DESC
                LIMIT 1
            ) a ON TRUE
            ON d.device_id = a.device_id
            """
        )

        rows = cur.fetchall()

    result = []

    for r in rows:

        result.append({
            "device_id": f"AC-{r[0]:03d}",
            "room": r[1],
            "last_service": r[2],
            "next_service": r[3],
            "issue": r[4] or "None",
            "criticality": r[5] or "Low"
        })

    return result

@app.get("/alerts")
def get_alerts():

    with get_db_cursor() as cur:

        cur.execute(
            """
            SELECT
                device_id,
                alert_text,
                alert_criticality,
                created_at
            FROM alerts
            ORDER BY created_at DESC
            LIMIT 10
            """
        )

        rows = cur.fetchall()

    return [
        {
            "device": f"AC-{r[0]:03d}",
            "alert": r[1],
            "criticality": r[2],
            "time": r[3]
        }
        for r in rows
    ]
