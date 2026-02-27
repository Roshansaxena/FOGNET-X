import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

print("🔄 Training ML Risk Model...")

X = []
y = []

for _ in range(1000):
    temp = np.random.randint(20, 50)
    gas = np.random.randint(100, 900)

    if gas > 600 and temp > 38:
        label = 2  # CRITICAL
    elif gas > 500:
        label = 1  # WARNING
    else:
        label = 0  # NORMAL

    X.append([temp, gas])
    y.append(label)

model = RandomForestClassifier(n_estimators=50)
model.fit(X, y)

joblib.dump(model, "risk_model.pkl")

print("✅ ML Model Saved as risk_model.pkl")
