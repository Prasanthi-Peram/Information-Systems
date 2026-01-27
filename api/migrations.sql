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