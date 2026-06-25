import re
from pathlib import Path

xml = Path(r"c:\agri-xplain-smart-farming-platform\temp_docx_work\word\document.xml").read_text(
    encoding="utf-8", errors="ignore"
)
rels = Path(
    r"c:\agri-xplain-smart-farming-platform\temp_docx_work\word\_rels\document.xml.rels"
).read_text()
rid_to_media = {
    m.group(1): m.group(2)
    for m in re.finditer(r'Id="([^"]+)".*Target="([^"]+)"', rels)
    if "media/" in m.group(2)
}

paras = xml.split("</w:p>")
for i, ch in enumerate(paras):
    texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", ch)
    cap = "".join(texts).strip()
    has_blip = "blip" in ch
    if has_blip or cap.startswith("Fig"):
        if has_blip or cap.startswith("Fig"):
            media = ""
            m = re.search(r'r:embed="([^"]+)"', ch)
            if m:
                media = rid_to_media.get(m.group(1), "")
            print(f"[{i}] blip={has_blip} media={media[-20:] if media else '-'} | {cap[:85]}")
