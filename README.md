# Information-Systems

## Setup

- Set the environment variables using the .env.template

- Make sure docker is installed

```bash
git clone https://github.com/Prasanthi-Peram/Information-Systems.git

cd Information-Systems/
docker compose build --no-cache
docker compose up
```
- The backend is available at http://127.0.0.1:8000/

- To test the db using psql

```bash
docker exec -it information-systems-db-1 psql -U postgres

\c ac_sys
\d
```
```SQL
SELECT * FROM device_telemetry;
```

- Testing the web socket connection using the simulator

```bash
python simulate.py
```

## ToDos

- [ ] Create a frontend design 

# Smart AC Monitoring System

Real-time IoT monitoring system for air-conditioning units with ML-based health prediction.

## Features

- Real-time telemetry ingestion via WebSocket
- TimescaleDB time-series storage
- ML-based performance prediction
- MLflow model tracking
- Automatic drift detection
- Automatic model retraining
- Docker-based microservices architecture

## Architecture

AC Device → WebSocket → FastAPI → TimescaleDB → ML Inference → Predictions → MLflow

## Run the system

```bash
docker compose up -d