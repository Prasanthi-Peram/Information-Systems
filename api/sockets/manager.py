from typing import Dict, Set

class SocketIOManager:
    def __init__(self):
        self.devices: Dict[str, Set[str]] = {}

    def connect(self, device_id: str, sid: str):
        self.devices.setdefault(device_id, set()).add(sid)

    def disconnect(self, device_id: str, sid: str):
        if device_id in self.devices:
            self.devices[device_id].discard(sid)
            if not self.devices[device_id]:
                del self.devices[device_id]

    def is_connected(self, device_id: str) -> bool:
        return device_id in self.devices

    def stats(self):
        return {k: len(v) for k, v in self.devices.items()}

sio_manager = SocketIOManager()
