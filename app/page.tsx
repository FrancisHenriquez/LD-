"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import articlesData from "./data/articles.json";
import {
  buildScriptureLookupReference,
  catholicBibleUrl,
} from "./catholic-bible";
import { tokenizeBiblicalReferences } from "./reference-parser";
import {
  loadScripture,
  prefetchScripture,
  type Scripture,
} from "./scripture-client";

const terms = `Abraham|Acción de gracias|Aceite|Adán|Adoración|Agua|Alabanza|Alianza|Alimento|Alma|Altar|Amén|Amigo|Amor|Ángeles|Animales|Anticristo|Apóstoles|Árbol|Arca|Ascensión|Astros|Autoridad|Ayuno|Babel - Babilonia|Bautismo|Bendición|Bestias|Bien - Mal|Bienaventuranza|Blanco|Brazo|Buscar|Calamidad|Camino|Carisma|Carne|Casa|Castigos|Cautividad|Celo|Cielo|Circuncisión|Comida|Comunión|Confesión|Confianza|Conocer|Consolación|Copa|Corazón|Cordero de Dios|Creación|Crecimiento|Cruz|Cuerpo|Cuerpo de Cristo|Cuidados|Culto|Cumplir|David|Demonios|Deseo|Desierto|Designio de Dios|Día del Señor|Diestra|Diluvio|Dios|Discípulo|Dispersión|Don|Edificar|Educación|Egipto|Ejemplo|Elección|Elías|Embriaguez|Endurecimiento|Enemigo|Enfermedad - Curación|Enseñar|Error|Escándalo|Esclavo|Escritura|Escuchar|Esperanza|Espíritu|Espíritu de Dios|Esposo|Esterilidad|Eucaristía|Evangelio|Exhortar|Exilio|Éxodo|Expiación|Extranjero|Fariseos|Fe|Fecundidad|Fidelidad|Fiestas|Figura|Fruto|Fuego|Fuerza|Generación|Gloria|Gozo|Gracia|Guerra|Gustar|Hambre y sed|Hebreo|Herencia|Hermano|Hijo|Hijo del hombre|Hipócrita|Hombre|Hora|Hospitalidad|Humildad|Ídolos|Iglesia|Imagen|Impío|Imposición de manos|Incredulidad|Infierno|Ira|Israel|Jerusalén|Jesús|Juan Bautista|Judío|Juicio|Justicia|Justificación|Labios|Lámpara|Leche|Lengua|Lepra|Ley|Liberación - Libertad|Libro|Limosna|Locura|Lomos y riñones|Luz|Madre|Maldición|Maná|Mansedumbre|Mar|María|Mártir|Matrimonio|Mediador|Memoria|Mentira|Mesías|Milagro|Ministerio|Misericordia|Misión|Misterio|Moisés|Montaña|Muerte|Mujer|Mundo|Nacimiento (nuevo)|Naciones|Niño|Noche|Nombre|Nube|Nuevo|Números|Obediencia|Obras|Odio|Oración|Orgullo|Paciencia|Padres y Padre|Palabra de Dios|Palabra humana|Pan|Parábola|Paráclito|Paraíso|Pascua|Pastor - Rebaño|Patria|Paz|Pecado|Pedro|Penitencia - Conversión|Pentecostés|Perdón|Perfección|Permanecer|Persecución|Piedad|Piedra|Plenitud|Pobres|Poder|Predicar|Presencia de Dios|Primicias|Proceso|Profeta|Prójimo|Promesas|Prueba - Tentación|Pueblo|Puerta|Puro|Reconciliación|Redención|Reino|Reposo|Resto|Resurrección|Retribución|Revelación|Rey|Riquezas|Risa|Roca|Rodilla|Rostro|Sábado|Sabiduría|Sacerdocio|Sacrificio|Salvación|Sangre|Santo|Satán|Seguir|Sello|Semana|Sembrar|Sencillo|Señor|Servir|Siega|Siervo de Yahveh|Silencio|Soberbia|Soledad|Sombra|Sueño|Sufrimiento|Temor|Templo|Testimonio|Tiempo|Tierra|Tormenta|Trabajo|Tradición|Transfiguración|Tristeza|Unción|Unidad|Velar|Vendimia|Venganza|Ver|Verdad|Vergüenza|Vestido|Victoria|Vida|Vino|Viña|Virginidad|Visita|Vocación|Voluntad de Dios`.split("|");

type Article = {
  title: string;
  pdfTitle: string;
  text: string;
  sourcePages: number[];
};

type OpenReference = { label: string };

const articles = articlesData as Record<string, Article>;

/**
 * Muestra el índice del vocabulario y coordina la búsqueda, la lectura de
 * artículos y la apertura de referencias bíblicas en un modal.
 */
export default function Home() {
  const [query, setQuery] = useState("");
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [openRef, setOpenRef] = useState<OpenReference | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Recalcula los términos visibles solo cuando cambia el texto de búsqueda.
  const filtered = useMemo(() => terms.filter((term) =>
    term.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
      .includes(query.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase())
  ), [query]);

  // Enfoca el botón de cierre y permite cerrar el modal con la tecla Escape.
  useEffect(() => {
    if (!openRef) return;
    closeRef.current?.focus();
    /** Cierra la referencia activa cuando se presiona Escape. */
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpenRef(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [openRef]);

  if (activeTerm) {
    const article = articles[activeTerm];
    return (
      <main>
        <Header />
        <Nav onHome={() => setActiveTerm(null)} />
        <article className="reading-page">
          <button className="back" onClick={() => setActiveTerm(null)}>← Volver al vocabulario</button>
          <p className="eyebrow">Vocabulario de teología bíblica</p>
          <h2>{activeTerm}</h2>
          <p className="article-meta">Texto extraído del PDF proporcionado · páginas {article.sourcePages[0]}–{article.sourcePages[1]}</p>
          <ArticleBody article={article} onOpenReference={setOpenRef} />
        </article>
        <Footer />
        {openRef && <Modal reference={openRef} onClose={() => setOpenRef(null)} closeRef={closeRef} />}
      </main>
    );
  }

  return (
    <main>
      <Header />
      <Nav />
      <section className="index-page" aria-labelledby="index-title">
        <div className="intro">
          <p className="eyebrow">Consulta y estudio</p>
          <h2 id="index-title">Vocabulario de<br />teología bíblica</h2>
          <p>Explora los grandes temas de la Escritura desde una lectura clara, pausada y centrada en el texto.</p>
        </div>
        <div className="search-wrap">
          <label htmlFor="search">Buscar en el vocabulario</label>
          <div className="search">
            <span aria-hidden="true">⌕</span>
            <input id="search" type="search" placeholder="Busca vocabulario teológico…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {query && <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda">×</button>}
          </div>
          <p className="count" aria-live="polite">{filtered.length} {filtered.length === 1 ? "entrada" : "entradas"}</p>
        </div>
        <div className="term-grid">
          {filtered.map((term, index) => (
            <button className="term-card" key={term} onClick={() => setActiveTerm(term)}>
              <span>{term}</span><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
        {!filtered.length && <p className="empty">No encontramos resultados. Prueba con otra palabra.</p>}
      </section>
      <Footer />
    </main>
  );
}

/**
 * Convierte el texto de un artículo en títulos y párrafos, transforma sus
 * citas bíblicas en enlaces interactivos y precarga la primera cita detectada.
 */
function ArticleBody({
  article,
  onOpenReference,
}: {
  article: Article;
  onOpenReference: (reference: OpenReference) => void;
}) {
  const paragraphs = useMemo(() => article.text.split(/\n{2,}/).filter(Boolean), [article.text]);
  // Busca una sola cita inicial para adelantar su carga mientras se lee el artículo.
  const firstReference = useMemo(() => {
    for (const paragraph of paragraphs) {
      const citation = tokenizeBiblicalReferences(paragraph).find((token) => token.type === "citation");
      if (citation?.type === "citation") return citation.label;
    }
    return null;
  }, [paragraphs]);

  // Inicia la precarga cuando el contenido proporciona una referencia válida.
  useEffect(() => {
    if (firstReference) prefetchScripture(firstReference);
  }, [firstReference]);

  return <div className="article-body">
    {paragraphs.map((paragraph, index) => {
      const heading =
        paragraph.length < 180 &&
        (/^(?:[IVXLCDM]+\.|\d+\.)\s/u.test(paragraph) ||
          (paragraph === paragraph.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/u.test(paragraph)));
      if (heading) {
        return <h3 key={index}>{paragraph}</h3>;
      }
      return <p className={index === 0 ? "lead" : undefined} key={index}>
        {renderReferences(paragraph, onOpenReference)}
      </p>;
    })}
  </div>;
}

/**
 * Tokeniza un fragmento de texto y devuelve contenido React donde cada cita
 * bíblica abre el modal y anticipa su carga al recibir interacción.
 *
 * @param text Texto del artículo que puede contener referencias bíblicas.
 * @param onOpenReference Callback que selecciona la referencia que se consultará.
 */
function renderReferences(
  text: string,
  onOpenReference: (reference: OpenReference) => void,
) {
  return tokenizeBiblicalReferences(text).map((token, index) => {
    if (token.type === "text") return token.value;
    return (
      <a
        className="bib-ref"
        href={catholicBibleUrl(token.label)}
        key={`${token.label}-${index}`}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => {
          // Mantiene la consulta dentro de la aplicación en vez de navegar al enlace.
          event.preventDefault();
          onOpenReference({ label: token.label });
        }}
        onFocus={() => prefetchScripture(token.label)}
        onPointerDown={() => prefetchScripture(token.label)}
        onPointerEnter={() => prefetchScripture(token.label)}
        aria-label={`Consultar la referencia bíblica ${token.label}`}
      >
        {token.value}
      </a>
    );
  });
}

/** Muestra la cabecera editorial y la identidad visual del sitio. */
function Header() {
  return <header className="site-header">
    <div className="wordmark">
      {/* El monograma generado es un recurso decorativo de marca, no contenido del artículo. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-monogram" src="/ld-monogram.png" alt="Monograma ornamental LD" />
      <h1>León Dufour</h1>
      <p>Vocabulario de teología bíblica</p>
    </div>
  </header>;
}

/**
 * Renderiza la navegación principal y, cuando se proporciona `onHome`, permite
 * volver desde un artículo al índice sin recargar la página.
 */
function Nav({ onHome }: { onHome?: () => void }) {
  return <nav aria-label="Navegación principal"><button onClick={onHome}>Inicio</button><a href="#informacion">Información</a><span aria-hidden="true">✣</span></nav>;
}

/** Presenta los datos bibliográficos y el alcance de esta edición digital. */
function Footer() {
  return <footer id="informacion">
    <div className="footer-mark">LD</div>
    <div><h2>Sobre esta edición</h2><p>Los textos provienen del <em>Vocabulario de teología bíblica</em>, publicado bajo la dirección de Xavier Léon-Dufour (1912–2007). Edición original: <em>Vocabulaire de théologie biblique</em>, Éditions du Cerf, 1962. Edición española: Herder, 2001.</p><p>Esta versión facilita el acceso ágil para consultas ocasionales y referencias. No pretende reemplazar la edición impresa, que contiene material adicional.</p></div>
    <p className="copyright">Edición de consulta · Diseño accesible en español</p>
  </footer>;
}

/**
 * Consulta y presenta una referencia bíblica en un diálogo accesible.
 * Cancela las actualizaciones de estado si cambia la referencia o se desmonta.
 */
function Modal({ reference, onClose, closeRef }: { reference: OpenReference; onClose: () => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  const [scripture, setScripture] = useState<Scripture | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincroniza el contenido del diálogo con la referencia seleccionada.
  useEffect(() => {
    let cancelled = false;

    /** Valida la referencia, solicita el pasaje y actualiza el estado del modal. */
    async function loadScriptureForModal() {
      const lookupReference = buildScriptureLookupReference(reference.label);
      if (!lookupReference) {
        if (!cancelled) {
          setScripture(null);
          setErrorMessage("No se pudo preparar la referencia bíblica para la búsqueda.");
        }
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      setScripture(null);

      try {
        const data = await loadScripture(reference.label);

        if (cancelled) return;

        setScripture(data);
      } catch {
        if (!cancelled) {
          setErrorMessage("No se pudo cargar el texto bíblico en este momento.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadScriptureForModal();
    return () => {
      cancelled = true;
    };
  }, [reference.label]);

  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Cerrar referencia">×</button>
      <p className="eyebrow">Referencia bíblica</p>
      <h2 id="modal-title">{reference.label}</h2>
      <a className="reference-link" href={catholicBibleUrl(reference.label)} target="_blank" rel="noreferrer">
        Abrir en La Biblia de Jerusalén (católica) ↗
      </a>
      <p className="modal-note">Enlace católico en español · Referencia detectada en el PDF proporcionado.</p>
      <div className="modal-scripture">
        {loading && <p className="modal-note">Cargando el texto bíblico…</p>}
        {errorMessage && <p className="modal-note">{errorMessage}</p>}
        {scripture && <>
          <p className="modal-note">{scripture.referenceLabel} · {scripture.translationName}</p>
          {scripture.text.split("\n\n").map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 20)}-${index}`} className="modal-scripture-text">{paragraph}</p>
          ))}
        </>}
      </div>
    </div>
  </div>;
}
