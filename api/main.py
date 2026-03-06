import os
import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

import psycopg
import pandas as pd
import numpy as np

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder

from db import insert_device_telemetry, insert_ac_prediction
from ml_utils import run_inference

# NEW: Scheduler for automatic monitoring
from apscheduler.schedulers.background import BackgroundScheduler
from ml.monitoring.monitor import main as monitor_models


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================
# JSON SERIALIZATION HELPER
# ============================================================

def _json_default(value):
    if isinstance(value, (datetime, pd.Timestamp)):
        return value.isoformat()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


# ============================================================
# DATABASE MIGRATIONS
# ============================================================

def run_migrations():

    db_host = os.getenv("DB_HOST", "db")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "postgres")

    migrations_path = Path(__file__).parent / "migrations.sql"

    sql = migrations_path.read_text()

    last_error = None

    for attempt in range(5):
        try:
            with psycopg.connect(
                host=db_host,
                user=db_user,
                password=db_password,
                dbname=db_name,
            ) as conn:

                with conn.cursor() as cur:
                    cur.execute(sql)

                conn.commit()

            logger.info("Database migrations completed")
            return

        except Exception as exc:
            last_error = exc
            logger.warning(
                "Migration attempt %s/5 failed: %s",
                attempt + 1,
                exc,
            )
            if attempt < 4:
                import time
                time.sleep(2)

    raise RuntimeError(f"Database migrations failed after retries: {last_error}")


# ============================================================
# SCHEDULER (NEW)
# ============================================================

scheduler = BackgroundScheduler()


# ============================================================
# FASTAPI LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    loop = asyncio.get_event_loop()

    # Run DB migrations
    await loop.run_in_executor(None, run_migrations)

    # Start monitoring scheduler
    logger.info("Starting ML monitoring scheduler")

    scheduler.add_job(
        monitor_models,
        "interval",
        hours=1,
        id="ml_monitor_job",
        replace_existing=True
    )

    scheduler.start()

    yield

    # Shutdown scheduler gracefully
    logger.info("Stopping scheduler")
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
async def root():
    return {"status": "ok"}


# ============================================================
# WEBSOCKET STREAM
# ============================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    try:
        while True:

            raw = await websocket.receive_text()
            data = json.loads(raw)

            # Convert timestamp to datetime for database
            if isinstance(data.get("time_stamp"), str):
                data["time_stamp"] = datetime.fromisoformat(
                    data["time_stamp"].replace("Z", "+00:00")
                )

            # Store telemetry
            insert_device_telemetry(data)

            # Run ML inference
            df = pd.DataFrame([data])
            pred_df = run_inference(df)

            prediction = pred_df.iloc[0].to_dict()

            prediction["device_id"] = data["device_id"]
            prediction["time_stamp"] = data["time_stamp"]

            # Store prediction
            insert_ac_prediction(prediction)

            response_data = {
                "status": "success",
                "prediction": prediction.copy()
            }

            await websocket.send_text(
                json.dumps(response_data, default=_json_default)
            )

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")

    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)

        error_response = jsonable_encoder({
            "status": "error",
            "message": str(e)
        })

        await websocket.send_text(json.dumps(error_response))