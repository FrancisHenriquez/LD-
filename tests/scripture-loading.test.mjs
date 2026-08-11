import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CATHOLIC_BIBLE_HTML_HEADERS,
  JERUSALEM_BIBLE_READER_HEADERS,
  fetchJerusalemBibleChapter,
  fetchJerusalemBiblePassage
} from '../app/jerusalem-bible-reader.ts';
import { loadScripture } from '../app/scripture-client.ts';
import {
  readBibleEdgeCache,
  writeBibleEdgeCache
} from '../app/bible-edge-cache.ts';

function catholicBibleNetFixture(chapter, verses) {
  return `<!doctype html>
<html lang="es">
  <head><title>Evangelio según Juan ${chapter}</title></head>
  <body>
    <h1>Evangelio según Juan ${chapter}</h1>
    <section class="content prose max-w-none">
      ${verses.map(([number, text]) => `<p><sup>${number}</sup>${text}</p>`).join('\n')}
    </section>
  </body>
</html>`;
}

test('normaliza, deduplica y conserva una cita cargada en el navegador', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let requests = 0;
  let requestedUrl;
  let requestedOptions;
  let finishRequest;
  // Mantiene la petición pendiente para comprobar que las llamadas comparten la promesa.
  globalThis.fetch = (url, options) => {
    requests += 1;
    requestedUrl = url;
    requestedOptions = options;
    return new Promise((resolve) => {
      finishRequest = resolve;
    });
  };

  const first = loadScripture('Jn 3,16');
  const normalizedSeparator = loadScripture('Jn 3:16');
  const normalizedWhitespace = loadScripture('  Jn 3.16  ');

  assert.equal(requests, 1);
  assert.strictEqual(first, normalizedSeparator);
  assert.strictEqual(first, normalizedWhitespace);
  assert.equal(requestedUrl, '/api/bible?reference=Jn%203%2C16');
  assert.deepEqual(requestedOptions.headers, { Accept: 'application/json' });
  assert.ok(requestedOptions.signal instanceof AbortSignal);

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
  assert.equal((await loadScripture('Jn 3.16')).text, scripture.text);
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

  await assert.rejects(loadScripture('Gén 12,7'), /request failed \(502\)/u);
  assert.equal((await loadScripture('Gén 12:7')).referenceLabel, 'Génesis 12:7');
  assert.equal(requests, 2);
});

test('rechaza como error un CAPTCHA que responde HTTP 200', async () => {
  const challengePage = `<!doctype html>
<html>
  <head><title>Just a moment...</title></head>
  <body>
    <h1>Verifying you are human</h1>
    <script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>
  </body>
</html>`;

  await assert.rejects(
    fetchJerusalemBibleChapter(
      'bibliacatolica-net',
      'juan',
      98,
      async () => new Response(challengePage, { status: 200 })
    ),
    /bibliacatolica-net returned challenge page/u
  );
});

test('continúa con proveedores alternos tras un error y versículos inválidos', async () => {
  const attempts = [];
  const result = await fetchJerusalemBiblePassage(
    'juan',
    3,
    16,
    17,
    async (providerId, bookSlug, chapter) => {
      attempts.push([providerId, bookSlug, chapter]);

      if (providerId === 'bibliacatolica-net') {
        throw new Error('network unavailable');
      }

      if (providerId === 'alpichel') {
        return {
          16: 'Este versículo existe.',
          18: 'El versículo 17 falta y el rango no es válido.'
        };
      }

      return {
        16: 'Porque tanto amó Dios al mundo.',
        17: 'Dios no envió a su Hijo para condenar al mundo.'
      };
    }
  );

  assert.deepEqual(attempts, [
    ['bibliacatolica-net', 'juan', 3],
    ['alpichel', 'juan', 3],
    ['legacy-jina', 'juan', 3]
  ]);
  assert.deepEqual(result, {
    providerId: 'legacy-jina',
    text: '16. Porque tanto amó Dios al mundo.\n\n' +
      '17. Dios no envió a su Hijo para condenar al mundo.'
  });
});

test('extrae solo los segmentos pedidos de una cita discontinua', async () => {
  const result = await fetchJerusalemBiblePassage(
    'salmos',
    33,
    1,
    21,
    async () => ({
      1: 'Aclamen, justos, al Señor.',
      2: 'Den gracias al Señor con la cítara.',
      3: 'Cántenle un cántico nuevo.',
      21: 'En él se alegra nuestro corazón.'
    }),
    [
      { startVerse: 1, endVerse: 3 },
      { startVerse: 21, endVerse: 21 }
    ]
  );

  assert.deepEqual(result, {
    providerId: 'bibliacatolica-net',
    text: '1. Aclamen, justos, al Señor.\n\n' +
      '2. Den gracias al Señor con la cítara.\n\n' +
      '3. Cántenle un cántico nuevo.\n\n' +
      '21. En él se alegra nuestro corazón.'
  });
});

test('coalesce descargas simultáneas y entrega un capítulo ya validado', async () => {
  let requests = 0;
  let requestedUrl;
  let requestedOptions;
  let finishRequest;
  // Permite resolver la descarga después de iniciar ambas llamadas.
  const fetcher = (url, options) => {
    requests += 1;
    requestedUrl = url;
    requestedOptions = options;
    return new Promise((resolve) => {
      finishRequest = resolve;
    });
  };

  const first = fetchJerusalemBibleChapter('bibliacatolica-net', 'juan', 4, fetcher);
  const concurrent = fetchJerusalemBibleChapter('bibliacatolica-net', 'juan', 4, fetcher);

  assert.equal(requests, 1);
  assert.strictEqual(first, concurrent);
  assert.equal(requestedUrl, 'https://www.bibliacatolica.net/juan/4');
  assert.deepEqual(requestedOptions.headers, CATHOLIC_BIBLE_HTML_HEADERS);

  finishRequest(new Response(catholicBibleNetFixture(4, [
    [1, 'Jesús se enteró de que los fariseos lo habían oído.'],
    [2, 'Aunque Jesús mismo no bautizaba, sino sus discípulos.']
  ])));

  assert.deepEqual(await first, {
    1: 'Jesús se enteró de que los fariseos lo habían oído.',
    2: 'Aunque Jesús mismo no bautizaba, sino sus discípulos.'
  });
});

test('usa encabezados específicos para el lector legado', async () => {
  let capturedOptions;
  // Captura las opciones sin acceder a la red para inspeccionar las cabeceras enviadas.
  const fetcher = async (_url, options) => {
    capturedOptions = options;
    return new Response('Title: Juan, 5\n\n**1.** Texto');
  };

  assert.deepEqual(
    await fetchJerusalemBibleChapter('legacy-jina', 'juan', 5, fetcher),
    { 1: 'Texto' }
  );
  assert.deepEqual(capturedOptions.headers, JERUSALEM_BIBLE_READER_HEADERS);
  assert.equal(capturedOptions.headers['X-Cache-Tolerance'], '2592000');
  assert.equal(capturedOptions.headers['X-Return-Format'], 'markdown');
});

test('sirve una copia validada de la caché de borde y tolera sus fallos', async () => {
  let matches = 0;
  let puts = 0;
  let matchedUrl;
  let storedResponse;
  const cache = {
    async match(request) {
      matches += 1;
      matchedUrl = request.url;
      return new Response(JSON.stringify({
        referenceLabel: 'Juan 3:16',
        translationName: 'Biblia de Jerusalén',
        text: '16. Porque tanto amó Dios al mundo.'
      }), {
        headers: {
          'Cache-Control': 'public, max-age=86400',
          'Content-Type': 'application/json'
        }
      });
    },
    async put(_request, response) {
      puts += 1;
      storedResponse = response;
    }
  };

  const response = await readBibleEdgeCache(
    'Juan 3:16',
    'Biblia de Jerusalén',
    cache,
    'https://vocabulario.example'
  );

  assert.ok(response);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Bible-Cache'), 'HIT');
  assert.equal((await response.json()).text, '16. Porque tanto amó Dios al mundo.');
  assert.equal(matches, 1);
  assert.match(matchedUrl, /^https:\/\/vocabulario\.example\/\.openai-cache\/bible\/v6\//u);

  await writeBibleEdgeCache(
    'Juan 3:16',
    new Response('ok', { headers: { 'Set-Cookie': 'private=true' } }),
    cache,
    'https://vocabulario.example'
  );
  assert.equal(puts, 1);
  assert.equal(storedResponse.headers.get('Cache-Control'), 'public, max-age=31536000');
  assert.equal(storedResponse.headers.get('Set-Cookie'), null);
  assert.equal(storedResponse.headers.get('X-Bible-Cache'), 'HIT');

  const brokenCache = {
    async match() { throw new Error('cache read failed'); },
    async put() { throw new Error('cache write failed'); }
  };
  assert.equal(
    await readBibleEdgeCache('Juan 3:16', 'Biblia de Jerusalén', brokenCache),
    null
  );
  await writeBibleEdgeCache('Juan 3:16', new Response('ok'), brokenCache);
  assert.equal(puts, 1);
});
