"""Copy and catalog diagram assets from temp_docx_work."""
import shutil
from pathlib import Path

SRC = Path(r"c:\agri-xplain-smart-farming-platform\temp_docx_work\word\media")
DST_BW = Path(__file__).resolve().parent / "bw_archive"
DST_WEB = Path(__file__).resolve().parent / "website_color"

DST_BW.mkdir(parents=True, exist_ok=True)
DST_WEB.mkdir(parents=True, exist_ok=True)

for f in sorted(SRC.iterdir()):
    if f.suffix.lower() == ".png":
        shutil.copy(f, DST_BW / f.name)
    elif f.suffix.lower() in (".jpg", ".jpeg"):
        shutil.copy(f, DST_WEB / f.name)

print("bw", len(list(DST_BW.glob("*"))), "web", len(list(DST_WEB.glob("*"))))
