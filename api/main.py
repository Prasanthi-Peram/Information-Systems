import json
from datetime import datetime
from contextlib import asynccontextmanager
import asyncio
import subprocess

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import (
    insert_device_telemetry,
    get_dashboard_stats,
    get_rooms_status,
    get_room_details,
    get_alerts,
    get_maintenance_tasks,
    get_device_details,
    resolve_alert_by_device,
    resolve_alert,
    create_room,
    create_ac_device,
    get_device_history,
    get_user_by_email,
    insert_user,
    get_false_alert_count,
    get_total_false_alert_count
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


class FalseAlertFeedback(BaseModel):
    # For now we don't need device_id to count; reserved for future
    device_id: str | None = None

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
        
        # Check for retraining after resolving an alert (which marks it as false)
        total_false_count = get_total_false_alert_count()
        should_retrain = total_false_count > 0 and (total_false_count % 10 == 0)
        
        if should_retrain:
            print(f"Total false alerts reached {total_false_count}. Triggering retraining...", flush=True)
            asyncio.create_task(_run_training_background(app))

        return {
            "status": "success", 
            "message": f"Alert {alert_id} resolved",
            "retrain_triggered": should_retrain,
            "total_false_alerts": total_false_count
        }
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


async def _run_training_background(app: FastAPI):
    """
    Helper to start the training script in the background (non-blocking).
    After training, it reloads the models into app.state.models.
    """
    loop = asyncio.get_event_loop()

    def _run():
        try:
            print("Retrain: starting training script...", flush=True)
            subprocess.run(
                ["python", "/app/retrain_model.py"],
                check=True,
            )
            print("Retrain: training script completed.", flush=True)
            return True
        except Exception as e:
            print(f"Retrain failed: {e}", flush=True)
            return False

    success = await loop.run_in_executor(None, _run)
    
    if success:
        print("Retrain: Reloading models...", flush=True)
        try:
            new_models = await loop.run_in_executor(None, load_all_models)
            app.state.models = new_models
            print(f"Retrain: Models reloaded. New version: {app.state.models['version']}", flush=True)
        except Exception as e:
            print(f"Retrain: Failed to reload models: {e}", flush=True)


@app.post("/maintenance/retrain")
async def trigger_retrain():
    """
    Trigger model retraining asynchronously from the API.
    Can be called directly if you want to force retraining.
    """
    asyncio.create_task(_run_training_background(app))
    return {"status": "started", "message": "Retraining triggered"}


@app.post("/maintenance/false-feedback")
async def false_alert_feedback(payload: FalseAlertFeedback):
    """
    Called when the user marks a maintenance task as unnecessary (false alert).
    We count total false alerts, and if that count
    reaches a new multiple of 10, we kick off retraining (non-blocking).
    """
    # Count how many alerts have been marked as false in total
    total_false_count = get_total_false_alert_count()

    # We only retrain when false alerts reach a multiple of 10
    should_retrain = total_false_count > 0 and (total_false_count % 10 == 0)

    if should_retrain:
        print(f"Total false alerts reached {total_false_count}. Triggering retraining...", flush=True)
        asyncio.create_task(_run_training_background(app))

    return {
        "total_false_alerts": total_false_count,
        "retrain_started": should_retrain,
    }