"""
AgriXplain Fusion — project-specific ensemble classifier.

Combines base learners (Random Forest, XGBoost) via weighted softmax fusion,
with optional Bayesian-branch fallback when tree models are unavailable.

This is the primary "our model" used as `ensemble` in predict_all().
Weights default to w_rf=0.35, w_xgb=0.65 (XGBoost typically strongest on validation).
When RF and XGB disagree on argmax, confidence is damped to reflect epistemic uncertainty.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

# Tunable fusion weights (must sum to 1 when both trees present)
W_RF = 0.35
W_XGB = 0.65


CONF_GATE = 0.65
DOMINANT_BLEND = 0.80
CONF_MARGIN = 0.02


def _load_weights_from_metrics() -> Tuple[float, float, float, float, float]:
    metrics_path = Path(__file__).resolve().parent / "fusion_metrics.json"
    if not metrics_path.exists():
        return W_RF, W_XGB, CONF_GATE, DOMINANT_BLEND, CONF_MARGIN
    try:
        data = json.loads(metrics_path.read_text(encoding="utf-8"))
        weights = data.get("weights", {})
        rf = float(weights.get("rf", W_RF))
        xgb = float(weights.get("xgb", W_XGB))
        rule = data.get("decision_rule", {})
        gate = float(rule.get("confidence_gate", CONF_GATE))
        dom = float(rule.get("dominant_blend", DOMINANT_BLEND))
        margin = float(rule.get("confidence_margin", CONF_MARGIN))
        if rf > 0 and xgb > 0:
            total = rf + xgb
            return rf / total, xgb / total, gate, dom, margin
    except Exception:
        pass
    return W_RF, W_XGB, CONF_GATE, DOMINANT_BLEND, CONF_MARGIN


W_RF, W_XGB, CONF_GATE, DOMINANT_BLEND, CONF_MARGIN = _load_weights_from_metrics()

CLASS_IDX = {0: "Low", 1: "Medium", 2: "High"}
IDX_CLASS = {"Low": 0, "Medium": 1, "High": 2}


def weighted_proba_fusion(
    proba_list: List[np.ndarray], weights: List[float]
) -> Tuple[np.ndarray, float, bool]:
    """
    Returns fused probability vector, agreement flag (RF vs XGB same argmax if len>=2).
    """
    w = np.array(weights, dtype=float)
    w = w / w.sum()
    fused = np.zeros_like(proba_list[0], dtype=float)
    for wi, p in zip(w, proba_list):
        fused += wi * p
    agree = True
    if len(proba_list) >= 2:
        p_rf, p_xgb = proba_list[0], proba_list[1]
        a0 = int(np.argmax(p_rf))
        a1 = int(np.argmax(p_xgb))
        agree = a0 == a1
        if not agree:
            rf_conf = float(np.max(p_rf))
            xgb_conf = float(np.max(p_xgb))
            if rf_conf >= CONF_GATE and (rf_conf - xgb_conf) >= CONF_MARGIN:
                fused = DOMINANT_BLEND * p_rf + (1.0 - DOMINANT_BLEND) * p_xgb
            elif xgb_conf >= CONF_GATE and (xgb_conf - rf_conf) >= CONF_MARGIN:
                fused = (1.0 - DOMINANT_BLEND) * p_rf + DOMINANT_BLEND * p_xgb
    return fused, agree


def fusion_confidence_from_probs(fused: np.ndarray, base_models_agree: bool) -> float:
    mx = float(np.max(fused))
    if not base_models_agree:
        return max(0.35, mx * 0.88)  # damp when RF/XGB disagree
    return mx


def predict_yield_label_from_fused(fused: np.ndarray) -> str:
    return CLASS_IDX[int(np.argmax(fused))]

