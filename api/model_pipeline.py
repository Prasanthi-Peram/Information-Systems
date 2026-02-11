from joblib import load
import numpy as np
import pandas as pd
from pathlib import Path
import warnings
from sklearn.exceptions import InconsistentVersionWarning

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)


# LOAD MODELS

MODEL_DIR = Path(__file__).parent / "models"

scaler = load(MODEL_DIR / "scaler.joblib")
model_state = load(MODEL_DIR / "model_state.joblib")
model_perf  = load(MODEL_DIR / "model_perf.joblib")
model_cond  = load(MODEL_DIR / "model_cond.joblib")
iso_model   = load(MODEL_DIR / "iso_model.joblib")


# FEATURES

selected_features = [
    "Current","voltage","Power_Factor","Real_Power_calc","load_ratio",
    "room_temp","External_temp","Humidity","temp_drop",
    "cooling_efficiency","thermal_stress",
    "rolling_std_power","power_variability","current_diff",
    "on_off_change","electrical_instability",
    "env_load_index","Tonnage","People","Static_heat_load",
    "hour_sin","hour_cos",
]

def ensure_columns(df):
    for col in selected_features:
        if col not in df.columns:
            df[col] = 0.0
    return df


# PURE ML PREDICTION

def smartcool_predict(iot_data: pd.DataFrame) -> pd.DataFrame:

    df = iot_data.copy()
    df["Time_Stamp"] = pd.to_datetime(df["Time_Stamp"])
    df = df.sort_values(["Device_ID","Time_Stamp"]).reset_index(drop=True)

    # ---- Feature Engineering
    df["apparent_power"] = df["voltage"] * df["Current"]
    df["load_ratio"] = df["Real_Power_calc"] / df["apparent_power"].replace(0,np.nan)
    df["cooling_efficiency"] = df["temp_drop"] / df["Real_Power_calc"].replace(0,np.nan)
    df["thermal_stress"] = df["External_temp"] - df["room_temp"]
    df["env_load_index"] = df["External_temp"] * df["Humidity"]

    hour = df["Time_Stamp"].dt.hour
    df["hour_sin"] = np.sin(2*np.pi*hour/24)
    df["hour_cos"] = np.cos(2*np.pi*hour/24)

    df["rolling_std_power"] = (
        df.groupby("Device_ID")["Real_Power_calc"]
        .transform(lambda x: x.rolling(3,1).std())
        .fillna(0)
    )

    df["rolling_mean_power"] = (
        df.groupby("Device_ID")["Real_Power_calc"]
        .transform(lambda x: x.rolling(3,1).mean())
        .replace(0,np.nan)
    )

    df["power_variability"] = (
        df["rolling_std_power"] / df["rolling_mean_power"]
    ).fillna(0).clip(0,2)

    df["current_diff"] = df.groupby("Device_ID")["Current"].diff().fillna(0)
    df["electrical_instability"] = df["rolling_std_power"]
    df["on_off_change"] = 0.0

    # ---- ML
    df = ensure_columns(df)
    X = scaler.transform(df[selected_features].astype(float))

    df["pred_state"] = model_state.predict(X)
    df["pred_perf"] = model_perf.predict(X).clip(0,100)
    df["pred_condition"] = model_cond.predict(X)
    df["critical_alert"] = (iso_model.predict(X) == -1).astype(int)

    stability = (1 - df["power_variability"]/2).clip(0,1) * 100
    df["Health_Score"] = (
        (0.6*df["pred_perf"] + 0.4*stability)
        * np.where(df["critical_alert"]==1,0.4,1.0)
    ).clip(0,100)

    # ---- Business rule (NO DB)
    def maintenance_rule(r):
        if r["critical_alert"]: return "Preventive Maintenance Suggested"
        if r["Health_Score"] < 50: return "Check Cooling Efficiency"
        return "Normal Operation"

    df["Maintenance_Advice"] = df.apply(maintenance_rule, axis=1)

    return df