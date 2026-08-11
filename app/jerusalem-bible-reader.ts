import {
  buildJerusalemBibleChapterSources,
  type JerusalemBibleProviderId,
  type JerusalemBibleVerseRange,
} from "./catholic-bible.ts";
import {
  extractPassageFromChapter,
  isBibleChallengePage,
  parseAlpichelChapter,
  parseCatholicBibleNetChapter,
  parseJerusalemBibleMarkdownChapter,
  type JerusalemBibleChapter,
} from "./jerusalem-bible.ts";

const JINA_CACHE_TOLERANCE_SECONDS = 60 * 60 * 24 * 30;
const PROVIDER_TIMEOUT_MS = 8_000;

export const CATHOLIC_BIBLE_HTML_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "es,en;q=0.7",
  "User-Agent": "Mozilla/5.0 (compatible; LD-Scripture/1.0)",
} as const;

export const JERUSALEM_BIBLE_READER_HEADERS = {
  Accept: "text/plain; charset=utf-8",
  "X-Cache-Tolerance": `${JINA_CACHE_TOLERANCE_SECONDS}`,
  "X-Return-Format": "markdown",
} as const;

type Fetcher = typeof fetch;

const chapterRequests = new Map<string, Promise<JerusalemBibleChapter>>();

type ChapterFetcher = (
  providerId: JerusalemBibleProviderId,
  bookSlug: string,
  chapter: number,
) => Promise<JerusalemBibleChapter>;

function parserForProvider(providerId: JerusalemBibleProviderId) {
  switch (providerId) {
    case "bibliacatolica-net":
      return parseCatholicBibleNetChapter;
    case "alpichel":
      return parseAlpichelChapter;
    case "legacy-jina":
      return parseJerusalemBibleMarkdownChapter;
  }
}

/**
 * Descarga, parsea y valida un capítulo desde el proveedor solicitado, y
 * reutiliza solicitudes simultáneas a la misma URL. El `fetcher` inyectable
 * permite probar la carga sin usar la red.
 */
export function fetchJerusalemBibleChapter(
  providerId: JerusalemBibleProviderId,
  bookSlug: string,
  chapter: number,
  fetcher: Fetcher = fetch,
) {
  const source = buildJerusalemBibleChapterSources(bookSlug, chapter)
    .find(({ id }) => id === providerId);
  if (!source) {
    return Promise.reject(new Error(`Unknown Bible provider: ${providerId}`));
  }

  const pending = chapterRequests.get(source.url);
  if (pending) return pending;

  // Convierte una respuesta HTTP correcta en un capítulo ya validado.
  const request = fetcher(source.url, {
    headers: providerId === "legacy-jina"
      ? JERUSALEM_BIBLE_READER_HEADERS
      : CATHOLIC_BIBLE_HTML_HEADERS,
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`${providerId} returned HTTP ${response.status}`);
    }

    const body = await response.text();
    const parsedChapter = parserForProvider(providerId)(body, chapter);
    if (!parsedChapter) {
      const reason = isBibleChallengePage(body) ? "challenge page" : "invalid chapter";
      throw new Error(`${providerId} returned ${reason}`);
    }

    return parsedChapter;
  });

  chapterRequests.set(source.url, request);
  // Libera la solicitud compartida cuando termina, sin borrar una más reciente.
  void request.finally(() => {
    if (chapterRequests.get(source.url) === request) {
      chapterRequests.delete(source.url);
    }
  }).catch(() => {
    // La promesa original comunica el error a quien hizo la llamada.
  });

  return request;
}

export async function fetchJerusalemBiblePassage(
  bookSlug: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
  chapterFetcher: ChapterFetcher = fetchJerusalemBibleChapter,
  verseRanges: readonly JerusalemBibleVerseRange[] = [{ startVerse, endVerse }],
) {
  const providerErrors: Error[] = [];

  for (const { id: providerId } of buildJerusalemBibleChapterSources(bookSlug, chapter)) {
    try {
      const parsedChapter = await chapterFetcher(providerId, bookSlug, chapter);
      const passages: string[] = [];

      for (const range of verseRanges) {
        const passage = extractPassageFromChapter(
          parsedChapter,
          range.startVerse,
          range.endVerse,
        );

        if (!passage) {
          throw new Error("requested verses are unavailable");
        }

        passages.push(passage);
      }

      const text = passages.join("\n\n");

      if (!text) {
        throw new Error("requested verses are unavailable");
      }

      return { providerId, text };
    } catch (error) {
      providerErrors.push(
        new Error(
          `${providerId}: ${error instanceof Error ? error.message : "unknown error"}`,
        ),
      );
    }
  }

  throw new AggregateError(providerErrors, "All Bible passage providers failed");
}
