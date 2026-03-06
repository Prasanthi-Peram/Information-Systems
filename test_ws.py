import asyncio
import websockets
import json

async def test():

    uri = "ws://localhost:8000/ws"

    async with websockets.connect(uri) as ws:

        message = {
            "device_id": "A200AC01",
            "time_stamp": "2026-03-06T22:40:00Z",

            "current": 6.5,
            "voltage": 230,
            "power_factor": 0.92,
            "real_power": 1500,

            "room_temp": 27,
            "external_temp": 35,
            "humidity": 60,

            "unit_consumption": 1.3
        }

        await ws.send(json.dumps(message))

        response = await ws.recv()

        print(response)


asyncio.run(test())