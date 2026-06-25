import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import shap

# Generate synthetic dataset
np.random.seed(42)
n_samples = 2200

# Features
crops = ['Rice', 'Wheat']
npk_rice = [90, 42, 43]
npk_wheat = [80, 40, 40]

data = []
for _ in range(n_samples):
    crop = np.random.choice(crops)
    if crop == 'Rice':
        N, P, K = npk_rice
    else:
        N, P, K = npk_wheat

    # Add some variation
    N += np.random.normal(0, 5)
    P += np.random.normal(0, 2)
    K += np.random.normal(0, 2)

    temperature = np.random.uniform(20, 40)
    humidity = np.random.uniform(40, 90)
    ph = np.random.uniform(5.5, 8.5)
    rainfall = np.random.uniform(0, 50)
    soil_moisture = np.random.uniform(20, 80)
    light = np.random.uniform(500, 2000)

    # Yield logic (simplified)
    yield_score = (
        0.1 * N + 0.1 * P + 0.1 * K +
        -0.05 * abs(temperature - 28) +
        0.02 * humidity +
        -0.1 * abs(ph - 7) +
        0.01 * rainfall +
        0.02 * soil_moisture +
        0.001 * light
    )

    if yield_score > 80:
        yield_class = 'High'
    elif yield_score > 60:
        yield_class = 'Medium'
    else:
        yield_class = 'Low'

    data.append({
        'crop': crop,
        'N': N, 'P': P, 'K': K,
        'temperature': temperature,
        'humidity': humidity,
        'ph': ph,
        'rainfall': rainfall,
        'soil_moisture': soil_moisture,
        'light': light,
        'yield': yield_class
    })

df = pd.DataFrame(data)
df.to_csv('training_data.csv', index=False)

# Prepare features
features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_moisture', 'light']
X = df[features]
y = df['yield']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

# Evaluate
y_pred = rf_model.predict(X_test)
print("Random Forest Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(rf_model, 'rf_model.pkl')

# SHAP explainer
explainer = shap.TreeExplainer(rf_model)
shap_values = explainer.shap_values(X_test)
joblib.dump(explainer, 'explainer.pkl')

print("Model and explainer saved.")
print(f"Dataset saved as training_data.csv with {len(df)} rows.")