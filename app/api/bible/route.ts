import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  buildJerusalemBibleLookup,
  JERUSALEM_BIBLE_TRANSLATION_NAME,
  type JerusalemBibleProviderId,
} from "../../catholic-bible";
import {
  fetchJerusalemBibleChapter as fetchChapterFromReader,
  fetchJerusalemBiblePassage,
} from "../../jerusalem-bible-reader";
import { readBibleEdgeCache, writeBibleEdgeCache } from "../../bible-edge-cache";

// Conserva cada capítulo completo durante 30 días para reutilizar una sola
// descarga entre consultas de distintos rangos de versículos.
const fetchProviderChapter = unstable_cache(
  (providerId: JerusalemBibleProviderId, bookSlug: string, chapter: number) => (
    fetchChapterFromReader(providerId, bookSlug, chapter)
  ),
  ["jerusalem-bible-provider-chapter-v3"],
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

  const cachedResponse = await readBibleEdgeCache(
    lookup.referenceLabel,
    JERUSALEM_BIBLE_TRANSLATION_NAME,
    undefined,
    request.nextUrl.origin,
  );
  if (cachedResponse) return cachedResponse;

  try {
    const { providerId, text } = await fetchJerusalemBiblePassage(
      lookup.bookSlug,
      lookup.chapter,
      lookup.startVerse,
      lookup.endVerse,
      fetchProviderChapter,
      lookup.verseRanges,
    );

    const response = NextResponse.json(
      {
        referenceLabel: lookup.referenceLabel,
        translationName: JERUSALEM_BIBLE_TRANSLATION_NAME,
        text,
      },
      {
        headers: {
          // El navegador conserva un día; las cachés compartidas, un año, y
          // pueden servir contenido anterior mientras revalidan o ante fallos.
          "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=2592000, stale-if-error=31536000",
          "X-Bible-Cache": "MISS",
          "X-Bible-Provider": providerId,
        },
      },
    );

    await writeBibleEdgeCache(
      lookup.referenceLabel,
      response,
      undefined,
      request.nextUrl.origin,
    );
    return response;
  } catch (error) {
    console.error("Bible passage providers failed", {
      reference: lookup.referenceLabel,
      error,
    });
  }

  return NextResponse.json(
    { error: "Unable to fetch Bible text" },
    {
      status: 502,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "30",
      },
    },
  );
}
