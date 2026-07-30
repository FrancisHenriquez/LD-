export type ReferenceToken =
  | { type: "text"; value: string }
  | { type: "citation"; value: string; label: string };

const bibleBooks = String.raw`(?:Gén|Gen|Éx|Ex|Lév|Lev|Núm|Num|Dt|Jos|Jue|Rut|[12I]{1,3}Sa|[12I]{1,3}Re|[12I]{1,3}Par|Esd|Neh|Est|Job|Sal|Prov|Ecl|Cant|Sab|Eclo|Is|Jer|Lam|Bar|Ez|Dan|Os|Jl|Am|Abd|Jon|Miq|Nah|Hab|Sof|Ag|Zac|Mal|Mt|Mc|Lc|Jn|Act|Hch|Rom|[12I]{1,3}Cor|Gál|Gal|Ef|Flp|Col|[12I]{1,3}Tes|[12I]{1,3}Tim|Tit|Flm|Heb|Sant|[12I]{1,3}Pe|[123I]{1,3}Jn|Jud|Ap)`;
const verse = String.raw`\d{1,3}(?:\.\d{1,3})*(?:[-–]\d{1,3}(?:\.\d{1,3})*)?(?:ss|s)?(?:\s*p)?`;
const chapterAndVerse = String.raw`\d{1,3}[,.:]\s*${verse}`;

const referenceContainerPattern = new RegExp(
  String.raw`\([^()]*\d{1,3}[,.:]\s*\d+[^()]*\)|\b${bibleBooks}\s+${chapterAndVerse}(?:\s*;\s*(?:${bibleBooks}\s+)?${chapterAndVerse})*`,
  "giu",
);

const referencePartPattern = new RegExp(
  String.raw`(?:(?<book>${bibleBooks})\s+)?(?<chapter>\d{1,3})(?<separator>[,.:])\s*(?<verses>${verse})`,
  "giu",
);

const explicitReferencePattern = new RegExp(
  String.raw`\b${bibleBooks}\s+${chapterAndVerse}`,
  "iu",
);

const inheritedOnlyPattern = new RegExp(
  String.raw`^(?:cf\.\s*)?${chapterAndVerse}(?:\s*;\s*(?:cf\.\s*)?${chapterAndVerse})*$`,
  "iu",
);

function pushText(tokens: ReferenceToken[], value: string) {
  if (!value) return;
  const previous = tokens.at(-1);
  if (previous?.type === "text") {
    previous.value += value;
  } else {
    tokens.push({ type: "text", value });
  }
}

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
          chapter?: string;
          separator?: string;
          verses?: string;
        }
      | undefined;
    const book = groups?.book ?? lastBook;

    pushText(tokens, value.slice(cursor, start));
    if (!book || !groups?.chapter || !groups.separator || !groups.verses) {
      pushText(tokens, match[0]);
    } else {
      const compactVerses = groups.verses.replace(/\s+/g, "");
      const label = `${book} ${groups.chapter}${groups.separator}${compactVerses}`;
      tokens.push({ type: "citation", value: match[0], label });
      lastBook = book;
    }
    cursor = start + match[0].length;
  }

  pushText(tokens, value.slice(cursor));
  return { tokens, lastBook };
}

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
