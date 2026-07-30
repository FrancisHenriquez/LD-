export const CATHOLIC_BIBLE_BASE_URL =
  "https://www.bibliacatolica.com.br/es/la-biblia-de-jerusalen";

export const CATHOLIC_BIBLE_FALLBACK_URL =
  "https://www.conferenciaepiscopal.es/biblia/";

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
  nah: "nahum",
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
