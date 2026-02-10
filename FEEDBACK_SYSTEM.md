# ML Feedback Loop & Model Retraining System

## Overview
This system allows users to provide feedback on ML predictions, which is stored in the database and used to retrain the model for better accuracy.

## Architecture

### Components

#### 1. **Frontend - Alerts Panel** (`frontend/components/ui/alerts-panel.tsx`)
- Displays AC units with critical alerts
- Users can mark alerts as:
  - **False Alarm**: The alert was wrong (AC is actually fine)
  - **Correct**: The alert prediction was accurate
- Sends feedback to `/ml/feedback` endpoint

#### 2. **Backend - Feedback API** (`api/main.py`)

**Endpoints:**

```bash
# Store feedback from user
POST /ml/feedback
{
  "device_id": "A200AC01",
  "time_stamp": "2026-02-10T12:34:56",
  "feedback": "false_alarm" | "correct"
}

# Trigger model retraining
POST /ml/retrain

# Get feedback statistics
GET /ml/feedback-stats
```

#### 3. **Database - Feedback Storage** (`api/db.py`)
- Table: `ml_feedback`
- Stores user feedback with device ID, timestamp, and feedback type
- Used to identify false alarms and improve the model

#### 4. **Model Retraining** (`api/retrain_models.py`)
- Queries all "false_alarm" feedback from database
- Joins with actual sensor telemetry data
- Retrains Isolation Forest model with these samples
- Updates `models/iso_model.joblib`

#### 5. **Settings Dashboard** (`frontend/app/settings/page.tsx`)
- Shows feedback statistics
- Displays count of false alarms vs correct predictions
- Button to manually trigger retraining
- Explains how the feedback loop works

## How It Works

### Step 1: User Feedback
```
Dashboard (Alert shown)
       ↓
User clicks "False Alarm" or "Correct"
       ↓
Feedback sent to /ml/feedback endpoint
```

### Step 2: Store Feedback
```
/ml/feedback endpoint (api/main.py)
       ↓
save_ml_feedback() (api/db.py)
       ↓
Insert into ml_feedback table
       ↓
Logged with emoji: 📝 Feedback: device_id | timestamp | feedback
```

### Step 3: Retrain Model (Manual or Automated)
```
User clicks "Trigger Model Retraining" in Settings
       OR
Automatic scheduled task (can be implemented)
       ↓
POST /ml/retrain endpoint
       ↓
retrain() function (api/retrain_models.py)
       ↓
Query false_alarm records from database
       ↓
Load scaler and retrain Isolation Forest
       ↓
Save updated iso_model.joblib
```

### Step 4: Improved Predictions
```
Model trained on false alarm examples
       ↓
Reduces false positives in future predictions
       ↓
Better health scores and maintenance advice
```

## Database Schema

### `ml_feedback` Table
```sql
CREATE TABLE ml_feedback (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    time_stamp TIMESTAMPTZ NOT NULL,
    feedback TEXT CHECK (feedback IN ('false_alarm','correct')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ml_feedback_device ON ml_feedback(device_id);
```

## API Flow Diagram

```
┌─────────────────────┐
│     Dashboard       │
│  (Alerts Panel)     │
├─────────────────────┤
│ Device: A200AC01    │
│ Alert: Maintenance  │
│                     │
│ [False Alarm] [✓]   │ ← User clicks
└────────┬────────────┘
         │
         ↓
┌────────────────────────────────────┐
│  POST /ml/feedback                 │
│  {                                 │
│    "device_id": "A200AC01",       │
│    "time_stamp": "ISO8601",       │
│    "feedback": "false_alarm"      │
│  }                                │
└────────────┬───────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  Backend: save_ml_feedback()     │
│  - Validate feedback value       │
│  - Insert to ml_feedback table   │
│  - Log result                    │
└────────────┬─────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  Database: ml_feedback Table    │
│                                 │
│  id | device_id | time_stamp   │
│  ---|-----------|-------------  │
│  1  | A200AC01  | 2026-02-10  │
│  2  | C108AC01  | 2026-02-10  │
└─────────────────────────────────┘
             │
             │ (User clicks "Retrain in Settings)
             ↓
┌────────────────────────────────────┐
│  POST /ml/retrain                  │
│  - Load false alarm data           │
│  - Retrain Isolation Forest model  │
│  - Save updated model              │
└────────────┬───────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  retrain_models.py:              │
│  1. Query ml_feedback table       │
│  2. Join with device_telemetry   │
│  3. Fit new iso model            │
│  4. Save to models/file.joblib   │
└────────────┬─────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  Next prediction run:            │
│  Uses updated model              │
│  → Fewer false alarms!           │
│  → Better health scores!         │
└──────────────────────────────────┘
```

## Frontend Components

### Alerts Panel
```typescript
// Shows critical alerts only
// Users can provide feedback inline
// Feedback is sent immediately to backend
```

### Feedback Dashboard (Settings Page)
```typescript
// Shows statistics
// - False Alarm Count
// - Correct Count
// - Devices affected

// Button to trigger retraining
// Real-time status messages
// Feedback history table
```

## Usage Examples

### 1. Send Feedback (Frontend)
```typescript
const response = await fetch('/ml/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    device_id: 'A200AC01',
    time_stamp: '2026-02-10T12:34:56',
    feedback: 'false_alarm'
  })
});
```

### 2. Trigger Retraining (Manual)
```bash
curl -X POST http://localhost:8000/ml/retrain
```

### 3. Get Feedback Stats
```bash
curl http://localhost:8000/ml/feedback-stats
```

Response:
```json
[
  {
    "feedback": "false_alarm",
    "count": 5,
    "devices": 3
  },
  {
    "feedback": "correct",
    "count": 12,
    "devices": 5
  }
]
```

## Service Dates

Service dates for each AC unit are:
- **Last Service Date**: Most recent maintenance
- **Next Service Date**: Scheduled maintenance date

These are displayed in the Maintenance Information table and fetched from the `ac_service` table.

### Table Format
```
Device      | Health | Last Service | Next Service | Status
------------|--------|--------------|--------------|--------
A200AC01    | 75%    | 12/01/2025   | 03/01/2026  | Prev. Maintenance
C108AC01    | 65%    | 11/15/2025   | 02/15/2026  | Check Cooling
NC324AC01   | 55%    | 12/20/2025   | 03/20/2026  | Prev. Maintenance
```

## Configuration

### Environment Variables
```bash
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=postgres
```

### Model Files
```
api/models/
├── scaler.joblib          # Feature scaler
├── model_state.joblib     # State prediction model
├── model_perf.joblib      # Performance prediction model
├── model_cond.joblib      # Condition prediction model
└── iso_model.joblib       # Isolation Forest (retrainable)
```

## Monitoring

### View Feedback Logs
Check backend console for feedback messages:
```
✅ Feedback saved: A200AC01 - false_alarm
🎯 Received feedback: false_alarm for A200AC01
🔄 Starting model retraining...
📊 Retraining with 15 false alarm samples
```

### Check Database
```sql
SELECT device_id, feedback, COUNT(*) 
FROM ml_feedback 
GROUP BY device_id, feedback;
```

## Future Enhancements

- [ ] Scheduled automatic retraining (e.g., every 24 hours)
- [ ] Time-series analysis of feedback trends
- [ ] Model performance metrics tracking
- [ ] A/B testing of model versions
- [ ] User feedback weighting based on role/expertise
- [ ] Visualization of model improvement over time

## Troubleshooting

### Issue: Feedback not saving
**Solution:** Check if DB_ENABLED is true and database is running
```python
# api/db.py
DB_ENABLED = bool(os.getenv("DB_HOST") and os.getenv("DB_USER"))
```

### Issue: Retraining failing with "not enough samples"
**Solution:** Need at least 30 false alarm samples to retrain
```python
if len(df) < 30:
    logger.info(f"Skipping retrain: only {len(df)} false alarm samples (need 30+)")
```

### Issue: Timestamp not JSON serializable
**Solution:** Frontend automatically converts timestamps to strings
```typescript
payload["Time_Stamp"] = payload["Time_Stamp"].astype(str)
```

## Summary

The complete feedback loop enables:
1. ✅ Users report false predictions
2. ✅ Data stored securely in database
3. ✅ Model retraining with corrected data
4. ✅ Improved future predictions
5. ✅ Visible statistics in dashboard

This creates a continuous improvement cycle for the ML model!
