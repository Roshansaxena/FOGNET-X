#!/bin/bash

echo "🚀 Upgrading FOGNET-X to ML-Based Decision Engine..."

source venv/bin/activate

# Install ML libraries
pip install scikit-learn joblib numpy

########################################
# Create Training Script
########################################

cat > train_model.py <<EOL
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
EOL

########################################
# Train Model
########################################

python train_model.py

########################################
# Replace Decision Engine
########################################

cat > core/decision_engine.py <<EOL
import joblib

class DecisionEngine:

    def __init__(self):
        self.model = joblib.load("risk_model.pkl")

    def evaluate(self, sensor_data):

        temp = sensor_data.get("temperature", 0)
        gas = sensor_data.get("gas", 0)

        prediction = self.model.predict([[temp, gas]])[0]

        risk_score = (0.6 * gas/1023) + (0.4 * temp/50)

        if prediction == 2:
            severity = "CRITICAL"
        elif prediction == 1:
            severity = "WARNING"
        else:
            severity = "NORMAL"

        return severity, round(risk_score, 3)
EOL

echo ""
echo "✅ FOGNET-X Successfully Upgraded to ML Decision Engine!"
echo ""
echo "Restart fog core using:"
echo "python -m services.mqtt_service"
