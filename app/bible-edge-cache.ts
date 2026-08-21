// La versión forma parte de cada clave. Debe incrementarse si cambia el formato
// de la respuesta para dejar inaccesibles las entradas antiguas.
const BIBLE_EDGE_CACHE_VERSION = "v6";
const BIBLE_EDGE_CACHE_NAME = "bible-passages-v6";

type BibleEdgeCache = Pick<Cache, "match" | "put">;
type WorkerCacheStorage = CacheStorage & { default?: Cache };

/**
 * Prefiere la caché predeterminada del Worker y recurre a una caché con nombre.
 * Devuelve `null` cuando la plataforma no implementa Cache API o no está lista.
 */
async function getDefaultBibleEdgeCache(): Promise<BibleEdgeCache | null> {
  const cacheStorage = (globalThis as typeof globalThis & {
    caches?: WorkerCacheStorage;
  }).caches;

  if (!cacheStorage) return null;
  if (cacheStorage.default) return cacheStorage.default;

  try {
    return await cacheStorage.open(BIBLE_EDGE_CACHE_NAME);
  } catch {
    return null;
  }
}

/**
 * Crea una URL sintética y versionada para la referencia. La traducción se
 * valida dentro de la respuesta, en lugar de duplicarse en la clave.
 */
function buildBibleEdgeCacheKey(referenceLabel: string, origin: string) {
  const cacheUrl = new URL(origin);
  cacheUrl.pathname = `/.openai-cache/bible/${BIBLE_EDGE_CACHE_VERSION}/${encodeURIComponent(referenceLabel)}`;
  cacheUrl.search = "";

  return new Request(
    cacheUrl,
  );
}

/**
 * Recupera y valida un pasaje almacenado en el borde. Una caché `undefined` se
 * detecta desde el runtime y `null` la deshabilita explícitamente; cualquier
 * fallo o contenido incompatible se trata como una ausencia de caché.
 */
export async function readBibleEdgeCache(
  referenceLabel: string,
  translationName: string,
  cache?: BibleEdgeCache | null,
  origin = "https://bible-cache.invalid",
) {
  const resolvedCache = cache === undefined ? await getDefaultBibleEdgeCache() : cache;
  if (!resolvedCache) return null;

  try {
    const response = await resolvedCache.match(buildBibleEdgeCacheKey(referenceLabel, origin));
    if (!response?.ok) return null;

    const payload = await response.clone().json() as Record<string, unknown>;
    if (
      payload.referenceLabel !== referenceLabel
      || typeof payload.text !== "string"
      || !payload.text.trim()
      || payload.translationName !== translationName
    ) {
      return null;
    }

    const headers = new Headers(response.headers);
    headers.set("X-Bible-Cache", "HIT");
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return null;
  }
}

/**
 * Guarda una copia pública y versionada de una respuesta válida, eliminando
 * cookies antes de persistirla. La escritura es best-effort y nunca convierte
 * una respuesta bíblica correcta en un error de la API.
 */
export async function writeBibleEdgeCache(
  referenceLabel: string,
  response: Response,
  cache?: BibleEdgeCache | null,
  origin = "https://bible-cache.invalid",
) {
  const resolvedCache = cache === undefined ? await getDefaultBibleEdgeCache() : cache;
  if (!resolvedCache) return;

  try {
    const cachedResponse = response.clone();
    const headers = new Headers(cachedResponse.headers);
    headers.delete("Set-Cookie");
    headers.set("Cache-Control", "public, max-age=31536000");
    headers.set("X-Bible-Cache", "HIT");

    await resolvedCache.put(
      buildBibleEdgeCacheKey(referenceLabel, origin),
      new Response(cachedResponse.body, { status: cachedResponse.status, headers }),
    );
  } catch {
    // Una avería de caché no debe invalidar una respuesta bíblica correcta.
  }
}
