import { buildJerusalemBibleLookup } from "./catholic-bible.ts";
import { tokenizeBiblicalReferences } from "./reference-parser.ts";

export type ReferenceGroupId = "historico" | "cartas" | "profetico" | "evangelio";

export type GroupedReference = {
  key: string;
  label: string;
};

export type ReferenceGroup = {
  id: ReferenceGroupId;
  title: string;
  description: string;
  references: GroupedReference[];
};

// Se clasifica por libro, no por el contenido de un pasaje. El Pentateuco y
// los libros poéticos y sapienciales quedan fuera de estos cuatro grupos.
const groupDefinitions = [
  {
    id: "historico",
    title: "Histórico",
    description: "Libros históricos y Hechos de los Apóstoles",
    books: [
      "josue", "jueces", "rut", "i-samuel", "ii-samuel", "i-reyes", "ii-reyes",
      "i-cronicas", "ii-cronicas", "esdras", "nehemias", "tobias", "judit",
      "ester", "i-macabeos", "ii-macabeos", "hechos",
    ],
  },
  {
    id: "cartas",
    title: "Cartas",
    description: "Cartas del Nuevo Testamento",
    books: [
      "romanos", "i-corintios", "ii-corintios", "galatas", "efesios",
      "filipenses", "colosenses", "i-tesalonicenses", "ii-tesalonicenses",
      "i-timoteo", "ii-timoteo", "tito", "filemon", "hebreos", "santiago",
      "i-pedro", "ii-pedro", "i-juan", "ii-juan", "iii-juan", "judas",
    ],
  },
  {
    id: "profetico",
    title: "Profético",
    description: "Libros proféticos y Apocalipsis",
    books: [
      "isaias", "jeremias", "lamentaciones", "baruc", "ezequiel", "daniel",
      "oseas", "joel", "amos", "abdias", "jonas", "miqueas", "nahun",
      "habacuc", "sofonias", "ageo", "zacarias", "malaquias", "apocalipsis",
    ],
  },
  {
    id: "evangelio",
    title: "Evangelio",
    description: "Mateo, Marcos, Lucas y Juan",
    books: ["mateo", "marcos", "lucas", "juan"],
  },
] satisfies Array<{
  id: ReferenceGroupId;
  title: string;
  description: string;
  books: string[];
}>;

/** Reúne las citas del lector por procedencia y conserva su primera aparición. */
export function groupBiblicalReferences(text: string): ReferenceGroup[] {
  const groups: ReferenceGroup[] = groupDefinitions.map(({ id, title, description }) => ({
    id, title, description, references: [],
  }));
  const seen = new Set<string>();

  // Coincide con el lector: un libro abreviado no se hereda entre párrafos.
  for (const paragraph of text.split(/\n{2,}/)) {
    for (const token of tokenizeBiblicalReferences(paragraph)) {
      if (token.type !== "citation") continue;
      const lookup = buildJerusalemBibleLookup(token.label);
      if (!lookup) continue;
      const groupIndex = groupDefinitions.findIndex(({ books }) => books.includes(lookup.bookSlug));
      if (groupIndex === -1) continue;

      // No se deduplica por URL ni por rangos ampliados: se perderían citas
      // distintas que empiezan en el mismo versículo o tienen marcas s/ss.
      const verseExpression = token.label.replace(/^.+?\s+(?=\d)/u, "")
        .replace(/^(\d+)[.:]/u, "$1,").replace(/\s+/gu, "").replace(/–/gu, "-").toLowerCase();
      const key = `${lookup.bookSlug}:${lookup.chapter}:${verseExpression}`;
      if (seen.has(key)) continue;
      seen.add(key);
      groups[groupIndex].references.push({ key, label: token.label });
    }
  }

  return groups;
}
