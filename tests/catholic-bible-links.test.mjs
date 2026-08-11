import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CATHOLIC_BIBLE_BASE_URL,
  CATHOLIC_BIBLE_FALLBACK_URL,
  CATHOLIC_BIBLE_PRIMARY_READER_BASE_URL,
  CATHOLIC_BIBLE_READER_BASE_URL,
  JERUSALEM_BIBLE_TRANSLATION_NAME,
  buildJerusalemBibleChapterSources,
  buildJerusalemBibleLookup,
  buildScriptureLookupReference,
  catholicBibleUrl,
  expandReferenceRange,
  expandReferenceRanges
} from '../app/catholic-bible.ts';
import {
  extractJerusalemBiblePassage,
  parseAlpichelChapter,
  parseCatholicBibleNetChapter
} from '../app/jerusalem-bible.ts';
import { tokenizeBiblicalReferences } from '../app/reference-parser.ts';

const articles = JSON.parse(
  readFileSync(new URL('../app/data/articles.json', import.meta.url), 'utf8')
);

const catholicBibleNetFixture = `<!doctype html>
<html lang="es">
  <head><title>Evangelio según Juan 3 | Biblia Católica</title></head>
  <body>
    <h1>Evangelio según Juan 3</h1>
    <p><sup>99</sup>Este texto está fuera del capítulo.</p>
    <section class="mx-auto prose prose-lg">
      <p><sup class="verse">15</sup> para que todo el que crea tenga por él <em>vida eterna.</em></p>
      <p><sup class="verse">16</sup> Porque tanto am&oacute; Dios al mundo<br>que dio a su Hijo &uacute;nico.</p>
      <p><sup class="verse">17</sup> Porque Dios no ha enviado a su Hijo al mundo para juzgarlo.</p>
    </section>
  </body>
</html>`;

const alpichelFixture = `<!doctype html>
<html lang="es">
  <head><title>Evangelio según san Juan 3</title></head>
  <body>
    <h1>Evangelio según san Juan 3</h1>
    <div class="chapter-verse group" id="v15">
      <button type="button"><sup>15</sup><span>para que todo el que crea tenga por él vida eterna.</span></button>
    </div>
    <div id="v16" class="chapter-verse group">
      <button type="button"><sup>16</sup><span>Porque tanto am&#243; Dios al mundo que dio a su Hijo <strong>único.</strong></span></button>
    </div>
    <div class="chapter-verse" id="v17">
      <button type="button"><sup>17</sup><span>Porque Dios no ha enviado a su Hijo al mundo para juzgarlo.</span></button>
    </div>
  </body>
</html>`;

test('crea enlaces directos a La Biblia de Jerusalén', () => {
  assert.equal(
    catholicBibleUrl('Gén 12,7'),
    `${CATHOLIC_BIBLE_BASE_URL}/genesis/12#v7`
  );
  assert.equal(
    catholicBibleUrl('2Cor 5,14-17'),
    `${CATHOLIC_BIBLE_BASE_URL}/segunda_carta_a_los_corintios/5#v14`
  );
  assert.equal(
    catholicBibleUrl('Eclo 2,1ss'),
    `${CATHOLIC_BIBLE_BASE_URL}/siracida_eclesiastico/2#v1`
  );
  assert.equal(
    catholicBibleUrl('Nah 1,1'),
    `${CATHOLIC_BIBLE_BASE_URL}/nahum/1#v1`
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

test('conserva los segmentos discontinuos y aplica s o ss solo al último', () => {
  assert.deepEqual(expandReferenceRanges('Gén 22,8.13ss'), {
    book: 'Gén',
    chapter: 22,
    verseRanges: [
      { startVerse: 8, endVerse: 8 },
      { startVerse: 10, endVerse: 16 }
    ]
  });
  assert.deepEqual(expandReferenceRanges('Sal 33,1-3.21'), {
    book: 'Sal',
    chapter: 33,
    verseRanges: [
      { startVerse: 1, endVerse: 3 },
      { startVerse: 21, endVerse: 21 }
    ]
  });
  assert.deepEqual(expandReferenceRanges('Mc 12,35ss p'), {
    book: 'Mc',
    chapter: 12,
    verseRanges: [{ startVerse: 32, endVerse: 38 }]
  });
  assert.deepEqual(expandReferenceRange('Gén 22,8.13ss'), {
    book: 'Gén',
    chapter: 22,
    startVerse: 8,
    endVerse: 16
  });

  const genesisLookup = buildJerusalemBibleLookup('Gén 22,8.13ss');
  const psalmLookup = buildJerusalemBibleLookup('Sal 33,1-3.21');
  assert.equal(genesisLookup?.referenceLabel, 'Génesis 22:8, 10-16');
  assert.deepEqual(genesisLookup?.verseRanges, [
    { startVerse: 8, endVerse: 8 },
    { startVerse: 10, endVerse: 16 }
  ]);
  assert.equal(psalmLookup?.referenceLabel, 'Salmos 33:1-3, 21');
  assert.equal(buildScriptureLookupReference('Mc 12,35ss p'), 'Marcos 12:32-38');
});

test('construye referencias bíblicas en español para la búsqueda del texto', () => {
  assert.equal(buildScriptureLookupReference('Jn 3,16'), 'Juan 3:16');
  assert.equal(buildScriptureLookupReference('Gén 12,7s'), 'Génesis 12:4-10');
});

test('mapea las URLs de los tres proveedores para libros con slugs especiales', () => {
  const cases = [
    {
      reference: '2Mac 7,1-5',
      bookSlug: 'ii-macabeos',
      chapter: 7,
      startVerse: 1,
      primarySlug: '2-macabeos',
      backupSlug: 'segundo_libro_de_los_macabeos'
    },
    {
      reference: 'Act 2,1',
      bookSlug: 'hechos',
      chapter: 2,
      startVerse: 1,
      primarySlug: 'hechos-de-los-apostoles',
      backupSlug: 'hechos_de_los_apostoles'
    },
    {
      reference: 'Nah 1,1',
      bookSlug: 'nahun',
      chapter: 1,
      startVerse: 1,
      primarySlug: 'nahum',
      backupSlug: 'nahum'
    },
    {
      reference: '3Jn 1,2',
      bookSlug: 'iii-juan',
      chapter: 1,
      startVerse: 2,
      primarySlug: '3-juan',
      backupSlug: 'tercera_epistola_de_san_juan'
    }
  ];

  for (const item of cases) {
    const sources = [
      {
        id: 'bibliacatolica-net',
        url: `${CATHOLIC_BIBLE_PRIMARY_READER_BASE_URL}/${item.primarySlug}/${item.chapter}`
      },
      {
        id: 'alpichel',
        url: `${CATHOLIC_BIBLE_BASE_URL}/${item.backupSlug}/${item.chapter}`
      },
      {
        id: 'legacy-jina',
        url: `${CATHOLIC_BIBLE_READER_BASE_URL}/${item.bookSlug}/${item.chapter}/`
      }
    ];
    const lookup = buildJerusalemBibleLookup(item.reference);

    assert.ok(lookup, item.reference);
    assert.equal(lookup.bookSlug, item.bookSlug, item.reference);
    assert.equal(lookup.readerUrl, sources[2].url, item.reference);
    assert.equal(
      lookup.sourceUrl,
      `${CATHOLIC_BIBLE_BASE_URL}/${item.backupSlug}/${item.chapter}#v${item.startVerse}`,
      item.reference
    );
    assert.deepEqual(lookup.sources, sources, item.reference);
    assert.deepEqual(
      buildJerusalemBibleChapterSources(item.bookSlug, item.chapter),
      sources,
      item.reference
    );
    assert.equal(catholicBibleUrl(item.reference), lookup.sourceUrl, item.reference);
  }

  assert.equal(JERUSALEM_BIBLE_TRANSLATION_NAME, 'Biblia de Jerusalén');
});

test('parsea un capítulo de bibliacatolica.net y limita la lectura a su sección bíblica', () => {
  assert.deepEqual(parseCatholicBibleNetChapter(catholicBibleNetFixture, 3), {
    15: 'para que todo el que crea tenga por él vida eterna.',
    16: 'Porque tanto amó Dios al mundo que dio a su Hijo único.',
    17: 'Porque Dios no ha enviado a su Hijo al mundo para juzgarlo.'
  });
  assert.equal(parseCatholicBibleNetChapter(catholicBibleNetFixture, 4), null);
});

test('parsea un capítulo de alpichel y decodifica entidades y etiquetas internas', () => {
  assert.deepEqual(parseAlpichelChapter(alpichelFixture, 3), {
    15: 'para que todo el que crea tenga por él vida eterna.',
    16: 'Porque tanto amó Dios al mundo que dio a su Hijo único.',
    17: 'Porque Dios no ha enviado a su Hijo al mundo para juzgarlo.'
  });
  assert.equal(parseAlpichelChapter(alpichelFixture, 2), null);
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
      assert.deepEqual(
        lookup.sources.map(({ id }) => id),
        ['bibliacatolica-net', 'alpichel', 'legacy-jina'],
        token.label
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
