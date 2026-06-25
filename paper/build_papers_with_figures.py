"""One-command rebuild: B&W diagrams + colorful website shots + embed into papers."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print(">", " ".join(cmd))
    subprocess.check_call(cmd, cwd=str(cwd or ROOT))


def main() -> None:
    run([sys.executable, str(ROOT / "figures" / "rename_bw_assets.py")])
    run([sys.executable, str(ROOT / "figures" / "generate_paper_figures.py")], cwd=ROOT.parent / "backend")
    run([sys.executable, str(ROOT / "colorize_website_figures.py")])
    try:
        run([sys.executable, str(ROOT / "capture_website_screenshots.py")], cwd=ROOT.parent)
    except subprocess.CalledProcessError:
        print("Live screenshot capture skipped (dev server unavailable); using colorized archives.")
    run([sys.executable, str(ROOT / "embed_all_figures.py")])
    print("\nDone. Open:")
    print("  paper/AgriXplain_Journal_v3_Figures.docx")
    print("  paper/AgriXplain_Conference_v3_Figures.docx")


if __name__ == "__main__":
    main()
