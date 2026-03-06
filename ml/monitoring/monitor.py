import os
import psycopg
import pandas as pd
import subprocess
from pathlib import Path


# ============================================================
# LOAD ENV VARIABLES FROM .env
# ============================================================

def load_env():

    env_file = Path(__file__).resolve().parents[2] / ".env"

    if env_file.exists():

        with open(env_file) as f:

            for line in f:

                line = line.strip()

                if line and not line.startswith("#") and "=" in line:

                    key, value = line.split("=", 1)

                    os.environ.setdefault(key, value)


load_env()


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    return psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD") or os.getenv("DB_PASS"),
        dbname=os.getenv("DB_NAME", "smartac"),
        port=int(os.getenv("DB_PORT", "5432"))
    )


# ============================================================
# LOAD RECENT PREDICTIONS
# ============================================================

def load_recent_predictions():

    query = """
    SELECT *
    FROM ac_predictions
    WHERE created_at > NOW() - INTERVAL '24 hours'
    """

    with get_connection() as conn:

        df = pd.read_sql(query, conn)

    return df


# ============================================================
# DRIFT DETECTION
# ============================================================

def detect_drift(df):

    if df.empty:

        print("No predictions available")

        return False

    anomaly_rate = df["critical_alert"].mean()

    print("Anomaly rate:", anomaly_rate)

    if anomaly_rate > 0.25:

        return True

    return False


# ============================================================
# RETRAIN MODEL
# ============================================================

def retrain_models():

    print("Starting retraining pipeline...")

    subprocess.run(["python", "ml/training/train.py"], check=True)

    print("Retraining finished")


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_recent_predictions()

    if detect_drift(df):

        print("Model drift detected")

        retrain_models()

    else:

        print("Model performance stable")


if __name__ == "__main__":

    main()