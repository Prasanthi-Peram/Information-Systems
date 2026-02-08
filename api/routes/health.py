from fastapi import APIRouter
from sockets.manager import sio_manager

router = APIRouter()

@router.get("/health")
def health():
    return {"devices": sio_manager.stats()}
