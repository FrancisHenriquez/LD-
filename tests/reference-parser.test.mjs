import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { tokenizeBiblicalReferences } from "../app/reference-parser.ts";

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

test("no convierte fechas ni numeración editorial", () => {
  assert.equal(citations("Xavier Léon-Dufour (1912-2007), edición 2001.").length, 0);
  assert.equal(citations("Véanse los apartados (1.2 y 3.4).").length, 0);
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
      assert.match(item.label, /\d+[,.:]\d+/u, `${name}: ${item.label}`);
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
