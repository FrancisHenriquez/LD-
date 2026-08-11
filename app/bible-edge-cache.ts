const BIBLE_EDGE_CACHE_VERSION = "v5";

type BibleEdgeCache = Pick<Cache, "match" | "put">;
type WorkerCacheStorage = CacheStorage & { default?: Cache };

function getDefaultBibleEdgeCache(): BibleEdgeCache | null {
  const cacheStorage = (globalThis as typeof globalThis & {
    caches?: WorkerCacheStorage;
  }).caches;

  return cacheStorage?.default ?? null;
}

function buildBibleEdgeCacheKey(referenceLabel: string, origin: string) {
  const cacheUrl = new URL(origin);
  cacheUrl.pathname = `/.openai-cache/bible/${BIBLE_EDGE_CACHE_VERSION}/${encodeURIComponent(referenceLabel)}`;
  cacheUrl.search = "";

  return new Request(
    cacheUrl,
  );
}

export async function readBibleEdgeCache(
  referenceLabel: string,
  translationName: string,
  cache: BibleEdgeCache | null = getDefaultBibleEdgeCache(),
  origin = "https://bible-cache.invalid",
) {
  if (!cache) return null;

  try {
    const response = await cache.match(buildBibleEdgeCacheKey(referenceLabel, origin));
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
  origin = "https://bible-cache.invalid",
) {
  if (!cache) return;

  try {
    const cachedResponse = response.clone();
    const headers = new Headers(cachedResponse.headers);
    headers.delete("Set-Cookie");
    headers.set("Cache-Control", "public, max-age=31536000");
    headers.set("X-Bible-Cache", "HIT");

    await cache.put(
      buildBibleEdgeCacheKey(referenceLabel, origin),
      new Response(cachedResponse.body, { status: cachedResponse.status, headers }),
    );
  } catch {
    // A cache outage must never turn a valid Bible response into an error.
  }
}
