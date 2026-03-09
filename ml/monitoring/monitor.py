import os, time, psycopg, requests


DB_URL = f"postgresql://postgres:{os.getenv('DB_PASS')}@db:5432/{os.getenv('DB_NAME')}"
GH_REPO = os.getenv("GITHUB_REPO")
GH_TOKEN = os.getenv("GITHUB_TOKEN")

def check_and_trigger():
    sql = "SELECT COUNT(*) FROM alerts WHERE is_true_alarm = FALSE AND created_at > NOW() - INTERVAL '24 hours'"
    
    try:
        with psycopg.connect(DB_URL) as conn:
            count = conn.execute(sql).fetchone()[0]
            print(f"False Alarms found: {count}")

            if count >= 10:
                print("Threshold hit! Sending signal to GitHub...")
                url = f"https://api.github.com/repos/{GH_REPO}/dispatches"
                headers = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github.v3+json"}
                data = {"event_type": "model_performance_low"}
                
                requests.post(url, json=data, headers=headers)
                return True
    except Exception as e:
        print(f"Error: {e}")
    return False

if __name__ == "__main__":
    while True:
        if check_and_trigger():
            time.sleep(3600) #Time to retrain
        else:
            time.sleep(600)  # check every 10 minutes