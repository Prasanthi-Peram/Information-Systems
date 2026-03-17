import asyncio
import websockets
import json
import numpy as np
import scipy.stats as stats
from datetime import datetime


# ==========================================================
# RANDOM DATA GENERATORS FROM FITTED DISTRIBUTIONS
# ==========================================================

def generate_current():
    return stats.expon.rvs(loc=0.0, scale=6.509237027541078)

def generate_voltage():
    return stats.weibull_min.rvs(
        c=6.680414095482709,
        loc=209.6498589381241,
        scale=32.899743937793296
    )

def generate_pf():
    return stats.weibull_min.rvs(
        c=0.5885534597281968,
        loc=0,
        scale=0.6261291400786251
    )

def generate_room_temp():
    return stats.lognorm.rvs(
        s=0.20089039337820974,
        loc=3.854232529745159,
        scale=20.05440815724674
    )

def generate_external_temp():
    return stats.lognorm.rvs(
        s=0.18565841819735307,
        loc=11.193289311336118,
        scale=16.57158289379011
    )

def generate_humidity():
    return stats.lognorm.rvs(
        s=0.33016533643532636,
        loc=29.62831910463395,
        scale=21.433405018469625
    )

def generate_unit_consumption():
    return stats.lognorm.rvs(
        s=1.600834817790106,
        loc=-4.330002624102156e-05,
        scale=0.5518384440607625
    )


# ==========================================================
# STREAM DATA
# ==========================================================

async def send_realistic_data():

    uri = "ws://localhost:8000/ws"

    # DEVICES IN ROOMS (currently 5 total)
    rooms = {
        "NR221": ["NR221-AC-01", "NR221-AC-02"],
        "NR222": ["NR222-AC-01"],
        "NC242": ["NC242-AC-01"],
        "NC243": ["NC243-AC-01"]
    }

    try:
        async with websockets.connect(uri) as websocket:

            for room_name, devices in rooms.items():
                for device_id in devices:

                    curr = generate_current()
                    volt = generate_voltage()
                    pf = generate_pf()

                    room_temp = generate_room_temp()
                    ext_temp = generate_external_temp()
                    hum = generate_humidity()
                    cons = generate_unit_consumption()

                    real_power = curr * volt * pf
                    ts = datetime.utcnow().isoformat() + "Z"

                    payload = {
                        "device_id": device_id,
                        "location": room_name,
                        "time_stamp": ts,
                        "current": round(curr, 3),
                        "voltage": round(volt, 3),
                        "power_factor": round(pf, 3),
                        "real_power": round(real_power, 2),
                        "room_temp": round(room_temp, 2),
                        "external_temp": round(ext_temp, 2),
                        "humidity": round(hum, 2),
                        "unit_consumption": round(cons, 4)
                    }

                    await websocket.send(json.dumps(payload))

                    print(
                        f"📤 Sent | {room_name} | {device_id} | "
                        f"I={payload['current']}A | "
                        f"V={payload['voltage']}V | "
                        f"PF={payload['power_factor']} | "
                        f"Temp={payload['room_temp']}°C"
                    )

                    response = await websocket.recv()
                    print(f"📥 Prediction for {device_id}: {response}\n")

    except Exception as e:
        print(f"Error: {e}")


# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":
    asyncio.run(send_realistic_data())