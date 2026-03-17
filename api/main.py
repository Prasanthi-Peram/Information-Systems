import json
from datetime import datetime
from contextlib import asynccontextmanager
import asyncio
import subprocess

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import (
    insert_device_telemetry, get_dashboard_stats, get_rooms_status,
    get_room_details, get_alerts, get_maintenance_tasks, get_device_details,
    resolve_alert_by_device, resolve_alert, create_room, create_ac_device,
    get_device_history, get_user_by_email, insert_user
)
from ml_utils import load_all_models, run_prediction


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("API Start: Initializing...", flush=True)
    app.state.models = None
    
    async def load_models_task():
        print("Background Task: Loading models from S3...", flush=True)
        try:
            # We use a separate thread for blocking IO
            import asyncio
            loop = asyncio.get_event_loop()
            app.state.models = await loop.run_in_executor(None, load_all_models)
            print(f"Models loaded: {app.state.models['version']}", flush=True)
        except Exception as e:
            print(f"ML LOAD ERROR: {e}", flush=True)
            import traceback
            traceback.print_exc()
            app.state.models = None

    import asyncio
    asyncio.create_task(load_models_task())
    yield


class RoomCreate(BaseModel):
    name: str

class DeviceCreate(BaseModel):
    device_id: str
    room_name: str


class UserCreate(BaseModel):
    id: str
    email: str
    password: str  # already hashed by frontend
    name: str
    role: str
    campus_id: str | None = None
    created_at: str

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "online"}


@app.get("/dashboard/stats")
async def dashboard_stats():
    return get_dashboard_stats()


@app.get("/rooms/status")
async def rooms_status():
    return get_rooms_status()


@app.get("/devices/{device_id}/history")
async def device_history(device_id: str, range: str = "24h"):
    history = get_device_history(device_id, range)
    return history

@app.get("/dashboard/history")
async def dashboard_history(range: str = "24h"):
    history = get_device_history(None, range)
    return history

@app.get("/rooms/{room_name}")
async def room_details(room_name: str):
    details = get_room_details(room_name)
    if not details:
        return {"error": "Room not found"}
    return details


@app.get("/alerts")
async def alerts(limit: int = 20):
    return get_alerts(limit)


@app.get("/maintenance/tasks")
async def maintenance_tasks():
    return get_maintenance_tasks()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = json.loads(await websocket.receive_text())

            if "time_stamp" not in data:
                data["time_stamp"] = datetime.now()

            if app.state.models:
                pred = run_prediction(data, models=app.state.models)
                await websocket.send_json({"prediction": pred})
            else:
                await websocket.send_json({"status": "models_not_loaded"})

    except WebSocketDisconnect:
        pass


@app.get("/devices/{device_id}")
async def device_details(device_id: str):
    details = get_device_details(device_id)
    if not details:
        return {"error": "Device not found"}
    return details


@app.post("/rooms")
async def add_room(room: RoomCreate):
    try:
        create_room(room.name)
        return {"status": "success", "message": f"Room {room.name} created"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/devices")
async def add_device(device: DeviceCreate):
    try:
        create_ac_device(device.device_id, device.room_name)
        return {"status": "success", "message": f"Device {device.device_id} added to {device.room_name}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/maintenance/resolve/{device_id}")
async def resolve_maintenance(device_id: str):
    try:
        resolve_alert_by_device(device_id)
        return {"status": "success", "message": f"Alerts for {device_id} resolved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/alerts/resolve/{alert_id}")
async def resolve_alert_endpoint(alert_id: int):
    try:
        resolve_alert(alert_id)
        return {"status": "success", "message": f"Alert {alert_id} resolved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/auth/users")
async def api_get_user_by_email(email: str):
    """
    Public API for frontend auth:
    Returns user by email or 404 if not found.
    """
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/auth/users")
async def api_create_user(payload: UserCreate):
    """
    Public API for frontend auth:
    Inserts a new user record. Expects password already hashed.
    """
    try:
        user_dict = insert_user(payload.dict())
        return user_dict
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/maintenance/retrain")
async def trigger_retrain():
    """
    Trigger model retraining asynchronously from the API.
    Intended to be called when the user confirms deleting a maintenance task.
    """

    async def run_training():
        loop = asyncio.get_event_loop()
        # Run the training script in a background thread so we don't block the API
        def _run():
            try:
                subprocess.run(["python", "/app/training/train.py"], check=True)
            except Exception as e:
                print(f"Retrain failed: {e}", flush=True)

        await loop.run_in_executor(None, _run)

    asyncio.create_task(run_training())
    return {"status": "started", "message": "Retraining triggered"}