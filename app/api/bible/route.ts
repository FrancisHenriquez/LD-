import { NextRequest, NextResponse } from "next/server";

const htmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Ntilde: "Ñ",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
    const lower = code.toLowerCase();
    if (lower in htmlEntities) return htmlEntities[lower];
    if (code.startsWith("#x")) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return entity;
  });
}

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference")?.trim();
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=RVR1960`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to fetch Bible text" }, { status: 502 });
  }

  const html = await response.text();
  const descriptionMatch = html.match(/<meta\s+property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);

  const text = descriptionMatch?.[1]
    ? decodeHtmlEntities(descriptionMatch[1]).replace(/\s+/g, " ").trim()
    : "No se pudo recuperar el texto bíblico.";

  return NextResponse.json({
    referenceLabel: reference,
    translationName: "Reina-Valera 1960",
    text,
  });
}
