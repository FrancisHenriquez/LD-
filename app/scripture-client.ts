"use client";

import {
  buildScriptureLookupReference,
  JERUSALEM_BIBLE_TRANSLATION_NAME,
} from "./catholic-bible.ts";

export type Scripture = {
  text: string;
  referenceLabel: string;
  translationName: string;
};

type ScriptureCacheEntry = {
  promise: Promise<Scripture>;
  settled: boolean;
};

const MAX_CACHED_SCRIPTURES = 100;
const scriptureCache = new Map<string, ScriptureCacheEntry>();

function trimScriptureCache() {
  if (scriptureCache.size <= MAX_CACHED_SCRIPTURES) return;

  for (const [key, entry] of scriptureCache) {
    if (!entry.settled) continue;
    scriptureCache.delete(key);
    if (scriptureCache.size <= MAX_CACHED_SCRIPTURES) return;
  }
}

export function loadScripture(reference: string): Promise<Scripture> {
  const cacheKey = reference.trim();
  const lookupReference = buildScriptureLookupReference(cacheKey);

  if (!lookupReference) {
    return Promise.reject(new Error("Invalid Bible reference"));
  }

  const cached = scriptureCache.get(cacheKey);
  if (cached) {
    scriptureCache.delete(cacheKey);
    scriptureCache.set(cacheKey, cached);
    return cached.promise;
  }

  const entry: ScriptureCacheEntry = {
    settled: false,
    promise: fetch(`/api/bible?reference=${encodeURIComponent(cacheKey)}`, {
      cache: "force-cache",
    }).then(async (response) => {
      if (!response.ok) throw new Error("Bible passage not found");

      const data = await response.json() as Partial<Scripture>;
      const text = data.text?.trim();
      if (!text) throw new Error("Bible passage is empty");

      return {
        text,
        referenceLabel: data.referenceLabel ?? lookupReference,
        translationName: data.translationName ?? JERUSALEM_BIBLE_TRANSLATION_NAME,
      };
    }),
  };

  scriptureCache.set(cacheKey, entry);
  trimScriptureCache();

  entry.promise.then(
    () => {
      entry.settled = true;
      trimScriptureCache();
    },
    () => {
      if (scriptureCache.get(cacheKey) === entry) {
        scriptureCache.delete(cacheKey);
      }
    },
  );

  return entry.promise;
}

export function prefetchScripture(reference: string) {
  void loadScripture(reference).catch(() => {
    // Prefetch failures are retried if the user opens the reference.
  });
}
