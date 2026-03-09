import os
import boto3
import pandas as pd
import psycopg
from dotenv import load_dotenv

load_dotenv()

S3_BUCKET = os.getenv("S3_BUCKET_NAME")
S3_KEY = os.getenv("S3_TRAIN_DATA")

DB_HOST = os.getenv("DB_HOST", "db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "ac_sys")

CHUNK_SIZE = 10000


def get_connection():
    conn = psycopg.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        dbname=DB_NAME
    )
    print("Connected to db")
    return conn


def insert_devices(cur, chunk):

    devices = (
        chunk[["device_id", "location"]]
        .drop_duplicates()
        .values
        .tolist()
    )

    cur.executemany(
        """
        INSERT INTO ac_device (device_id, location)
        VALUES (%s,%s)
        ON CONFLICT (device_id) DO NOTHING
        """,
        devices
    )


def insert_telemetry(cur, chunk):

    records = (
        chunk[
            [
                "time_stamp",
                "device_id",
                "current",
                "voltage",
                "power_factor",
                "real_power",
                "room_temp",
                "external_temp",
                "humidity",
                "unit_consumption",
            ]
        ]
        .values
        .tolist()
    )

    cur.executemany(
        """
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
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT DO NOTHING
        """,
        records
    )

def main():

    print("Connecting to S3...")
    s3 = boto3.client("s3")
    obj = s3.get_object(Bucket=S3_BUCKET, Key=S3_KEY)

    conn = get_connection()
    cur = conn.cursor()

    chunk_id = 0

    for chunk in pd.read_csv(obj["Body"], chunksize=CHUNK_SIZE):

        chunk_id += 1

        chunk = chunk.rename(columns={
            "Device_ID": "device_id",
            "Time_Stamp": "time_stamp",
            "Current": "current",
            "Power_Factor": "power_factor",
            "Real_Power_calc": "real_power",
            "External_temp": "external_temp",
            "Humidity": "humidity",
        })

        chunk["location"] = chunk["device_id"].astype(str).str[:4]

        print(f"Processing chunk {chunk_id} ({len(chunk)} rows)")

        insert_devices(cur, chunk)
        insert_telemetry(cur, chunk)

        conn.commit()

        print(f"Chunk {chunk_id} inserted successfully")

    cur.close()
    conn.close()

    print("Dataset loading completed")


if __name__ == "__main__":
    main()