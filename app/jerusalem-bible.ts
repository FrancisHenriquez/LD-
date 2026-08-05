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

  // Selecciona cada marcador dentro del rango y limpia el texto que lo sigue.
  const verses = markers.flatMap((marker, index) => {
    const verseNumber = Number(marker[1]);
    if (verseNumber < startVerse || verseNumber > endVerse) return [];

    const textStart = (marker.index ?? 0) + marker[0].length;
    const textEnd = markers[index + 1]?.index ?? chapterContent.length;
    const text = plainTextFromMarkdown(chapterContent.slice(textStart, textEnd));

    return text ? [`${verseNumber}. ${text}`] : [];
  });

  return verses.length > 0 ? verses.join("\n\n") : null;
}
