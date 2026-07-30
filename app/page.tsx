"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const terms = `Abraham|Acción de gracias|Aceite|Adán|Adoración|Agua|Alabanza|Alianza|Alimento|Alma|Altar|Amén|Amigo|Amor|Ángeles|Animales|Anticristo|Apóstoles|Árbol|Arca|Ascensión|Astros|Autoridad|Ayuno|Babel - Babilonia|Bautismo|Bendición|Bestias|Bien - Mal|Bienaventuranza|Blanco|Brazo|Buscar|Calamidad|Camino|Carisma|Carne|Casa|Castigos|Cautividad|Celo|Cielo|Circuncisión|Comida|Comunión|Confesión|Confianza|Conocer|Consolación|Copa|Corazón|Cordero de Dios|Creación|Crecimiento|Cruz|Cuerpo|Cuerpo de Cristo|Cuidados|Culto|Cumplir|David|Demonios|Deseo|Desierto|Designio de Dios|Día del Señor|Diestra|Diluvio|Dios|Discípulo|Dispersión|Don|Edificar|Educación|Egipto|Ejemplo|Elección|Elías|Embriaguez|Endurecimiento|Enemigo|Enfermedad - Curación|Enseñar|Error|Escándalo|Esclavo|Escritura|Escuchar|Esperanza|Espíritu|Espíritu de Dios|Esposo|Esterilidad|Eucaristía|Evangelio|Exhortar|Exilio|Éxodo|Expiación|Extranjero|Fariseos|Fe|Fecundidad|Fidelidad|Fiestas|Figura|Fruto|Fuego|Fuerza|Generación|Gloria|Gozo|Gracia|Guerra|Gustar|Hambre y sed|Hebreo|Herencia|Hermano|Hijo|Hijo del hombre|Hipócrita|Hombre|Hora|Hospitalidad|Humildad|Ídolos|Iglesia|Imagen|Impío|Imposición de manos|Incredulidad|Infierno|Ira|Israel|Jerusalén|Jesús|Juan Bautista|Judío|Juicio|Justicia|Justificación|Labios|Lámpara|Leche|Lengua|Lepra|Ley|Liberación - Libertad|Libro|Limosna|Locura|Lomos y riñones|Luz|Madre|Maldición|Maná|Mansedumbre|Mar|María|Mártir|Matrimonio|Mediador|Memoria|Mentira|Mesías|Milagro|Ministerio|Misericordia|Misión|Misterio|Moisés|Montaña|Muerte|Mujer|Mundo|Nacimiento (nuevo)|Naciones|Niño|Noche|Nombre|Nube|Nuevo|Números|Obediencia|Obras|Odio|Oración|Orgullo|Paciencia|Padres y Padre|Palabra de Dios|Palabra humana|Pan|Parábola|Paráclito|Paraíso|Pascua|Pastor - Rebaño|Patria|Paz|Pecado|Pedro|Penitencia - Conversión|Pentecostés|Perdón|Perfección|Permanecer|Persecución|Piedad|Piedra|Plenitud|Pobres|Poder|Predicar|Presencia de Dios|Primicias|Proceso|Profeta|Prójimo|Promesas|Prueba - Tentación|Pueblo|Puerta|Puro|Reconciliación|Redención|Reino|Reposo|Resto|Resurrección|Retribución|Revelación|Rey|Riquezas|Risa|Roca|Rodilla|Rostro|Sábado|Sabiduría|Sacerdocio|Sacrificio|Salvación|Sangre|Santo|Satán|Seguir|Sello|Semana|Sembrar|Sencillo|Señor|Servir|Siega|Siervo de Yahveh|Silencio|Soberbia|Soledad|Sombra|Sueño|Sufrimiento|Temor|Templo|Testimonio|Tiempo|Tierra|Tormenta|Trabajo|Tradición|Transfiguración|Tristeza|Unción|Unidad|Velar|Vendimia|Venganza|Ver|Verdad|Vergüenza|Vestido|Victoria|Vida|Vino|Viña|Virginidad|Visita|Vocación|Voluntad de Dios`.split("|");

const references: Record<string, { title: string; text: string }> = {
  "Jn 14,6": { title: "Juan 14,6", text: "Jesús le respondió: «Yo soy el Camino, la Verdad y la Vida. Nadie va al Padre, sino por mí»." },
  "Sal 119,105": { title: "Salmo 119,105", text: "Tu palabra es una lámpara para mis pasos, y una luz en mi camino." },
  "Hch 9,2": { title: "Hechos 9,2", text: "Pidió cartas para las sinagogas de Damasco, a fin de llevar encadenados a Jerusalén a los seguidores del Camino que encontrara." },
};

function Reference({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  return <button className="bib-ref" onClick={() => onOpen(id)} aria-label={`Leer ${references[id].title}`}>{id}</button>;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [openRef, setOpenRef] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => terms.filter((term) =>
    term.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
      .includes(query.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase())
  ), [query]);

  useEffect(() => {
    if (!openRef) return;
    closeRef.current?.focus();
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpenRef(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [openRef]);

  if (activeTerm) {
    return (
      <main>
        <Header />
        <Nav onHome={() => setActiveTerm(null)} />
        <article className="reading-page">
          <button className="back" onClick={() => setActiveTerm(null)}>← Volver al vocabulario</button>
          <p className="eyebrow">Vocabulario de teología bíblica</p>
          <h2>{activeTerm}</h2>
          {activeTerm === "Camino" ? (
            <>
              <p className="lead">La experiencia humana del camino sirve a la revelación bíblica para expresar la orientación de una vida y el encuentro del hombre con Dios.</p>
              <h3>I. Los caminos de Dios</h3>
              <p>La Escritura presenta la existencia como una marcha. La palabra recibida ilumina los pasos del creyente <Reference id="Sal 119,105" onOpen={setOpenRef} />, mientras Dios guía a su pueblo y le enseña a reconocer su voluntad.</p>
              <h3>II. Cristo, camino vivo</h3>
              <p>En el Nuevo Testamento, la imagen alcanza su plenitud en Jesús: él no se limita a mostrar una ruta, sino que se presenta como el camino hacia el Padre <Reference id="Jn 14,6" onOpen={setOpenRef} />. Por eso, la primera comunidad cristiana llegó a ser identificada como «el Camino» <Reference id="Hch 9,2" onOpen={setOpenRef} />.</p>
              <h3>III. Caminar en la fe</h3>
              <p>Seguir este camino implica escuchar, discernir y perseverar. La fe deja de ser una idea abstracta para convertirse en conducta, comunión y esperanza.</p>
            </>
          ) : (
            <>
              <p className="lead">Entrada del vocabulario dedicada a «{activeTerm}».</p>
              <p>Esta maqueta conserva la navegación, la jerarquía editorial y el sistema de consulta del índice. Abre la entrada <button className="inline-link" onClick={() => setActiveTerm("Camino")}>Camino</button> para ver el artículo demostrativo con referencias bíblicas accesibles.</p>
            </>
          )}
        </article>
        <Footer />
        {openRef && <Modal id={openRef} onClose={() => setOpenRef(null)} closeRef={closeRef} />}
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

function Header() {
  return <header className="site-header"><div className="monogram" aria-hidden="true">LD</div><div><h1>León Dufour</h1><p>Vocabulario de teología bíblica</p></div></header>;
}

function Nav({ onHome }: { onHome?: () => void }) {
  return <nav aria-label="Navegación principal"><button onClick={onHome}>Inicio</button><a href="#informacion">Información</a><span aria-hidden="true">✣</span></nav>;
}

function Footer() {
  return <footer id="informacion">
    <div className="footer-mark">LD</div>
    <div><h2>Sobre esta edición</h2><p>Los textos provienen del <em>Vocabulario de teología bíblica</em>, publicado bajo la dirección de Xavier Léon-Dufour (1912–2007). Edición original: <em>Vocabulaire de théologie biblique</em>, Éditions du Cerf, 1962. Edición española: Herder, 2001.</p><p>Esta versión facilita el acceso ágil para consultas ocasionales y referencias. No pretende reemplazar la edición impresa, que contiene material adicional.</p></div>
    <p className="copyright">Edición de consulta · Diseño accesible en español</p>
  </footer>;
}

function Modal({ id, onClose, closeRef }: { id: string; onClose: () => void; closeRef: React.RefObject<HTMLButtonElement | null> }) {
  const ref = references[id];
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Cerrar referencia">×</button>
      <p className="eyebrow">Referencia bíblica</p>
      <h2 id="modal-title">{ref.title}</h2>
      <blockquote>«{ref.text}»</blockquote>
      <p className="modal-note">Texto presentado para consulta contextual.</p>
    </div>
  </div>;
}
