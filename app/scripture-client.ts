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

/**
 * Reduce la caché al límite configurado eliminando primero las entradas ya
 * resueltas; conserva las solicitudes que todavía están en curso.
 */
function trimScriptureCache() {
  if (scriptureCache.size <= MAX_CACHED_SCRIPTURES) return;

  for (const [key, entry] of scriptureCache) {
    if (!entry.settled) continue;
    scriptureCache.delete(key);
    if (scriptureCache.size <= MAX_CACHED_SCRIPTURES) return;
  }
}

/**
 * Obtiene un pasaje bíblico y reutiliza solicitudes o resultados previos para
 * la misma referencia. Las entradas consultadas recientemente se conservan al
 * final de la caché y los fallos se eliminan para permitir reintentos.
 *
 * @param reference Referencia bíblica que se validará y enviará a la API.
 * @returns Una promesa con el texto y los datos de su traducción.
 */
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
      // Valida y normaliza la respuesta antes de almacenarla en la caché local.
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
      // Una entrada resuelta ya puede descartarse si la caché supera el límite.
      entry.settled = true;
      trimScriptureCache();
    },
    () => {
      // Los errores no se memorizan para que una consulta posterior pueda reintentarse.
      if (scriptureCache.get(cacheKey) === entry) {
        scriptureCache.delete(cacheKey);
      }
    },
  );

  return entry.promise;
}

/**
 * Inicia en segundo plano la misma carga usada por el modal; cualquier fallo se
 * ignora aquí porque la apertura explícita de la cita volverá a intentarlo.
 */
export function prefetchScripture(reference: string) {
  void loadScripture(reference).catch(() => {
    // Los fallos de precarga se reintentan si el usuario abre la referencia.
  });
}
