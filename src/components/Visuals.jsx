import React, { Suspense, lazy, useState, useEffect } from "react";
import { motion } from "motion/react";
import { parameters, velocity } from "../lib/kinetics";
import {
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  Info,
} from "@phosphor-icons/react";
const MolecularScene = lazy(() => import("./MolecularScene"));
export { MolecularScene };
const Toggle = ({ values, value, onChange }) => (
  <div className="segmented">
    {values.map((x) => (
      <button
        key={x}
        className={value === x ? "selected" : ""}
        onClick={() => onChange(x)}
      >
        {x}
      </button>
    ))}
  </div>
);
export function Kinetics({ slide }) {
  const [km, setKm] = useState(3),
    [vmax, setVmax] = useState(10),
    [substrate, setSubstrate] = useState(3),
    [dose, setDose] = useState(2),
    [mode, setMode] = useState(slide.inhibition || "None"),
    [reciprocal, setReciprocal] = useState(!!slide.reciprocal);
  const effective = parameters(km, vmax, mode, dose),
    ik = effective.km,
    iv = effective.vmax;
  const rate = (s, k = km, m = vmax) =>
    velocity(s, k, m, slide.allosteric ? 2 : 1);
  const x = (s) => 78 + (s / 20) * 560,
    y = (n) => 322 - (n / 12) * 250;
  const curve = (k, m) =>
    Array.from({ length: 201 }, (_, i) => {
      const s = i / 10;
      return `${i ? "L" : "M"}${x(s)},${y(rate(s, k, m))}`;
    }).join(" ");
  const reciprocalCurve = (k, m) =>
    `M 78 ${y((1 / m) * 10)} L 638 ${y(((k / m) * 0.5 + 1 / m) * 10)}`;
  return (
    <div className="chart-visual">
      <div className="visual-heading">
        <span>
          {reciprocal
            ? "Lineweaver–Burk plot"
            : slide.allosteric
              ? "Cooperative response"
              : "Michaelis–Menten kinetics"}
        </span>
        <button
          className="text-button"
          disabled={!!slide.allosteric}
          onClick={() => setReciprocal(!reciprocal)}
        >
          {reciprocal ? "Saturation curve" : "Reciprocal view"}
        </button>
      </div>
      <svg
        viewBox="0 0 700 390"
        className="kinetics-svg"
        role="img"
        aria-label={`Enzyme velocity chart. Km ${km}, Vmax ${vmax}, inhibition ${mode}.`}
      >
        {[0, 3, 6, 9, 12].map((n) => (
          <g key={n}>
            <line
              x1="78"
              x2="638"
              y1={y(n)}
              y2={y(n)}
              stroke="#dce3e7"
              strokeDasharray="3 5"
            />
            <text x="62" y={y(n) + 6} textAnchor="end">
              {reciprocal ? (n / 10).toFixed(1) : n}
            </text>
          </g>
        ))}
        <path
          d="M78 58 V322 H638"
          fill="none"
          stroke="#657889"
          strokeWidth="2"
        />
        {[0, 5, 10, 15, 20].map((s) => (
          <text key={s} x={x(s)} y="350" textAnchor="middle">
            {reciprocal ? (s / 40).toFixed(2) : s}
          </text>
        ))}
        <text x="358" y="382" textAnchor="middle">
          {reciprocal ? "1 / [S]" : "Substrate concentration [S]"}
        </text>
        <text transform="translate(23 205) rotate(-90)" textAnchor="middle">
          {reciprocal ? "1 / v" : "Initial velocity v"}
        </text>
        <path
          d={reciprocal ? reciprocalCurve(km, vmax) : curve(km, vmax)}
          fill="none"
          stroke="#98adb7"
          strokeWidth="4"
          strokeDasharray={mode === "None" ? "" : "7 6"}
        />
        <motion.path
          d={reciprocal ? reciprocalCurve(ik, iv) : curve(ik, iv)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.65 }}
        />
        {!reciprocal && (
          <>
            <line
              x1={x(substrate)}
              x2={x(substrate)}
              y1={y(rate(substrate, ik, iv))}
              y2="322"
              stroke="var(--accent)"
              strokeDasharray="4 5"
            />
            <circle
              cx={x(substrate)}
              cy={y(rate(substrate, ik, iv))}
              r="8"
              fill="var(--accent)"
              stroke="white"
              strokeWidth="3"
            />
          </>
        )}
      </svg>
      <div className="chart-stats">
        <span>
          {slide.allosteric ? "K₀.₅" : "Apparent Km"} <b>{ik.toFixed(1)}</b>
        </span>
        <span>
          Vmax <b>{iv.toFixed(1)}</b>
        </span>
        <span>
          v at [S] <b>{rate(substrate, ik, iv).toFixed(2)}</b>
        </span>
      </div>
      <div className="slider-row">
        <label>
          Substrate [S]
          <input
            aria-label="Substrate concentration"
            type="range"
            min=".1"
            max="20"
            step=".1"
            value={substrate}
            onChange={(e) => setSubstrate(+e.target.value)}
          />
        </label>
        <label>
          {slide.allosteric ? "K₀.₅" : "Km"}
          <input
            aria-label={
              slide.allosteric
                ? "Half-saturation concentration"
                : "Michaelis constant Km"
            }
            type="range"
            min=".5"
            max="8"
            step=".5"
            value={km}
            onChange={(e) => setKm(+e.target.value)}
          />
        </label>
        <label>
          Vmax
          <input
            aria-label="Maximum velocity"
            type="range"
            min="2"
            max="12"
            step=".5"
            value={vmax}
            onChange={(e) => setVmax(+e.target.value)}
          />
        </label>
      </div>
      {slide.inhibition && (
        <>
          <Toggle
            values={[
              "None",
              "Competitive",
              "Noncompetitive",
              "Mixed",
              "Uncompetitive",
            ]}
            value={mode}
            onChange={setMode}
          />
          <label className="dose">
            Inhibitor [I]/Ki <b>{dose}</b>
            <input
              aria-label="Relative inhibitor concentration"
              type="range"
              min="0"
              max="4"
              step=".5"
              value={dose}
              onChange={(e) => setDose(+e.target.value)}
            />
          </label>
        </>
      )}
      <p className="visual-caption">
        Dimensionless teaching model ·{" "}
        {slide.allosteric
          ? "Hill coefficient n = 2"
          : reciprocal
            ? "1/v = (Km/Vmax)(1/[S]) + 1/Vmax"
            : "Initial-rate, simple-enzyme assumptions"}
        {slide.allosteric && reciprocal
          ? " · reciprocal line shown only as a reference for noncooperative kinetics"
          : ""}
      </p>
    </div>
  );
}
export const pathways = {
  glycolysis: [
    ["Glucose", "Hexokinase / glucokinase consumes ATP"],
    ["Glucose-6-P", "Phosphoglucose isomerase changes aldose to ketose"],
    ["Fructose-6-P", "PFK-1 consumes ATP; major control point"],
    ["Fructose-1,6-BP", "Aldolase forms GAP and DHAP; TPI interconverts them"],
    ["2 GAP", "GAPDH makes two NADH and two 1,3-BPG"],
    ["2 1,3-BPG", "Phosphoglycerate kinase makes two ATP"],
    ["2 3-PG", "Phosphoglycerate mutase forms 2-PG"],
    ["2 2-PG", "Enolase removes water; inhibited by fluoride"],
    ["2 PEP", "Pyruvate kinase makes two ATP"],
    ["2 Pyruvate", "Net: two ATP, two NADH, two pyruvate"],
  ],
  etc: [
    [
      "NADH / I",
      "Complex I transfers electrons to Q and pumps protons. Rotenone blocks I.",
    ],
    [
      "Succinate / II",
      "Complex II transfers electrons to Q without proton pumping. Alternative entry, not downstream of I.",
    ],
    ["Q", "Coenzyme Q accepts from I and II, transfers to III."],
    ["Complex III", "Cytochrome bc1 pumps protons; antimycin A inhibits III."],
    ["Cytochrome c", "Mobile one-electron carrier between III and IV."],
    ["Complex IV", "Reduces O₂ to H₂O and pumps protons; cyanide inhibits IV."],
    [
      "ATP synthase",
      "H⁺ returns to matrix through Fo; F1 catalyzes ATP formation. Not an electron carrier.",
    ],
  ],
  glycogenesis: [
    ["Glucose-6-P", "Phosphoglucomutase forms glucose-1-P"],
    ["Glucose-1-P", "UTP activates glucose via UDP-glucose pyrophosphorylase"],
    ["UDP-glucose", "Activated glucosyl donor"],
    ["Glycogenin primer", "Autoglucosylated protein provides a starting chain"],
    ["α(1→4) elongation", "Glycogen synthase extends nonreducing ends"],
    ["α(1→6) branches", "Branching enzyme transfers a chain segment"],
  ],
  glycogenolysis: [
    ["Glycogen", "Many nonreducing ends support rapid mobilization"],
    ["Phosphorylase", "PLP-dependent phosphorolysis of α(1→4) linkages"],
    ["Debranching", "Transferase and α(1→6)-glucosidase activities"],
    [
      "Glucose-1-P",
      "Most residues emerge phosphorylated; branch residue yields free glucose",
    ],
    ["Glucose-6-P", "Phosphoglucomutase interconversion"],
    [
      "Tissue-specific fate",
      "Liver exports free glucose; muscle uses G6P locally",
    ],
  ],
  heme: [
    ["Glycine + succinyl-CoA", "Mitochondria: ALAS + PLP forms ALA (step 1)"],
    ["ALA → PBG", "Cytosol: ALA dehydratase (step 2)"],
    ["Hydroxymethylbilane", "Cytosol: hydroxymethylbilane synthase (step 3)"],
    ["Uroporphyrinogen III", "Cytosol: uroporphyrinogen III synthase (step 4)"],
    [
      "Coproporphyrinogen III",
      "Cytosol: uroporphyrinogen decarboxylase (step 5)",
    ],
    [
      "Protoporphyrinogen IX",
      "Mitochondria: coproporphyrinogen oxidase (step 6)",
    ],
    ["Protoporphyrin IX", "Mitochondria: protoporphyrinogen oxidase (step 7)"],
    ["Heme", "Mitochondria: ferrochelatase inserts Fe²⁺ (step 8)"],
  ],
  bilirubin: [
    ["Heme", "Macrophage heme oxygenase forms green biliverdin, iron and CO"],
    ["Biliverdin", "Biliverdin reductase + NADPH forms bilirubin"],
    [
      "Unconjugated bilirubin",
      "Albumin carries poorly water-soluble bilirubin in plasma",
    ],
    [
      "Liver / UGT1A1",
      "Conjugation with glucuronic acid increases water solubility",
    ],
    ["Bile / MRP2", "ATP-dependent canalicular secretion"],
    ["Gut pigments", "Urobilinogen metabolism yields stercobilin and urobilin"],
  ],
  b12: [
    ["Dietary B12", "Released from food, binds haptocorrin"],
    ["Duodenum", "Pancreatic proteases free B12 from haptocorrin"],
    ["Intrinsic factor", "B12 binds IF secreted by gastric parietal cells"],
    ["Terminal ileum", "Receptor-mediated uptake of B12–IF"],
    ["Transcobalamin", "Plasma transport to tissues"],
    ["Liver stores", "Stores can delay deficiency for years"],
  ],
};
function Pathway({ slide, paused }) {
  const nodes = pathways[slide.path],
    [active, setActive] = useState(0),
    [auto, setAuto] = useState(false),
    [block, setBlock] = useState("None");
  useEffect(() => {
    if (!auto || paused) return;
    const id = setInterval(
      () => setActive((x) => (x + 1) % nodes.length),
      1800,
    );
    return () => clearInterval(id);
  }, [auto, paused, nodes.length]);
  return (
    <div className="pathway-visual">
      <div className="visual-heading">
        <span>
          {slide.path === "etc"
            ? "Electron transfer & coupling"
            : "Follow the mechanism"}
        </span>
        <button className="text-button" onClick={() => setAuto(!auto)}>
          {auto ? <Pause /> : <Play />}
          {auto ? "Pause" : "Trace pathway"}
        </button>
      </div>
      {slide.path === "etc" && (
        <div className="branch-note">
          I and II are parallel entry points into Q. ATP synthase uses the
          gradient.
        </div>
      )}
      <div
        className={`pathway-nodes ${slide.path === "etc" ? "etc-nodes" : ""}`}
      >
        {nodes.map(([name, detail], i) => (
          <React.Fragment key={name}>
            <button
              style={
                slide.path === "etc"
                  ? {
                      gridArea: [
                        "entry1",
                        "entry2",
                        "q",
                        "iii",
                        "cyt",
                        "iv",
                        "atp",
                      ][i],
                    }
                  : undefined
              }
              className={`path-node ${active === i ? "active" : ""} ${block !== "None" && ((block === "Rotenone" && i === 0) || (block === "Antimycin A" && i === 3) || (block === "Cyanide" && i === 5) || (block === "Oligomycin" && i === 6)) ? "blocked" : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className="node-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              {name}
            </button>
            {slide.path !== "etc" && i < nodes.length - 1 && (
              <span className="path-connector">→</span>
            )}
          </React.Fragment>
        ))}
        {slide.path === "etc" && (
          <>
            <span className="etc-join" style={{ gridArea: "join" }}>
              ↘　↙
            </span>
            <span className="etc-link" style={{ gridArea: "link1" }}>
              →
            </span>
            <span className="etc-link" style={{ gridArea: "link2" }}>
              →
            </span>
            <span className="etc-link" style={{ gridArea: "link3" }}>
              →
            </span>
            <span className="etc-gradient" style={{ gridArea: "gradient" }}>
              H⁺ gradient couples electron transfer to ATP synthesis ↓
            </span>
          </>
        )}
      </div>
      <div className="mechanism-detail" aria-live="polite">
        <span>
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(nodes.length).padStart(2, "0")}
        </span>
        <h3>{nodes[active][0]}</h3>
        <p>{nodes[active][1]}</p>
      </div>
      {slide.poison && (
        <>
          <Toggle
            values={[
              "None",
              "Rotenone",
              "Antimycin A",
              "Cyanide",
              "Oligomycin",
            ]}
            value={block}
            onChange={setBlock}
          />
          {block !== "None" && (
            <p className="visual-caption">
              {block === "Rotenone"
                ? "NADH entry is blocked; electron entry via complex II can bypass complex I."
                : block === "Oligomycin"
                  ? "Fo proton return is blocked, reducing ATP synthesis and slowing electron flow."
                  : "Downstream electron flow and oxidative ATP formation are impaired."}
            </p>
          )}
        </>
      )}
      <p className="visual-caption">
        Select a step to reveal its mechanism · qualitative pathway schematic
      </p>
    </div>
  );
}
const cycleNodes = [
  ["Citrate", "Citrate synthase: acetyl-CoA + oxaloacetate form citrate."],
  ["Isocitrate", "Aconitase rearranges citrate via cis-aconitate."],
  ["α-Ketoglutarate", "Isocitrate dehydrogenase produces NADH and CO₂."],
  ["Succinyl-CoA", "α-Ketoglutarate dehydrogenase produces NADH and CO₂."],
  ["Succinate", "Succinyl-CoA synthetase produces GTP (or ATP by isoform)."],
  ["Fumarate", "Succinate dehydrogenase transfers electrons via FAD into Q."],
  ["Malate", "Fumarase adds water to fumarate."],
  [
    "Oxaloacetate",
    "Malate dehydrogenase produces NADH and regenerates oxaloacetate.",
  ],
];
function Cycle() {
  const [active, setActive] = useState(0);
  return (
    <div className="cycle-visual">
      <div className="cycle-map">
        <svg
          viewBox="0 0 600 460"
          role="img"
          aria-label="Eight steps of the citric acid cycle"
        >
          <circle
            cx="300"
            cy="225"
            r="155"
            stroke="#d4dfe1"
            fill="none"
            strokeWidth="2"
            strokeDasharray="5 7"
          />
          {cycleNodes.map(([name], i) => {
            let a = (i * Math.PI) / 4 - Math.PI / 2,
              x = 300 + Math.cos(a) * 175,
              y = 225 + Math.sin(a) * 165;
            return (
              <g
                key={name}
                tabIndex="0"
                role="button"
                aria-label={name}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                onKeyDown={(e) => e.key === "Enter" && setActive(i)}
                className="cycle-node"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={active === i ? 24 : 19}
                  fill={active === i ? "var(--accent)" : "#e7eeec"}
                />
                <text
                  x={x}
                  y={y + 6}
                  textAnchor="middle"
                  fill={active === i ? "white" : "#43585f"}
                >
                  {i + 1}
                </text>
                <text
                  x={x}
                  y={y + (i === 4 ? 44 : -34)}
                  textAnchor="middle"
                  className="cycle-label"
                >
                  {name}
                </text>
              </g>
            );
          })}
          <text x="300" y="208" textAnchor="middle" className="cycle-center">
            TCA
          </text>
          <text x="300" y="241" textAnchor="middle">
            Mitochondrial matrix*
          </text>
          <text x="300" y="278" textAnchor="middle" fill="var(--accent)">
            3 NADH · 1 FADH₂ · 1 GTP
          </text>
        </svg>
      </div>
      <div className="cycle-detail">
        <b>{cycleNodes[active][0]}</b>
        <span>{cycleNodes[active][1]}</span>
      </div>
      <p className="visual-caption">
        Yield per acetyl-CoA · *Succinate dehydrogenase lies in the inner
        membrane
      </p>
    </div>
  );
}
function Diagram({ slide }) {
  const [active, setActive] = useState(-1);
  return (
    <div className="diagram-visual">
      <div
        className={`diagram-nodes ${slide.flow === false ? "independent" : ""}`}
      >
        {(slide.nodes || []).map((n, i) => (
          <React.Fragment key={n}>
            <button
              className={`diagram-node ${active === i ? "active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(active === i ? -1 : i)}
            >
              <span className="diagram-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              {n.split("\n").map((line, j) => (
                <span key={j} className={j ? "node-subtitle" : ""}>
                  {line}
                </span>
              ))}
              {slide.flow !== false && i < slide.nodes.length - 1 && (
                <ArrowRight className="diagram-arrow" />
              )}
            </button>
          </React.Fragment>
        ))}
      </div>
      {slide.feedback && (
        <div className="feedback-loop">
          <span />
          Feedback to an early regulatory step
          <ArrowLeft />
        </div>
      )}
      <div className="diagram-context">
        <Info />
        <p>
          {active < 0
            ? "Select any element to bring the explanation into focus."
            : slide.notes}
        </p>
      </div>
    </div>
  );
}
function Charge() {
  const [ph, setPh] = useState(6);
  const state = ph < 2.4 ? "Cation" : ph > 9.6 ? "Anion" : "Zwitterion";
  return (
    <div className="charge-visual">
      <div className="charge-model">
        <div className="charge-group amino">{ph > 9.6 ? "NH₂" : "NH₃⁺"}</div>
        <div className="charge-center">Cα</div>
        <div className="charge-group carboxyl">
          {ph < 2.4 ? "COOH" : "COO⁻"}
        </div>
        <div className="charge-h">H / R</div>
      </div>
      <div className="charge-state">
        <b>{state}</b>
        <span>
          Predominant form for an amino acid without an ionizable side chain
        </span>
      </div>
      <label className="ph-slider">
        pH <strong>{ph.toFixed(1)}</strong>
        <input
          aria-label="Solution pH"
          type="range"
          min="0"
          max="14"
          step=".1"
          value={ph}
          onChange={(e) => setPh(+e.target.value)}
        />
        <div>
          <span>Acidic</span>
          <span>Neutral</span>
          <span>Basic</span>
        </div>
      </label>
      <p className="visual-caption">
        Illustrative pKa values 2.4 and 9.6 · side chains change titration
        behavior
      </p>
    </div>
  );
}
function Isomers() {
  const [mode, setMode] = useState("Glucose");
  const flips = mode === "Mannose" ? [2] : mode === "Galactose" ? [4] : [];
  return (
    <div className="isomer-visual">
      <Toggle
        values={["Glucose", "Mannose", "Galactose"]}
        value={mode}
        onChange={setMode}
      />
      <svg
        viewBox="0 0 640 380"
        role="img"
        aria-label={`Fischer projection schematic of D-${mode.toLowerCase()}`}
      >
        <text x="320" y="42" textAnchor="middle">
          CHO
        </text>
        <line
          x1="320"
          y1="53"
          x2="320"
          y2="320"
          stroke="#8da1a6"
          strokeWidth="3"
        />
        {[2, 3, 4, 5].map((n, i) => {
          let right = n !== 3;
          if (flips.includes(n)) right = !right;
          let y = 95 + i * 63;
          return (
            <g key={n}>
              <line
                x1="220"
                x2="420"
                y1={y}
                y2={y}
                stroke="#a3b1b7"
                strokeWidth="3"
              />
              <circle
                cx="320"
                cy={y}
                r="20"
                fill={flips.includes(n) ? "var(--accent)" : "#e3eaeb"}
              />
              <text
                x="320"
                y={y + 6}
                textAnchor="middle"
                fill={flips.includes(n) ? "white" : "#47606e"}
              >
                {n}
              </text>
              <text x="185" y={y + 7} textAnchor="middle">
                {right ? "H" : "OH"}
              </text>
              <text x="455" y={y + 7} textAnchor="middle">
                {right ? "OH" : "H"}
              </text>
            </g>
          );
        })}
        <text x="320" y="353" textAnchor="middle">
          CH₂OH
        </text>
      </svg>
      <p className="isomer-caption">
        {mode === "Glucose"
          ? "D-glucose reference configuration"
          : `${mode} differs from glucose at C${mode === "Mannose" ? 2 : 4}`}
      </p>
    </div>
  );
}
function Balance({ slide }) {
  const [reveal, setReveal] = useState(true);
  return (
    <div className="balance-visual">
      <div className="balance-bars">
        {slide.values.map(([name, value], i) => (
          <div className="balance-row" key={name}>
            <label>{name}</label>
            <div>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: reveal ? 1 : 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                style={{
                  width: `${(Math.abs(value) / Math.max(...slide.values.map((x) => Math.abs(x[1])))) * 90}%`,
                  background: value < 0 ? "#c68677" : "var(--accent)",
                }}
              />
            </div>
            <b>{reveal ? value : "?"}</b>
          </div>
        ))}
      </div>
      <button className="pill-button" onClick={() => setReveal(!reveal)}>
        {reveal ? "Hide yields for audience recall" : "Reveal yields"}
      </button>
      <p className="visual-caption">
        Teaching values ·{" "}
        {slide.values.length === 2
          ? "approximate conventional ATP equivalents"
          : "per glucose molecule"}
      </p>
    </div>
  );
}
const labPatterns = {
  "Iron deficiency": {
    MCV: "↓",
    Ferritin: "↓",
    TIBC: "↑",
    Homocysteine: "Usually normal",
    MMA: "Usually normal",
  },
  "B12 deficiency": {
    MCV: "Often ↑",
    Ferritin: "Variable",
    TIBC: "Variable",
    Homocysteine: "↑",
    MMA: "↑",
  },
  "Folate deficiency": {
    MCV: "Often ↑",
    Ferritin: "Variable",
    TIBC: "Variable",
    Homocysteine: "↑",
    MMA: "Usually normal",
  },
};
function Labs({ slide }) {
  const [mode, setMode] = useState(slide.mode || "Iron deficiency");
  return (
    <div className="lab-visual">
      <Toggle
        values={Object.keys(labPatterns)}
        value={mode}
        onChange={setMode}
      />
      <div className="lab-grid">
        {Object.entries(labPatterns[mode]).map(([k, val]) => (
          <motion.div layout key={k}>
            <span>{k === "MMA" ? "Methylmalonic acid" : k}</span>
            <b className={val.includes("↑") ? "up" : ""}>{val}</b>
          </motion.div>
        ))}
      </div>
      <p className="visual-caption">
        Typical patterns, not diagnostic rules · mixed deficiencies and
        inflammation can alter results
      </p>
    </div>
  );
}
function Hormone() {
  const [state, setState] = useState("Fed / insulin");
  const fed = state === "Fed / insulin";
  return (
    <div className="hormone-visual">
      <Toggle
        values={[
          "Fed / insulin",
          "Fasting / glucagon",
          "Exercise / epinephrine",
        ]}
        value={state}
        onChange={setState}
      />
      <div className="switch-diagram">
        <div className={fed ? "lit" : ""}>
          Glycogen synthase<b>{fed ? "ACTIVE" : "LESS ACTIVE"}</b>
          <span>{fed ? "Dephosphorylated" : "Phosphorylated"}</span>
        </div>
        <div className="switch-center">GLYCOGEN</div>
        <div className={!fed ? "lit" : ""}>
          Glycogen phosphorylase<b>{fed ? "LESS ACTIVE" : "ACTIVE"}</b>
          <span>{fed ? "Dephosphorylated" : "Phosphorylated"}</span>
        </div>
      </div>
      <p className="hormone-outcome">
        {fed
          ? "Glucose storage increases"
          : state === "Fasting / glucagon"
            ? "Liver glycogen supports blood glucose"
            : "Glycogen mobilization supports energy demand"}
      </p>
      <p className="visual-caption">
        Hormonal schematic · glucagon acts on liver, not directly on skeletal
        muscle
      </p>
    </div>
  );
}
const diseases = [
  [
    "Von Gierke",
    "Glucose-6-phosphatase",
    "Severe fasting hypoglycemia, hepatomegaly",
  ],
  [
    "Pompe",
    "Lysosomal acid α-glucosidase",
    "Cardiomyopathy and muscle weakness",
  ],
  ["Cori", "Debranching enzyme", "Abnormal glycogen, hepatomegaly"],
  [
    "McArdle",
    "Muscle glycogen phosphorylase",
    "Exercise intolerance, little lactate rise",
  ],
  ["Hers", "Liver glycogen phosphorylase", "Hepatomegaly, milder hypoglycemia"],
];
function Diseases() {
  const [i, setI] = useState(0);
  return (
    <div className="disease-visual">
      <Toggle
        values={diseases.map((d) => d[0])}
        value={diseases[i][0]}
        onChange={(x) => setI(diseases.findIndex((d) => d[0] === x))}
      />
      <div className="disease-detail">
        <span>DEFICIENT ENZYME</span>
        <h3>{diseases[i][1]}</h3>
        <div className="disease-rule" />
        <span>MECHANISM TO PHENOTYPE</span>
        <p>{diseases[i][2]}</p>
      </div>
    </div>
  );
}
function Energy() {
  const [enzyme, setEnzyme] = useState(true);
  return (
    <div className="energy-visual">
      <Toggle
        values={["Uncatalyzed", "Enzyme catalysis"]}
        value={enzyme ? "Enzyme catalysis" : "Uncatalyzed"}
        onChange={(x) => setEnzyme(x === "Enzyme catalysis")}
      />
      <svg
        viewBox="0 0 650 400"
        role="img"
        aria-label="Conceptual energy barrier lowered by enzyme without changing reaction delta G"
      >
        <path
          d="M80 40 V330 H600"
          fill="none"
          stroke="#748990"
          strokeWidth="2"
        />
        <path
          d="M85 270 C180 270 180 65 320 65 S430 300 590 300"
          fill="none"
          stroke="#9eaeb5"
          strokeDasharray="6 6"
          strokeWidth="4"
        />
        {enzyme && (
          <motion.path
            d="M85 270 C180 270 200 180 320 180 S440 300 590 300"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />
        )}
        <text x="320" y={enzyme ? 155 : 42} textAnchor="middle">
          {enzyme ? "Lower activation energy" : "Higher activation energy"}
        </text>
        <text x="110" y="305">
          Reactants
        </text>
        <text x="505" y="325">
          Products
        </text>
        <text x="320" y="375" textAnchor="middle">
          Reaction progress
        </text>
        <text transform="translate(30 190) rotate(-90)" textAnchor="middle">
          Free energy
        </text>
      </svg>
      <p className="visual-caption">
        Conceptual profile · ΔG and equilibrium are unchanged
      </p>
    </div>
  );
}
const residues = {
  Nonpolar: [
    ["Glycine", "Gly", "G"],
    ["Alanine", "Ala", "A"],
    ["Valine", "Val", "V"],
    ["Leucine", "Leu", "L"],
    ["Isoleucine", "Ile", "I"],
    ["Methionine", "Met", "M"],
    ["Proline", "Pro", "P"],
  ],
  Aromatic: [
    ["Phenylalanine", "Phe", "F"],
    ["Tyrosine", "Tyr", "Y"],
    ["Tryptophan", "Trp", "W"],
  ],
  "Polar uncharged": [
    ["Serine", "Ser", "S"],
    ["Threonine", "Thr", "T"],
    ["Cysteine", "Cys", "C"],
    ["Asparagine", "Asn", "N"],
    ["Glutamine", "Gln", "Q"],
  ],
  Acidic: [
    ["Aspartate", "Asp", "D"],
    ["Glutamate", "Glu", "E"],
  ],
  Basic: [
    ["Lysine", "Lys", "K"],
    ["Arginine", "Arg", "R"],
    ["Histidine", "His", "H"],
  ],
};
const essential = new Set([
  "His",
  "Ile",
  "Leu",
  "Lys",
  "Met",
  "Phe",
  "Thr",
  "Trp",
  "Val",
]);
function AminoExplorer() {
  const [group, setGroup] = useState("Nonpolar"),
    [selected, setSelected] = useState(null);
  return (
    <div className="amino-explorer">
      <div className="visual-heading">
        <span>The 20 standard amino acids</span>
        <span>Explore by side chain</span>
      </div>
      <Toggle
        values={Object.keys(residues)}
        value={group}
        onChange={(x) => {
          setGroup(x);
          setSelected(null);
        }}
      />
      <div className="residue-grid">
        {residues[group].map(([name, code, letter]) => (
          <button
            className={selected === code ? "selected" : ""}
            key={code}
            onClick={() => setSelected(code)}
          >
            <b>{letter}</b>
            <span>{name}</span>
            <small>
              {code}
              {essential.has(code) ? " · Essential" : ""}
            </small>
          </button>
        ))}
      </div>
      <p className="residue-detail">
        {selected
          ? `${selected}: ${essential.has(selected) ? "one of the nine adult dietary essential amino acids." : "not one of the nine adult dietary essential amino acids; requirements can become conditional in specific settings."}`
          : group === "Aromatic"
            ? "Aromatic describes ring structure. Tyrosine also contains a polar hydroxyl group."
            : "Select a residue to inspect its dietary classification."}
      </p>
      <p className="visual-caption">
        Structural and dietary categories describe different properties ·
        National Academies reference in explanation
      </p>
    </div>
  );
}
export default function Visual({ slide, paused }) {
  const key = slide.visual;
  return (
    <div className="visual-content">
      {key === "molecule" ? (
        <Suspense
          fallback={
            <div className="loading-model">Preparing molecular view…</div>
          }
        >
          <MolecularScene
            model={slide.model}
            uncoupled={slide.uncoupled}
            paused={paused}
          />
        </Suspense>
      ) : key === "kinetics" ? (
        <Kinetics slide={slide} />
      ) : key === "pathway" ? (
        <Pathway slide={slide} paused={paused} />
      ) : key === "cycle" ? (
        <Cycle />
      ) : key === "charge" ? (
        <Charge />
      ) : key === "isomers" ? (
        <Isomers />
      ) : key === "balance" ? (
        <Balance slide={slide} />
      ) : key === "labs" ? (
        <Labs slide={slide} />
      ) : key === "hormone" ? (
        <Hormone />
      ) : key === "diseases" ? (
        <Diseases />
      ) : key === "aminoExplorer" ? (
        <AminoExplorer />
      ) : key === "energy" ? (
        <Energy />
      ) : (
        <Diagram slide={slide} />
      )}
    </div>
  );
}
