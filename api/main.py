import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

import psycopg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from db import insert_device_telemetry


# Db migrations

def run_migrations():
    db_host = os.getenv("DB_HOST", "db")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "")
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
            await websocket.send_json({"status": "success"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"status": "error", "message": str(e)})
