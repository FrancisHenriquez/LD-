import { buildJerusalemBibleLookup } from "./catholic-bible.ts";

export type ReferenceToken =
  | { type: "text"; value: string }
  | { type: "citation"; value: string; label: string };

// La gramática admite abreviaturas y variantes OCR de libros, rangos, segmentos
// discontinuos y sufijos contextuales. Primero localiza contenedores candidatos;
// después exige un libro explícito o una secuencia completa que pueda heredarlo,
// evitando convertir números incidentales de la prosa en referencias.
const bibleBooks = String.raw`(?:Gén|Gen|Éx|Ex|Lév|Lev|Núm|Num|Dt|Jos|Jue|Rut|[12I]{1,3}Sa|[12I]{1,3}Re|[12I]{1,3}Par|Esd|Neh|Tob|Jdt|Est|Job|Sal|(?:[12]|[Il]{1,3})\s*Mac|Prov|Ecl|Cant|Sab|Eclo|Is|Jer|Lam|Bar|Ez|Dan|Os|Jl|Am|Abd|Jon|Miq|Nah|Hab|Sof|Ag|Zac|Mal|Mt|Mc|Lc|Jn|Act|Hch|Rom|Rm|[12I]{1,3}Cor|Gál|Gal|Ef|Flp|Col|[12I]{1,3}Tes|[12I]{1,3}Tim|Tit|Flm|Heb|Sant|[12I]{1,3}Pe|[123I]{1,3}Jn|Jud|Ap)`;
const verseNumber = String.raw`\d{1,3}(?!\d)`;
const verseSegment = String.raw`${verseNumber}(?:\s*[-–]\s*${verseNumber})?`;
const verse = String.raw`${verseSegment}(?:\s*\.\s*${verseSegment}(?!\s*[,:]\s*\d))*(?:\s*(?:ss|s)(?!\p{L}))?(?:\s*p(?!\p{L}))?`;
const crossChapter = String.raw`${verseNumber}\s*[,.:]\s*${verseNumber}\s*[-–]\s*${verseNumber}\s*,\s*${verseNumber}`;
const chapterAndVerse = String.raw`(?:${crossChapter}|${verseNumber}\s*[,.:]\s*${verse})(?!\s*,\s*\d)`;
const chapterOnly = String.raw`${verseSegment}(?!\s*(?:[,:\d–-]|\.\s*\d))(?![\p{L}\p{N}])`;
const explicitReference = String.raw`${bibleBooks}\s+(?:${chapterAndVerse}|${chapterOnly})`;

const referenceContainerPattern = new RegExp(
  String.raw`\([^()]*\d[^()]*\)|(?<![\p{L}\p{N}_])${explicitReference}(?:\s*[;:]\s*(?:${explicitReference}|${chapterAndVerse}))*`,
  "giu",
);

const referencePartPattern = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:(?<book>${bibleBooks})\s+)?(?<reference>${chapterAndVerse})|(?<![\p{L}\p{N}_])(?<chapterBook>${bibleBooks})\s+(?<chapters>${chapterOnly})`,
  "giu",
);

const explicitReferencePattern = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])${explicitReference}`,
  "iu",
);

const inheritedOnlyPattern = new RegExp(
  String.raw`^(?:cf\.\s*)?${chapterAndVerse}(?:\s*;\s*(?:cf\.\s*)?${chapterAndVerse})*$`,
  "iu",
);

/**
 * Añade texto a la lista y lo fusiona con el fragmento de texto anterior.
 */
function pushText(tokens: ReferenceToken[], value: string) {
  if (!value) return;
  const previous = tokens.at(-1);
  if (previous?.type === "text") {
    previous.value += value;
  } else {
    tokens.push({ type: "text", value });
  }
}

/**
 * Separa una secuencia de citas y conserva el último libro para referencias
 * posteriores que solo indiquen capítulo y versículo. Solo permite herencia si
 * el fragmento completo, aparte de `cf.`, tiene forma de cita bíblica.
 */
function tokenizeSequence(
  value: string,
  inheritedBook: string | null,
): { tokens: ReferenceToken[]; lastBook: string | null } {
  const hasExplicitReference = explicitReferencePattern.test(value);
  const canInherit =
    inheritedBook !== null && inheritedOnlyPattern.test(value.trim());

  if (!hasExplicitReference && !canInherit) {
    return { tokens: [{ type: "text", value }], lastBook: inheritedBook };
  }

  const tokens: ReferenceToken[] = [];
  let cursor = 0;
  let lastBook = inheritedBook;

  for (const match of value.matchAll(referencePartPattern)) {
    const start = match.index ?? 0;
    const groups = match.groups as
      | {
          book?: string;
          reference?: string;
          chapterBook?: string;
          chapters?: string;
        }
      | undefined;
    const book = groups?.book ?? groups?.chapterBook ?? lastBook;
    const reference = groups?.reference ?? groups?.chapters;

    pushText(tokens, value.slice(cursor, start));
    if (!book || !reference) {
      pushText(tokens, match[0]);
    } else {
      const label = `${book} ${reference.replace(/\s+/g, "")}`;
      if (buildJerusalemBibleLookup(label)) {
        tokens.push({ type: "citation", value: match[0], label });
        lastBook = book;
      } else {
        pushText(tokens, match[0]);
      }
    }
    cursor = start + match[0].length;
  }

  pushText(tokens, value.slice(cursor));
  return { tokens, lastBook };
}

/**
 * Divide un texto en fragmentos literales y citas bíblicas reconocibles.
 * Mantiene intacto el contenido original de cada fragmento.
 */
export function tokenizeBiblicalReferences(text: string): ReferenceToken[] {
  const tokens: ReferenceToken[] = [];
  let cursor = 0;
  let lastBook: string | null = null;

  for (const match of text.matchAll(referenceContainerPattern)) {
    const start = match.index ?? 0;
    pushText(tokens, text.slice(cursor, start));

    const isParenthetical = match[0].startsWith("(");
    if (isParenthetical) pushText(tokens, "(");

    const content = isParenthetical ? match[0].slice(1, -1) : match[0];
    const result = tokenizeSequence(content, lastBook);
    // Reincorpora la secuencia sin dejar fragmentos de texto adyacentes.
    result.tokens.forEach((token) => {
      if (token.type === "text") pushText(tokens, token.value);
      else tokens.push(token);
    });
    lastBook = result.lastBook;

    if (isParenthetical) pushText(tokens, ")");
    cursor = start + match[0].length;
  }

  pushText(tokens, text.slice(cursor));
  return tokens;
}
