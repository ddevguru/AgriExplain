"""Generate readable high-DPI figures for AgriXplain journal/conference papers."""
from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import pandas as pd
import seaborn as sns
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from sklearn.metrics import confusion_matrix

import sys

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))
OUT = Path(__file__).resolve().parent / "bw"
DPI = 300

# Grayscale palette for print-ready diagrams
C_DARK = "#222222"
C_MID = "#666666"
C_LIGHT = "#dddddd"
C_FILL = "#f2f2f2"

plt.rcParams.update(
    {
        "font.size": 11,
        "axes.titlesize": 13,
        "axes.labelsize": 11,
        "legend.fontsize": 10,
        "figure.dpi": DPI,
        "savefig.dpi": DPI,
    }
)


def methodology_flowchart(path: Path) -> None:
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis("off")

    boxes = [
        (0.3, 2.0, "Stakeholder\nRequirements"),
        (2.0, 2.0, "Hardware &\nSensor BOM"),
        (3.7, 2.0, "ESP32\nFirmware"),
        (5.4, 2.0, "FastAPI\nBackend"),
        (7.1, 2.0, "AgriFusion\nML Pipeline"),
        (8.8, 2.0, "Dashboards &\nAdvisories"),
    ]
    for x, y, label in boxes:
        rect = FancyBboxPatch(
            (x, y),
            1.4,
            1.2,
            boxstyle="round,pad=0.08",
            linewidth=1.5,
            edgecolor=C_DARK,
            facecolor=C_FILL,
        )
        ax.add_patch(rect)
        ax.text(x + 0.7, y + 0.6, label, ha="center", va="center", fontsize=10, fontweight="bold")

    for x in [1.7, 3.4, 5.1, 6.8, 8.5]:
        ax.annotate(
            "",
            xy=(x + 0.15, 2.6),
            xytext=(x - 0.15, 2.6),
            arrowprops=dict(arrowstyle="->", lw=1.8, color=C_DARK),
        )

    ax.text(
        5.0,
        4.2,
        "AgriXplain System Design Methodology",
        ha="center",
        fontsize=14,
        fontweight="bold",
    )
    ax.text(
        5.0,
        0.5,
        "Iterative validation: calibration constants, API contracts, synthetic benchmark (N=2,200), field deployment checklist",
        ha="center",
        fontsize=9,
        style="italic",
    )
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def feature_vector_diagram(path: Path) -> None:
    features = [
        "N", "P", "K", "Temperature", "Humidity", "pH", "Rainfall", "Soil Moisture", "Light"
    ]
    fig, ax = plt.subplots(figsize=(10, 3.5))
    grays = [C_DARK, C_MID, "#999999", "#bbbbbb", "#cccccc", "#aaaaaa", "#888888", "#777777", "#555555"]
    for i, (feat, c) in enumerate(zip(features, grays)):
        ax.barh(0, 1, left=i, color=c, edgecolor="white", height=0.6)
        ax.text(i + 0.5, 0, feat, ha="center", va="center", fontsize=9, fontweight="bold", color="white")
    ax.set_xlim(0, len(features))
    ax.set_ylim(-0.5, 0.8)
    ax.set_title("Nine-Dimensional Feature Vector from Sensor Payload", fontweight="bold")
    ax.axis("off")
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def model_comparison(path: Path) -> None:
    bench = json.loads((BACKEND / "model_benchmark.json").read_text(encoding="utf-8"))
    models = bench["models"]
    names = list(models.keys())
    acc = [models[m]["accuracy"] for m in names]
    f1 = [models[m]["f1_score"] for m in names]
    labels = [n.replace("_", " ").title() for n in names]

    x = np.arange(len(labels))
    w = 0.35
    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.bar(x - w / 2, acc, w, label="Accuracy", color=C_DARK, edgecolor="black")
    ax.bar(x + w / 2, f1, w, label="Weighted F1", color=C_MID, edgecolor="black")
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=15, ha="right")
    ax.set_ylim(0, 1.0)
    ax.set_ylabel("Score")
    ax.set_title("Hold-Out Benchmark: Model Comparison (Synthetic Dataset)", fontweight="bold")
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def confusion_matrices(path: Path) -> None:
    df = pd.read_csv(BACKEND / "training_data.csv")
    features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall", "soil_moisture", "light"]
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder

    import agrixplain_fusion

    X = df[features]
    le = LabelEncoder()
    y = le.fit_transform(df["yield"])
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    rf = joblib.load(BACKEND / "rf_model.pkl")
    xgb_model = joblib.load(BACKEND / "xgb_model.pkl")

    y_rf = rf.predict(X_test)
    p_rf = rf.predict_proba(X_test)
    p_xgb = xgb_model.predict_proba(X_test)
    w_rf, w_xgb, _, _, _ = agrixplain_fusion._load_weights_from_metrics()
    y_fusion = []
    for i in range(len(X_test)):
        fused, _ = agrixplain_fusion.weighted_proba_fusion([p_rf[i], p_xgb[i]], [w_rf, w_xgb])
        y_fusion.append(int(np.argmax(fused)))
    y_fusion = np.array(y_fusion)

    fig, axes = plt.subplots(1, 2, figsize=(10, 4.2))
    for ax, y_pred, title in [
        (axes[0], y_fusion, "AgriFusion Ensemble"),
        (axes[1], y_rf, "Random Forest Baseline"),
    ]:
        cm = confusion_matrix(y_test, y_pred)
        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Greys",
            xticklabels=le.classes_,
            yticklabels=le.classes_,
            ax=ax,
            cbar=False,
        )
        ax.set_title(title, fontweight="bold")
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
    fig.suptitle("Confusion Matrices (Test Split, seed=42)", fontweight="bold", y=1.02)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def agrifusion_diagram(path: Path) -> None:
    fig, ax = plt.subplots(figsize=(9, 4))
    ax.axis("off")
    steps = [
        "RF probabilities  p_rf",
        "XGB probabilities p_xgb",
        "Weighted fusion\np_fused = w_rf·p_rf + w_xgb·p_xgb",
        "Disagreement gate\n(confidence damping)",
        "Final yield class\n(High / Medium / Low)",
    ]
    y = 0.85
    for i, step in enumerate(steps):
        box = FancyBboxPatch(
            (0.1 + i * 1.75, y - 0.12),
            1.55,
            0.35,
            boxstyle="round,pad=0.05",
            facecolor=C_FILL,
            edgecolor=C_DARK,
            linewidth=1.2,
        )
        ax.add_patch(box)
        ax.text(0.1 + i * 1.75 + 0.78, y + 0.05, step, ha="center", va="center", fontsize=8.5)
        if i < len(steps) - 1:
            ax.annotate(
                "",
                xy=(0.1 + (i + 1) * 1.75 - 0.05, y + 0.05),
                xytext=(0.1 + i * 1.75 + 1.6, y + 0.05),
                arrowprops=dict(arrowstyle="->", lw=1.5, color=C_DARK),
            )
    ax.set_xlim(0, 9.5)
    ax.set_ylim(0, 1.2)
    ax.set_title("AgriFusion Weighted Probability Fusion Pipeline", fontweight="bold", y=0.98)
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def dataset_distribution(path: Path) -> None:
    df = pd.read_csv(BACKEND / "training_data.csv")
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    crop_counts = df["crop"].value_counts()
    crop_counts.plot(kind="bar", ax=axes[0], color=C_DARK, edgecolor="black")
    axes[0].set_title("Samples per Crop (N=2,200)", fontweight="bold")
    axes[0].set_xlabel("Crop")
    axes[0].set_ylabel("Count")
    axes[0].tick_params(axis="x", rotation=30)

    yield_counts = df["yield"].value_counts().reindex(["High", "Medium", "Low"])
    yield_counts.plot(kind="bar", ax=axes[1], color=[C_DARK, C_MID, C_LIGHT], edgecolor="black")
    axes[1].set_title("Yield Class Distribution", fontweight="bold")
    axes[1].set_xlabel("Yield Risk Class")
    axes[1].set_ylabel("Count")
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    methodology_flowchart(OUT / "methodology_flowchart.png")
    feature_vector_diagram(OUT / "feature_vector.png")
    model_comparison(OUT / "model_comparison.png")
    confusion_matrices(OUT / "confusion_matrices.png")
    agrifusion_diagram(OUT / "agrifusion_diagram.png")
    dataset_distribution(OUT / "dataset_distribution.png")
    print(f"B&W figures saved to {OUT}")


if __name__ == "__main__":
    main()
