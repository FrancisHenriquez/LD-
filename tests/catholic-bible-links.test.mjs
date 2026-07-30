import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CATHOLIC_BIBLE_BASE_URL,
  CATHOLIC_BIBLE_FALLBACK_URL,
  buildScriptureLookupReference,
  catholicBibleUrl,
  expandReferenceRange
} from '../app/catholic-bible.ts';
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

test('solo genera enlaces hacia fuentes bíblicas católicas', () => {
  let total = 0;
  let fallbacks = 0;

  for (const article of Object.values(articles)) {
    for (const token of tokenizeBiblicalReferences(article.text)) {
      if (token.type !== 'citation') continue;
      total += 1;
      const url = catholicBibleUrl(token.label);
      const isJerusalemBible = url.startsWith(`${CATHOLIC_BIBLE_BASE_URL}/`);
      const isSpanishBishopsBible = url === CATHOLIC_BIBLE_FALLBACK_URL;

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

  assert.equal(page.includes('biblegateway'), false);
  assert.equal(page.includes('version=RVA'), false);
  assert.match(page, /Biblia de Jerusalén \(católica\)/u);
});
