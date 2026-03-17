import asyncio
import websockets
import json
from datetime import datetime


async def send_anomalous_data():
    """
    Send 5 clearly abnormal telemetry points to trigger Isolation Forest anomalies.
    Uses extreme currents / powers and temperatures far outside normal range.
    """

    uri = "ws://localhost:8000/ws"

    room_name = "ERROR_ROOM"
    device_id = "ERROR-AC-01"

    try:
        async with websockets.connect(uri) as websocket:
            for i in range(5):
                # Vary anomalies slightly across the 5 points
                curr = 120.0 + i * 10.0   # Increasing high current
                volt = 260.0 + i * 5.0    # Slightly increasing voltage
                pf = 0.05                 # Very low power factor
                real_power = curr * volt * pf * 5  # exaggerate power further

                room_temp = -5.0 - i      # Even colder room
                ext_temp = 45.0 + i * 2   # Very hot outside
                hum = 5.0 + i             # Still abnormal
                cons = 8.0 + i * 1.5      # High unit consumption

                ts = datetime.utcnow().isoformat() + "Z"

                payload = {
                    "device_id": device_id,
                    "location": room_name,
                    "time_stamp": ts,
                    "current": curr,
                    "voltage": volt,
                    "power_factor": pf,
                    "real_power": real_power,
                    "room_temp": room_temp,
                    "external_temp": ext_temp,
                    "humidity": hum,
                    "unit_consumption": cons,
                }

                print(f"Sending anomalous telemetry payload {i+1}/5...")
                await websocket.send(json.dumps(payload))

                resp = await websocket.recv()
                print("Response from server:")
                print(resp)
                print("---")
    except Exception as e:
        print(f"Error while sending anomalous data: {e}")


if __name__ == "__main__":
    asyncio.run(send_anomalous_data())

