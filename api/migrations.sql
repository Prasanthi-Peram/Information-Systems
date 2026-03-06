CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ac_device (
    device_id TEXT PRIMARY KEY,
    location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS device_telemetry (
    time_stamp TIMESTAMPTZ NOT NULL,
    device_id TEXT NOT NULL,

    current DOUBLE PRECISION,
    voltage DOUBLE PRECISION,
    power_factor DOUBLE PRECISION,
    real_power DOUBLE PRECISION,

    room_temp DOUBLE PRECISION,
    external_temp DOUBLE PRECISION,
    humidity DOUBLE PRECISION,

    unit_consumption DOUBLE PRECISION,

    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key only if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_device_telemetry_ac_device'
    ) THEN
        ALTER TABLE device_telemetry
        ADD CONSTRAINT fk_device_telemetry_ac_device
        FOREIGN KEY (device_id)
        REFERENCES ac_device(device_id)
        ON DELETE CASCADE;
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS ac_predictions (

    prediction_id BIGSERIAL PRIMARY KEY,

    time_stamp TIMESTAMPTZ NOT NULL,
    device_id TEXT NOT NULL,

    pred_state TEXT,
    pred_perf DOUBLE PRECISION,
    pred_condition TEXT,

    health_score DOUBLE PRECISION,
    critical_alert INTEGER,

    maintenance_advice TEXT,
    model_version TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ac_predictions_device_time
ON ac_predictions(device_id, time_stamp DESC);
