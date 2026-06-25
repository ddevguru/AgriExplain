"""
Train all ML models for AgriXplain:
1. Random Forest Classifier
2. XGBoost Classifier
3. Bayesian Ridge Regression
4. SHAP Explainers
"""

import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import BayesianRidge
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, f1_score
import xgboost as xgb
import joblib
import shap
import os

import agrixplain_fusion

# Set random seed for reproducibility
np.random.seed(42)
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Generate comprehensive synthetic dataset
n_samples = 2200

# Crop types and their NPK values
crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Tomato', 'Sugarcane', 'Potato']
npk_values = {
    'Rice': {'N': 90, 'P': 42, 'K': 43},
    'Wheat': {'N': 120, 'P': 60, 'K': 80},
    'Maize': {'N': 85, 'P': 35, 'K': 45},
    'Cotton': {'N': 100, 'P': 50, 'K': 50},
    'Tomato': {'N': 110, 'P': 55, 'K': 65},
    'Sugarcane': {'N': 150, 'P': 70, 'K': 90},
    'Potato': {'N': 95, 'P': 45, 'K': 55}
}

print("Generating synthetic dataset...")
data = []

for _ in range(n_samples):
    crop = np.random.choice(crops)
    npk = npk_values[crop]
    
    # Add variation to NPK
    N = npk['N'] + np.random.normal(0, 5)
    P = npk['P'] + np.random.normal(0, 2)
    K = npk['K'] + np.random.normal(0, 2)
    
    # Environmental factors
    temperature = np.random.uniform(15, 40)
    humidity = np.random.uniform(40, 95)
    ph = np.random.uniform(5.5, 8.5)
    rainfall = np.random.uniform(0, 100)
    soil_moisture = np.random.uniform(20, 85)
    light = np.random.uniform(500, 2000)
    
    # Yield calculation (more realistic)
    yield_score = (
        0.15 * (N / 100) + 0.15 * (P / 50) + 0.15 * (K / 50) +
        -0.1 * abs(temperature - 28) / 10 +
        0.05 * (humidity / 100) +
        -0.1 * abs(ph - 7) +
        0.05 * (rainfall / 100) +
        0.1 * (soil_moisture / 100) +
        0.05 * (light / 2000) +
        np.random.normal(0, 0.1)
    )
    
    # Classify yield
    if yield_score > 0.7:
        yield_class = 'High'
    elif yield_score > 0.4:
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
df.to_csv(os.path.join(MODEL_DIR, 'training_data.csv'), index=False)
print(f"Dataset saved: {len(df)} samples")

# Prepare features
features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_moisture', 'light']
X = df[features]
y = df['yield']

# Encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)
# Secondary split for fair weight tuning (do not tune directly on final test set)
X_train_fit, X_val, y_train_fit, y_val = train_test_split(
    X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
)

print(f"\nTraining set: {len(X_train)} samples")
print(f"Test set: {len(X_test)} samples")

# ==================== 1. RANDOM FOREST ====================
print("\n" + "="*50)
print("Training Random Forest Classifier...")
print("="*50)

rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train_fit, y_train_fit)

# Evaluate
y_pred_rf = rf_model.predict(X_test)
rf_accuracy = accuracy_score(y_test, y_pred_rf)
rf_f1 = f1_score(y_test, y_pred_rf, average='weighted')

print(f"Random Forest Accuracy: {rf_accuracy:.4f}")
print(f"Random Forest F1-Score: {rf_f1:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred_rf, target_names=le.classes_))

# Save model
joblib.dump(rf_model, os.path.join(MODEL_DIR, 'rf_model.pkl'))
print("Random Forest model saved: rf_model.pkl")

# SHAP explainer for RF
print("\nCreating SHAP explainer for Random Forest...")
shap_rf = shap.TreeExplainer(rf_model)
joblib.dump(shap_rf, os.path.join(MODEL_DIR, 'shap_rf.pkl'))
print("SHAP explainer saved: shap_rf.pkl")

# ==================== 2. XGBOOST ====================
print("\n" + "="*50)
print("Training XGBoost Classifier...")
print("="*50)

xgb_model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
    eval_metric='mlogloss'
)
xgb_model.fit(X_train_fit, y_train_fit)

# Evaluate
y_pred_xgb = xgb_model.predict(X_test)
xgb_accuracy = accuracy_score(y_test, y_pred_xgb)
xgb_f1 = f1_score(y_test, y_pred_xgb, average='weighted')

print(f"XGBoost Accuracy: {xgb_accuracy:.4f}")
print(f"XGBoost F1-Score: {xgb_f1:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred_xgb, target_names=le.classes_))

# Save model
joblib.dump(xgb_model, os.path.join(MODEL_DIR, 'xgb_model.pkl'))
print("XGBoost model saved: xgb_model.pkl")

# SHAP explainer for XGBoost
print("\nCreating SHAP explainer for XGBoost...")
shap_xgb = shap.TreeExplainer(xgb_model)
joblib.dump(shap_xgb, os.path.join(MODEL_DIR, 'shap_xgb.pkl'))
print("SHAP explainer saved: shap_xgb.pkl")

# ==================== 3. BAYESIAN RIDGE ====================
print("\n" + "="*50)
print("Training Bayesian Ridge Regression...")
print("="*50)

# Convert yield to numeric for regression (0=Low, 1=Medium, 2=High)
bayesian_model = BayesianRidge(
    max_iter=300,
    compute_score=True
)
bayesian_model.fit(X_train_fit, y_train_fit)

# Evaluate (convert predictions back to classes)
y_pred_bayes = bayesian_model.predict(X_test)
y_pred_bayes_class = np.clip(np.round(y_pred_bayes), 0, 2).astype(int)
bayes_accuracy = accuracy_score(y_test, y_pred_bayes_class)
bayes_f1 = f1_score(y_test, y_pred_bayes_class, average='weighted')

print(f"Bayesian Accuracy: {bayes_accuracy:.4f}")
print(f"Bayesian F1-Score: {bayes_f1:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred_bayes_class, target_names=le.classes_))

# Save model
joblib.dump(bayesian_model, os.path.join(MODEL_DIR, 'bayes_model.pkl'))
print("Bayesian model saved: bayes_model.pkl")

# Save label encoder
joblib.dump(le, os.path.join(MODEL_DIR, 'label_encoder.pkl'))
print("Label encoder saved: label_encoder.pkl")

# ==================== SUMMARY ====================
print("\n" + "="*50)
print("TRAINING SUMMARY")
print("="*50)
print(f"\n{'Model':<20} {'Accuracy':<12} {'F1-Score':<12}")
print("-" * 50)
print(f"{'Random Forest':<20} {rf_accuracy:<12.4f} {rf_f1:<12.4f}")
print(f"{'XGBoost':<20} {xgb_accuracy:<12.4f} {xgb_f1:<12.4f}")
print(f"{'Bayesian':<20} {bayes_accuracy:<12.4f} {bayes_f1:<12.4f}")

# ==================== 4. AGRIXPLAIN FUSION (weighted RF + XGB proba) ====================
print("\n" + "="*50)
print("AgriXplain Fusion (validation-tuned weighted softmax)")
print("="*50)

p_rf_val = rf_model.predict_proba(X_val)
p_xgb_val = xgb_model.predict_proba(X_val)

best = {
    "score": -1.0, "w_rf": 0.5, "w_xgb": 0.5, "acc": 0.0, "f1": 0.0,
    "confidence_gate": 0.65, "dominant_blend": 0.8, "confidence_margin": 0.02,
}
for w_rf in np.linspace(0.05, 0.95, 19):
    w_xgb = 1.0 - w_rf
    for confidence_gate in [0.55, 0.60, 0.65, 0.70, 0.75]:
        for dominant_blend in [0.70, 0.75, 0.80, 0.85]:
            for confidence_margin in [0.01, 0.02, 0.03, 0.05]:
                agrixplain_fusion.CONF_GATE = float(confidence_gate)
                agrixplain_fusion.DOMINANT_BLEND = float(dominant_blend)
                agrixplain_fusion.CONF_MARGIN = float(confidence_margin)
                y_val_pred = []
                for p_rf, p_xgb in zip(p_rf_val, p_xgb_val):
                    p_val, _ = agrixplain_fusion.weighted_proba_fusion([p_rf, p_xgb], [w_rf, w_xgb])
                    y_val_pred.append(int(np.argmax(p_val)))
                y_val_pred = np.array(y_val_pred)
                acc_val = accuracy_score(y_val, y_val_pred)
                f1_val = f1_score(y_val, y_val_pred, average='weighted')
                # Primary objective: accuracy, secondary weighted F1
                score = 0.7 * acc_val + 0.3 * f1_val
                if score > best["score"]:
                    best = {
                        "score": float(score),
                        "w_rf": float(w_rf),
                        "w_xgb": float(w_xgb),
                        "acc": float(acc_val),
                        "f1": float(f1_val),
                        "confidence_gate": float(confidence_gate),
                        "dominant_blend": float(dominant_blend),
                        "confidence_margin": float(confidence_margin),
                    }

w_rf, w_xgb = best["w_rf"], best["w_xgb"]
print(f"Best validation weights -> w_rf={w_rf:.2f}, w_xgb={w_xgb:.2f}")
print(
    f"Decision rule -> gate={best['confidence_gate']:.2f}, "
    f"dominant_blend={best['dominant_blend']:.2f}, margin={best['confidence_margin']:.2f}"
)
print(f"Validation Accuracy: {best['acc']:.4f}")
print(f"Validation F1-Score: {best['f1']:.4f}")

# Retrain base learners on full training split after tuning fusion rule.
rf_model.fit(X_train, y_train)
xgb_model.fit(X_train, y_train)
bayesian_model.fit(X_train, y_train)

y_pred_rf = rf_model.predict(X_test)
rf_accuracy = accuracy_score(y_test, y_pred_rf)
rf_f1 = f1_score(y_test, y_pred_rf, average='weighted')

y_pred_xgb = xgb_model.predict(X_test)
xgb_accuracy = accuracy_score(y_test, y_pred_xgb)
xgb_f1 = f1_score(y_test, y_pred_xgb, average='weighted')

y_pred_bayes = bayesian_model.predict(X_test)
y_pred_bayes_class = np.clip(np.round(y_pred_bayes), 0, 2).astype(int)
bayes_accuracy = accuracy_score(y_test, y_pred_bayes_class)
bayes_f1 = f1_score(y_test, y_pred_bayes_class, average='weighted')

p_rf_test = rf_model.predict_proba(X_test)
p_xgb_test = xgb_model.predict_proba(X_test)
y_fusion = []
for p_rf, p_xgb in zip(p_rf_test, p_xgb_test):
    agrixplain_fusion.CONF_GATE = best["confidence_gate"]
    agrixplain_fusion.DOMINANT_BLEND = best["dominant_blend"]
    agrixplain_fusion.CONF_MARGIN = best["confidence_margin"]
    p_fusion, _ = agrixplain_fusion.weighted_proba_fusion([p_rf, p_xgb], [w_rf, w_xgb])
    y_fusion.append(int(np.argmax(p_fusion)))
y_fusion = np.array(y_fusion)
fusion_accuracy = accuracy_score(y_test, y_fusion)
fusion_f1 = f1_score(y_test, y_fusion, average='weighted')

# Overwrite artifacts with final retrained models (full training split).
joblib.dump(rf_model, os.path.join(MODEL_DIR, 'rf_model.pkl'))
joblib.dump(xgb_model, os.path.join(MODEL_DIR, 'xgb_model.pkl'))
joblib.dump(bayesian_model, os.path.join(MODEL_DIR, 'bayes_model.pkl'))
joblib.dump(shap.TreeExplainer(rf_model), os.path.join(MODEL_DIR, 'shap_rf.pkl'))
joblib.dump(shap.TreeExplainer(xgb_model), os.path.join(MODEL_DIR, 'shap_xgb.pkl'))

print(f"Fusion Accuracy: {fusion_accuracy:.4f}")
print(f"Fusion F1-Score: {fusion_f1:.4f}")

fusion_metrics_path = os.path.join(MODEL_DIR, 'fusion_metrics.json')
base_best_acc = max(rf_accuracy, xgb_accuracy, bayes_accuracy)
base_best_f1 = max(rf_f1, xgb_f1, bayes_f1)
with open(fusion_metrics_path, 'w', encoding='utf-8') as f:
    json.dump(
        {
            'accuracy': round(float(fusion_accuracy), 6),
            'f1_score': round(float(fusion_f1), 6),
            'weights': {'rf': w_rf, 'xgb': w_xgb},
            'decision_rule': {
                'confidence_gate': best["confidence_gate"],
                'dominant_blend': best["dominant_blend"],
                'confidence_margin': best["confidence_margin"],
            },
            'validation': {
                'accuracy': round(float(best["acc"]), 6),
                'f1_score': round(float(best["f1"]), 6),
            },
            'improvement_vs_best_base': {
                'accuracy_abs': round(float(fusion_accuracy - base_best_acc), 6),
                'accuracy_rel_percent': round(float(((fusion_accuracy - base_best_acc) / max(base_best_acc, 1e-9)) * 100), 4),
                'f1_abs': round(float(fusion_f1 - base_best_f1), 6),
                'f1_rel_percent': round(float(((fusion_f1 - base_best_f1) / max(base_best_f1, 1e-9)) * 100), 4),
            },
            'description': 'Weighted probability fusion of RandomForest and XGBoost (AgriXplain proposed model).',
        },
        f,
        indent=2,
    )
print(f"Saved {fusion_metrics_path}")

benchmark_path = os.path.join(MODEL_DIR, 'model_benchmark.json')
with open(benchmark_path, 'w', encoding='utf-8') as f:
    json.dump(
        {
            "dataset": {"samples": int(len(df)), "test_samples": int(len(X_test)), "seed": 42},
            "models": {
                "agrixplain_fusion": {"accuracy": round(float(fusion_accuracy), 6), "f1_score": round(float(fusion_f1), 6)},
                "random_forest": {"accuracy": round(float(rf_accuracy), 6), "f1_score": round(float(rf_f1), 6)},
                "xgboost": {"accuracy": round(float(xgb_accuracy), 6), "f1_score": round(float(xgb_f1), 6)},
                "bayesian_ridge": {"accuracy": round(float(bayes_accuracy), 6), "f1_score": round(float(bayes_f1), 6)},
            },
            "fusion_weights": {"rf": round(float(w_rf), 2), "xgb": round(float(w_xgb), 2)},
            "best_base_model": {
                "accuracy": "random_forest" if rf_accuracy >= max(xgb_accuracy, bayes_accuracy) else ("xgboost" if xgb_accuracy >= bayes_accuracy else "bayesian_ridge"),
                "f1_score": "random_forest" if rf_f1 >= max(xgb_f1, bayes_f1) else ("xgboost" if xgb_f1 >= bayes_f1 else "bayesian_ridge"),
            },
        },
        f,
        indent=2,
    )
print(f"Saved {benchmark_path}")

print(f"\n{'Model':<28} {'Accuracy':<12} {'F1-Score':<12}")
print("-" * 52)
print(f"{'AgriXplain Fusion (ours)':<28} {fusion_accuracy:<12.4f} {fusion_f1:<12.4f}")
print(f"{'Random Forest':<28} {rf_accuracy:<12.4f} {rf_f1:<12.4f}")
print(f"{'XGBoost':<28} {xgb_accuracy:<12.4f} {xgb_f1:<12.4f}")
print(f"{'Bayesian':<28} {bayes_accuracy:<12.4f} {bayes_f1:<12.4f}")

print("\n" + "="*50)
print("FILES CREATED:")
print("="*50)
print("[ok] training_data.csv")
print("[ok] rf_model.pkl")
print("[ok] xgb_model.pkl")
print("[ok] bayes_model.pkl")
print("[ok] shap_rf.pkl")
print("[ok] shap_xgb.pkl")
print("[ok] label_encoder.pkl")
print("[ok] fusion_metrics.json  (AgriXplain Fusion validation scores)")
print("[ok] model_benchmark.json (all-model comparison scores)")

print("\nDone: all models trained successfully.")
best_single = "XGBoost" if xgb_accuracy >= rf_accuracy else "Random Forest"
print(f"Best single base learner: {best_single}")
print(f"AgriXplain Fusion accuracy: {fusion_accuracy:.4f} (compare with base learners above)")

