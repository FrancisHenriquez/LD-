import assert from 'node:assert/strict';
import test from 'node:test';
import {
  JERUSALEM_BIBLE_READER_HEADERS,
  fetchJerusalemBibleChapter
} from '../app/jerusalem-bible-reader.ts';
import { loadScripture } from '../app/scripture-client.ts';

test('deduplica y conserva una cita cargada en el navegador', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let requests = 0;
  let finishRequest;
  // Mantiene la petición pendiente para comprobar que dos llamadas comparten la promesa.
  globalThis.fetch = () => {
    requests += 1;
    return new Promise((resolve) => {
      finishRequest = resolve;
    });
  };

  const first = loadScripture('Jn 3,16');
  const concurrent = loadScripture('Jn 3,16');

  assert.equal(requests, 1);
  assert.strictEqual(first, concurrent);

  finishRequest(new Response(JSON.stringify({
    text: '16. Porque tanto amó Dios al mundo.',
    referenceLabel: 'Juan 3:16',
    translationName: 'Biblia de Jerusalén'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  }));

  const scripture = await first;
  assert.equal(scripture.referenceLabel, 'Juan 3:16');
  assert.equal((await loadScripture('Jn 3,16')).text, scripture.text);
  assert.equal(requests, 1);
});

test('no conserva los errores de carga en la caché del navegador', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let requests = 0;
  // Simula un fallo transitorio seguido de una respuesta válida para probar el reintento.
  globalThis.fetch = async () => {
    requests += 1;
    if (requests === 1) return new Response(null, { status: 502 });
    return new Response(JSON.stringify({ text: '7. Yahveh se apareció a Abram.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  await assert.rejects(loadScripture('Gén 12,7'));
  assert.equal((await loadScripture('Gén 12,7')).referenceLabel, 'Génesis 12:7');
  assert.equal(requests, 2);
});

test('coalesce descargas simultáneas del mismo capítulo', async () => {
  let requests = 0;
  let finishRequest;
  // Permite resolver la descarga manualmente después de iniciar ambas llamadas.
  const fetcher = () => {
    requests += 1;
    return new Promise((resolve) => {
      finishRequest = resolve;
    });
  };

  const readerUrl = 'https://r.jina.ai/https://example.test/juan/3/';
  const first = fetchJerusalemBibleChapter(readerUrl, fetcher);
  const concurrent = fetchJerusalemBibleChapter(readerUrl, fetcher);

  assert.equal(requests, 1);
  assert.strictEqual(first, concurrent);

  finishRequest(new Response('Title: Juan, 3\n\n**16.** Texto'));
  assert.equal(await first, 'Title: Juan, 3\n\n**16.** Texto');
});

test('solicita únicamente el bloque bíblico y tolera la caché mensual', async () => {
  let capturedOptions;
  // Captura las opciones sin acceder a la red para inspeccionar las cabeceras enviadas.
  const fetcher = async (_url, options) => {
    capturedOptions = options;
    return new Response('Title: Juan, 4\n\n**1.** Texto');
  };

  await fetchJerusalemBibleChapter('https://r.jina.ai/https://example.test/juan/4/', fetcher);

  assert.deepEqual(capturedOptions.headers, JERUSALEM_BIBLE_READER_HEADERS);
  assert.equal(capturedOptions.headers['X-Cache-Tolerance'], '2592000');
  assert.equal(capturedOptions.headers['X-Target-Selector'], 'article.bibleChapter');
  assert.equal(capturedOptions.headers['X-Engine'], 'curl');
});
