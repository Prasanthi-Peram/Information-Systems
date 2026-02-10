import json
import asyncio
import random
from datetime import datetime
from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware

from db import (
    insert_device_telemetry,
    fetch_service_dates,
    save_ml_feedback,
)
from model_pipeline import smartcool_predict
from retrain_models import retrain

# =============================
# APP
# =============================
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

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
    return {"status": "ok"}

# =============================
# ML STREAMING WEBSOCKET
# =============================
AC_REGISTRY = [
    {"id": "A200AC01", "tonnage": 2.5},
    {"id": "C108AC01", "tonnage": 1.5},
    {"id": "NR312AC01", "tonnage": 2.0},
    {"id": "NC324AC01", "tonnage": 1.8},
    {"id": "NR422AC01", "tonnage": 3.0},
]


def _make_rows(now_iso: str):
    """Create simulated telemetry rows for all registered ACs."""
    rows = []
    for ac in AC_REGISTRY:
        rows.append({
            "Device_ID": ac["id"],
            "Time_Stamp": now_iso,
            "Current": random.uniform(3, 12),
            "voltage": random.uniform(215, 245),
            "Power_Factor": random.uniform(0.80, 0.98),
            "Real_Power_calc": random.uniform(800, 2500),
            "room_temp": random.uniform(20, 32),
            "External_temp": random.uniform(25, 40),
            "Humidity": random.uniform(40, 80),
            "temp_drop": random.uniform(-8, -2),
            "Tonnage": ac.get("tonnage", 2.0),
            "People": random.randint(1, 12),
            "Static_heat_load": random.uniform(20000, 80000),
        })
    return rows


def _generate_ml_records(rows):
    """Run the ML pipeline on rows and return JSON-serializable records list."""
    try:
        df = pd.DataFrame(rows)
        result = smartcool_predict(df)

        service = fetch_service_dates()
        if service.empty:
            # fallback service data if DB not available
            service = pd.DataFrame([
                {"device_id": "A200AC01", "last_service_date": "2025-12-01", "next_service_date": "2026-03-01"},
                {"device_id": "C108AC01", "last_service_date": "2025-11-15", "next_service_date": "2026-02-15"},
                {"device_id": "NR312AC01", "last_service_date": "2025-10-10", "next_service_date": "2026-01-10"},
                {"device_id": "NC324AC01", "last_service_date": "2025-12-20", "next_service_date": "2026-03-20"},
                {"device_id": "NR422AC01", "last_service_date": "2025-12-05", "next_service_date": "2026-03-05"},
            ])

        merged = result.merge(
            service,
            left_on="Device_ID",
            right_on="device_id",
            how="left"
        )

        payload = merged[[
            "Device_ID",
            "Time_Stamp",
            "Real_Power_calc",
            "voltage",
            "Current",
            "pred_perf",
            "Health_Score",
            "pred_condition",
            "Maintenance_Advice",
            "critical_alert",
            "last_service_date",
            "next_service_date",
        ]].copy()

        # Ensure JSON serializable types
        for col in payload.columns:
            if pd.api.types.is_datetime64_any_dtype(payload[col]):
                payload.loc[:, col] = payload[col].astype(str)
            elif str(payload[col].dtype) == "object":
                payload.loc[:, col] = payload[col].astype(str)

        # Numeric formatting
        if "pred_perf" in payload.columns:
            payload.loc[:, "pred_perf"] = payload["pred_perf"].round(1)
        if "Health_Score" in payload.columns:
            payload.loc[:, "Health_Score"] = payload["Health_Score"].round(1)
        if "Real_Power_calc" in payload.columns:
            payload.loc[:, "Real_Power_calc"] = payload["Real_Power_calc"].round(0).astype(int)
        if "Current" in payload.columns:
            payload.loc[:, "Current"] = payload["Current"].round(2)
        if "voltage" in payload.columns:
            payload.loc[:, "voltage"] = payload["voltage"].round(0).astype(int)

        records = payload.fillna("").to_dict(orient="records")

        # Final cleanup
        for record in records:
            for k, v in record.items():
                if hasattr(v, "isoformat"):
                    record[k] = str(v)
                elif v == "NaT" or v == "nan" or str(v) == "nan":
                    record[k] = ""

        return records

    except Exception:
        raise

@app.websocket("/ws/ml")
async def ws_ml_dashboard(websocket: WebSocket):
    await websocket.accept()
    print("🟢 /ws/ml connected")

    try:
        while True:
            now = datetime.utcnow().isoformat()
            rows = []

            for ac in AC_REGISTRY:
                rows.append({
                    "Device_ID": ac["id"],
                    "Time_Stamp": now,
                    "Current": random.uniform(3, 12),  # Wider variation: 3-12A
                    "voltage": random.uniform(215, 245),  # Wider: 215-245V
                    "Power_Factor": random.uniform(0.80, 0.98),  # Wider: 0.80-0.98
                    "Real_Power_calc": random.uniform(800, 2500),  # Wider: 800-2500W
                    "room_temp": random.uniform(20, 32),  # Wider: 20-32°C
                    "External_temp": random.uniform(25, 40),  # Wider: 25-40°C
                    "Humidity": random.uniform(40, 80),  # Wider: 40-80%
                    "temp_drop": random.uniform(-8, -2),  # Wider: -8 to -2°C
                    "Tonnage": ac["tonnage"],
                    "People": random.randint(1, 12),  # More variation: 1-12 people
                    "Static_heat_load": random.uniform(20000, 80000),  # Wider
                })

            df = pd.DataFrame(rows)

            # ✅ FIXED: now returns DataFrame
            try:
                result = smartcool_predict(df)

                service = fetch_service_dates()
                
                # If service dates are empty, use fallback data
                if service.empty:
                    service = pd.DataFrame([
                        {"device_id": "A200AC01", "last_service_date": "2025-12-01", "next_service_date": "2026-03-01"},
                        {"device_id": "C108AC01", "last_service_date": "2025-11-15", "next_service_date": "2026-02-15"},
                        {"device_id": "NR312AC01", "last_service_date": "2025-10-10", "next_service_date": "2026-01-10"},
                        {"device_id": "NC324AC01", "last_service_date": "2025-12-20", "next_service_date": "2026-03-20"},
                        {"device_id": "NR422AC01", "last_service_date": "2025-12-05", "next_service_date": "2026-03-05"},
                    ])
                
                result = result.merge(
                    service,
                    left_on="Device_ID",
                    right_on="device_id",
                    how="left"
                )

                payload = result[[
                "Device_ID",
                "Time_Stamp",
                "Real_Power_calc",
                "voltage",
                "Current",
                "pred_perf",
                "Health_Score",
                "pred_condition",
                "Maintenance_Advice",
                "critical_alert",
                "last_service_date",
                "next_service_date",
            ]].copy()

                # Convert all columns to JSON-serializable types
                for col in payload.columns:
                    # Check if column contains datetime/Timestamp objects
                    if str(payload[col].dtype) == "object":
                        # Convert objects to string (handles Timestamp and other objects)
                        payload.loc[:, col] = payload[col].astype(str)
                    elif pd.api.types.is_datetime64_any_dtype(payload[col]):
                        # Explicitly handle datetime columns
                        payload.loc[:, col] = payload[col].astype(str)
                
                # Numeric conversions
                payload.loc[:, "pred_perf"] = payload["pred_perf"].round(1)
                payload.loc[:, "Health_Score"] = payload["Health_Score"].round(1)
                payload.loc[:, "Real_Power_calc"] = payload["Real_Power_calc"].round(0).astype(int)
                payload.loc[:, "Current"] = payload["Current"].round(2)
                payload.loc[:, "voltage"] = payload["voltage"].round(0).astype(int)

                # Remove NaT strings and replace with empty string
                records = payload.fillna("").to_dict(orient="records")
                
                # Final cleanup: convert any remaining Timestamp objects in the records
                for record in records:
                    for key, value in record.items():
                        if hasattr(value, 'isoformat'):  # Handles Timestamp, datetime
                            record[key] = str(value)
                        elif value == "NaT" or value == "nan" or str(value) == "nan":
                            record[key] = ""
                
                await websocket.send_json(records)
            except Exception as e:
                print(f"❌ ML Pipeline Error: {e}")
                # Send fallback data with error indicator
                fallback = []
                for ac in AC_REGISTRY:
                    fallback.append({
                        "Device_ID": ac["id"],
                        "Time_Stamp": now,
                        "Real_Power_calc": 1500,
                        "voltage": 230,
                        "Current": 7,
                        "pred_perf": 75,
                        "Health_Score": 75,
                        "pred_condition": "Unknown",
                        "Maintenance_Advice": "Pipeline Error - Check Logs",
                        "critical_alert": 0,
                        "last_service_date": "",
                        "next_service_date": "",
                    })
                await websocket.send_json(fallback)

            await asyncio.sleep(3)

    except WebSocketDisconnect:
        print("🔴 WS disconnected")


@app.websocket("/ws/room/{room}")
async def ws_room_dashboard(websocket: WebSocket, room: str):
    """WebSocket streaming ML records filtered to a room identifier.

    The room filter is matched against the `Device_ID` string (case-insensitive substring).
    """
    await websocket.accept()
    print(f"🟢 /ws/room/{room} connected")

    try:
        while True:
            now = datetime.utcnow().isoformat()
            rows = _make_rows(now)
            try:
                records = _generate_ml_records(rows)
                room_up = room.upper()
                filtered = [r for r in records if room_up in (r.get("Device_ID") or "").upper()]
                await websocket.send_json(filtered)
            except Exception as e:
                print(f"❌ ML Pipeline Error (room): {e}")
                await websocket.send_json([])

            await asyncio.sleep(3)
    except WebSocketDisconnect:
        print(f"🔴 /ws/room/{room} disconnected")


@app.websocket("/ws/device/{device_id}")
async def ws_device_dashboard(websocket: WebSocket, device_id: str):
    """WebSocket streaming ML records for a single device id (exact match).
    """
    await websocket.accept()
    print(f"🟢 /ws/device/{device_id} connected")

    try:
        while True:
            now = datetime.utcnow().isoformat()
            rows = _make_rows(now)
            try:
                records = _generate_ml_records(rows)
                target = device_id.upper()
                filtered = [r for r in records if (r.get("Device_ID") or "").upper() == target]
                await websocket.send_json(filtered)
            except Exception as e:
                print(f"❌ ML Pipeline Error (device): {e}")
                await websocket.send_json([])

            await asyncio.sleep(3)
    except WebSocketDisconnect:
        print(f"🔴 /ws/device/{device_id} disconnected")
# =============================
# SERVICE DATES API
# =============================
@app.get("/maintenance/dates")
async def maintenance_dates():
    df = fetch_service_dates()
    return df.to_dict(orient="records")

# =============================
# ML FEEDBACK API
# =============================
@app.post("/ml/feedback")
async def ml_feedback(payload: dict = Body(...)):
    """Store ML feedback and trigger retraining if needed"""
    try:
        feedback_type = payload["feedback"]
        device_id = payload["device_id"]
        
        save_ml_feedback(device_id, payload["time_stamp"], feedback_type)
        print(f"🎯 Feedback recorded: {feedback_type} for {device_id}")
        
        # If false alarm, log it prominently
        if feedback_type == "false_alarm":
            print(f"🚨 FALSE ALARM detected: {device_id} - Model will learn from this")
        
        return {"status": "ok", "message": f"Feedback recorded: {feedback_type}"}
    except Exception as e:
        print(f"❌ Feedback error: {e}")
        return {"status": "error", "message": str(e)}

# =============================
# MODEL RETRAINING API
# =============================
@app.post("/ml/retrain")
async def retrain_trigger():
    """Trigger model retraining based on false alarm feedback"""
    try:
        print("🔄 Starting model retraining...")
        retrain()
        return {"status": "ok", "message": "Model retraining completed"}
    except Exception as e:
        print(f"❌ Retrain error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/ml/feedback-stats")
async def feedback_stats():
    """Get feedback statistics"""
    try:
        from db import get_db_connection
        with get_db_connection() as conn:
            stats = pd.read_sql(
                """
                SELECT 
                    feedback,
                    COUNT(*) as count,
                    COUNT(DISTINCT device_id) as devices
                FROM ml_feedback
                GROUP BY feedback
                """,
                conn
            )
        return stats.to_dict(orient="records")
    except Exception as e:
        print(f"❌ Stats error: {e}")
        return {"status": "error", "message": str(e)}