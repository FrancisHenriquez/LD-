export const CATHOLIC_BIBLE_BASE_URL =
  "https://www.bibliacatolica.com.br/es/la-biblia-de-jerusalen";

export const CATHOLIC_BIBLE_READER_BASE_URL =
  `https://r.jina.ai/${CATHOLIC_BIBLE_BASE_URL}`;

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

/**
 * Normaliza la abreviatura de un libro para buscarla en el mapa de slugs.
 */
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

/**
 * Interpreta una cita y devuelve su libro, capítulo y rango de versículos.
 * Las marcas finales `s` o `ss` amplían el rango tres versículos por lado.
 */
export function expandReferenceRange(reference: string) {
  const cleanReference = reference.replace(/[()]/g, "").trim();
  const match = cleanReference.match(
    /^(?<book>.+?)\s+(?<chapter>\d{1,3})[,.:]\s*(?<verses>\d{1,3}(?:\.\d{1,3})*(?:[-–]\d{1,3}(?:\.\d{1,3})*)?(?:ss|s)?(?:\s*p)?)$/iu,
  );

  if (!match?.groups) return null;

  const verseNumbers = [...match.groups.verses.matchAll(/\d{1,3}/gu)].map((value) => Number(value[0]));
  if (!verseNumbers.length) return null;

  const startVerse = verseNumbers[0];
  const endVerse = verseNumbers.at(-1) ?? startVerse;
  const hasContextMarker = /(?:ss|s)$/iu.test(match.groups.verses);
  const contextPadding = hasContextMarker ? 3 : 0;

  return {
    book: match.groups.book.trim(),
    chapter: Number(match.groups.chapter),
    startVerse: Math.max(1, startVerse - contextPadding),
    endVerse: endVerse + contextPadding,
  };
}

/**
 * Convierte una cita admitida en la etiqueta canónica usada para buscarla.
 */
export function buildScriptureLookupReference(reference: string) {
  return buildJerusalemBibleLookup(reference)?.referenceLabel ?? null;
}

/**
 * Construye la etiqueta, las URL y el rango necesarios para consultar una cita.
 * Devuelve `null` cuando la referencia o el libro no son reconocidos.
 */
export function buildJerusalemBibleLookup(reference: string) {
  const parsed = expandReferenceRange(reference);
  if (!parsed) return null;

  const slug = bookSlugs[normalizeBook(parsed.book)];
  const bookName = slug ? bookSlugToSpanishReferenceBook[slug] : null;
  if (!bookName) return null;

  const verseLabel = parsed.startVerse === parsed.endVerse
    ? `${parsed.startVerse}`
    : `${parsed.startVerse}-${parsed.endVerse}`;

  return {
    referenceLabel: `${bookName} ${parsed.chapter}:${verseLabel}`,
    readerUrl: `${CATHOLIC_BIBLE_READER_BASE_URL}/${slug}/${parsed.chapter}/`,
    sourceUrl: `${CATHOLIC_BIBLE_BASE_URL}/${slug}/${parsed.chapter}/`,
    chapter: parsed.chapter,
    startVerse: parsed.startVerse,
    endVerse: parsed.endVerse,
  };
}

/**
 * Genera la URL pública de una cita, apuntando a su primer versículo.
 * Si la cita no es válida, devuelve la página bíblica alternativa.
 */
export function catholicBibleUrl(reference: string) {
  const cleanReference = reference.replace(/[()]/g, "").trim();
  const match = cleanReference.match(
    /^(?<book>.+?)\s+(?<chapter>\d{1,3})[,.:]\s*(?<verses>\d{1,3}(?:\.\d{1,3})*(?:[-–]\d{1,3}(?:\.\d{1,3})*)?(?:ss|s)?(?:\s*p)?)$/iu,
  );

  if (!match?.groups) return CATHOLIC_BIBLE_FALLBACK_URL;

  const slug = bookSlugs[normalizeBook(match.groups.book)];
  const firstVerse = match.groups.verses.match(/\d{1,3}/u)?.[0];

  if (!slug || !firstVerse) return CATHOLIC_BIBLE_FALLBACK_URL;

  return `${CATHOLIC_BIBLE_BASE_URL}/${slug}/${match.groups.chapter}/${firstVerse}/`;
}
