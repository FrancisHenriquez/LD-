const BIBLE_EDGE_CACHE_VERSION = "v4";

type BibleEdgeCache = Pick<Cache, "match" | "put">;
type WorkerCacheStorage = CacheStorage & { default?: Cache };

function getDefaultBibleEdgeCache(): BibleEdgeCache | null {
  const cacheStorage = (globalThis as typeof globalThis & {
    caches?: WorkerCacheStorage;
  }).caches;

  return cacheStorage?.default ?? null;
}

function buildBibleEdgeCacheKey(referenceLabel: string) {
  return new Request(
    `https://bible-cache.invalid/${BIBLE_EDGE_CACHE_VERSION}/${encodeURIComponent(referenceLabel)}`,
  );
}

export async function readBibleEdgeCache(
  referenceLabel: string,
  translationName: string,
  cache: BibleEdgeCache | null = getDefaultBibleEdgeCache(),
) {
  if (!cache) return null;

  try {
    const response = await cache.match(buildBibleEdgeCacheKey(referenceLabel));
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

export async function writeBibleEdgeCache(
  referenceLabel: string,
  response: Response,
  cache: BibleEdgeCache | null = getDefaultBibleEdgeCache(),
) {
  if (!cache) return;

  try {
    await cache.put(buildBibleEdgeCacheKey(referenceLabel), response.clone());
  } catch {
    // A cache outage must never turn a valid Bible response into an error.
  }
}
