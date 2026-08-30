# Smart AC Monitoring & Predictive Maintenance System

A full-stack IoT system for real-time Air Conditioning (AC) unit monitoring. This project ingests live sensor telemetry via WebSockets, applies Machine Learning models to predict equipment health and detect anomalies, and surfaces alerts and dashboards to administrators and technicians.

## Features

- **Real-Time Telemetry Ingestion:** WebSocket-based ingestion of AC sensor data (temperature, power, voltage, current, etc.).
- **Predictive Analytics & Anomaly Detection:** Utilizes Random Forest and Isolation Forest models to predict AC state, performance, and health, while flagging anomalies.
- **Adaptive Retraining:** Feedback-driven retraining loop that monitors false-alarm counts and automatically triggers full model retraining.
- **Role-Based Dashboards:** API endpoints tailored for Admins and Technicians to monitor AC units and assign maintenance tasks.

## Tech Stack

- **Backend:** FastAPI, Python, WebSockets
- **Machine Learning:** scikit-learn, MLflow, Pandas, NumPy
- **Database:** TimescaleDB (PostgreSQL) for time-series data
- **Infrastructure:** Docker, Docker Compose, AWS (S3 for model artifact storage)
- **Frontend:** Next.js, React, Tailwind CSS
## Setup & Installation

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Python 3.9+ (for running the simulator)

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Prasanthi-Peram/Information-Systems.git
   cd Information-Systems/
   ```

2. **Environment Variables:**
   Copy the template file and fill in your credentials (especially AWS credentials for MLflow):
   ```bash
   cp .env.template .env
   ```

3. **Build and Run Services:**
   The application uses Docker Compose to orchestrate TimescaleDB, MLflow, the FastAPI backend, and the data loader.
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

4. **Access the Services:**
   - **FastAPI Backend:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - **API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **MLflow UI:** `http://127.0.0.1:<MLFLOW_PORT>` (Check your `.env` for the configured port)

## Testing & Simulation

### Database Verification

To verify that the database is running and data is being populated:

```bash
docker exec -it information-systems-db-1 psql -U postgres
```

Inside the `psql` prompt:
```sql
\c ac_sys
\d
SELECT * FROM device_telemetry LIMIT 10;
```

### Telemetry Simulator

To test the WebSocket connection and simulate live telemetry data coming from AC units:

```bash
# Ensure you have the required dependencies installed
pip install -r api/requirements.txt
python simulate.py
```

## ToDos

- [ ] Add unit and integration tests
- [ ] Enhance alerting mechanisms with email/SMS notifications
