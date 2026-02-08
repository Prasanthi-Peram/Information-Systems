from datetime import datetime
import asyncio
from sockets.server import sio
from sockets.manager import sio_manager
from db.telemetry import insert_device_telemetry

@sio.event(namespace="/devices")
async def connect(sid, environ, auth):
    device_id = environ.get("QUERY_STRING", "").split("device_id=")[-1].split("&")[0]

    print("DEVICE CONNECT:", device_id)

    if not device_id:
        raise ConnectionRefusedError("device_id required")
    
    qs = environ.get("QUERY_STRING", "")
    device_id = qs.split("device_id=")[-1].split("&")[0]

    if not device_id:
        raise ConnectionRefusedError("device_id required")

    sio_manager.connect(device_id, sid)
    return True

@sio.event(namespace="/devices")
async def disconnect(sid):
    print("DEVICE DISCONNECTED:", sid)
    for device, sessions in sio_manager.devices.items():
        if sid in sessions:
            sio_manager.disconnect(device, sid)
            break

@sio.on("telemetry", namespace="/devices")
async def telemetry(sid, data):
    print("TELEMETRY RECEIVED:", sid, data)
    if "device_id" not in data or "time_stamp" not in data:
        return {"status": "error"}

    if isinstance(data["time_stamp"], str):
        data["time_stamp"] = datetime.fromisoformat(
            data["time_stamp"].replace("Z", "+00:00")
        )

    # Offload DB write
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, insert_device_telemetry, data)

    return {"status": "ok"}
