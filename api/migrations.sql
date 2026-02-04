CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS device_telemetry (
    time_stamp        TIMESTAMPTZ NOT NULL,
    device_id         BIGINT NOT NULL,

    current           DOUBLE PRECISION,
    voltage           DOUBLE PRECISION,
    power_factor      DOUBLE PRECISION,
    real_power        DOUBLE PRECISION,

    room_temp         DOUBLE PRECISION,
    external_temp     DOUBLE PRECISION,
    humidity          DOUBLE PRECISION,

    unit_consumption  DOUBLE PRECISION,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    name          VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);