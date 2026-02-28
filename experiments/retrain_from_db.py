import sqlite3
import pandas as pd
import joblib
from core.config import DB_NAME
from sklearn.ensemble import RandomForestClassifier

print("🔄 Retraining ML Model from Real Fog Data...\n")

# Load DB
conn =  sqlite3.connect(DB_NAME)
df = pd.read_sql_query("SELECT temperature, gas, severity FROM events", conn)
conn.close()

if len(df) < 100:
    print("⚠ Not enough data to retrain (need at least 100 rows)")
    exit()

# Convert severity to numeric labels
label_map = {
    "NORMAL": 0,
    "WARNING": 1,
    "CRITICAL": 2
}

df["label"] = df["severity"].map(label_map)

X = df[["temperature", "gas"]]
y = df["label"]

# Train new model
model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# Save updated model
joblib.dump(model, "risk_model.pkl")

print("✅ Model retrained using real fog data!")
print(f"Training samples used: {len(df)}")
