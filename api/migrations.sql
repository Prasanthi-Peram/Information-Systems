CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS location (
    location_id SERIAL PRIMARY KEY,
    location_name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS ac_device (
    device_id TEXT PRIMARY KEY,
    location_id INT REFERENCES location(location_id),
    last_service TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_telemetry (
    time_stamp        TIMESTAMPTZ NOT NULL,
    device_id         TEXT NOT NULL REFERENCES ac_device(device_id) ON DELETE CASCADE,

    current           DOUBLE PRECISION,
    voltage           DOUBLE PRECISION,
    power_factor      DOUBLE PRECISION,
    real_power        DOUBLE PRECISION,

    room_temp         DOUBLE PRECISION,
    external_temp     DOUBLE PRECISION,
    humidity          DOUBLE PRECISION,

    unit_consumption  DOUBLE PRECISION,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (time_stamp, device_id)
);

SELECT create_hypertable('device_telemetry', 'time_stamp', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS live_location (
    location_id SERIAL PRIMARY KEY,
    location_name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS live_ac_device (
    device_id TEXT PRIMARY KEY,
    location_id INT REFERENCES live_location(location_id),
    last_service TIMESTAMPTZ DEFAULT now()
);

DROP TABLE IF EXISTS alerts;
CREATE TABLE IF NOT EXISTS alerts(
    alert_id      BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    time_stamp    TIMESTAMPTZ NOT NULL,
    device_id     TEXT NOT NULL REFERENCES live_ac_device(device_id) ON DELETE CASCADE,


    alert_text    TEXT NOT NULL,
    is_true_alarm BOOLEAN NOT NULL DEFAULT TRUE, 
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at   TIMESTAMPTZ,
     alert_criticality   TEXT CHECK (alert_criticality IN ('Critical', 'Warning', 'Info')),
    recommendation TEXT,

    predicted_service_date TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    name          VARCHAR(255),
    role          VARCHAR(20),
    campus_id     VARCHAR(50),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS live_device_telemetry (
    time_stamp        TIMESTAMPTZ NOT NULL,
    device_id         TEXT NOT NULL REFERENCES live_ac_device(device_id) ON DELETE CASCADE,

    current           DOUBLE PRECISION,
    voltage           DOUBLE PRECISION,
    power_factor      DOUBLE PRECISION,
    real_power        DOUBLE PRECISION,

    room_temp         DOUBLE PRECISION,
    external_temp     DOUBLE PRECISION,
    humidity          DOUBLE PRECISION,

    unit_consumption  DOUBLE PRECISION,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (time_stamp, device_id)
);

SELECT create_hypertable('live_device_telemetry', 'time_stamp', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS live_ml_predictions (
    prediction_id      BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    time_stamp          TIMESTAMPTZ NOT NULL,
    device_id           TEXT NOT NULL REFERENCES live_ac_device(device_id) ON DELETE CASCADE,
    
    predicted_state     INT,
    health_score        DOUBLE PRECISION,
    performance_score   DOUBLE PRECISION,
    model_version       TEXT
);