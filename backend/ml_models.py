import joblib
import json
import os
from typing import Dict, List, Union

import numpy as np
import pandas as pd
import shap

from agrixplain_fusion import (
    W_RF,
    W_XGB,
    weighted_proba_fusion,
    fusion_confidence_from_probs,
    predict_yield_label_from_fused,
)

class MLModelManager:
    def __init__(self):
        self.rf_model = None
        self.xgb_model = None
        self.bayesian_model = None
        self.shap_rf = None
        self.shap_xgb = None

        # Required before _load_models() → _validate_loaded_models() → _X_for_model()
        self.feature_names = [
            'N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'soil_moisture', 'light'
        ]

        # Load models
        self._load_models()
        
        # NPK values per crop
        self.NPK_VALUES = {
            'Rice': {'N': 90, 'P': 42, 'K': 43},
            'Wheat': {'N': 120, 'P': 60, 'K': 80},
            'Maize': {'N': 85, 'P': 35, 'K': 45},
            'Cotton': {'N': 100, 'P': 50, 'K': 50},
            'Tomato': {'N': 110, 'P': 55, 'K': 65},
            'Sugarcane': {'N': 150, 'P': 70, 'K': 90},
            'Potato': {'N': 95, 'P': 45, 'K': 55},
            'Onion': {'N': 80, 'P': 40, 'K': 45},
            'Banana': {'N': 100, 'P': 50, 'K': 90},
            'Mango': {'N': 75, 'P': 35, 'K': 40},
            'Chickpea': {'N': 20, 'P': 60, 'K': 25},
            'Soybean': {'N': 20, 'P': 60, 'K': 30},
            'Groundnut': {'N': 20, 'P': 60, 'K': 30},
            'Turmeric': {'N': 120, 'P': 60, 'K': 100},
            'Chili': {'N': 100, 'P': 50, 'K': 60},
            'Brinjal': {'N': 100, 'P': 50, 'K': 60},
            'Cabbage': {'N': 120, 'P': 60, 'K': 80},
            'Cauliflower': {'N': 120, 'P': 60, 'K': 80},
            'Okra': {'N': 100, 'P': 50, 'K': 60},
            'Cucumber': {'N': 100, 'P': 50, 'K': 60},
            'Watermelon': {'N': 80, 'P': 40, 'K': 50},
            'Pomegranate': {'N': 75, 'P': 35, 'K': 40},
            'Grapes': {'N': 100, 'P': 50, 'K': 90},
            'Apple': {'N': 75, 'P': 35, 'K': 40},
            'Orange': {'N': 100, 'P': 50, 'K': 90},
            'Lemon': {'N': 100, 'P': 50, 'K': 90}
        }
        
        # Model performance metrics: base learners + AgriXplain Fusion (see train_all_models.py → fusion_metrics.json)
        self.model_metrics = {
            'rf': {'accuracy': 0.923, 'f1_score': 0.91, 'uncertainty': 'Low', 'shap_ready': True},
            'xgb': {'accuracy': 0.941, 'f1_score': 0.93, 'uncertainty': 'Low', 'shap_ready': True},
            'bayesian': {'accuracy': 0.897, 'f1_score': 0.88, 'uncertainty': 'High', 'shap_ready': False},
            'agrixplain_fusion': {
                'accuracy': 0.707,
                'f1_score': 0.70,
                'uncertainty': 'Low',
                'shap_ready': True,
                'note': 'Weighted RF+XGB fusion; fusion_metrics.json from train_all_models.py overrides defaults.',
            },
        }
        self._load_fusion_metrics()
        self._load_model_benchmark()
    
    def _load_models(self):
        """Load all trained models"""
        model_dir = os.path.dirname(os.path.abspath(__file__))
        
        try:
            if os.path.exists(os.path.join(model_dir, 'rf_model.pkl')):
                self.rf_model = joblib.load(os.path.join(model_dir, 'rf_model.pkl'))
        except Exception as e:
            print(f"Error loading RF model: {e}")
            self.rf_model = None

        try:
            if os.path.exists(os.path.join(model_dir, 'xgb_model.pkl')):
                self.xgb_model = joblib.load(os.path.join(model_dir, 'xgb_model.pkl'))
        except Exception as e:
            print(f"Error loading XGBoost model: {e}")
            self.xgb_model = None

        try:
            if os.path.exists(os.path.join(model_dir, 'bayes_model.pkl')):
                self.bayesian_model = joblib.load(os.path.join(model_dir, 'bayes_model.pkl'))
        except Exception as e:
            print(f"Error loading Bayesian model: {e}")
            self.bayesian_model = None

        self._validate_loaded_models()

    def _X_for_model(self, model, features: List[float]) -> Union[pd.DataFrame, np.ndarray]:
        """
        Match training-time input layout. Estimators fit on a pandas DataFrame get
        `feature_names_in_`; passing bare numpy triggers repeated UserWarnings during
        API polling (e.g. /api/dashboard).
        """
        if model is None:
            return np.asarray([features], dtype=float)
        fitted_names = getattr(model, "feature_names_in_", None)
        if fitted_names is None:
            return np.asarray([features], dtype=float)
        frame = pd.DataFrame([features], columns=self.feature_names)
        cols = list(fitted_names)
        for c in cols:
            if c not in frame.columns:
                frame[c] = 0.0
        return frame[cols]

    def _feature_probe_array(self) -> np.ndarray:
        """One row matching training feature order (avoids load OK / predict crash)."""
        return np.asarray(
            [[90.0, 42.0, 43.0, 28.0, 60.0, 7.0, 40.0, 55.0, 1000.0]], dtype=float
        )

    def _validate_loaded_models(self) -> None:
        """
        Drop tree/checkpoint models that fail at inference (common when .pkl was
        built with a different scikit-learn / XGBoost than the runtime).
        """
        probe_row: List[float] = list(self._feature_probe_array()[0])

        if self.rf_model is not None:
            try:
                self.rf_model.predict_proba(self._X_for_model(self.rf_model, probe_row))
                self.shap_rf = shap.TreeExplainer(self.rf_model)
            except Exception as e:
                print(
                    "[AgriXplain] Random Forest is unusable with this scikit-learn build "
                    f"({e}). Fix: use the project venv and `pip install -r requirements.txt`, "
                    "or run `python train_all_models.py` from the backend folder to regenerate "
                    "rf_model.pkl with your current packages."
                )
                self.rf_model = None
                self.shap_rf = None

        if self.xgb_model is not None:
            try:
                self.xgb_model.predict_proba(self._X_for_model(self.xgb_model, probe_row))
                self.shap_xgb = shap.TreeExplainer(self.xgb_model)
            except Exception as e:
                print(
                    "[AgriXplain] XGBoost model failed inference after load "
                    f"({e}). Regenerate xgb_model.pkl with `python train_all_models.py` "
                    "or match xgboost version used for training."
                )
                self.xgb_model = None
                self.shap_xgb = None

        if self.bayesian_model is not None:
            try:
                self.bayesian_model.predict(
                    self._X_for_model(self.bayesian_model, probe_row),
                    return_std=True,
                )
            except Exception as e:
                print(
                    "[AgriXplain] Bayesian Ridge model failed inference after load "
                    f"({e}). Regenerate bayes_model.pkl with `python train_all_models.py`."
                )
                self.bayesian_model = None

    def _load_fusion_metrics(self) -> None:
        model_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(model_dir, 'fusion_metrics.json')
        if not os.path.exists(path):
            return
        try:
            with open(path, encoding='utf-8') as f:
                data = json.load(f)
            if 'accuracy' in data and 'f1_score' in data:
                self.model_metrics['agrixplain_fusion']['accuracy'] = float(data['accuracy'])
                self.model_metrics['agrixplain_fusion']['f1_score'] = float(data['f1_score'])
        except Exception as e:
            print(f"Could not load fusion_metrics.json: {e}")

    def _load_model_benchmark(self) -> None:
        """Load full model comparison metrics when available."""
        model_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(model_dir, 'model_benchmark.json')
        if not os.path.exists(path):
            return
        try:
            with open(path, encoding='utf-8') as f:
                data = json.load(f)
            models = data.get("models", {})
            mapping = {
                "random_forest": "rf",
                "xgboost": "xgb",
                "bayesian_ridge": "bayesian",
                "agrixplain_fusion": "agrixplain_fusion",
            }
            for src_key, dst_key in mapping.items():
                if src_key in models:
                    self.model_metrics[dst_key]["accuracy"] = float(models[src_key]["accuracy"])
                    self.model_metrics[dst_key]["f1_score"] = float(models[src_key]["f1_score"])
        except Exception as e:
            print(f"Could not load model_benchmark.json: {e}")

    def predict_agrixplain_fusion(self, features: List[float]) -> Dict:
        """
        Proposed AgriXplain model: weighted softmax fusion of RF + XGBoost probabilities.
        Falls back to XGB → RF → Bayesian if only some base models load.
        """
        proba_list = []
        weights = []

        if self.rf_model:
            proba_list.append(
                self.rf_model.predict_proba(self._X_for_model(self.rf_model, features))[0]
            )
            weights.append(W_RF)
        if self.xgb_model:
            proba_list.append(
                self.xgb_model.predict_proba(self._X_for_model(self.xgb_model, features))[0]
            )
            weights.append(W_XGB)

        if len(proba_list) >= 2:
            fused, agree = weighted_proba_fusion(proba_list, weights)
            yc = predict_yield_label_from_fused(fused)
            conf = fusion_confidence_from_probs(fused, agree)
            return {
                'yield': yc,
                'confidence': conf,
                'model': 'AgriXplainFusion',
                'rf_xgb_agree': agree,
            }
        if self.xgb_model:
            return {**self.predict_xgb(features), 'model': 'AgriXplainFusion(XGB-only)'}
        if self.rf_model:
            return {**self.predict_rf(features), 'model': 'AgriXplainFusion(RF-only)'}
        return {**self.predict_bayesian(features), 'model': 'AgriXplainFusion(Bayesian-fallback)'}

    def get_npk_for_crop(self, crop: str) -> Dict[str, float]:
        """Get NPK values for a crop"""
        return self.NPK_VALUES.get(crop, self.NPK_VALUES['Rice'])
    
    def predict_rf(self, features: List[float]) -> Dict:
        """Random Forest prediction"""
        if not self.rf_model:
            return {'yield': 'Medium', 'confidence': 0.5}

        X = self._X_for_model(self.rf_model, features)
        pred_proba = self.rf_model.predict_proba(X)[0]
        pred_class = self.rf_model.predict(X)[0]
        
        # Map to HIGH/MEDIUM/LOW
        class_mapping = {0: 'Low', 1: 'Medium', 2: 'High'}
        yield_class = class_mapping.get(int(pred_class), 'Medium')
        confidence = float(max(pred_proba))
        
        return {'yield': yield_class, 'confidence': confidence}
    
    def predict_xgb(self, features: List[float]) -> Dict:
        """XGBoost prediction"""
        if not self.xgb_model:
            return {'yield': 'Medium', 'confidence': 0.5}

        X = self._X_for_model(self.xgb_model, features)
        pred_proba = self.xgb_model.predict_proba(X)[0]
        pred_class = self.xgb_model.predict(X)[0]
        
        class_mapping = {0: 'Low', 1: 'Medium', 2: 'High'}
        yield_class = class_mapping.get(int(pred_class), 'Medium')
        confidence = float(max(pred_proba))
        
        return {'yield': yield_class, 'confidence': confidence}
    
    def predict_bayesian(self, features: List[float]) -> Dict:
        """Bayesian prediction with uncertainty"""
        if not self.bayesian_model:
            return {
                'yield': 'Medium',
                'confidence': 0.5,
                'uncertainty': 15.0,
                'risk_level': 'Medium'
            }

        X = self._X_for_model(self.bayesian_model, features)
        pred, std = self.bayesian_model.predict(X, return_std=True)
        
        # Convert to yield class
        if pred[0] > 0.7:
            yield_class = 'High'
        elif pred[0] > 0.4:
            yield_class = 'Medium'
        else:
            yield_class = 'Low'
        
        uncertainty = float(std[0] * 100)  # Convert to percentage
        confidence = float(pred[0])
        
        # Risk level based on uncertainty
        if uncertainty < 10:
            risk_level = 'Low'
        elif uncertainty < 20:
            risk_level = 'Medium'
        else:
            risk_level = 'High'
        
        return {
            'yield': yield_class,
            'confidence': confidence,
            'uncertainty': uncertainty,
            'risk_level': risk_level
        }
    
    def predict_all(self, features: List[float]) -> Dict:
        """Get predictions from all models; primary `ensemble` is AgriXplain Fusion."""
        rf_pred = self.predict_rf(features)
        xgb_pred = self.predict_xgb(features)
        bayesian_pred = self.predict_bayesian(features)
        fusion_pred = self.predict_agrixplain_fusion(features)

        # Primary deployed model: weighted fusion (RF + XGB), not single XGB alone
        ensemble = {
            'yield': fusion_pred['yield'],
            'confidence': fusion_pred['confidence'],
        }

        shap_values = self.get_shap_values(features)

        return {
            'rf': rf_pred,
            'xgb': xgb_pred,
            'bayesian': bayesian_pred,
            'agrixplain_fusion': fusion_pred,
            'ensemble': ensemble,
            'shap_values': shap_values,
        }
    
    def get_shap_values(self, features: List[float]) -> Dict[str, float]:
        """Get SHAP feature importance values"""
        # Align with RF training layout when the model was fit on a DataFrame
        if self.shap_rf and self.rf_model:
            X = self._X_for_model(self.rf_model, features)
            X_shap = X.to_numpy(dtype=float) if isinstance(X, pd.DataFrame) else X
            shap_values = self.shap_rf.shap_values(X_shap)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # Use positive class

            # Convert to dictionary with percentages
            shap_dict = {}
            total = sum(abs(v) for v in shap_values[0])
            names = (
                list(self.rf_model.feature_names_in_)
                if getattr(self.rf_model, "feature_names_in_", None) is not None
                else self.feature_names
            )
            for name, val in zip(names, shap_values[0]):
                if total > 0:
                    percentage = (abs(val) / total) * 100
                else:
                    percentage = 0
                shap_dict[name] = round(percentage, 2)
            
            return shap_dict
        
        # Fallback: equal distribution
        return {name: round(100 / len(self.feature_names), 2) for name in self.feature_names}
    
    def get_shap_explanation(self, features: List[float], shap_values: Dict[str, float]) -> Dict[str, str]:
        """Get human-readable SHAP explanations"""
        explanations = {}
        
        # Get top 3 features
        sorted_features = sorted(shap_values.items(), key=lambda x: x[1], reverse=True)[:3]
        
        for feature, importance in sorted_features:
            idx = self.feature_names.index(feature)
            value = features[idx]
            
            if feature == 'temperature':
                if value > 35:
                    explanations[feature] = f"High temperature ({value}°C) may reduce yield by {importance:.1f}%"
                elif value < 20:
                    explanations[feature] = f"Low temperature ({value}°C) may reduce yield by {importance:.1f}%"
                else:
                    explanations[feature] = f"Optimal temperature ({value}°C) increases yield by {importance:.1f}%"
            elif feature == 'rainfall':
                explanations[feature] = f"Rainfall of {value}mm contributes {importance:.1f}% to yield prediction"
            elif feature == 'soil_moisture':
                if value < 40:
                    explanations[feature] = f"Low soil moisture ({value}%) may reduce yield by {importance:.1f}%"
                else:
                    explanations[feature] = f"Good soil moisture ({value}%) increases yield by {importance:.1f}%"
            else:
                explanations[feature] = f"{feature} contributes {importance:.1f}% to yield prediction"
        
        return explanations
    
    def get_model_comparison(self) -> Dict:
        """Get model performance comparison (includes AgriXplain Fusion)."""
        fusion = self.model_metrics['agrixplain_fusion']
        return {
            'models': [
                {
                    'name': 'AgriFusion (AgriXplain Model)',
                    'accuracy': fusion['accuracy'],
                    'f1_score': fusion['f1_score'],
                    'uncertainty': fusion.get('uncertainty', 'Low'),
                    'shap_ready': fusion.get('shap_ready', True),
                },
                {
                    'name': 'Random Forest',
                    'accuracy': self.model_metrics['rf']['accuracy'],
                    'f1_score': self.model_metrics['rf']['f1_score'],
                    'uncertainty': self.model_metrics['rf']['uncertainty'],
                    'shap_ready': self.model_metrics['rf']['shap_ready']
                },
                {
                    'name': 'XGBoost',
                    'accuracy': self.model_metrics['xgb']['accuracy'],
                    'f1_score': self.model_metrics['xgb']['f1_score'],
                    'uncertainty': self.model_metrics['xgb']['uncertainty'],
                    'shap_ready': self.model_metrics['xgb']['shap_ready']
                },
                {
                    'name': 'Bayesian Ridge',
                    'accuracy': self.model_metrics['bayesian']['accuracy'],
                    'f1_score': self.model_metrics['bayesian']['f1_score'],
                    'uncertainty': self.model_metrics['bayesian']['uncertainty'],
                    'shap_ready': self.model_metrics['bayesian']['shap_ready']
                }
            ]
        }
    
    def models_loaded(self) -> bool:
        """Check if models are loaded"""
        return self.rf_model is not None or self.xgb_model is not None or self.bayesian_model is not None

