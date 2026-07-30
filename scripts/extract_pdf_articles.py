#!/usr/bin/env python3
"""Extract the user-provided Léon-Dufour PDF into the site's static data."""

from __future__ import annotations

import json
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = Path("/workspace/scratch/07ed0bc5c89e/upload/Leondf.pdf")
TEXT = ROOT / "tmp/pdfs/leondf.txt"
OUTPUT = ROOT / "app/data/articles.json"


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def extract_terms() -> list[str]:
    source = (ROOT / "app/page.tsx").read_text(encoding="utf-8")
    match = re.search(r"const terms = `([^`]+)`\.split", source, re.S)
    if not match:
        raise RuntimeError("Could not locate the canonical term index.")
    return match.group(1).split("|")


def page_lines(page: str) -> list[str]:
    return [line.rstrip() for line in page.splitlines()]


def first_nonempty(page: str) -> str:
    for line in page_lines(page):
        if line.strip():
            return line.strip()
    return ""


def clean_article(pages: list[str], heading: str) -> str:
    lines: list[str] = []
    for page_number, page in enumerate(pages):
        current = page_lines(page)
        if page_number == 0:
            while current and not current[0].strip():
                current.pop(0)
            if current and normalize(current[0]) == normalize(heading):
                current.pop(0)
        lines.extend(current)
        lines.append("")

    # Join PDF-wrapped lines while retaining paragraph and heading breaks.
    paragraphs: list[str] = []
    buffer: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if buffer:
                paragraphs.append(" ".join(buffer))
                buffer = []
            continue
        buffer.append(stripped)
    if buffer:
        paragraphs.append(" ".join(buffer))

    text = "\n\n".join(paragraphs)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def main() -> None:
    if not PDF.exists():
        raise FileNotFoundError(PDF)
    TEXT.parent.mkdir(parents=True, exist_ok=True)
    if not TEXT.exists():
        subprocess.run(
            ["pdftotext", "-layout", str(PDF), str(TEXT)],
            check=True,
        )

    terms = extract_terms()
    pages = TEXT.read_text(encoding="utf-8").split("\f")
    first_lines = [first_nonempty(page) for page in pages]
    aliases = {
        "bestias": "bestia bestias",
        "bien mal": "bien y mal",
        "pastor rebano": "pastor y rebano",
    }

    starts: list[tuple[str, int, str]] = []
    cursor = 20  # the PDF index occupies the first 20 pages
    for term in terms:
        expected = aliases.get(normalize(term), normalize(term))
        found = next(
            (
                index
                for index in range(cursor, len(pages))
                if normalize(first_lines[index]) == expected
            ),
            None,
        )
        if found is None:
            raise RuntimeError(f"Article heading not found: {term}")
        starts.append((term, found, first_lines[found]))
        cursor = found + 1

    articles: dict[str, dict[str, object]] = {}
    for index, (term, start, pdf_heading) in enumerate(starts):
        end = starts[index + 1][1] if index + 1 < len(starts) else len(pages)
        body = clean_article(pages[start:end], pdf_heading)
        articles[term] = {
            "title": term,
            "pdfTitle": pdf_heading,
            "text": body,
            "sourcePages": [start + 1, end],
        }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(articles, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"Extracted {len(articles)} articles, "
        f"{sum(len(article['text']) for article in articles.values()):,} characters."
    )


if __name__ == "__main__":
    main()
