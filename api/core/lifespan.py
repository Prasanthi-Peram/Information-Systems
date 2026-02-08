import asyncio
import logging
from contextlib import asynccontextmanager
from db.migrations import run_migrations

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app):
    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, run_migrations)
        logger.info("DB migrations completed")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

    yield

    logger.info("Application shutdown")
