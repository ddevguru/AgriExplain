# AgriXplain Fusion (proposed model)

**What it is:** A custom **weighted probability fusion** of two tree classifiers trained on the same 9 agronomic features:

- `P_fused = (w_rf * P_rf + w_xgb * P_xgb) / (w_rf + w_xgb)` with default `w_rf=0.35`, `w_xgb=0.65`
- Predicted class = `argmax(P_fused)` (Low / Medium / High yield risk band)
- Confidence is `max(P_fused)`, **damped** when RF and XGB disagree on `argmax` (reduces overconfidence on ambiguous samples)

**Why it can beat a single model:** RF and XGB make partially independent errors; blending softmax outputs often improves robustness versus either alone. On the bundled synthetic validation split, **Fusion** slightly **outperformed** both RF and XGB (see `train_all_models.py` output and `fusion_metrics.json`).

**Code:** `backend/agrixplain_fusion.py` (math), `MLModelManager.predict_agrixplain_fusion()` and `predict_all()` (API uses `ensemble` = Fusion output).

**Refresh metrics:** From `backend/` run:

```bash
python train_all_models.py
```

This overwrites `fusion_metrics.json`, `rf_model.pkl`, `xgb_model.pkl`, etc., and prints a comparison table including **AgriXplain Fusion (ours)**.
