import os
import psycopg
import pandas as pd
import joblib
import logging
from pathlib import Path
from sklearn.ensemble import IsolationForest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent / "models"

def retrain():
    """Retrain Isolation Forest model based on false alarm feedback"""
    try:
        # Connect to DB with environment variables
        conn = psycopg.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            dbname=os.getenv("DB_NAME", "postgres"),
        )

        # Fetch false alarm cases
        df = pd.read_sql(
            """
            SELECT t.*
            FROM ml_feedback f
            JOIN device_telemetry t
            ON f.device_id=t.device_id AND f.time_stamp=t.time_stamp
            WHERE f.feedback='false_alarm'
            LIMIT 1000
            """,
            conn
        )
        conn.close()

        if len(df) < 30:
            logger.info(f"⏭️  Skipping retrain: only {len(df)} false alarm samples (need 30+)")
            return

        logger.info(f"📊 Retraining with {len(df)} false alarm samples")

        # Load scaler and prepare features
        scaler = joblib.load(MODEL_DIR / "scaler.joblib")
        X = scaler.transform(df.select_dtypes(float).fillna(0))

        # Retrain Isolation Forest
        iso = IsolationForest(contamination=0.02, random_state=42)
        iso.fit(X)
        joblib.dump(iso, MODEL_DIR / "iso_model.joblib")

        logger.info(f"✅ Model retraining complete. Saved to {MODEL_DIR / 'iso_model.joblib'}")

    except Exception as e:
        logger.error(f"❌ Retrain error: {e}")

if __name__ == "__main__":
    retrain()