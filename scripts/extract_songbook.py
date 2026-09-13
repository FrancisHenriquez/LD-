"""Extract the supplied Resucitó edition into native, searchable song content.

Requires PyMuPDF. Reading order is column-first; typography identifies titles,
source references and chord rows. The PDF remains the source of truth.
"""
import json
import re
from pathlib import Path
import pymupdf

ROOT = Path(__file__).resolve().parents[1]
document = pymupdf.open(ROOT / "public/pdfs/resucito-xx-edicion-2014.pdf")

def spans(page):
    return [s for b in page.get_text("dict", flags=pymupdf.TEXTFLAGS_DICT & ~pymupdf.TEXT_PRESERVE_IMAGES)["blocks"]
            for line in b.get("lines", []) for s in line["spans"] if s["text"].strip()]

index = {}
for page in document[8:11]:
    for span in spans(page):
        match = re.match(r"(.+?)\s*\.{2,}\s*(\d+)\s*$", span["text"])
        if match:
            index[int(match[2])] = match[1].strip()
index[165] = "Zaqueo"

songs = []
for number in range(21, 259):
    content = spans(document[number - 1])
    titles = [s for s in content if 14 < s["size"] < 17 and s["bbox"][1] < 65]
    if titles:
        subtitle = [s for s in content if 9.8 < s["size"] < 10 and s["bbox"][1] < 85]
        song = {
            "id": str(number), "title": index[number],
            "source": " ".join(s["text"].strip() for s in subtitle),
            "category": "Precatecumenado" if number < 167 else "Cantos litúrgicos" if number < 205 else "Catecumenado" if number < 231 else "Elección",
            "pages": [], "lines": [],
        }
        songs.append(song)
        top = max(s["bbox"][3] for s in titles + subtitle)
    else:
        top = 0
    body = [s for s in content if top <= s["bbox"][1] < 563]
    if not body:
        continue
    song["pages"].append(number)
    for column in (0, 1):
        items = sorted([s for s in body if (s["bbox"][0] >= 300) == bool(column)], key=lambda s: (s["origin"][1], s["bbox"][0]))
        rows = []
        for span in items:
            baseline = span["origin"][1]
            if not rows or abs(rows[-1][0] - baseline) > 3:
                rows.append((baseline, [span]))
            else:
                rows[-1][1].append(span)
        previous = None
        for baseline, row in rows:
            row.sort(key=lambda s: s["bbox"][0])
            joined = row[0]["text"]
            for left, right in zip(row, row[1:]):
                joined += (" " if right["bbox"][0] - left["bbox"][2] > 2 else "") + right["text"]
            text = re.sub(r"\s+", " ", joined).strip().replace("\uf058", "✝").replace("\uf02a", "∗")
            # Red also marks liturgical directions and some spoken passages.
            # Only note names and chord modifiers may be hidden as chords.
            non_notes = re.sub(r"Do|Re|Mi|Fa|Sol|La|Si|aum|dim|sus|maj|b", "", text)
            chord = all(s["color"] == 16711680 for s in row) and not re.search(r"[^\W\d_]", non_notes, re.UNICODE)
            chorus = any(12 <= s["size"] < 13 and s["color"] == 0 for s in row)
            song["lines"].append({"text": text, "kind": "chord" if chord else "chorus" if chorus else "verse",
                                  "breakBefore": previous is None or baseline - previous > 21})
            previous = baseline

assert len(songs) == len(index) == 222, "Every indexed song must be present"
assert all(s["lines"] and s["source"] for s in songs)
assert not any("\ufffd" in line["text"] for s in songs for line in s["lines"])
output = ROOT / "public/data/songbook.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(songs, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Extracted {len(songs)} songs; {sum(len(s['lines']) for s in songs)} lines")
