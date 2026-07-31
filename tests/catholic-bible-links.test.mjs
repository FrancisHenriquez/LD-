import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CATHOLIC_BIBLE_BASE_URL,
  CATHOLIC_BIBLE_FALLBACK_URL,
  CATHOLIC_BIBLE_READER_BASE_URL,
  JERUSALEM_BIBLE_TRANSLATION_NAME,
  buildJerusalemBibleLookup,
  buildScriptureLookupReference,
  catholicBibleUrl,
  expandReferenceRange
} from '../app/catholic-bible.ts';
import { extractJerusalemBiblePassage } from '../app/jerusalem-bible.ts';
import { tokenizeBiblicalReferences } from '../app/reference-parser.ts';

const articles = JSON.parse(
  readFileSync(new URL('../app/data/articles.json', import.meta.url), 'utf8')
);

test('crea enlaces directos a La Biblia de Jerusalén', () => {
  assert.equal(
    catholicBibleUrl('Gén 12,7'),
    `${CATHOLIC_BIBLE_BASE_URL}/genesis/12/7/`
  );
  assert.equal(
    catholicBibleUrl('2Cor 5,14-17'),
    `${CATHOLIC_BIBLE_BASE_URL}/ii-corintios/5/14/`
  );
  assert.equal(
    catholicBibleUrl('Eclo 2,1ss'),
    `${CATHOLIC_BIBLE_BASE_URL}/eclesiastico/2/1/`
  );
  assert.equal(
    catholicBibleUrl('Nah 1,1'),
    `${CATHOLIC_BIBLE_BASE_URL}/nahun/1/1/`
  );
});

test('expande el rango bíblico cuando la referencia lleva s o ss', () => {
  assert.deepEqual(expandReferenceRange('Gén 12,7s'), {
    book: 'Gén',
    chapter: 12,
    startVerse: 4,
    endVerse: 10
  });
  assert.deepEqual(expandReferenceRange('Rom 8,31-32ss'), {
    book: 'Rom',
    chapter: 8,
    startVerse: 28,
    endVerse: 35
  });
  assert.deepEqual(expandReferenceRange('Jn 3,16'), {
    book: 'Jn',
    chapter: 3,
    startVerse: 16,
    endVerse: 16
  });
});

test('construye referencias bíblicas en español para la búsqueda del texto', () => {
  assert.equal(buildScriptureLookupReference('Jn 3,16'), 'Juan 3:16');
  assert.equal(buildScriptureLookupReference('Gén 12,7s'), 'Génesis 12:4-10');
});

test('construye la consulta del capítulo en La Biblia de Jerusalén', () => {
  assert.deepEqual(buildJerusalemBibleLookup('2Mac 7,1-5'), {
    referenceLabel: '2 Macabeos 7:1-5',
    readerUrl: `${CATHOLIC_BIBLE_READER_BASE_URL}/ii-macabeos/7/`,
    sourceUrl: `${CATHOLIC_BIBLE_BASE_URL}/ii-macabeos/7/`,
    chapter: 7,
    startVerse: 1,
    endVerse: 5
  });
  assert.equal(JERUSALEM_BIBLE_TRANSLATION_NAME, 'Biblia de Jerusalén');
});

test('extrae solo el rango solicitado del capítulo de Jerusalén', () => {
  const markdown = `Title: Juan, 3

# Juan, 3

**15.** para que todo el que crea tenga por él vida eterna.

**16.** Porque tanto amó Dios al mundo
que dio a su Hijo único.

**17.** Porque Dios no ha enviado a su Hijo al mundo para juzgarlo.

*   [Capítulo anterior](https://example.com)

## Notas al pie:

**16.** Este contenido no pertenece al pasaje.`;

  assert.equal(
    extractJerusalemBiblePassage(markdown, 16, 17, 3),
    '16. Porque tanto amó Dios al mundo que dio a su Hijo único.\n\n' +
      '17. Porque Dios no ha enviado a su Hijo al mundo para juzgarlo.'
  );
  assert.equal(extractJerusalemBiblePassage(markdown, 30, 31, 3), null);
  assert.equal(extractJerusalemBiblePassage(markdown, 16, 17, 4), null);
});

test('solo genera enlaces hacia fuentes bíblicas católicas', () => {
  let total = 0;
  let fallbacks = 0;

  for (const article of Object.values(articles)) {
    for (const token of tokenizeBiblicalReferences(article.text)) {
      if (token.type !== 'citation') continue;
      total += 1;
      const url = catholicBibleUrl(token.label);
      const lookup = buildJerusalemBibleLookup(token.label);
      const isJerusalemBible = url.startsWith(`${CATHOLIC_BIBLE_BASE_URL}/`);
      const isSpanishBishopsBible = url === CATHOLIC_BIBLE_FALLBACK_URL;

      assert.ok(lookup, `${token.label} no generó una consulta de Jerusalén`);
      assert.ok(
        lookup.readerUrl.startsWith(`${CATHOLIC_BIBLE_READER_BASE_URL}/`),
        `${token.label} generó un lector bíblico inesperado`
      );
      assert.ok(
        isJerusalemBible || isSpanishBishopsBible,
        `${token.label} generó una fuente no católica: ${url}`
      );
      assert.equal(url.includes('biblegateway'), false, token.label);
      assert.equal(url.includes('RVA'), false, token.label);
      if (isSpanishBishopsBible) fallbacks += 1;
    }
  }

  assert.ok(total > 8_000, `solo se comprobaron ${total} enlaces`);
  assert.equal(fallbacks, 0, `${fallbacks} citas no tuvieron enlace directo`);
});

test('el código visible no contiene proveedores bíblicos no católicos', () => {
  const page = readFileSync(
    new URL('../app/page.tsx', import.meta.url),
    'utf8'
  );
  const route = readFileSync(
    new URL('../app/api/bible/route.ts', import.meta.url),
    'utf8'
  );
  const applicationCode = `${page}\n${route}`;

  assert.equal(applicationCode.toLowerCase().includes('biblegateway'), false);
  assert.equal(applicationCode.includes('RVR1960'), false);
  assert.equal(applicationCode.includes('Reina-Valera'), false);
  assert.match(page, /Biblia de Jerusalén \(católica\)/u);
  assert.match(route, /JERUSALEM_BIBLE_TRANSLATION_NAME/u);
});
