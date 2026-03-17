import json
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import (
    insert_device_telemetry, get_dashboard_stats, get_rooms_status,
    get_room_details, get_alerts, get_maintenance_tasks, get_device_details,
    resolve_alert_by_device, resolve_alert, create_room, create_ac_device, get_device_history
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