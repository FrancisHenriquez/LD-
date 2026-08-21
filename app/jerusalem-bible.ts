export type JerusalemBibleChapter = Record<string, string>;

const htmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
  nbsp: " ",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Ntilde: "Ñ",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

/**
 * Decodifica el subconjunto de entidades que emplean los proveedores y deja
 * intactas las entidades desconocidas para evitar pérdida de contenido.
 */
function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/giu, (entity, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }

    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }

    return htmlEntities[code] ?? htmlEntities[code.toLowerCase()] ?? entity;
  });
}

/** Convierte el HTML acotado de un versículo en texto normalizado. */
function plainTextFromHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?\s*>/giu, " ")
      .replace(/<[^>]+>/gu, " "),
  )
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * Elimina enlaces, imágenes y marcas de formato para obtener texto legible.
 */
function plainTextFromMarkdown(value: string) {
  return value
    .replace(/^>\s?/gmu, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/gu, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/\\([\\`*_[\]{}()#+\-.!>])/gu, "$1")
    .replace(/[*_]{1,2}/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Detecta páginas anti-bot que pueden responder con HTTP 200 pero sin Biblia. */
export function isBibleChallengePage(value: string) {
  return /(?:just a moment|verifying you are human|captcha|cf-chl-|challenge-platform)/iu.test(value);
}

// Verifica el último número del título o encabezado para rechazar redirecciones
// y respuestas almacenadas que pertenecen a otro capítulo.
function reportsExpectedChapter(html: string, expectedChapter: number) {
  const headingHtml = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/iu)?.[1]
    ?? html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1];
  if (!headingHtml) return false;

  const numbers = plainTextFromHtml(headingHtml).match(/\d{1,3}/gu);
  return Number(numbers?.at(-1)) === expectedChapter;
}

// Exige números positivos y estrictamente crecientes, además de texto. Si un
// versículo rompe el contrato, el parser descarta el capítulo completo.
function addVerse(
  chapter: JerusalemBibleChapter,
  verseNumber: number,
  verseText: string,
  previousVerse: number,
) {
  if (!Number.isInteger(verseNumber) || verseNumber <= previousVerse || !verseText) {
    return false;
  }

  chapter[String(verseNumber)] = verseText;
  return true;
}

/**
 * Extrae un capítulo de la sección `prose` de BibliaCatólica.net para no
 * confundir números de navegación con versículos. Devuelve `null` si el
 * capítulo indicado, la secuencia o el contenido no son válidos.
 */
export function parseCatholicBibleNetChapter(html: string, expectedChapter: number) {
  if (isBibleChallengePage(html) || !reportsExpectedChapter(html, expectedChapter)) {
    return null;
  }

  const section = html.match(
    /<section\b[^>]*class=["'][^"']*\bprose\b[^"']*["'][^>]*>([\s\S]*?)<\/section>/iu,
  )?.[1];
  if (!section) return null;

  const chapter: JerusalemBibleChapter = {};
  const versePattern = /<p\b[^>]*>\s*<sup\b[^>]*>\s*(\d{1,3})\s*<\/sup>([\s\S]*?)<\/p>/giu;
  let previousVerse = 0;

  for (const match of section.matchAll(versePattern)) {
    const verseNumber = Number(match[1]);
    const verseText = plainTextFromHtml(match[2]);
    if (!addVerse(chapter, verseNumber, verseText, previousVerse)) return null;
    previousVerse = verseNumber;
  }

  return previousVerse > 0 ? chapter : null;
}

/**
 * Extrae los versículos de Alpichel usando su identificador `vN` como número y
 * aplica las mismas garantías de capítulo completo y secuencia creciente.
 */
export function parseAlpichelChapter(html: string, expectedChapter: number) {
  if (isBibleChallengePage(html) || !reportsExpectedChapter(html, expectedChapter)) {
    return null;
  }

  const chapter: JerusalemBibleChapter = {};
  const versePattern = /<div\b(?=[^>]*class=["'][^"']*\bchapter-verse\b[^"']*["'])(?=[^>]*id=["']v(\d{1,3})["'])[^>]*>[\s\S]*?<sup\b[^>]*>\s*\d{1,3}\s*<\/sup>[\s\S]*?<span\b[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/button>\s*<\/div>/giu;
  let previousVerse = 0;

  for (const match of html.matchAll(versePattern)) {
    const verseNumber = Number(match[1]);
    const verseText = plainTextFromHtml(match[2]);
    if (!addVerse(chapter, verseNumber, verseText, previousVerse)) return null;
    previousVerse = verseNumber;
  }

  return previousVerse > 0 ? chapter : null;
}

/**
 * Convierte el Markdown del lector legado en un capítulo validado.
 * Devuelve `null` cuando el contenido no corresponde al capítulo solicitado.
 */
export function parseJerusalemBibleMarkdownChapter(
  markdown: string,
  expectedChapter: number,
) {
  if (isBibleChallengePage(markdown)) return null;

  const reportedChapterMatch = markdown.match(
    /^(?:Title:\s*|#\s+)[^\r\n,]+,\s*(\d{1,3})(?:\s|$)/mu,
  );
  if (Number(reportedChapterMatch?.[1]) !== expectedChapter) return null;

  const verseMarker = /^(?:>\s*)?\*\*(\d{1,3})\.\*\*\s*/gmu;
  const firstMarkerIndex = markdown.search(verseMarker);
  if (firstMarkerIndex < 0) return null;

  const contentFromFirstVerse = markdown.slice(firstMarkerIndex);
  const navigationIndex = contentFromFirstVerse.search(/^(?:\* {3}\[|#{2,}\s)/mu);
  const chapterContent = navigationIndex < 0
    ? contentFromFirstVerse
    : contentFromFirstVerse.slice(0, navigationIndex);
  const markers = [...chapterContent.matchAll(verseMarker)];
  const chapter: JerusalemBibleChapter = {};
  let previousVerse = 0;

  // Limpia el texto que sigue a cada marcador y conserva su número de versículo.
  for (const [index, marker] of markers.entries()) {
    const verseNumber = Number(marker[1]);
    const textStart = (marker.index ?? 0) + marker[0].length;
    const textEnd = markers[index + 1]?.index ?? chapterContent.length;
    const verseText = plainTextFromMarkdown(chapterContent.slice(textStart, textEnd));

    if (!addVerse(chapter, verseNumber, verseText, previousVerse)) return null;
    previousVerse = verseNumber;
  }

  return previousVerse > 0 ? chapter : null;
}

/**
 * Devuelve un rango numerado solo cuando todos sus versículos están presentes.
 * Rechaza huecos y recorta el final al último versículo disponible, comportamiento
 * necesario para referencias contextuales `s`/`ss` cercanas al fin del capítulo.
 */
export function extractPassageFromChapter(
  chapter: JerusalemBibleChapter,
  startVerse: number,
  endVerse: number,
) {
  const availableVerses = Object.keys(chapter).map(Number).filter(Number.isInteger);
  const lastVerse = Math.max(0, ...availableVerses);
  if (startVerse < 1 || endVerse < startVerse || startVerse > lastVerse) return null;

  const effectiveEnd = Math.min(endVerse, lastVerse);
  const verses: string[] = [];

  for (let verseNumber = startVerse; verseNumber <= effectiveEnd; verseNumber += 1) {
    const text = chapter[String(verseNumber)]?.trim();
    if (!text) return null;
    verses.push(`${verseNumber}. ${text}`);
  }

  return verses.join("\n\n");
}

/**
 * Extrae del Markdown los versículos solicitados después de validar el capítulo.
 * Devuelve el pasaje numerado o `null` si el contenido no corresponde.
 */
export function extractJerusalemBiblePassage(
  markdown: string,
  startVerse: number,
  endVerse: number,
  expectedChapter: number,
) {
  const chapter = parseJerusalemBibleMarkdownChapter(markdown, expectedChapter);
  return chapter ? extractPassageFromChapter(chapter, startVerse, endVerse) : null;
}
