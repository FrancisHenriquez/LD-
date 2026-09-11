import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { groupBiblicalReferences } from "../app/reference-groups.ts";
import { tokenizeBiblicalReferences } from "../app/reference-parser.ts";
import { buildJerusalemBibleLookup } from "../app/catholic-bible.ts";

const labels = (text, id) => groupBiblicalReferences(text)
  .find((group) => group.id === id).references.map((reference) => reference.label);

test("clasifica los 61 libros de los cuatro grupos y excluye los otros 12", () => {
  const booksByGroup = {
    historico: "Jos Jue Rut 1Sa 2Sa 1Re 2Re 1Par 2Par Esd Neh Tob Jdt Est 1Mac 2Mac Hch",
    cartas: "Rom 1Cor 2Cor Gál Ef Flp Col 1Tes 2Tes 1Tim 2Tim Tit Flm Heb Sant 1Pe 2Pe 1Jn 2Jn 3Jn Jud",
    profetico: "Is Jer Lam Bar Ez Dan Os Jl Am Abd Jon Miq Nah Hab Sof Ag Zac Mal Ap",
    evangelio: "Mt Mc Lc Jn",
  };
  for (const [id, books] of Object.entries(booksByGroup)) {
    for (const book of books.split(" ")) {
      const groups = groupBiblicalReferences(`${book} 1,1`);
      assert.equal(groups.find((group) => group.id === id).references.length, 1, book);
      assert.equal(groups.flatMap((group) => group.references).length, 1, book);
    }
  }
  for (const book of "Gén Ex Lév Núm Dt Job Sal Prov Ecl Cant Sab Eclo".split(" ")) {
    assert.deepEqual(groupBiblicalReferences(`${book} 1,1`).flatMap((group) => group.references), [], book);
  }
});

test("unifica abreviaturas y separadores, sin confundir cartas con evangelios", () => {
  assert.deepEqual(labels("Rom 8,18; Rm 8:18; Rom 8,18-20", "cartas"), ["Rom 8,18", "Rom 8,18-20"]);
  assert.deepEqual(labels("Act 2,1; Hch 2:1", "historico"), ["Act 2,1"]);
  assert.deepEqual(labels("Jn 1,1; 1Jn 1,1; IJn 1,1; 2Jn 1,1; IIIJn 1,1", "cartas"), ["1Jn 1,1", "2Jn 1,1", "IIIJn 1,1"]);
  assert.deepEqual(labels("Jn 1,1; 1Jn 1,1", "evangelio"), ["Jn 1,1"]);
});

test("conserva citas heredadas dentro del párrafo, sin herencia entre párrafos", () => {
  const text = "La promesa (Is 7,14; 9,5) continúa (11,1).\n\nOtra sección (12,2).";
  assert.deepEqual(labels(text, "profetico"), ["Is 7,14", "Is 9,5", "Is 11,1"]);
});

test("preserva segmentos discontinuos y las marcas editoriales de contexto", () => {
  const text = "(Dan 2,22.27s; Jn 11,3.11.35ss; Mc 12,35ss p; Mc 12,35; Mc 12,35-38)";
  assert.deepEqual(labels(text, "profetico"), ["Dan 2,22.27s"]);
  assert.deepEqual(labels(text, "evangelio"), ["Jn 11,3.11.35ss", "Mc 12,35ssp", "Mc 12,35", "Mc 12,35-38"]);
});

test("siempre devuelve cuatro grupos ordenados, incluso sin citas", () => {
  for (const text of ["", "Un tema sin referencias.", "Sal 23,1; Gén 1,1"]) {
    const groups = groupBiblicalReferences(text);
    assert.deepEqual(groups.map((group) => group.title), ["Histórico", "Cartas", "Profético", "Evangelio"]);
    assert.ok(groups.every((group) => group.references.length === 0));
  }
});

test("recorre todos los temas sin omitir citas elegibles ni duplicar referencias", () => {
  const articles = JSON.parse(readFileSync(new URL("../app/data/articles.json", import.meta.url), "utf8"));
  const excluded = new Set(["genesis", "exodo", "levitico", "numeros", "deuteronomio", "job", "salmos", "proverbios", "eclesiastes", "cantar", "sabiduria", "eclesiastico"]);
  for (const article of Object.values(articles)) {
    const references = groupBiblicalReferences(article.text).flatMap((group) => group.references);
    const keys = new Set(references.map((reference) => reference.key));
    const passages = new Set(references.map((reference) => buildJerusalemBibleLookup(reference.label).referenceLabel));
    assert.equal(keys.size, references.length, article.title);
    const eligibleTokens = article.text.split(/\n{2,}/)
      .flatMap(tokenizeBiblicalReferences)
      .filter((token) => token.type === "citation")
      .filter((token) => {
        const lookup = buildJerusalemBibleLookup(token.label);
        return lookup && !excluded.has(lookup.bookSlug);
      });
    for (const token of eligibleTokens) {
      assert.ok(passages.has(buildJerusalemBibleLookup(token.label).referenceLabel), `${article.title}: ${token.label}`);
    }
    for (const reference of references) {
      assert.ok(eligibleTokens.some((token) => token.label === reference.label), `${article.title}: ${reference.label}`);
    }
  }
});
