import psycopg
from core.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

def get_connection():
    return psycopg.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
    )
