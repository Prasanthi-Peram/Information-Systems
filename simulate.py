import asyncio, json, os, random
from datetime import datetime, timezone

import psycopg, websockets


WS_URL = "ws://localhost:8000/ws"
NUM_DEVICES = 5
MESSAGES_PER_DEVICE = 20

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME", "postgres"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASS", "postgres"),
}


def seed_ac_devices():
    with psycopg.connect(**DB_CONFIG) as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO ac_device (device_id, location)
            OVERRIDING SYSTEM VALUE VALUES
                (1, 'Lobby - Ground Floor'),
                (2, 'Conference Room - 1st Floor'),
                (3, 'Server Room - Basement'),
                (4, 'Office Area - 2nd Floor'),
                (5, 'Cafeteria - 3rd Floor')
            ON CONFLICT (device_id) DO NOTHING;
            """
        )
        conn.commit()


async def device_simulator(device_id: int):
    # Retry a few times in case the API is still starting up
    for attempt in range(5):
        try:
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

                return
        except Exception as e:
            print(f"Device {device_id}: websocket connect failed (attempt {attempt+1}/5): {e}")
            await asyncio.sleep(1.0)


async def main():
    await asyncio.gather(
        *(device_simulator(device_id) for device_id in range(1, NUM_DEVICES + 1))
    )


if __name__ == "__main__":
    seed_ac_devices()
    asyncio.run(main())
