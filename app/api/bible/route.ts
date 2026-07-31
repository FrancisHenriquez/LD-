import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  buildJerusalemBibleLookup,
  JERUSALEM_BIBLE_TRANSLATION_NAME,
} from "../../catholic-bible";
import { extractJerusalemBiblePassage } from "../../jerusalem-bible";

const fetchJerusalemBibleChapter = unstable_cache(
  async (readerUrl: string) => {
    const response = await fetch(readerUrl, {
      headers: {
        Accept: "text/plain; charset=utf-8",
        "X-Return-Format": "markdown",
      },
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch Bible chapter (${response.status})`);
    }

    return response.text();
  },
  ["jerusalem-bible-chapter"],
  { revalidate: 60 * 60 * 24 * 30 },
);

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference")?.trim();
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const lookup = buildJerusalemBibleLookup(reference);
  if (!lookup) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  try {
    const markdown = await fetchJerusalemBibleChapter(lookup.readerUrl);
    const text = extractJerusalemBiblePassage(
      markdown,
      lookup.startVerse,
      lookup.endVerse,
      lookup.chapter,
    );

    if (!text) {
      return NextResponse.json({ error: "Bible passage not found" }, { status: 502 });
    }

    return NextResponse.json(
      {
        referenceLabel: lookup.referenceLabel,
        translationName: JERUSALEM_BIBLE_TRANSLATION_NAME,
        text,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Unable to fetch Bible text" }, { status: 502 });
  }
}
