from pathlib import Path
from .connection import get_connection

def run_migrations():
    sql = (Path(__file__).parent.parent / "migrations.sql").read_text()
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
