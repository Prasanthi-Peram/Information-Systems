import asyncio
import websockets
import json
from datetime import datetime, timedelta

async def send_realistic_dummy_data():
    uri = "ws://localhost:8000/ws"
    
    base_data = [
        # IDLE (Low current, high room temp)
        {"curr": 0.05, "volt": 240.1, "pf": 0.05, "r_temp": 30.5, "ext_t": 35.0, "hum": 60.2, "cons": 0.001},
        {"curr": 0.05, "volt": 239.8, "pf": 0.05, "r_temp": 30.5, "ext_t": 35.1, "hum": 60.1, "cons": 0.002},
        # STARTUP (Current spikes as compressor kicks in)
        {"curr": 15.2, "volt": 238.5, "pf": 0.85, "r_temp": 30.4, "ext_t": 35.2, "hum": 60.0, "cons": 0.050},
        {"curr": 18.5, "volt": 237.2, "pf": 0.95, "r_temp": 30.2, "ext_t": 35.2, "hum": 59.5, "cons": 0.120},
        # COOLING (High power, room temp starts dropping)
        {"curr": 20.1, "volt": 240.2, "pf": 0.98, "r_temp": 29.5, "ext_t": 35.3, "hum": 58.0, "cons": 0.250},
        {"curr": 20.3, "volt": 241.0, "pf": 0.98, "r_temp": 28.1, "ext_t": 35.3, "hum": 56.5, "cons": 0.380},
        {"curr": 19.8, "volt": 240.5, "pf": 0.98, "r_temp": 26.8, "ext_t": 35.4, "hum": 55.2, "cons": 0.510},
        # STABILIZING (Power settles, humidity drops)
        {"curr": 12.4, "volt": 240.1, "pf": 0.92, "r_temp": 25.5, "ext_t": 35.4, "hum": 52.1, "cons": 0.620},
        {"curr": 8.5,  "volt": 240.3, "pf": 0.88, "r_temp": 24.8, "ext_t": 35.5, "hum": 50.5, "cons": 0.710},
        {"curr": 8.2,  "volt": 240.2, "pf": 0.88, "r_temp": 24.5, "ext_t": 35.5, "hum": 50.1, "cons": 0.800},
    ]

    try:
        async with websockets.connect(uri) as websocket:
            # We add a random offset to the minutes so even if you run this 
            # script frequently, the timestamps are likely to be unique.
            now = datetime.utcnow()
            
            for i, d in enumerate(base_data):
                # Ensure each row has a unique minute/second
                ts = (now + timedelta(minutes=i)).isoformat() + "Z"
                
                payload = {
                    "device_id": "A700AC01",
                    "time_stamp": ts,
                    "current": d["curr"],
                    "voltage": d["volt"],
                    "power_factor": d["pf"],
                    "real_power": round(d["curr"] * d["volt"] * d["pf"], 2),
                    "room_temp": d["r_temp"],
                    "external_temp": d["ext_t"],
                    "humidity": d["hum"],
                    "unit_consumption": d["cons"]
                }
                
                await websocket.send(json.dumps(payload))
                print(f"Sent: {ts} | Power: {payload['real_power']}W | Temp: {d['r_temp']}°C")
                
                response = await websocket.recv()
                print(f"Prediction: {response}\n")
                await asyncio.sleep(0.3)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(send_realistic_dummy_data())