"""Rename archived B&W diagram PNGs to semantic filenames."""
import shutil
from pathlib import Path

BW = Path(__file__).resolve().parent / "bw"
BW.mkdir(exist_ok=True)
ARCH = Path(__file__).resolve().parent / "bw_archive"

MAPPING = {
    "image1.png": "architecture.png",
    "image2.png": "deployment_topology.png",
    "image3.png": "hardware_block.png",
    "image4.png": "gpio_map.png",
    "image5.png": "sensor_pipeline.png",
    "image6.png": "er_diagram.png",
    "image7.png": "agrifusion_diagram.png",
    "image8.png": "shap_chart.png",
    "image9.png": "telemetry_chart.png",
    "image10.png": "yield_distribution.png",
    "image11.png": "damping_curve.png",
    "image16.png": "feature_vector.png",
    "image17.png": "model_comparison.png",
    "image22.png": "npk_chart.png",
}

for src_name, dst_name in MAPPING.items():
    src = ARCH / src_name
    if src.exists():
        shutil.copy(src, BW / dst_name)
        print("copied", dst_name)
