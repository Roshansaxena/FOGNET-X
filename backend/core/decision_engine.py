import joblib
import pandas as pd
class DecisionEngine:

    def __init__(self):
        import os
        from core.config import PROJECT_ROOT

        model_path = os.path.join(PROJECT_ROOT, "risk_model.pkl")
        self.model = joblib.load(model_path)

    def evaluate(self, sensor_data):

        temp = sensor_data.get("temperature", 0)
        gas = sensor_data.get("gas", 0)



        features = pd.DataFrame([[temp, gas]], columns=["temperature", "gas"])
        prediction = self.model.predict(features)[0]

        risk_score = (0.6 * gas/1023) + (0.4 * temp/50)

        if prediction == 2:
            severity = "CRITICAL"
        elif prediction == 1:
            severity = "WARNING"
        else:
            severity = "NORMAL"

        return severity, round(risk_score, 3)
