import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_URL = f"postgresql://postgres:{os.getenv('DB_PASS')}@db:5432/{os.getenv('DB_NAME')}"
    
    MLFLOW_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")