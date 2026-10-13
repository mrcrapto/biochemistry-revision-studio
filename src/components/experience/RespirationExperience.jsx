import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsOut,
  Pause,
  Play,
  X,
  SquaresFour,
  BookOpen,
  Check,
} from "@phosphor-icons/react";
import RespirationModel from "./RespirationModel";
import { respiratoryState } from "./physiology";
import "./experience.css";

const scenes = [
  {
    eyebrow: "BIOCHEMISTRY / ENERGY METABOLISM",
    title: (
      <>
        Electron transport.
        <br />
        <em>Energy, in motion.</em>
      </>
    ),
    caption: "Follow the electrons. Build the gradient. Make ATP.",
    page: 1,
  },
  {
    eyebrow: "01 / THE SETTING",
    title: (
      <>
        One membrane.
        <br />
        <em>Two compartments.</em>
      </>
    ),
    caption:
      "The inner mitochondrial membrane separates matrix from intermembrane space.",
    page: 3,
  },
  {
    eyebrow: "02 / ELECTRON TRANSFER",
    title: (
      <>
        Two entry points.
        <br />
        <em>One destination.</em>
      </>
    ),
    caption: "Electrons pass through Q → III → cytochrome c → IV → oxygen.",
    page: 8,
  },
  {
    eyebrow: "03 / PROTON PUMPING",
    title: (
      <>
        Electron flow
        <br />
        <em>moves protons.</em>
      </>
    ),
    caption:
      "Complexes I, III and IV pump H⁺ out of the matrix. Complex II does not.",
    page: 9,
  },
  {
    eyebrow: "04 / CHEMIOSMOTIC COUPLING",
    title: (
      <>
        The gradient
        <br />
        <em>does the work.</em>
      </>
    ),
    caption:
      "H⁺ returns through ATP synthase, coupling the gradient to ATP production.",
    page: 10,
  },
  {
    eyebrow: "05 / ATP SYNTHASE",
    title: (
      <>
        A molecular
        <br />
        <em>rotary motor.</em>
      </>
    ),
    caption: "Fₒ spans the membrane. F₁ makes ATP on the matrix side.",
    page: 13,
  },
  {
    eyebrow: "06 / LIVE EXPERIMENT",
    title: (
      <>
        Change one thing.
        <br />
        <em>Follow the consequence.</em>
      </>
    ),
    caption:
      "Select a perturbation. Compare electron flow, the gradient and ATP synthesis.",
    page: 15,
  },
  {
    eyebrow: "07 / CHECK YOUR UNDERSTANDING",
    title: (
      <>
        The chain runs.
        <br />
        <em>ATP falls. Why?</em>
      </>
    ),
    caption:
      "An uncoupler is added to well-fed mitochondria with oxygen available.",
    page: 17,
  },
];
const details = {
  I: [
    "Complex I",
    "NADH → Q",
    "Oxidation of NADH supplies electrons to coenzyme Q. Complex I uses released energy to pump protons from matrix to intermembrane space. Rotenone blocks this entry route.",
  ],
  II: [
    "Complex II",
    "Succinate → Q",
    "Succinate dehydrogenase supplies FAD-linked electrons to Q. It does not pump protons. This entry bypasses complex I. FAD is enzyme-bound; FADH₂ is not a freely diffusible carrier here.",
  ],
  III: [
    "Complex III",
    "Q → cytochrome c",
    "The cytochrome bc₁ complex transfers electrons from reduced Q to cytochrome c and contributes to proton translocation. Antimycin A inhibits complex III.",
  ],
  IV: [
    "Complex IV",
    "O₂ → H₂O",
    "Cytochrome c oxidase transfers electrons to oxygen, the terminal electron acceptor. Oxygen is reduced to water; complex IV also pumps protons. Cyanide inhibits this complex.",
  ],
  V: [
    "ATP synthase",
    "ADP + Pᵢ → ATP",
    "Proton flow through Fₒ drives rotation of the central rotor. The stationary catalytic F₁ head changes conformation to synthesize and release ATP. The head itself is not shown rotating. Oligomycin blocks proton passage.",
  ],
  Q: [
    "Coenzyme Q",
    "The membrane carrier",
    "Lipid-soluble Q accepts electrons from complexes I and II and delivers them to complex III. Its redox chemistry links two-electron donors to one-electron carriers.",
  ],
  cytc: [
    "Cytochrome c",
    "The surface carrier",
    "This small heme protein transfers one electron at a time from complex III to complex IV on the intermembrane-space side of the inner membrane.",
  ],
};
const descriptions = {
  Coupled:
    "Electron transfer builds a gradient; proton return supports ATP synthesis.",
  Rotenone:
    "Complex I is blocked. Switch to succinate to demonstrate entry through complex II.",
  "Antimycin A":
    "Complex III is blocked. Both entry routes converge upstream of the block.",
  Cyanide:
    "Complex IV cannot pass electrons to oxygen. Sustained electron flow and ATP synthesis fall.",
  Oligomycin:
    "Proton return through ATP synthase is blocked. The gradient builds, slowing the chain.",
  Uncoupler:
    "Protons bypass ATP synthase. The gradient dissipates; oxidation can accelerate and more energy becomes heat.",
};
function initialScene() {
  return Math.min(
    7,
    Math.max(0, Number(location.hash.replace("#scene/", "")) || 0),
  );
}

export default function RespirationExperience() {
  const [step, setStep] = useState(initialScene),
    [entry, setEntry] = useState("NADH"),
    [condition, setCondition] = useState("Coupled"),
    [paused, setPaused] = useState(false),
    [panel, setPanel] = useState(null),
    [selected, setSelected] = useState(null),
    [answer, setAnswer] = useState(null),
    [black, setBlack] = useState(false);
  const stage = useRef(),
    closeButton = useRef(),
    lastFocus = useRef();
  const scene = scenes[step],
    state = respiratoryState(step === 7 ? "Uncoupler" : condition, entry),
    activeCondition = step === 7 ? "Uncoupler" : condition;
  const navigate = (n) => {
    setStep(Math.min(7, Math.max(0, n)));
    setSelected(null);
    setAnswer(null);
    setCondition("Coupled");
  };
  useEffect(() => {
    history.replaceState(
      null,
      "",
      `${location.pathname}?experience=etc#scene/${step}`,
    );
  }, [step]);
  useEffect(() => {
    const key = (e) => {
      if (
        e.target.matches("input,textarea,select") ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey
      )
        return;
      if (e.key === "Escape") {
        setPanel(null);
        setSelected(null);
        setBlack(false);
        return;
      }
      if (panel) return;
      if (
        e.key === "ArrowRight" ||
        (e.code === "Space" && !e.target.closest("button,a"))
      ) {
        e.preventDefault();
        navigate(step + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(step - 1);
      }
      if (e.key.toLowerCase() === "o") setPanel("overview");
      if (e.key.toLowerCase() === "b") setBlack((v) => !v);
      if (e.key.toLowerCase() === "f") fullscreen();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step, panel]);
  useEffect(() => {
    if (!panel) return;
    lastFocus.current = document.activeElement;
    closeButton.current?.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const items = [
          ...document.querySelectorAll(
            ".resp-dialog button,.resp-dialog a[href]",
          ),
        ].filter((el) => !el.disabled),
        first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trap);
    return () => {
      window.removeEventListener("keydown", trap);
      lastFocus.current?.focus();
    };
  }, [panel]);
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current.requestFullscreen();
    } catch {
      setPanel("help");
    }
  }
  return (
    <main className={"resp-experience resp-step-" + step} ref={stage}>
      <RespirationModel
        step={step}
        condition={activeCondition}
        entry={entry}
        paused={paused}
        onSelect={setSelected}
      />
      <div className="resp-atmosphere" aria-hidden="true" />
      <header className="resp-topline">
        <a href={location.pathname}>
          BIOCHEMISTRY<span> / REVISION STUDIO</span>
        </a>
        <button onClick={() => setPanel("sources")}>
          <BookOpen size={17} weight="light" /> Lecture source
        </button>
      </header>
      <AnimatePresence mode="wait">
        <motion.section
          className="resp-copy"
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="resp-eyebrow">{scene.eyebrow}</p>
          <h1>{scene.title}</h1>
          {step === 0 && (
            <>
              <p className="resp-intro">{scene.caption}</p>
              <button className="resp-start" onClick={() => navigate(1)}>
                Explore the mechanism{" "}
                <span>
                  <ArrowRight size={21} />
                </span>
              </button>
              <p className="resp-prototype">
                New presentation direction · ETC chapter preview
              </p>
            </>
          )}
        </motion.section>
      </AnimatePresence>
      {step > 0 && step !== 5 && (
        <div className="resp-compartments" aria-hidden="true">
          <span>
            INTERMEMBRANE SPACE
            {step >= 3 && <small>Higher H⁺ · more positive</small>}
          </span>
          <span>MATRIX</span>
        </div>
      )}
      {step >= 2 && step <= 4 && (
        <div className="resp-entry">
          <span>Electron entry</span>
          <div role="group" aria-label="Electron entry route">
            {["NADH", "Succinate"].map((v) => (
              <button
                key={v}
                aria-pressed={entry === v}
                onClick={() => setEntry(v)}
              >
                {v}
                {v === "Succinate" && <small>Complex II</small>}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 5 && (
        <div className="resp-motor-key">
          <button onClick={() => setSelected("V")}>
            <span>Fₒ</span>Proton-driven rotor
          </button>
          <button onClick={() => setSelected("V")}>
            <span>F₁</span>Catalytic head · matrix side
          </button>
          <div className="resp-equation">
            ADP + Pᵢ <span>→</span> <b>ATP</b>
          </div>
        </div>
      )}
      {step === 6 && (
        <section className="resp-lab" aria-label="Live inhibitor experiment">
          <div
            className="resp-conditions"
            role="group"
            aria-label="Perturbation"
          >
            {Object.keys(descriptions).map((v) => (
              <button
                key={v}
                aria-pressed={condition === v}
                onClick={() => setCondition(v)}
              >
                {v === "Coupled" ? "Normal" : v}
              </button>
            ))}
          </div>
          <div className="resp-entry lab-entry">
            <span>Electron donor</span>
            <div role="group" aria-label="Electron entry route">
              {["NADH", "Succinate"].map((v) => (
                <button
                  key={v}
                  aria-pressed={entry === v}
                  onClick={() => setEntry(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="resp-readouts" aria-live="polite">
            {[
              ["Electron flow", state.flow, "cyan"],
              ["H⁺ gradient", state.gradient, "pink"],
              ["ATP synthesis", state.synthesis, "gold"],
              ["Heat", state.heat, "pink"],
            ].map(([name, value, color]) => (
              <div className={"resp-readout " + color} key={name}>
                <span>{name}</span>
                <strong>
                  {name === "Heat"
                    ? value > 0.5
                      ? "Higher"
                      : value < 0.1
                        ? "Lower"
                        : "Baseline"
                    : value < 0.2
                      ? "Low"
                      : value > 1.2
                        ? "Higher"
                        : "Maintained"}
                </strong>
                <div>
                  <i style={{ transform: `scaleX(${value / 1.55})` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="resp-lab-explanation" aria-live="polite">
            {descriptions[condition]}
          </p>
        </section>
      )}
      {step === 7 && (
        <section className="resp-question" aria-label="Understanding check">
          <p>An uncoupler is added. Why does oxidative ATP yield fall?</p>
          {[
            "Complex IV can no longer reduce oxygen.",
            "H⁺ returns without driving ATP synthase.",
            "ATP synthase pumps H⁺ into the intermembrane space.",
          ].map((option, i) => (
            <button
              key={option}
              onClick={() => setAnswer(i)}
              aria-pressed={answer === i}
              className={
                answer === i ? (i === 1 ? "correct" : "incorrect") : ""
              }
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {option}
              {answer === i && i === 1 && <Check />}
            </button>
          ))}
          {answer !== null && (
            <p className="resp-feedback" role="status">
              {answer === 1
                ? "Correct. Electron transport can continue while the gradient dissipates through a bypass."
                : "Look at the pink H⁺ particles: they bypass the motor. Oxygen reduction can still continue."}
            </p>
          )}
        </section>
      )}
      {step > 0 && step < 6 && (
        <div className="resp-takeaway">
          <span className="resp-takeaway-line" />
          <p>{scene.caption}</p>
        </div>
      )}
      {step === 7 && (
        <div className="resp-quiz-bridge">
          <a href={`${location.pathname}?practice=1`}>
            Open the full 165-question bank <ArrowRight />
          </a>
        </div>
      )}
      {step >= 2 && step !== 7 && (
        <div className="resp-legend">
          <span>
            <i className="cyan" />
            e⁻
          </span>
          <span>
            <i className="pink" />
            H⁺
          </span>
          {step >= 4 && (
            <span>
              <i className="gold" />
              ATP
            </span>
          )}
        </div>
      )}
      <AnimatePresence>
        {selected && (
          <motion.aside
            className="resp-inspector"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            aria-label={details[selected][0]}
          >
            <button aria-label="Close detail" onClick={() => setSelected(null)}>
              <X />
            </button>
            <span>MECHANISM DETAIL</span>
            <h2>{details[selected][0]}</h2>
            <strong>{details[selected][1]}</strong>
            <p>{details[selected][2]}</p>
          </motion.aside>
        )}
      </AnimatePresence>
      <footer className="resp-dock">
        <div className="resp-scene-status">
          <span>
            {step === 0
              ? "Oxidative phosphorylation"
              : scene.eyebrow.split(" / ")[1]}
          </span>
          <b>
            {String(step + 1).padStart(2, "0")}
            <i> / 08</i>
          </b>
        </div>
        <nav aria-label="Presentation controls">
          <button
            onClick={() => navigate(step - 1)}
            disabled={step === 0}
            aria-label="Previous scene"
          >
            <ArrowLeft />
          </button>
          <button
            className="resp-next"
            onClick={() => navigate(step + 1)}
            disabled={step === 7}
            aria-label="Next scene"
          >
            <ArrowRight />
          </button>
          <span className="resp-dock-divider" />
          <button
            onClick={() => setPanel("overview")}
            aria-label="Scene overview"
          >
            <SquaresFour />
          </button>
          <button
            onClick={() => setPaused((v) => !v)}
            aria-label={paused ? "Resume animation" : "Pause animation"}
          >
            {paused ? <Play /> : <Pause />}
          </button>
          <button onClick={fullscreen} aria-label="Fullscreen">
            <ArrowsOut />
          </button>
        </nav>
        <button className="resp-shortcuts" onClick={() => setPanel("help")}>
          ← → <span>to navigate</span>
        </button>
      </footer>
      <div className="resp-progress" aria-hidden="true">
        <i style={{ transform: `scaleX(${(step + 1) / 8})` }} />
      </div>
      <AnimatePresence>
        {panel && (
          <motion.div
            className="resp-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setPanel(null);
            }}
          >
            <section
              className="resp-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="resp-dialog-title"
            >
              <button
                ref={closeButton}
                className="resp-close"
                onClick={() => setPanel(null)}
                aria-label="Close dialog"
              >
                <X />
              </button>
              <p className="resp-eyebrow">REVISION STUDIO</p>
              <h2 id="resp-dialog-title">
                {panel === "overview"
                  ? "The mechanism, step by step."
                  : panel === "sources"
                    ? "Trace every idea."
                    : "Present with confidence."}
              </h2>
              {panel === "overview" && (
                <div className="resp-overview">
                  {scenes.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        navigate(i);
                        setPanel(null);
                      }}
                      aria-current={step === i ? "step" : undefined}
                    >
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        {i === 0 ? "Introduction" : s.eyebrow.split(" / ")[1]}
                        <small>{s.caption}</small>
                      </div>
                      <ArrowRight />
                    </button>
                  ))}
                </div>
              )}
              {panel === "sources" && (
                <>
                  <p>
                    This scene follows{" "}
                    <b>Oxidative Phosphorylation and ETC.pdf</b>, supplied with
                    this project. Current scene: lecture page {scene.page}.
                  </p>
                  <div className="resp-source-pages">
                    {[3, 8, 9, 10, 13, 15, 16, 17, 19].map((p) => (
                      <a
                        key={p}
                        href={`./originals/etc/${p}.webp`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Lecture p. {p} <ArrowRight size={18} />
                      </a>
                    ))}
                  </div>
                  <p>
                    The lecture cites{" "}
                    <i>Lippincott Illustrated Reviews: Biochemistry</i>, 9th
                    edition, chapter 5, pp. 85–94. These are the bibliographic
                    details printed on the lecture’s final page; instructor
                    confirmation remains appropriate.
                  </p>
                  <a
                    className="resp-supporting-source"
                    href="https://www.ncbi.nlm.nih.gov/books/NBK26894/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Supporting reference: Molecular Biology of the Cell · The
                    Mitochondrion <ArrowRight />
                  </a>
                  <p className="resp-method-note">
                    All 3D structures are purpose-built schematics, not atomic
                    reconstructions. Particle counts, speed and readout bars are
                    illustrative. The experiment shows qualitative steady-state
                    tendencies with substrate, oxygen and ADP available. An
                    uncoupler increases dissipation as heat; it does not remove
                    substrate-level ATP production or imply zero cellular ATP.
                    Normal mitochondria also release heat.
                  </p>
                </>
              )}
              {panel === "help" && (
                <>
                  <div className="resp-help">
                    {[
                      ["→ / Space", "Next scene"],
                      ["←", "Previous scene"],
                      ["O", "Scene overview"],
                      ["F", "Fullscreen"],
                      ["B", "Black screen"],
                      ["Esc", "Close overlay / restore screen"],
                    ].map(([key, text]) => (
                      <div key={key}>
                        <kbd>{key}</kbd>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                  <p>
                    Click a labelled complex to open a focused explanation.
                    Pause the particles while you talk. If fullscreen is
                    unavailable, use your browser’s fullscreen command.
                  </p>
                </>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      {black && (
        <button
          className="resp-blackout"
          aria-label="Restore presentation"
          onClick={() => setBlack(false)}
        />
      )}
    </main>
  );
}
