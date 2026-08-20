export type ArticleParagraph = { text: string; sourceIndex: number };

export type ArticleSection = {
  title: "Introducción" | "Antiguo Testamento" | "Nuevo Testamento" | null;
  paragraphs: ArticleParagraph[];
};

type SectionKind = "INTRO" | "AT" | "NT" | null;
type ParagraphPiece = ArticleParagraph & { marker: SectionKind };

const structuralMarkerPattern =
  /(?:^|(?<=[.!?…])\s+)(?:(?:(\d+)\.\s+)?(INTRODUCCI[ÓO]N|AT|NT)\.|(\d+)\.\s+(Antiguo Testamento|Nuevo Testamento)[.,])(?:\s+|$)/giu;

function sectionKind(marker: string): Exclude<SectionKind, null> {
  const normalizedMarker = marker.toUpperCase();
  if (/^INTRODUCCI[ÓO]N$/u.test(normalizedMarker)) return "INTRO";
  return normalizedMarker === "AT" || normalizedMarker === "ANTIGUO TESTAMENTO"
    ? "AT"
    : "NT";
}

function isStructuralSectionStart(paragraph: ArticleParagraph) {
  const text = paragraph.text.trim();
  return /^(?:[IVXLCDM]+|\d+)\.\s/u.test(text) ||
    /^[IVXLCDM]+\s+[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+(?:\.|$)/u.test(text) ||
    /^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+?\.\s/u.test(text);
}

/** Separa los marcadores editoriales que aparecen dentro de un párrafo. */
function splitParagraph(paragraph: string, sourceIndex: number): ParagraphPiece[] {
  let activeMarker: SectionKind = null;
  let prefix = "";
  let cursor = 0;

  const pieces: ParagraphPiece[] = [];
  for (const marker of paragraph.matchAll(structuralMarkerPattern)) {
    const markerIndex = marker.index ?? 0;
    const content = paragraph.slice(cursor, markerIndex).trim();
    const text = content ? [prefix, content].filter(Boolean).join(" ") : "";
    if (activeMarker || text) {
      pieces.push({ marker: activeMarker, text, sourceIndex });
    }

    activeMarker = sectionKind(marker[2] ?? marker[4]);
    const ordinal = marker[1] ?? marker[3];
    prefix = ordinal ? `${ordinal}.` : "";
    cursor = markerIndex + marker[0].length;
  }

  const content = paragraph.slice(cursor).trim();
  const text = content ? [prefix, content].filter(Boolean).join(" ") : "";
  if (activeMarker || text) {
    pieces.push({ marker: activeMarker, text, sourceIndex });
  }
  return pieces;
}

/** Repara un único salto OCR que divide "Antiguo Testamento" en dos bloques. */
function normalizeParagraphs(paragraphs: string[]): ArticleParagraph[] {
  const normalized: ArticleParagraph[] = [];

  paragraphs.forEach((paragraph, sourceIndex) => {
    if (paragraph.trim() === "VocTB") return;

    const previous = normalized.at(-1);
    if (
      previous &&
      /\b(?:Antiguo|Nuevo)$/iu.test(previous.text.trim()) &&
      /^Testamento[.,](?:\s|$)/iu.test(paragraph.trim())
    ) {
      previous.text = `${previous.text.trimEnd()} ${paragraph.trimStart()}`;
      return;
    }

    normalized.push({ text: paragraph, sourceIndex });
  });

  return normalized;
}

/**
 * Agrupa los párrafos según los marcadores editoriales de introducción, AT y
 * NT. Admite marcadores aislados, unidos al contenido o al final de una frase.
 */
export function splitArticleSections(paragraphs: string[]): ArticleSection[] {
  const sections: Array<{ kind: SectionKind; paragraphs: ArticleParagraph[] }> = [];
  let current: (typeof sections)[number] = { kind: null, paragraphs: [] };

  normalizeParagraphs(paragraphs).forEach(({ text: paragraph, sourceIndex }) => {
    for (const piece of splitParagraph(paragraph, sourceIndex)) {
      if (piece.marker) {
        if (current.kind || current.paragraphs.length) sections.push(current);
        current = {
          kind: piece.marker,
          paragraphs: [],
        };
      }

      if (piece.text) {
        current.paragraphs.push({
          text: piece.text,
          sourceIndex: piece.sourceIndex,
        });
      }
    }
  });

  if (current.kind || current.paragraphs.length) sections.push(current);

  if (sections[0]?.kind === null && sections[1]?.kind === "INTRO") {
    sections[1].paragraphs.unshift(...sections[0].paragraphs);
    sections.shift();
  }

  if (sections[0]?.kind === null && sections[1]?.kind === "NT") {
    const atStart = sections[0].paragraphs.findIndex(isStructuralSectionStart);
    if (atStart > 0) {
      const introductoryParagraphs = sections[0].paragraphs.slice(0, atStart);
      const oldTestamentParagraphs = sections[0].paragraphs.slice(atStart);
      sections.splice(
        0,
        1,
        { kind: "INTRO", paragraphs: introductoryParagraphs },
        { kind: "AT", paragraphs: oldTestamentParagraphs },
      );
    } else {
      sections[0].kind = "AT";
    }
  }

  const firstMarkedSection = sections.find(
    ({ kind }) => kind === "AT" || kind === "NT",
  );
  const articleSections: ArticleSection[] = sections.map(({
    kind,
    paragraphs: sectionParagraphs,
  }) => ({
    title:
      kind === "INTRO"
        ? "Introducción"
        : kind === "AT"
          ? "Antiguo Testamento"
          : kind === "NT"
            ? "Nuevo Testamento"
            : firstMarkedSection?.kind === "AT"
              ? "Introducción"
              : null,
    paragraphs: sectionParagraphs,
  }));

  if (articleSections.length === 1 && articleSections[0].title === null) {
    const developmentStart = articleSections[0].paragraphs.findIndex(
      isStructuralSectionStart,
    );
    if (developmentStart > 0) {
      return [
        {
          title: "Introducción",
          paragraphs: articleSections[0].paragraphs.slice(0, developmentStart),
        },
        {
          title: null,
          paragraphs: articleSections[0].paragraphs.slice(developmentStart),
        },
      ];
    }
  }

  return articleSections;
}
