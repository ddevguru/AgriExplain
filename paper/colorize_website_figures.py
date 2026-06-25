"""Create colorful website figure fallbacks from archive JPGs if live capture unavailable."""
from pathlib import Path

from PIL import Image, ImageEnhance

WEB = Path(__file__).resolve().parent / "figures" / "website_color"
ARCH = WEB  # jpgs already copied here

MAPPING = {
    "image12.jpg": "web_farmer_dashboard.png",
    "image13.jpg": "web_farmer_dashboard.png",
    "image14.jpg": "web_farmer_dashboard.png",
    "image15.jpg": "web_admin_sensors.png",
    "image18.jpg": "web_login.png",
    "image19.jpg": "web_landing.png",
    "image20.jpg": "web_admin_overview.png",
    "image21.jpg": "web_admin_models.png",
}


def colorize(src: Path, dst: Path) -> None:
    import numpy as np

    im = Image.open(src).convert("RGB")
    arr = np.array(im, dtype=np.float32)
    # Stronger agri-green tint for colorful website figures in the paper
    arr[:, :, 0] = np.clip(arr[:, :, 0] * 0.85, 0, 255)   # reduce red
    arr[:, :, 1] = np.clip(arr[:, :, 1] * 1.35 + 25, 0, 255)  # boost green
    arr[:, :, 2] = np.clip(arr[:, :, 2] * 1.05 + 10, 0, 255)  # slight blue
    im = Image.fromarray(arr.astype(np.uint8))
    im = ImageEnhance.Color(im).enhance(2.5)
    im = ImageEnhance.Contrast(im).enhance(1.2)
    im.save(dst, "PNG", optimize=True)
    print("colorized", dst.name)


def main() -> None:
    WEB.mkdir(parents=True, exist_ok=True)
    for src_name, dst_name in MAPPING.items():
        src = ARCH / src_name
        dst = WEB / dst_name
        if src.exists():
            colorize(src, dst)
    # Ensure minimum set exists
    defaults = {
        "web_landing.png": "image19.jpg",
        "web_login.png": "image18.jpg",
        "web_farmer_dashboard.png": "image12.jpg",
        "web_admin_sensors.png": "image15.jpg",
        "web_admin_models.png": "image21.jpg",
        "web_admin_overview.png": "image20.jpg",
    }
    for dst_name, src_name in defaults.items():
        dst = WEB / dst_name
        src = ARCH / src_name
        if src.exists():
            colorize(src, dst)


if __name__ == "__main__":
    main()
