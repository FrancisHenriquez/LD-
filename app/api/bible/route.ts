import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  buildJerusalemBibleLookup,
  JERUSALEM_BIBLE_TRANSLATION_NAME,
} from "../../catholic-bible";
import { extractJerusalemBiblePassage } from "../../jerusalem-bible";
import {
  fetchJerusalemBibleChapter as fetchChapterFromReader,
} from "../../jerusalem-bible-reader";

const fetchJerusalemBibleChapter = unstable_cache(
  fetchChapterFromReader,
  ["jerusalem-bible-chapter"],
  { revalidate: 60 * 60 * 24 * 30 },
);

/**
 * Atiende consultas GET de pasajes bíblicos, valida la referencia, obtiene el
 * capítulo almacenado en caché y devuelve el rango solicitado como JSON.
 *
 * @param request Solicitud cuya query `reference` contiene la cita bíblica.
 * @returns El pasaje encontrado o una respuesta de error con estado 400/502.
 */
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
          "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Unable to fetch Bible text" }, { status: 502 });
  }
}
