-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- DEVICE TELEMETRY (TIMESERIES)
CREATE TABLE IF NOT EXISTS device_telemetry (
    time_stamp        TIMESTAMPTZ NOT NULL,
    device_id         TEXT NOT NULL,

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

-- Convert to hypertable
SELECT create_hypertable(
    'device_telemetry',
    'time_stamp',
    if_not_exists => TRUE
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    name          VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- AC SERVICE DATES
CREATE TABLE IF NOT EXISTS ac_service (
    device_id TEXT PRIMARY KEY,
    last_service_date DATE,
    next_service_date DATE
);

-- Demo data (safe)
INSERT INTO ac_service VALUES
('A200AC01','2025-12-01','2026-03-01'),
('C108AC01','2025-11-15','2026-02-15'),
('NC324AC01','2025-12-20','2026-03-20'),
('NR312AC01','2025-10-10','2026-01-10'),
('NR422AC01','2025-12-05','2026-03-05')
ON CONFLICT (device_id) DO NOTHING;

-- ML FEEDBACK
CREATE TABLE IF NOT EXISTS ml_feedback (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    time_stamp TIMESTAMPTZ NOT NULL,
    feedback TEXT CHECK (feedback IN ('false_alarm','correct')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ml_feedback_device
ON ml_feedback(device_id);