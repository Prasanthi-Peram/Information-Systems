CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS ac_device (
    device_id   BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    location    TEXT NOT NULL,
    last_service TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_telemetry (
    time_stamp        TIMESTAMPTZ NOT NULL,
    device_id         BIGINT NOT NULL REFERENCES ac_device(device_id) ON DELETE CASCADE,

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

CREATE TABLE IF NOT EXISTS alerts(
    alert_id      BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    time_stamp    TIMESTAMPTZ NOT NULL,
    device_id     BIGINT NOT NULL,


    alert_text    TEXT NOT NULL,
    is_true_alarm BOOLEAN DEFAULT NULL, 
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at   TIMESTAMPTZ,
     alert_criticality   TEXT CHECK (alert_criticality IN ('Critical', 'Warning', 'Info')),
    recommendation TEXT,

    predicted_service_date TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT fk_telemetry_alerts 
    FOREIGN KEY (time_stamp, device_id) 
    REFERENCES device_telemetry (time_stamp, device_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ml_predictions (
    prediction_id      BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    time_stamp          TIMESTAMPTZ NOT NULL,
    device_id           BIGINT NOT NULL,
    
    predicted_state     INT,
    health_score        DOUBLE PRECISION,
    performance_score   DOUBLE PRECISION,
   
    
    --ground_truth        INT,
    --is_error            BOOLEAN DEFAULT FALSE,
    model_version       TEXT,
    CONSTRAINT fk_telemetry_predictions 
    FOREIGN KEY (time_stamp, device_id) 
    REFERENCES device_telemetry (time_stamp, device_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    name          VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);