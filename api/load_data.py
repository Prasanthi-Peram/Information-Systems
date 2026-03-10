import os
from io import StringIO

import boto3
import pandas as pd
import psycopg


# ============================================================
# CONFIGURATION
# ============================================================

S3_BUCKET = os.getenv("S3_BUCKET", "smartcool-datasets")
S3_KEY = os.getenv("S3_DATASET_KEY", "data/train_data.csv")

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

DB_HOST = os.getenv("DB_HOST", "db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
DB_NAME = os.getenv("DB_NAME", "ac_sys")
DB_PORT = int(os.getenv("DB_PORT", "5432"))


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    return psycopg.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME,
        port=DB_PORT,
    )


# ============================================================
# DOWNLOAD DATASET FROM S3
# ============================================================

def download_from_s3():

    print("Downloading dataset from S3...")

    s3 = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
    )

    try:
        obj = s3.get_object(Bucket=S3_BUCKET, Key=S3_KEY)
    except Exception as e:
        raise RuntimeError(f"S3 download failed: {e}")

    data = obj["Body"].read().decode("utf-8")

    df = pd.read_csv(StringIO(data))

    print(f"Dataset downloaded: {len(df)} rows")

    return df


# ============================================================
# DATA CLEANING
# ============================================================

def preprocess_dataset(df: pd.DataFrame):

    df = df.copy()

    required_columns = [
        "time_stamp",
        "device_id",
        "current",
        "voltage",
        "power_factor",
        "real_power",
        "room_temp",
        "external_temp",
        "humidity",
        "unit_consumption"
    ]

    missing = [c for c in required_columns if c not in df.columns]

    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    df = df[required_columns]

    # Convert timestamp
    df["time_stamp"] = pd.to_datetime(df["time_stamp"])

    # Fill NaNs safely
    df = df.fillna(0)

    # Convert device_id to int
    df["device_id"] = df["device_id"].astype(int)

    return df


# ============================================================
# ENSURE DEVICES EXIST
# ============================================================

def ensure_devices_exist(conn, df):

    device_ids = df["device_id"].unique()

    with conn.cursor() as cur:

        for device in device_ids:

            cur.execute(
                """
                INSERT INTO ac_device(device_id, location)
                VALUES (%s, %s)
                ON CONFLICT (device_id) DO NOTHING
                """,
                (device, f"Device-{device}")
            )

    conn.commit()

    print(f"{len(device_ids)} devices verified in ac_device table")


# ============================================================
# INSERT TELEMETRY DATA
# ============================================================

def insert_data(df: pd.DataFrame):

    print("Inserting telemetry data into TimescaleDB...")

    insert_query = """
    INSERT INTO device_telemetry (
        time_stamp,
        device_id,
        current,
        voltage,
        power_factor,
        real_power,
        room_temp,
        external_temp,
        humidity,
        unit_consumption
    )
    VALUES (
        %(time_stamp)s,
        %(device_id)s,
        %(current)s,
        %(voltage)s,
        %(power_factor)s,
        %(real_power)s,
        %(room_temp)s,
        %(external_temp)s,
        %(humidity)s,
        %(unit_consumption)s
    )
    """

    with get_connection() as conn:

        ensure_devices_exist(conn, df)

        with conn.cursor() as cur:

            cur.executemany(
                insert_query,
                df.to_dict(orient="records")
            )

        conn.commit()

    print(f"{len(df)} telemetry rows inserted successfully")


# ============================================================
# MAIN PIPELINE
# ============================================================

def main():

    print("Starting S3 → TimescaleDB ingestion pipeline")

    df = download_from_s3()

    df = preprocess_dataset(df)

    insert_data(df)

    print("Dataset successfully loaded into TimescaleDB")


if __name__ == "__main__":
    main()