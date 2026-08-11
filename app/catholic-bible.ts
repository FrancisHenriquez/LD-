export const CATHOLIC_BIBLE_BASE_URL =
  "https://bdj.alpichel.com";

export const CATHOLIC_BIBLE_PRIMARY_READER_BASE_URL =
  "https://www.bibliacatolica.net";

export const CATHOLIC_BIBLE_LEGACY_BASE_URL =
  "https://www.bibliacatolica.com.br/es/la-biblia-de-jerusalen";

export const CATHOLIC_BIBLE_READER_BASE_URL =
  `https://r.jina.ai/${CATHOLIC_BIBLE_LEGACY_BASE_URL}`;

export const CATHOLIC_BIBLE_FALLBACK_URL =
  "https://www.conferenciaepiscopal.es/biblia/";

export const JERUSALEM_BIBLE_TRANSLATION_NAME = "Biblia de Jerusalén";

const bookSlugs: Record<string, string> = {
  gen: "genesis",
  ex: "exodo",
  lev: "levitico",
  lv: "levitico",
  num: "numeros",
  dt: "deuteronomio",
  jos: "josue",
  jue: "jueces",
  rut: "rut",
  "1sa": "i-samuel",
  isa: "i-samuel",
  lsa: "i-samuel",
  "2sa": "ii-samuel",
  iisa: "ii-samuel",
  llsa: "ii-samuel",
  "1re": "i-reyes",
  ire: "i-reyes",
  lre: "i-reyes",
  "2re": "ii-reyes",
  iire: "ii-reyes",
  llre: "ii-reyes",
  "1par": "i-cronicas",
  ipar: "i-cronicas",
  lpar: "i-cronicas",
  "2par": "ii-cronicas",
  iipar: "ii-cronicas",
  llpar: "ii-cronicas",
  esd: "esdras",
  neh: "nehemias",
  tob: "tobias",
  jdt: "judit",
  est: "ester",
  job: "job",
  sal: "salmos",
  salmo: "salmos",
  "1mac": "i-macabeos",
  imac: "i-macabeos",
  lmac: "i-macabeos",
  "2mac": "ii-macabeos",
  iimac: "ii-macabeos",
  llmac: "ii-macabeos",
  prov: "proverbios",
  ecl: "eclesiastes",
  cant: "cantar",
  sab: "sabiduria",
  eclo: "eclesiastico",
  is: "isaias",
  isaias: "isaias",
  jer: "jeremias",
  lam: "lamentaciones",
  bar: "baruc",
  ez: "ezequiel",
  dan: "daniel",
  dn: "daniel",
  os: "oseas",
  jl: "joel",
  am: "amos",
  abd: "abdias",
  jon: "jonas",
  miq: "miqueas",
  nah: "nahun",
  hab: "habacuc",
  sof: "sofonias",
  ag: "ageo",
  zac: "zacarias",
  mal: "malaquias",
  mt: "mateo",
  mc: "marcos",
  lc: "lucas",
  jn: "juan",
  act: "hechos",
  hch: "hechos",
  rom: "romanos",
  rm: "romanos",
  "1cor": "i-corintios",
  icor: "i-corintios",
  lcor: "i-corintios",
  "2cor": "ii-corintios",
  iicor: "ii-corintios",
  llcor: "ii-corintios",
  gal: "galatas",
  ef: "efesios",
  flp: "filipenses",
  col: "colosenses",
  "1tes": "i-tesalonicenses",
  ites: "i-tesalonicenses",
  ltes: "i-tesalonicenses",
  "2tes": "ii-tesalonicenses",
  iites: "ii-tesalonicenses",
  lltes: "ii-tesalonicenses",
  "1tim": "i-timoteo",
  itim: "i-timoteo",
  ltim: "i-timoteo",
  "2tim": "ii-timoteo",
  iitim: "ii-timoteo",
  lltim: "ii-timoteo",
  tit: "tito",
  flm: "filemon",
  heb: "hebreos",
  sant: "santiago",
  "1pe": "i-pedro",
  ipe: "i-pedro",
  lpe: "i-pedro",
  "2pe": "ii-pedro",
  iipe: "ii-pedro",
  llpe: "ii-pedro",
  "1jn": "i-juan",
  ijn: "i-juan",
  ljn: "i-juan",
  "2jn": "ii-juan",
  iijn: "ii-juan",
  lljn: "ii-juan",
  "3jn": "iii-juan",
  iiijn: "iii-juan",
  llljn: "iii-juan",
  jud: "judas",
  ap: "apocalipsis",
};

function normalizeBook(book: string) {
  const normalized = book
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s.]/g, "")
    .toLowerCase();

  // Corrige el caso aislado "i2Cor" producido por el OCR del PDF.
  return /^[il]2/u.test(normalized) ? normalized.slice(1) : normalized;
}

const bookSlugToSpanishReferenceBook: Record<string, string> = {
  genesis: "Génesis",
  exodo: "Éxodo",
  levitico: "Levítico",
  numeros: "Números",
  deuteronomio: "Deuteronomio",
  josue: "Josué",
  jueces: "Jueces",
  rut: "Rut",
  "i-samuel": "1 Samuel",
  "ii-samuel": "2 Samuel",
  "i-reyes": "1 Reyes",
  "ii-reyes": "2 Reyes",
  "i-cronicas": "1 Crónicas",
  "ii-cronicas": "2 Crónicas",
  esdras: "Esdras",
  nehemias: "Nehemías",
  tobias: "Tobías",
  judit: "Judit",
  ester: "Ester",
  job: "Job",
  salmos: "Salmos",
  "i-macabeos": "1 Macabeos",
  "ii-macabeos": "2 Macabeos",
  proverbios: "Proverbios",
  eclesiastes: "Eclesiastés",
  cantar: "Cantares",
  sabiduria: "Sabiduría",
  eclesiastico: "Eclesiástico",
  isaias: "Isaías",
  jeremias: "Jeremías",
  lamentaciones: "Lamentaciones",
  baruc: "Baruc",
  ezequiel: "Ezequiel",
  daniel: "Daniel",
  oseas: "Oseas",
  joel: "Joel",
  amos: "Amós",
  abdias: "Abdías",
  jonas: "Jonás",
  miqueas: "Miqueas",
  nahun: "Nahúm",
  habacuc: "Habacuc",
  sofonias: "Sofonías",
  ageo: "Ageo",
  zacarias: "Zacarías",
  malaquias: "Malaquías",
  mateo: "Mateo",
  marcos: "Marcos",
  lucas: "Lucas",
  juan: "Juan",
  hechos: "Hechos",
  romanos: "Romanos",
  "i-corintios": "1 Corintios",
  "ii-corintios": "2 Corintios",
  galatas: "Gálatas",
  efesios: "Efesios",
  filipenses: "Filipenses",
  colosenses: "Colosenses",
  "i-tesalonicenses": "1 Tesalonicenses",
  "ii-tesalonicenses": "2 Tesalonicenses",
  "i-timoteo": "1 Timoteo",
  "ii-timoteo": "2 Timoteo",
  tito: "Tito",
  filemon: "Filemón",
  hebreos: "Hebreos",
  santiago: "Santiago",
  "i-pedro": "1 Pedro",
  "ii-pedro": "2 Pedro",
  "i-juan": "1 Juan",
  "ii-juan": "2 Juan",
  "iii-juan": "3 Juan",
  judas: "Judas",
  apocalipsis: "Apocalipsis",
};

const primaryReaderSlugOverrides: Record<string, string> = {
  cantar: "cantar-de-los-cantares",
  hechos: "hechos-de-los-apostoles",
  nahun: "nahum",
};

const backupReaderSlugOverrides: Record<string, string> = {
  "i-samuel": "primer_libro_de_samuel",
  "ii-samuel": "segundo_libro_de_samuel",
  "i-reyes": "primer_libro_de_los_reyes",
  "ii-reyes": "segundo_libro_de_los_reyes",
  "i-cronicas": "primer_libro_de_cronicas",
  "ii-cronicas": "segundo_libro_de_cronicas",
  "i-macabeos": "primer_libro_de_los_macabeos",
  "ii-macabeos": "segundo_libro_de_los_macabeos",
  eclesiastes: "qohelet_eclesiastes",
  cantar: "cantar_de_los_cantares",
  eclesiastico: "siracida_eclesiastico",
  nahun: "nahum",
  mateo: "evangelio_segun_san_mateo",
  marcos: "evangelio_segun_san_marcos",
  lucas: "evangelio_segun_san_lucas",
  juan: "evangelio_segun_san_juan",
  hechos: "hechos_de_los_apostoles",
  romanos: "carta_a_los_romanos",
  "i-corintios": "primera_carta_a_los_corintios",
  "ii-corintios": "segunda_carta_a_los_corintios",
  "i-tesalonicenses": "primera_carta_a_los_tesalonicenses",
  "ii-tesalonicenses": "segunda_carta_a_los_tesalonicenses",
  "i-timoteo": "primera_carta_a_timoteo",
  "ii-timoteo": "segunda_carta_a_timoteo",
  tito: "carta_a_tito",
  filemon: "carta_a_filemon",
  hebreos: "carta_a_los_hebreos",
  santiago: "epistola_de_santiago",
  "i-pedro": "primera_epistola_de_san_pedro",
  "ii-pedro": "segunda_epistola_de_san_pedro",
  "i-juan": "primera_epistola_de_san_juan",
  "ii-juan": "segunda_epistola_de_san_juan",
  "iii-juan": "tercera_epistola_de_san_juan",
  judas: "epistola_de_san_judas",
};

function primaryReaderSlug(bookSlug: string) {
  const overridden = primaryReaderSlugOverrides[bookSlug];
  if (overridden) return overridden;

  return bookSlug
    .replace(/^iii-/u, "3-")
    .replace(/^ii-/u, "2-")
    .replace(/^i-/u, "1-");
}

function backupReaderSlug(bookSlug: string) {
  return backupReaderSlugOverrides[bookSlug] ?? bookSlug;
}

export type JerusalemBibleProviderId =
  | "bibliacatolica-net"
  | "alpichel"
  | "legacy-jina";

export type JerusalemBibleChapterSource = {
  id: JerusalemBibleProviderId;
  url: string;
};

export type JerusalemBibleVerseRange = {
  startVerse: number;
  endVerse: number;
};

const BIBLE_REFERENCE_PATTERN = /^(?<book>.+?)\s+(?<chapter>\d{1,3})\s*[,.:]\s*(?<verses>\d{1,3}(?:\s*[-–]\s*\d{1,3})?(?:\s*\.\s*\d{1,3}(?:\s*[-–]\s*\d{1,3})?)*(?:ss|s)?(?:\s*p)?)$/iu;

export function buildJerusalemBibleChapterSources(bookSlug: string, chapter: number) {
  return [
    {
      id: "bibliacatolica-net",
      url: `${CATHOLIC_BIBLE_PRIMARY_READER_BASE_URL}/${primaryReaderSlug(bookSlug)}/${chapter}`,
    },
    {
      id: "alpichel",
      url: `${CATHOLIC_BIBLE_BASE_URL}/${backupReaderSlug(bookSlug)}/${chapter}`,
    },
    {
      id: "legacy-jina",
      url: `${CATHOLIC_BIBLE_READER_BASE_URL}/${bookSlug}/${chapter}/`,
    },
  ] satisfies JerusalemBibleChapterSource[];
}

export function expandReferenceRanges(reference: string) {
  const cleanReference = reference.replace(/[()]/g, "").trim();
  const match = cleanReference.match(BIBLE_REFERENCE_PATTERN);

  if (!match?.groups) return null;

  const compactVerses = match.groups.verses.replace(/\s/gu, "");
  const withoutParallelMarker = compactVerses.replace(/p$/iu, "");
  const hasContextMarker = /(?:ss|s)$/iu.test(withoutParallelMarker);
  const verseExpression = withoutParallelMarker.replace(/(?:ss|s)$/iu, "");
  const verseRanges: JerusalemBibleVerseRange[] = [];

  for (const segment of verseExpression.split(".")) {
    const segmentMatch = segment.match(/^(?<start>\d{1,3})(?:[-–](?<end>\d{1,3}))?$/u);
    if (!segmentMatch?.groups) return null;

    const startVerse = Number(segmentMatch.groups.start);
    const endVerse = Number(segmentMatch.groups.end ?? segmentMatch.groups.start);
    if (startVerse < 1 || endVerse < 1) return null;

    verseRanges.push({
      startVerse: Math.min(startVerse, endVerse),
      endVerse: Math.max(startVerse, endVerse),
    });
  }

  const finalRange = verseRanges.at(-1);
  if (!finalRange) return null;

  if (hasContextMarker) {
    finalRange.startVerse = Math.max(1, finalRange.startVerse - 3);
    finalRange.endVerse += 3;
  }

  const mergedVerseRanges: JerusalemBibleVerseRange[] = [];
  for (const range of verseRanges) {
    const previousRange = mergedVerseRanges.at(-1);
    const overlapsPrevious = previousRange
      && range.startVerse <= previousRange.endVerse
      && range.endVerse >= previousRange.startVerse;

    if (previousRange && overlapsPrevious) {
      previousRange.startVerse = Math.min(previousRange.startVerse, range.startVerse);
      previousRange.endVerse = Math.max(previousRange.endVerse, range.endVerse);
      continue;
    }

    mergedVerseRanges.push({ ...range });
  }

  return {
    book: match.groups.book.trim(),
    chapter: Number(match.groups.chapter),
    verseRanges: mergedVerseRanges,
  };
}

export function expandReferenceRange(reference: string) {
  const parsed = expandReferenceRanges(reference);
  if (!parsed) return null;

  const startVerse = Math.min(...parsed.verseRanges.map((range) => range.startVerse));
  const endVerse = Math.max(...parsed.verseRanges.map((range) => range.endVerse));

  return {
    book: parsed.book,
    chapter: parsed.chapter,
    startVerse,
    endVerse,
  };
}

export function buildScriptureLookupReference(reference: string) {
  return buildJerusalemBibleLookup(reference)?.referenceLabel ?? null;
}

export function buildJerusalemBibleLookup(reference: string) {
  const parsed = expandReferenceRanges(reference);
  if (!parsed) return null;

  const slug = bookSlugs[normalizeBook(parsed.book)];
  const bookName = slug ? bookSlugToSpanishReferenceBook[slug] : null;
  if (!bookName) return null;

  const verseLabel = parsed.verseRanges.map(({ startVerse, endVerse }) => (
    startVerse === endVerse ? `${startVerse}` : `${startVerse}-${endVerse}`
  )).join(", ");
  const startVerse = Math.min(...parsed.verseRanges.map((range) => range.startVerse));
  const endVerse = Math.max(...parsed.verseRanges.map((range) => range.endVerse));

  return {
    referenceLabel: `${bookName} ${parsed.chapter}:${verseLabel}`,
    readerUrl: `${CATHOLIC_BIBLE_READER_BASE_URL}/${slug}/${parsed.chapter}/`,
    sourceUrl: `${CATHOLIC_BIBLE_BASE_URL}/${backupReaderSlug(slug)}/${parsed.chapter}#v${startVerse}`,
    bookSlug: slug,
    sources: buildJerusalemBibleChapterSources(slug, parsed.chapter),
    chapter: parsed.chapter,
    startVerse,
    endVerse,
    verseRanges: parsed.verseRanges,
  };
}

export function catholicBibleUrl(reference: string) {
  const cleanReference = reference.replace(/[()]/g, "").trim();
  const match = cleanReference.match(BIBLE_REFERENCE_PATTERN);

  if (!match?.groups) return CATHOLIC_BIBLE_FALLBACK_URL;

  const slug = bookSlugs[normalizeBook(match.groups.book)];
  const firstVerse = match.groups.verses.match(/\d{1,3}/u)?.[0];

  if (!slug || !firstVerse) return CATHOLIC_BIBLE_FALLBACK_URL;

  return `${CATHOLIC_BIBLE_BASE_URL}/${backupReaderSlug(slug)}/${match.groups.chapter}#v${firstVerse}`;
}
