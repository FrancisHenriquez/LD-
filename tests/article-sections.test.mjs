import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { splitArticleSections } from "../app/article-sections.ts";
import { tokenizeBiblicalReferences } from "../app/reference-parser.ts";

const articles = JSON.parse(
  readFileSync(new URL("../app/data/articles.json", import.meta.url), "utf8"),
);

function sectionsForArticle(name) {
  const paragraphs = articles[name].text.split(/\n{2,}/).filter(Boolean);
  return splitArticleSections(paragraphs);
}

test("separa la introducción de marcadores AT y NT aislados", () => {
  assert.deepEqual(
    splitArticleSections(["Texto inicial", "AT.", "Texto antiguo", "NT.", "Texto nuevo"]),
    [
      { title: "Introducción", paragraphs: [{ text: "Texto inicial", sourceIndex: 0 }] },
      { title: "Antiguo Testamento", paragraphs: [{ text: "Texto antiguo", sourceIndex: 2 }] },
      { title: "Nuevo Testamento", paragraphs: [{ text: "Texto nuevo", sourceIndex: 4 }] },
    ],
  );
});

test("separa marcadores unidos al contenido o al final de una frase", () => {
  assert.deepEqual(
    splitArticleSections(["Introducción", "AT. Texto antiguo. NT. Texto nuevo"]),
    [
      { title: "Introducción", paragraphs: [{ text: "Introducción", sourceIndex: 0 }] },
      { title: "Antiguo Testamento", paragraphs: [{ text: "Texto antiguo.", sourceIndex: 1 }] },
      { title: "Nuevo Testamento", paragraphs: [{ text: "Texto nuevo", sourceIndex: 1 }] },
    ],
  );
});

test("infiere introducción y AT cuando el texto solo marca el NT", () => {
  assert.deepEqual(
    splitArticleSections([
      "Texto introductorio",
      "I. BLOQUE ANTIGUO.",
      "Contenido antiguo",
      "NT. Contenido nuevo",
    ]),
    [
      { title: "Introducción", paragraphs: [{ text: "Texto introductorio", sourceIndex: 0 }] },
      {
        title: "Antiguo Testamento",
        paragraphs: [
          { text: "I. BLOQUE ANTIGUO.", sourceIndex: 1 },
          { text: "Contenido antiguo", sourceIndex: 2 },
        ],
      },
      { title: "Nuevo Testamento", paragraphs: [{ text: "Contenido nuevo", sourceIndex: 3 }] },
    ],
  );
});

test("conserva un título estructural antes del rótulo siguiente", () => {
  const result = splitArticleSections([
    "AT. Texto antiguo",
    "II. LA CARIDAD FRATERNA.",
    "NT. Texto nuevo",
  ]);
  assert.deepEqual(result[0], {
    title: "Antiguo Testamento",
    paragraphs: [
      { text: "Texto antiguo", sourceIndex: 0 },
      { text: "II. LA CARIDAD FRATERNA.", sourceIndex: 1 },
    ],
  });
  assert.deepEqual(result[1], {
    title: "Nuevo Testamento",
    paragraphs: [{ text: "Texto nuevo", sourceIndex: 2 }],
  });
});

test("integra la numeración de divisiones sin dejar títulos huérfanos", () => {
  assert.deepEqual(
    splitArticleSections([
      "II. LA PUERTA DEL CIELO. 1. AT. Texto antiguo",
      "2. NT. Texto nuevo",
    ]),
    [
      {
        title: "Introducción",
        paragraphs: [{ text: "II. LA PUERTA DEL CIELO.", sourceIndex: 0 }],
      },
      {
        title: "Antiguo Testamento",
        paragraphs: [{ text: "1. Texto antiguo", sourceIndex: 0 }],
      },
      {
        title: "Nuevo Testamento",
        paragraphs: [{ text: "2. Texto nuevo", sourceIndex: 1 }],
      },
    ],
  );
});

test("no añade un rótulo cuando el artículo no contiene divisiones", () => {
  assert.deepEqual(
    splitArticleSections(["Artículo completo"]),
    [{ title: null, paragraphs: [{ text: "Artículo completo", sourceIndex: 0 }] }],
  );
});

test("mantiene las divisiones editoriales de los artículos especiales", () => {
  const cases = {
    "Acción de gracias": ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Fuego: ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    "Hambre y sed": ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Justicia: [
      "Introducción",
      "Antiguo Testamento",
      "Nuevo Testamento",
      "Antiguo Testamento",
      "Nuevo Testamento",
      "Antiguo Testamento",
      "Nuevo Testamento",
      "Antiguo Testamento",
      "Nuevo Testamento",
    ],
    Ira: ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Limosna: ["Antiguo Testamento", "Nuevo Testamento"],
    Nombre: ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Profeta: ["Antiguo Testamento", "Nuevo Testamento"],
    Sabiduría: ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Amor: [
      "Introducción",
      "Antiguo Testamento",
      "Nuevo Testamento",
      "Antiguo Testamento",
      "Nuevo Testamento",
    ],
    Ley: ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Paciencia: ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Puerta: ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Tiempo: ["Introducción", "Antiguo Testamento", "Nuevo Testamento"],
    Abraham: [null],
  };

  for (const [name, expectedTitles] of Object.entries(cases)) {
    assert.deepEqual(
      sectionsForArticle(name).map(({ title }) => title),
      expectedTitles,
      name,
    );
  }
});

test("conserva todas las citas al dividir los artículos reales", () => {
  for (const [name, article] of Object.entries(articles)) {
    const originalParagraphs = article.text.split(/\n{2,}/).filter(Boolean);
    const originalCitations = originalParagraphs.flatMap((paragraph) =>
      tokenizeBiblicalReferences(paragraph)
        .filter((token) => token.type === "citation")
        .map((token) => token.label)
    );
    const sectionCitations = splitArticleSections(originalParagraphs)
      .flatMap(({ paragraphs: sectionParagraphs }) => sectionParagraphs)
      .flatMap(({ text }) =>
        tokenizeBiblicalReferences(text)
          .filter((token) => token.type === "citation")
          .map((token) => token.label)
      );

    assert.deepEqual(sectionCitations, originalCitations, name);
  }
});
