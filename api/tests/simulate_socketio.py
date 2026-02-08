import asyncio
import random
from datetime import datetime, timezone

import socketio

NUM_DEVICES = 5
MESSAGES_PER_DEVICE = 20
SERVER_URL = "http://localhost:8000"
NAMESPACE = "/devices"


async def device_simulator(device_id: int):
    sio = socketio.AsyncClient()

    await sio.connect(
        f"{SERVER_URL}?device_id={device_id}",
        namespaces=[NAMESPACE],
    )

    for _ in range(MESSAGES_PER_DEVICE):
        payload = {
            "time_stamp": datetime.now(timezone.utc).isoformat(),
            "device_id": device_id,
            "current": round(random.uniform(0.1, 1.5), 2),
            "voltage": round(random.uniform(220, 240), 2),
            "power_factor": round(random.uniform(0.7, 1.0), 2),
            "real_power": round(random.uniform(10, 500), 2),
            "room_temp": round(random.uniform(20, 35), 2),
            "external_temp": round(random.uniform(25, 40), 2),
            "humidity": round(random.uniform(30, 80), 2),
            "unit_consumption": round(random.uniform(0.01, 0.5), 3),
        }

        response = await sio.call(
            "telemetry",
            payload,
            namespace=NAMESPACE,
        )

        print(f"Device {device_id}: {response}")
        await asyncio.sleep(random.uniform(0.2, 1.0))

    await sio.disconnect()


async def main():
    await asyncio.gather(
        *(device_simulator(i) for i in range(1, NUM_DEVICES + 1))
    )


if __name__ == "__main__":
    asyncio.run(main())
