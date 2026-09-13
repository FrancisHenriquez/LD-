"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Song = {
  id: string;
  title: string;
  source: string;
  category: string;
  pages: number[];
  lines: { text: string; kind: "chord" | "chorus" | "verse"; breakBefore: boolean }[];
};

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
let cachedSongs: Promise<Song[]> | undefined;
function loadSongs() {
  cachedSongs ??= fetch("/data/songbook.json").then(async (response) => {
    if (!response.ok) throw new Error("No se pudo cargar el cancionero");
    return await response.json() as Song[];
  }).catch((error) => {
    cachedSongs = undefined;
    throw error;
  });
  return cachedSongs;
}

/** Native song index and reading surface, shared by the home and topic views. */
export default function Songbook({ topic }: { topic?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Song | null>(null);
  const [showChords, setShowChords] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [focusTarget, setFocusTarget] = useState<"reader" | "search" | null>(null);

  useEffect(() => {
    if (!expanded || songs) return;
    let active = true;
    loadSongs().then((data) => { if (active) setSongs(data); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [expanded, songs, retry]);

  useEffect(() => {
    if (!focusTarget) return;
    const target = focusTarget === "reader" ? heading.current : search.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [focusTarget, selected]);

  const searchable = useMemo(() => songs?.map((song) => ({ song, text: normalize(`${song.title} ${song.source} ${song.lines.filter((line) => line.kind !== "chord").map((line) => line.text).join(" ")}`) })) ?? [], [songs]);
  const results = useMemo(() => {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    return searchable.filter(({ text }) => words.every((word) => text.includes(word))).map(({ song }) => song)
      .sort((a, b) => a.title.localeCompare(b.title, "es"));
  }, [searchable, query]);

  // Carry stanza breaks through hidden chord rows so lyrics retain their phrasing.
  const lines = useMemo(() => {
    let pendingBreak = false;
    return selected?.lines.flatMap((line) => {
      pendingBreak ||= line.breakBefore;
      if (!showChords && line.kind === "chord") return [];
      const visible = { ...line, breakBefore: pendingBreak };
      pendingBreak = false;
      return [visible];
    }) ?? [];
  }, [selected, showChords]);

  function close() {
    setExpanded(false);
    setFocusTarget(null);
    toggle.current?.focus();
  }

  return <section className="songbook" id="cantos" aria-labelledby="songbook-title">
    <div className="songbook-heading"><p className="songbook-label">Cantos y Escritura</p><span aria-hidden="true">♫</span></div>
    <h3 id="songbook-title">Cantos para acompañar la Palabra</h3>
    <p className="songbook-description">{topic
      ? <>Al preparar el tema «{topic}», elige cantos relacionados con sus citas bíblicas para acompañar la lectura y profundizar en su sentido.</>
      : <>Los cantos acompañan las citas de los temarios bíblicos y ayudan a comprender la Palabra. Encuentra un canto y léelo aquí, junto al tema que estás preparando.</>}
    </p>
    <div className="songbook-resource">
      <div><p className="songbook-name">Resucitó</p><p className="songbook-edition">222 cantos · XX edición · 2014</p></div>
      <button ref={toggle} className="songbook-toggle" aria-expanded={expanded} aria-controls="songbook-content" onClick={() => expanded ? close() : setExpanded(true)}>
        {expanded ? "Cerrar cancionero" : "Explorar los cantos"} <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
    </div>
    {expanded && <div className="songbook-content" id="songbook-content">
      {!songs && !error && <p className="songbook-status" role="status">Preparando los cantos…</p>}
      {error && !songs && <div role="alert"><p className="songbook-status">No se pudieron cargar los cantos. Inténtalo de nuevo.</p><button className="songbook-text-button" onClick={() => { setError(false); setRetry((value) => value + 1); }}>Reintentar</button></div>}
      {songs && !selected && <>
        <label className="songbook-search-label" htmlFor="songbook-search">Buscar un canto</label>
        <div className="songbook-search"><input ref={search} id="songbook-search" type="search" placeholder="Título, cita o palabras de la letra…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button aria-label="Limpiar búsqueda de cantos" onClick={() => { setQuery(""); search.current?.focus(); }}>×</button>}</div>
        <p className="songbook-status" role="status">{results.length} {results.length === 1 ? "canto" : "cantos"}</p>
        {results.length ? <ul className="songbook-list" aria-label="Cantos del cancionero">
          {results.map((song) => <li key={song.id}><button onClick={() => { setSelected(song); setFocusTarget("reader"); }}><span><span className="songbook-list-title">{song.title}</span><span className="songbook-list-source">{song.source}</span></span><span aria-hidden="true">→</span></button></li>)}
        </ul> : <p className="songbook-status">No encontramos cantos con esas palabras. Prueba con el nombre de un libro bíblico o con otra expresión.</p>}
      </>}
      {selected && <article className="song-reader" aria-labelledby="song-title">
        <button className="songbook-text-button" onClick={() => { setSelected(null); setFocusTarget("search"); }}>← Volver a los cantos</button>
        <p className="songbook-label song-category">{selected.category}</p>
        <h4 ref={heading} tabIndex={-1} id="song-title">{selected.title}</h4>
        <p className="song-source">{selected.source}</p>
        <div className="song-reader-options"><label><input type="checkbox" checked={showChords} onChange={(event) => setShowChords(event.target.checked)} /> Mostrar acordes</label><span>S. Solista · A. Asamblea</span></div>
        <div className="song-lyrics">{lines.map((line, index) => <div key={index} className={`song-line song-line--${line.kind}${line.breakBefore ? " song-line--break" : ""}`}>{line.text}</div>)}</div>
        <p className="songbook-status song-attribution">Resucitó · XX edición, 2014 · {selected.pages.length === 1 ? "Página" : "Páginas"} {selected.pages.join(", ")}</p>
        <button className="songbook-text-button" onClick={close}>{topic ? `Volver al tema «${topic}»` : "Volver al vocabulario"} ↑</button>
      </article>}
    </div>}
  </section>;
}
