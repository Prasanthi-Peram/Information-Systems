import json
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from db import insert_device_telemetry
from ml_utils import load_all_models, run_prediction


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("API Start: Loading models from S3...", flush=True)
    try:
        app.state.models = load_all_models()
        print(f"Models loaded: {app.state.models['version']}", flush=True)
    except Exception as e:
        print(f"ML LOAD ERROR: {e}", flush=True)
        import traceback
        traceback.print_exc() 
        app.state.models = None
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    return {"status": "online"}


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