const JINA_CACHE_TOLERANCE_SECONDS = 60 * 60 * 24 * 30;

export const JERUSALEM_BIBLE_READER_HEADERS = {
  Accept: "text/plain; charset=utf-8",
  "X-Cache-Tolerance": `${JINA_CACHE_TOLERANCE_SECONDS}`,
  "X-Engine": "curl",
  "X-Respond-Timing": "visible-content",
  "X-Respond-With": "markdown",
  "X-Retain-Images": "none",
  "X-Retain-Links": "none",
  "X-Target-Selector": "article.bibleChapter",
} as const;

type Fetcher = typeof fetch;

const chapterRequests = new Map<string, Promise<string>>();

/**
 * Descarga un capítulo en Markdown y reutiliza solicitudes simultáneas a la
 * misma URL. El `fetcher` inyectable permite probar la carga sin usar la red.
 */
export function fetchJerusalemBibleChapter(
  readerUrl: string,
  fetcher: Fetcher = fetch,
) {
  const pending = chapterRequests.get(readerUrl);
  if (pending) return pending;

  // Convierte una respuesta HTTP correcta en el cuerpo Markdown del capítulo.
  const request = fetcher(readerUrl, {
    headers: JERUSALEM_BIBLE_READER_HEADERS,
    signal: AbortSignal.timeout(25_000),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Unable to fetch Bible chapter (${response.status})`);
    }

    return response.text();
  });

  chapterRequests.set(readerUrl, request);
  // Libera la solicitud compartida cuando termina, sin borrar una más reciente.
  void request.finally(() => {
    if (chapterRequests.get(readerUrl) === request) {
      chapterRequests.delete(readerUrl);
    }
  }).catch(() => {
    // La promesa original comunica el error a quien hizo la llamada.
  });

  return request;
}
