import asyncio
import json
import random
from datetime import datetime, timezone

import websockets


WS_URL = "ws://localhost:8000/ws"
NUM_DEVICES = 5
MESSAGES_PER_DEVICE = 20


async def device_simulator(device_id: int):
    async with websockets.connect(WS_URL) as ws:
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

            await ws.send(json.dumps(payload))
            response = await ws.recv()
            print(f"Device {device_id}: {response}")

            await asyncio.sleep(random.uniform(0.2, 1.0))


async def main():
    tasks = [
        device_simulator(device_id)
        for device_id in range(1, NUM_DEVICES + 1)
    ]
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
