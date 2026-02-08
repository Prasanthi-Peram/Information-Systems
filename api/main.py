from fastapi import FastAPI
from contextlib import asynccontextmanager
from socketio import ASGIApp

from core.lifespan import lifespan
from core.logging import setup_logging
from sockets.server import sio
import sockets.events
from routes.health import router as health_router

setup_logging()
app = FastAPI(lifespan=lifespan)
app.include_router(health_router)

socket_app = ASGIApp(sio, app)