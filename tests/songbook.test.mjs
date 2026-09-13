import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const songs = JSON.parse(await readFile(new URL("../public/data/songbook.json", import.meta.url), "utf8"));

test("includes every song from the edition's alphabetical index with readable text", () => {
  assert.equal(songs.length, 222);
  assert.equal(new Set(songs.map((song) => song.id)).size, 222);
  for (const song of songs) {
    assert.ok(song.title && song.source && song.lines.length && song.pages.length);
    assert.doesNotMatch(JSON.stringify(song), /[\uFFFD\uE000-\uF8FF]/u);
    assert.ok(song.lines.some((line) => line.kind !== "chord"));
  }
});

test("preserves column reading order and multi-page songs", () => {
  const moses = songs.find((song) => song.id === "51").lines.map((line) => line.text).join("\n");
  assert.ok(moses.indexOf("Tu diestra poderosa") < moses.indexOf("El enemigo había dicho"));
  const corpus = songs.find((song) => song.id === "134");
  assert.deepEqual(corpus.pages, [134, 135]);
  assert.ok(corpus.lines.some((line) => line.text.includes("IN HYMNIS ET CANTICIS")));
  assert.deepEqual(songs.find((song) => song.id === "182").pages, [182, 183, 184]);
});

test("keeps red spoken passages visible when chords are hidden", () => {
  const prayer = songs.find((song) => song.id === "182");
  const spoken = prayer.lines.find((line) => line.text.includes("Santo eres en verdad"));
  assert.ok(spoken);
  assert.notEqual(spoken.kind, "chord");
  assert.ok(prayer.lines.some((line) => line.text === "PREFACIO"));
});
