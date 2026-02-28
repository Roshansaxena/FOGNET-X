import numpy as np
import joblib
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

print("🔍 Evaluating ML Risk Model...\n")

# Load trained model
model = joblib.load("risk_model.pkl")

# Generate synthetic test data
X_test = []
y_true = []

for _ in range(1000):
    temp = np.random.randint(20, 50)
    gas = np.random.randint(100, 900)

    # True rule logic (ground truth)
    if gas > 600 and temp > 38:
        label = 2  # CRITICAL
    elif gas > 500:
        label = 1  # WARNING
    else:
        label = 0  # NORMAL

    X_test.append([temp, gas])
    y_true.append(label)

X_test = np.array(X_test)
y_true = np.array(y_true)

# Model predictions
y_pred = model.predict(X_test)

# Print metrics
print("Classification Report:")
print(classification_report(y_true, y_pred,
      target_names=["NORMAL", "WARNING", "CRITICAL"]))

# Confusion matrix
cm = confusion_matrix(y_true, y_pred)

print("Confusion Matrix:")
print(cm)

# Plot confusion matrix
plt.figure()
sns.heatmap(cm, annot=True, fmt="d",
            xticklabels=["NORMAL", "WARNING", "CRITICAL"],
            yticklabels=["NORMAL", "WARNING", "CRITICAL"])
plt.title("Confusion Matrix")
plt.ylabel("Actual")
plt.xlabel("Predicted")
plt.savefig("confusion_matrix.png")
plt.show()
