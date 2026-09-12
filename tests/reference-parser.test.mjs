import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tokenizeBiblicalReferences } from "../app/reference-parser.ts";

// Reduce la salida del tokenizador a las citas que interesan en estas pruebas.
const citations = (text) =>
  tokenizeBiblicalReferences(text).filter((token) => token.type === "citation");

test("separa referencias del mismo libro", () => {
  const result = citations("(Gén 12,7; 13,15ss; 15,18; 17,8)");
  assert.deepEqual(
    result.map((item) => item.label),
    ["Gén 12,7", "Gén 13,15ss", "Gén 15,18", "Gén 17,8"],
  );
});

test("actualiza el libro heredado dentro del grupo", () => {
  const result = citations("(Gén 12,7; cf. Heb 11,8; 12,2)");
  assert.deepEqual(
    result.map((item) => item.label),
    ["Gén 12,7", "Heb 11,8", "Heb 12,2"],
  );
});

test("hereda el libro en un grupo posterior del mismo párrafo", () => {
  const result = citations(
    "La promesa (Gén 12,7; 13,15) continúa después (16,10; 22,17).",
  );
  assert.deepEqual(
    result.map((item) => item.label),
    ["Gén 12,7", "Gén 13,15", "Gén 16,10", "Gén 22,17"],
  );
});

test("separa referencias de libros diferentes", () => {
  const result = citations("(Mt 5,3-10; Lc 6,20-23; Rom 8,18)");
  assert.deepEqual(
    result.map((item) => item.label),
    ["Mt 5,3-10", "Lc 6,20-23", "Rom 8,18"],
  );
});

test("detecta los libros deuterocanónicos", () => {
  const result = citations(
    "(Tob 13,1; Jdt 16,1; 1 Mac 2,52; 2Mac 7,9; lMac 4,44)",
  );
  assert.deepEqual(
    result.map((item) => item.label),
    ["Tob 13,1", "Jdt 16,1", "1 Mac 2,52", "2Mac 7,9", "lMac 4,44"],
  );
});

test("detecta las abreviaturas usadas en las introducciones", () => {
  const result = citations("(Rm 1,21), (Éx 3,7-10) y Éx 3,7-10");
  assert.deepEqual(
    result.map((item) => item.label),
    ["Rm 1,21", "Éx 3,7-10", "Éx 3,7-10"],
  );
});

test("incluye segmentos discontinuos separados por espacios en una sola cita", () => {
  const source = "Tal es el misterio (Dan 2,22. 27s) cuya sustancia permanece.";
  const tokens = tokenizeBiblicalReferences(source);
  const result = tokens.filter((token) => token.type === "citation");

  assert.deepEqual(result, [{
    type: "citation",
    value: "Dan 2,22. 27s",
    label: "Dan 2,22.27s",
  }]);
  assert.equal(tokens.map((token) => token.value).join(""), source);
});

test("conserva rangos en cada segmento discontinuo", () => {
  const result = citations("(Sal 33,1-3. 21-22) y (Jn 11,3. 11.35 ss)");

  assert.deepEqual(
    result.map((item) => item.label),
    ["Sal 33,1-3.21-22", "Jn 11,3.11.35ss"],
  );
});

test("no confunde un cambio de capítulo con un segmento discontinuo", () => {
  const result = citations("(Act 4,31. 10,44ss)");

  assert.deepEqual(
    result.map((item) => ({ value: item.value, label: item.label })),
    [
      { value: "Act 4,31", label: "Act 4,31" },
      { value: "10,44ss", label: "Act 10,44ss" },
    ],
  );
});

test("no convierte fechas ni numeración editorial", () => {
  assert.equal(citations("Xavier Léon-Dufour (1912-2007), edición 2001.").length, 0);
  assert.equal(citations("Véanse los apartados (1.2 y 3.4).").length, 0);
});

test("enlaza la cita completa de Amigo sin consumir el capítulo siguiente", () => {
  const source = "(Eclo 6,5-13; 12,8-13,23: 37,1-5)";
  const tokens = tokenizeBiblicalReferences(source);
  assert.deepEqual(tokens.filter((token) => token.type === "citation"), [
    { type: "citation", value: "Eclo 6,5-13", label: "Eclo 6,5-13" },
    { type: "citation", value: "12,8-13,23", label: "Eclo 12,8-13,23" },
    { type: "citation", value: "37,1-5", label: "Eclo 37,1-5" },
  ]);
  assert.equal(tokens.map((token) => token.value).join(""), source);
});

test("enlaza capítulos completos y rangos con libro explícito", () => {
  assert.deepEqual(citations("(Sal 133; Prov 15,17), (ISa 19-20) y Gén 2-3.").map((token) => token.label), [
    "Sal 133", "Prov 15,17", "ISa 19-20", "Gén 2-3",
  ]);
  assert.deepEqual(citations("Sal 133: Prov 15,17").map((token) => token.label), ["Prov 15,17"]);
});

test("no convierte cifras OCR incompletas en capítulos ni rangos inválidos", () => {
  for (const source of ["(Mt 11,l9)", "(Ef 5 25-33)", "(Dt 411)", "(Sal 71-15)", "(apartados 19-20)"]) {
    assert.deepEqual(citations(source), [], source);
  }
});

test("conserva literalmente el texto de todos los artículos", () => {
  const articles = JSON.parse(readFileSync(new URL("../app/data/articles.json", import.meta.url), "utf8"));
  for (const article of Object.values(articles)) {
    assert.equal(tokenizeBiblicalReferences(article.text).map((token) => token.value).join(""), article.text, article.title);
  }
});

test("cada enlace representa exactamente una cita", () => {
  const articles = JSON.parse(
    readFileSync(new URL("../app/data/articles.json", import.meta.url), "utf8"),
  );
  const samples = [
    "Abraham",
    "Acción de gracias",
    "Camino",
    "Amor",
    "Fe",
    "Jesús",
    "Pecado",
    "Voluntad de Dios",
  ];

  for (const name of samples) {
    const result = citations(articles[name].text);
    assert.ok(result.length > 5, `${name} debe contener varias citas`);
    for (const item of result) {
      assert.equal(item.label.includes(";"), false, `${name}: ${item.label}`);
      assert.equal(item.label.includes("\n"), false, `${name}: ${item.label}`);
      assert.match(item.label, /\s\d+(?:[,.:]\d+|(?:-\d+)?$)/u, `${name}: ${item.label}`);
    }
  }
});

test("verifica todos los artículos y miles de enlaces individuales", () => {
  const articles = JSON.parse(
    readFileSync(new URL("../app/data/articles.json", import.meta.url), "utf8"),
  );
  let total = 0;

  for (const article of Object.values(articles)) {
    const result = citations(article.text);
    total += result.length;
    for (const item of result) {
      assert.equal(item.label.includes(";"), false, item.label);
      assert.equal(item.label.startsWith("("), false, item.label);
      assert.equal(item.label.endsWith(")"), false, item.label);
    }
  }

  assert.ok(total > 8_000, `solo se detectaron ${total} citas`);
});
