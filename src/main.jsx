import React, { useEffect, useState, useRef, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "motion/react";
import {
  Atom,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  ArrowsOut,
  ArrowsIn,
  Pause,
  Play,
  Notebook,
  X,
  List,
  Monitor,
  Lightbulb,
  EyeSlash,
  Info,
  Check,
  Keyboard,
} from "@phosphor-icons/react";
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/geist/700.css";
import { chapters, sources } from "./data/chapters";
import Visual, { MolecularScene } from "./components/Visuals";
import Quiz from "./components/Quiz";
const RespirationExperience = React.lazy(
  () => import("./components/experience/RespirationExperience"),
);
import "./styles.css";
const count = chapters.reduce((a, c) => a + c.slides.length, 0);
const initial = () => {
  const p = location.hash.slice(1).split("/");
  let c = chapters.findIndex((c) => c.id === p[0]);
  return {
    chapter: Math.max(c, 0),
    slide: Math.max(0, +p[1] || 0),
    view: new URLSearchParams(location.search).has("practice")
      ? "quiz"
      : c >= 0
        ? "deck"
        : "home",
  };
};
function App() {
  const start = initial(),
    [view, setView] = useState(start.view),
    [ci, setCi] = useState(start.chapter),
    [si, setSi] = useState(
      Math.min(start.slide, chapters[start.chapter].slides.length - 1),
    ),
    [panel, setPanel] = useState(null),
    [presenting, setPresenting] = useState(
      new URLSearchParams(location.search).has("audience"),
    ),
    [paused, setPaused] = useState(false),
    [blackout, setBlackout] = useState(false),
    [reveal, setReveal] = useState(3),
    [menu, setMenu] = useState(false),
    [sourcePage, setSourcePage] = useState(null),
    [note, setNote] = useState(""),
    [hint, setHint] = useState(""),
    [audience] = useState(new URLSearchParams(location.search).has("audience")),
    [sessionId] = useState(
      () =>
        new URLSearchParams(location.search).get("session") ||
        crypto.randomUUID(),
    );
  const chapter = chapters[ci],
    slide = chapter.slides[si],
    channel = useRef(null),
    remote = useRef(false),
    state = useRef();
  state.current = { ci, si, view, presenting, paused, blackout, reveal };
  const go = (c, s = 0) => {
    setCi(c);
    setSi(s);
    setView("deck");
    setMenu(false);
    setReveal(3);
    setSourcePage(null);
  };
  const next = () =>
    si < chapter.slides.length - 1
      ? go(ci, si + 1)
      : ci < chapters.length - 1
        ? go(ci + 1, 0)
        : setHint(
            "You have reached the final scene. Open Practice to test your understanding.",
          );
  const prev = () =>
    si > 0
      ? go(ci, si - 1)
      : ci > 0
        ? go(ci - 1, chapters[ci - 1].slides.length - 1)
        : setView("home");
  useEffect(() => {
    if (view === "deck") {
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}#${chapter.id}/${si}`,
      );
    } else
      history.replaceState(null, "", `${location.pathname}${location.search}`);
  }, [view, ci, si]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, ci, si]);
  useEffect(() => {
    setNote(
      localStorage.getItem(`bio-note-${chapter.id}-${si}`) || slide.notes,
    );
  }, [ci, si]);
  useEffect(() => {
    channel.current = new BroadcastChannel(
      "biochemistry-stage-v1-" + sessionId,
    );
    channel.current.onmessage = (e) => {
      if (e.data.type === "request" && !audience)
        channel.current.postMessage({ type: "state", ...state.current });
      if (e.data.type === "state" && audience) {
        remote.current = true;
        const s = e.data;
        setCi(s.ci);
        setSi(s.si);
        setView(s.view);
        setPaused(s.paused);
        setBlackout(s.blackout);
        setReveal(s.reveal);
        setPresenting(true);
      }
      if (e.data.type === "visual" && audience) {
        const root = document.querySelector(".visual-content");
        let target = root;
        for (const idx of e.data.path) target = target?.children[idx];
        if (target) {
          if (e.data.event === "click") target.click();
          else if (target instanceof HTMLInputElement) {
            const setter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value",
            ).set;
            setter.call(target, e.data.value);
            target.dispatchEvent(new Event("input", { bubbles: true }));
            target.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    };
    if (audience) channel.current.postMessage({ type: "request" });
    return () => channel.current.close();
  }, [audience]);
  useEffect(() => {
    if (!audience)
      channel.current?.postMessage({ type: "state", ...state.current });
  }, [ci, si, view, presenting, paused, blackout, reveal]);
  function syncVisual(e) {
    if (audience) return;
    let t = e.target;
    if (e.type === "click") t = t.closest("button");
    if (!t) return;
    const root = document.querySelector(".visual-content");
    let cur = t,
      path = [];
    while (cur && cur !== root) {
      path.unshift(Array.from(cur.parentElement.children).indexOf(cur));
      cur = cur.parentElement;
    }
    if (cur === root)
      channel.current?.postMessage({
        type: "visual",
        path,
        event: e.type === "click" ? "click" : "input",
        value: t.value,
      });
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setHint("Use the browser fullscreen shortcut (F11) on this device.");
    }
  }
  function present() {
    setPresenting(true);
    setView("deck");
    if (!audience) {
      const url = `${location.origin}${location.pathname}?audience=1&session=${sessionId}#${chapter.id}/${si}`;
      const win = window.open(url, "biochemistry-audience");
      setPanel("notes");
      if (!win)
        setHint(
          "The audience tab was blocked. Allow pop-ups, or press F for fullscreen presentation here.",
        );
    }
  }
  useEffect(() => {
    const handle = (e) => {
      if (
        e.target.matches("input,textarea,select") ||
        e.target.isContentEditable
      )
        return;
      if (e.key === "Escape") {
        setPanel(null);
        setMenu(false);
        setPresenting(false);
        setBlackout(false);
      }
      if (e.key.toLowerCase() === "f") fullscreen();
      if (e.key.toLowerCase() === "p") present();
      if (e.key.toLowerCase() === "n" && !audience)
        setPanel((x) => (x === "notes" ? null : "notes"));
      if (e.key.toLowerCase() === "b") setBlackout((x) => !x);
      if (
        e.key === "ArrowRight" ||
        e.key === "PageDown" ||
        (e.code === "Space" && view === "deck")
      ) {
        e.preventDefault();
        if (view === "deck") next();
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (view === "deck") prev();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [ci, si, view, audience]);
  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(""), 7000);
    return () => clearTimeout(id);
  }, [hint]);
  const globalIndex =
    chapters.slice(0, ci).reduce((n, c) => n + c.slides.length, 0) + si + 1;
  return (
    <div
      className={`app ${presenting ? "presenting" : ""} ${audience ? "audience" : ""}`}
      style={{ "--accent": chapter.color }}
    >
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setView("home");
            setPresenting(false);
          }}
        >
          <span className="brand-symbol">
            <Atom size={23} weight="regular" />
          </span>
          <span>
            biochemistry
            <span className="brand-divider" />{" "}
            <span className="brand-sub">revision studio</span>
          </span>
        </button>
        <nav>
          <button
            className={view === "deck" || view === "home" ? "nav-active" : ""}
            onClick={() => setView(view === "home" ? "home" : "deck")}
          >
            <BookOpen />
            Explore
          </button>
          <button
            className={view === "quiz" ? "nav-active" : ""}
            onClick={() => {
              setView("quiz");
              setPresenting(false);
            }}
          >
            <GraduationCap />
            Practice
          </button>
          <button onClick={() => setPanel("sources")}>
            Sources
            <ArrowUpRight size={14} />
          </button>
        </nav>
        <button className="presentation-launch" onClick={present}>
          <Monitor /> Present<span className="keycap">P</span>
        </button>
      </header>
      {view === "home" ? (
        <main className="home">
          <div className="home-hero">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="status-dot" /> AN INTERACTIVE REVISION
                EXPERIENCE
              </span>
              <h1>
                Biochemistry.
                <br />
                <span>
                  From molecule
                  <br />
                  to mechanism.
                </span>
              </h1>
              <p>
                See the structures. Follow the pathways.
                <br />
                Understand the science behind the medicine.
              </p>
              <div className="hero-actions">
                <button
                  className="primary-button"
                  onClick={() => {
                    location.href = `${location.pathname}?experience=etc`;
                  }}
                >
                  Preview the new presentation
                  <ArrowRight />
                </button>
                <button className="text-button" onClick={() => go(0)}>
                  Browse all 11 chapters
                  <ArrowUpRight />
                </button>
              </div>
              <div className="hero-facts">
                <span>
                  <b>11</b> chapters
                </span>
                <span>
                  <b>{count}</b> visual scenes
                </span>
                <span>
                  <b>165</b> practice questions
                </span>
              </div>
            </div>
            <div className="hero-art">
              <div className="hero-model-halo" />
              <Suspense
                fallback={
                  <div className="loading-model">Loading hemoglobin…</div>
                }
              >
                <MolecularScene hero model="protein" />
              </Suspense>
              <div className="hero-annotation">
                <span className="annotation-dot" />
                <div>
                  <b>Human hemoglobin</b>
                  <span>Four subunits. One coordinated function.</span>
                </div>
              </div>
              <span className="hero-credit">
                EXPERIMENTAL STRUCTURE · PDB 4HHB
              </span>
            </div>
          </div>
          <section className="chapter-section">
            <div className="section-intro">
              <span className="eyebrow">THE COMPLETE REVISION COLLECTION</span>
              <h2>Choose your starting point.</h2>
              <p>
                Move through the course, or go straight to the mechanism you
                need.
              </p>
            </div>
            <div className="chapter-grid">
              {chapters.map((c, i) => (
                <button
                  className="chapter-card"
                  key={c.id}
                  onClick={() => go(i)}
                  style={{ "--card-accent": c.color }}
                >
                  <div className="chapter-card-top">
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <ArrowUpRight />
                  </div>
                  <span className="chapter-category">{c.category}</span>
                  <h3>{c.title}</h3>
                  <div className="chapter-card-bottom">
                    <span>{c.slides.length} scenes</span>
                    <span>15 questions</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <footer className="home-footer">
            <span>Built from the 11 supplied lecture documents.</span>
            <button onClick={() => setPanel("sources")}>
              Academic sources & corrections
              <ArrowUpRight />
            </button>
          </footer>
        </main>
      ) : view === "quiz" ? (
        <Quiz
          onReview={(id, page) => {
            const c = chapters.findIndex((c) => c.id === id);
            const s = chapters[c].slides.reduce(
              (best, x, i) =>
                Math.abs(x.page - page) <
                Math.abs(chapters[c].slides[best].page - page)
                  ? i
                  : best,
              0,
            );
            go(c, s);
          }}
        />
      ) : (
        <div className="deck-layout">
          <aside className={`chapter-sidebar ${menu ? "open" : ""}`}>
            <div className="sidebar-label">
              CHAPTERS <span>11</span>
            </div>
            {chapters.map((c, i) => (
              <button
                key={c.id}
                className={ci === i ? "current" : ""}
                onClick={() => go(i)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>{c.short}</div>
                {ci === i && <span className="current-dot" />}
              </button>
            ))}
            <div className="sidebar-bottom">
              <Keyboard />
              <span>
                ← → navigate
                <br />F fullscreen · N notes
              </span>
            </div>
          </aside>
          <main className="deck-main">
            <div className="deck-subbar">
              <button
                className="mobile-menu"
                onClick={() => setMenu(!menu)}
                aria-label="Open chapters"
              >
                <List />
              </button>
              <span>
                {String(ci + 1).padStart(2, "0")}{" "}
                <span className="subbar-line" /> {chapter.title}
              </span>
              <div>
                <button
                  title={paused ? "Resume animation" : "Pause animation"}
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? <Play /> : <Pause />}
                </button>
                <button title="Fullscreen (F)" onClick={fullscreen}>
                  <ArrowsOut />
                </button>
                <button
                  title="Speaker notes (N)"
                  onClick={() => setPanel("notes")}
                >
                  <Notebook />
                </button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.section
                key={`${ci}-${si}`}
                className="scene"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                <div className="scene-copy">
                  <span className="scene-eyebrow">
                    {chapter.category} <span> / </span>{" "}
                    {String(si + 1).padStart(2, "0")}
                  </span>
                  <h1>{slide.title}</h1>
                  <ul>
                    {slide.bullets.map((b, i) => (
                      <li key={b} style={{ opacity: i < reveal ? 1 : 0.12 }}>
                        <button onClick={() => setPanel("detail")}>
                          <span />
                          {b}
                          <Info className="bullet-info" />
                          <span className="bullet-tooltip">
                            {
                              (slide.notes.match(/[^.!?]+[.!?]+/g) || [
                                slide.notes,
                              ])[
                                Math.min(
                                  i,
                                  (
                                    slide.notes.match(/[^.!?]+[.!?]+/g) || [
                                      slide.notes,
                                    ]
                                  ).length - 1,
                                )
                              ]
                            }
                            <em>Click for the full explanation and source.</em>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="scene-copy-actions">
                    <button
                      className="text-button"
                      onClick={() => setPanel("detail")}
                    >
                      Explore the explanation
                      <ArrowUpRight />
                    </button>
                    <button
                      className="reveal-control"
                      title="Reveal bullet points one at a time"
                      onClick={() => setReveal((x) => (x >= 3 ? 0 : x + 1))}
                    >
                      <Lightbulb />
                    </button>
                  </div>
                </div>
                <div
                  className="scene-visual"
                  onClickCapture={syncVisual}
                  onInputCapture={syncVisual}
                >
                  <Visual key={`${ci}-${si}`} slide={slide} paused={paused} />
                  {slide.labels && (
                    <div className="visual-labels">
                      {slide.labels.map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            </AnimatePresence>
            <footer className="deck-footer">
              <button
                className="source-link"
                onClick={() => {
                  setSourcePage(slide.page);
                  setPanel("source");
                }}
              >
                <BookOpen /> Lecture p. {slide.page}
                <span>Source & original visual</span>
              </button>
              <div className="slide-progress">
                <span>
                  {globalIndex} <span>/ {count}</span>
                </span>
                <div className="scene-dots">
                  {chapter.slides.map((s, i) => (
                    <button
                      key={i}
                      className={si === i ? "active" : ""}
                      onClick={() => go(ci, i)}
                      title={s.title}
                      aria-label={`Scene ${i + 1}: ${s.title}`}
                    />
                  ))}
                </div>
              </div>
              <div className="slide-nav">
                <button onClick={prev} aria-label="Previous scene">
                  <ArrowLeft />
                </button>
                <button onClick={next} aria-label="Next scene">
                  <ArrowRight />
                </button>
              </div>
            </footer>
          </main>
        </div>
      )}
      {blackout && (
        <button className="blackout" onClick={() => setBlackout(false)}>
          Press B to return
        </button>
      )}
      {hint && (
        <div className="toast" role="status">
          {hint}
        </div>
      )}
      <AnimatePresence>
        {panel && !(audience && panel === "notes") && (
          <motion.div
            className="panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(null)}
          >
            <motion.aside
              className={`detail-panel ${panel === "source" ? "source-panel" : ""}`}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={
                panel === "sources"
                  ? "Academic sources"
                  : panel === "notes"
                    ? "Presenter notes"
                    : "Concept explanation"
              }
            >
              <button
                autoFocus
                className="close-panel"
                aria-label="Close panel"
                onClick={() => setPanel(null)}
              >
                <X />
              </button>
              {panel === "sources" ? (
                <>
                  <span className="eyebrow">ACADEMIC PROVENANCE</span>
                  <h2>Trace every mechanism.</h2>
                  <p>
                    Each scene and practice question cites a supplied lecture
                    page. The lecture bibliographies are transcribed below.
                    Supplementary sources support identified corrections and
                    molecular coordinates.
                  </p>
                  <div className="source-list">
                    {chapters.map((c) => (
                      <div key={c.id}>
                        <b>{c.title}</b>
                        <p>
                          {c.file} · {c.pages} pages
                        </p>
                        <span>{c.ref}</span>
                      </div>
                    ))}
                  </div>
                  <h3>Verified supplementary references</h3>
                  {sources.map((s) => (
                    <a
                      className="reference-link"
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.title}
                      <ArrowUpRight />
                    </a>
                  ))}
                  <h3>Question provenance</h3>
                  <p>
                    The professor agent searched official NU Oman material and
                    public search results. No authenticated official exam paper
                    was available. All 165 items are original practice MCQs, not
                    reproduced university papers and not endorsed by the
                    university.
                  </p>
                  <h3>Accuracy notes</h3>
                  <p>
                    Corrections include EC 7 translocases, trypsin specificity,
                    cytosolic glycolysis, heme compartments, pure noncompetitive
                    inhibition, folate stores, historical Schilling testing and
                    context-dependent dietary requirements. Schematic models and
                    hypothetical charts are labeled. Scores indicate performance
                    on this bank, not proven clinical mastery.
                  </p>
                </>
              ) : panel === "source" ? (
                <>
                  <span className="eyebrow">ORIGINAL SOURCE</span>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.file}</p>
                  <label className="source-page-picker">
                    Lecture page{" "}
                    <input
                      type="number"
                      min="1"
                      max={chapter.pages}
                      value={sourcePage || slide.page}
                      onChange={(e) =>
                        setSourcePage(
                          Math.max(
                            1,
                            Math.min(chapter.pages, +e.target.value || 1),
                          ),
                        )
                      }
                    />{" "}
                    of {chapter.pages}
                  </label>
                  <a
                    href={`${import.meta.env.BASE_URL}originals/${chapter.id}/${sourcePage || slide.page}.webp`}
                    target="_blank"
                    rel="noreferrer"
                    className="source-image-link"
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}originals/${chapter.id}/${sourcePage || slide.page}.webp`}
                      alt={`Unmodified layout of ${chapter.file}, page ${sourcePage || slide.page}`}
                    />
                    <span>
                      Open the original slide at full size
                      <ArrowsOut />
                    </span>
                  </a>
                  <p className="panel-small">
                    Original figures and layout are preserved. The source may
                    contain oversimplifications addressed in the presentation’s
                    explanation and accuracy notes.
                  </p>
                  <p>{chapter.ref}</p>
                </>
              ) : panel === "notes" ? (
                <>
                  <span className="eyebrow">PRESENTER VIEW</span>
                  <h2>{slide.title}</h2>
                  <p className="notes-hint">
                    Keep this tab on your screen. Project or share the audience
                    tab. Slide navigation and button / slider controls sync
                    between tabs.
                  </p>
                  <a
                    className="audience-link"
                    href={`${location.origin}${location.pathname}?audience=1&session=${sessionId}#${chapter.id}/${si}`}
                    target="biochemistry-audience"
                    rel="noreferrer"
                  >
                    Open audience view
                    <ArrowUpRight />
                  </a>
                  <label className="notes-label">
                    Your speaker notes
                    <textarea
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value);
                        localStorage.setItem(
                          `bio-note-${chapter.id}-${si}`,
                          e.target.value,
                        );
                      }}
                    />
                  </label>
                  <div className="presenter-next">
                    <span>NEXT SCENE</span>
                    <b>
                      {chapter.slides[si + 1]?.title ||
                        chapters[ci + 1]?.slides[0]?.title ||
                        "End of presentation"}
                    </b>
                    <button className="primary-button" onClick={next}>
                      Next scene
                      <ArrowRight />
                    </button>
                  </div>
                  <div className="presenter-controls">
                    <button onClick={() => setBlackout(!blackout)}>
                      <EyeSlash /> Blackout (B)
                    </button>
                    <button onClick={fullscreen}>
                      <ArrowsOut /> Fullscreen (F)
                    </button>
                    <button
                      onClick={() => {
                        setPresenting(false);
                        setPanel(null);
                      }}
                    >
                      <ArrowsIn /> Exit presentation
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="eyebrow">BEHIND THE MECHANISM</span>
                  <h2>{slide.title}</h2>
                  <p className="detail-explanation">{slide.notes}</p>
                  {slide.supplemental?.map((s) => (
                    <a
                      className="reference-link"
                      key={s.url}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.title}
                      <ArrowUpRight />
                    </a>
                  ))}
                  {slide.correction && (
                    <div className="academic-correction">
                      <Check />
                      <div>
                        <b>Academic clarification</b>
                        <p>{slide.correction}</p>
                      </div>
                    </div>
                  )}
                  <div className="detail-source">
                    <BookOpen />
                    <span>
                      {chapter.file}
                      <br />
                      Page {slide.page}
                    </span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setSourcePage(slide.page);
                      setPanel("source");
                    }}
                  >
                    Inspect the original slide
                    <ArrowUpRight />
                  </button>
                  <button
                    className="primary-button panel-practice"
                    onClick={() => {
                      setPanel(null);
                      setView("quiz");
                      setPresenting(false);
                    }}
                  >
                    Practice this course
                    <GraduationCap />
                  </button>
                </>
              )}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  new URLSearchParams(location.search).get("experience") === "etc" ? (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100dvh",
            background: "#05070c",
            color: "#a3acbd",
            display: "grid",
            placeItems: "center",
          }}
        >
          Loading the presentation…
        </div>
      }
    >
      <RespirationExperience />
    </Suspense>
  ) : (
    <App />
  ),
);
