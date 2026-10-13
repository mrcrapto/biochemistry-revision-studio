import React, { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  Pause,
  Play,
  ArrowsOut,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
const palette = {
  C: "#4f6b79",
  N: "#638fdf",
  O: "#d87063",
  H: "#edf2f6",
  FE: "#dba85b",
};
const v = (p) => new T.Vector3(...p);
function sphere(parent, p, r, color) {
  const m = new T.Mesh(
    new T.SphereGeometry(r, 24, 16),
    new T.MeshStandardMaterial({ color, roughness: 0.27, metalness: 0.12 }),
  );
  m.position.copy(v(p));
  parent.add(m);
  return m;
}
function bond(parent, a, b, r = 0.09, color = "#9eafba") {
  const va = v(a),
    vb = v(b),
    d = vb.clone().sub(va);
  const m = new T.Mesh(
    new T.CylinderGeometry(r, r, d.length(), 12),
    new T.MeshStandardMaterial({ color, roughness: 0.42 }),
  );
  m.position.copy(va.add(vb).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  parent.add(m);
  return m;
}
function tube(parent, points, color, r = 0.12) {
  const m = new T.Mesh(
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map(v)),
      points.length * 5,
      r,
      8,
      false,
    ),
    new T.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.15 }),
  );
  parent.add(m);
  return m;
}
function glycine(g) {
  const atoms = [
    ["C", [0, 0, 0]],
    ["N", [-1.3, 0.7, 0.3]],
    ["C", [1.3, 0.7, -0.3]],
    ["O", [2.3, 0.15, -0.5]],
    ["O", [1.3, 2, -0.2]],
    ["H", [-0.05, -0.6, 1]],
    ["H", [-0.1, -0.7, -1]],
    ["H", [-2.1, 0.15, 0.5]],
    ["H", [-1.5, 1.5, 0.8]],
    ["H", [2, 2.5, -0.3]],
  ];
  atoms.forEach(([e, p]) => sphere(g, p, e === "H" ? 0.24 : 0.42, palette[e]));
  [
    [0, 1],
    [0, 2],
    [2, 3],
    [2, 4],
    [0, 5],
    [0, 6],
    [1, 7],
    [1, 8],
    [4, 9],
  ].forEach(([a, b]) => bond(g, atoms[a][1], atoms[b][1]));
}
function glucose(g) {
  const ring = Array.from({ length: 6 }, (_, i) => [
    Math.cos((i * Math.PI) / 3) * 1.6,
    Math.sin((i * Math.PI) / 3) * 1.6,
    i % 2 ? 0.15 : -0.15,
  ]);
  ring.forEach((p, i) => {
    sphere(g, p, 0.4, i === 5 ? palette.O : palette.C);
    bond(g, p, ring[(i + 1) % 6]);
    if (i < 4) {
      let q = [p[0] * 1.65, p[1] * 1.65, p[2] + (i % 2 ? 0.8 : -0.8)];
      sphere(g, q, 0.32, palette.O);
      bond(g, p, q);
    }
  });
  const q = [ring[4][0] - 0.6, ring[4][1] - 0.95, 0.5],
    o = [q[0] - 0.6, q[1] - 0.55, 0.8];
  sphere(g, q, 0.4, palette.C);
  bond(g, ring[4], q);
  sphere(g, o, 0.32, palette.O);
  bond(g, q, o);
}
function glycogen(g) {
  sphere(g, [0, 0, 0], 0.52, "#d4a65c");
  for (let arm = 0; arm < 7; arm++) {
    const a = (arm * Math.PI * 2) / 7;
    let prev = [0, 0, 0];
    for (let i = 1; i <= 7; i++) {
      const p = [
        Math.cos(a) * i * 0.48,
        Math.sin(a) * i * 0.48,
        Math.sin(i * 0.7 + arm) * 0.35,
      ];
      sphere(g, p, 0.18, "#70aaa5");
      bond(g, prev, p, 0.055);
      if (i === 3 || i === 5) {
        let bprev = p;
        for (let j = 1; j <= 3; j++) {
          const bp = [
            p[0] + Math.cos(a + 0.65) * j * 0.45,
            p[1] + Math.sin(a + 0.65) * j * 0.45,
            p[2] + j * 0.27,
          ];
          sphere(g, bp, 0.17, "#c2a260");
          bond(g, bprev, bp, 0.05);
          bprev = bp;
        }
      }
      prev = p;
    }
  }
}
function bilayer(g) {
  for (let x = -4; x <= 4; x++) {
    for (let z = -2; z <= 2; z++) {
      for (let side of [-1, 1]) {
        const p = [x * 0.72, side * 0.85, z * 0.7];
        sphere(g, p, 0.23, "#6faaa6");
        for (let k of [-1, 1])
          tube(
            g,
            [
              [p[0] + k * 0.08, side * 0.7, p[2]],
              [p[0] + k * 0.15, side * 0.3, p[2] + 0.1],
              [p[0] + k * 0.22, side * 0.08, p[2]],
              [p[0] + k * 0.26, -side * 0.2, p[2] - 0.1],
            ],
            "#b4c4d5",
            0.055,
          );
      }
    }
  }
  g.rotation.x = 0.3;
  g.rotation.z = 0.15;
}
function fatty(g, variant) {
  let prev = null;
  for (let i = 0; i < 16; i++) {
    const bend = variant === "Cis" && i > 7 ? (i - 7) * 0.37 : 0;
    const p = [(i - 7.5) * 0.43, Math.abs(i % 2) * 0.2 + bend, 0];
    sphere(g, p, 0.18, i === 0 ? "#d87063" : "#648595");
    if (prev) bond(g, prev, p, 0.07);
    prev = p;
  }
  sphere(g, [-3.6, 0.55, 0], 0.23, palette.O);
  bond(g, [-3.225, 0, 0], [-3.6, 0.55, 0]);
}
function lipoprotein(g) {
  sphere(g, [0, 0, 0], 1.75, "#d1b37d");
  for (let i = 0; i < 150; i++) {
    const y = 1 - (2 * (i + 0.5)) / 150,
      r = Math.sqrt(1 - y * y),
      a = i * 2.39996;
    const p = [r * Math.cos(a) * 1.85, y * 1.85, r * Math.sin(a) * 1.85];
    if (p[0] < 0.5 || p[2] < 0)
      sphere(g, p, 0.14, i % 9 === 0 ? "#517195" : "#78aaa7");
  }
  tube(
    g,
    Array.from({ length: 65 }, (_, i) => {
      const a = i * 0.12;
      return [2 * Math.cos(a), 0.5 * Math.sin(a * 2), 2 * Math.sin(a)];
    }),
    "#577eac",
    0.13,
  );
}
function etc(g, moving) {
  for (let x = -5; x <= 5; x++) {
    for (let z = -1; z <= 1; z++) {
      for (let y of [-0.4, 0.4]) {
        sphere(g, [x * 0.62, y, z * 0.7], 0.17, "#93b8b3");
        bond(
          g,
          [x * 0.62, y, z * 0.7],
          [x * 0.62, -y, z * 0.7],
          0.05,
          "#c9d2c8",
        );
      }
    }
  }
  [-2.8, -1.5, 0, 1.4].forEach((x, i) => {
    const m = sphere(
      g,
      [x, 0, 0],
      0.52,
      ["#658cbd", "#86a394", "#9b8ab6", "#ca9c6a"][i],
    );
    m.scale.set(0.75, 1.8, 0.85);
  });
  let rotor = new T.Group();
  rotor.position.set(2.8, 0.35, 0);
  g.add(rotor);
  sphere(rotor, [0, 0.9, 0], 0.65, "#618fb1");
  bond(rotor, [0, -0.5, 0], [0, 1, 0], 0.14, "#dbc69b");
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    sphere(
      rotor,
      [Math.cos(a) * 0.45, -0.45, Math.sin(a) * 0.45],
      0.16,
      "#c7ad7b",
    );
  }
  moving.push({ mesh: rotor, rotor: true });
  for (let i = 0; i < 14; i++) {
    let p = sphere(
      g,
      [((i % 7) - 3) * 0.8, 1.4 + (i % 2) * 0.3, ((i % 3) - 1) * 0.6],
      0.09,
      "#d2a65e",
    );
    moving.push({ mesh: p, proton: true, index: i });
  }
  g.rotation.x = 0.2;
}
async function pdbModel(g, kind, signal) {
  const res = await fetch(`${import.meta.env.BASE_URL}models/4hhb.pdb`, {
    signal,
  });
  if (!res.ok) throw Error("Coordinate file unavailable");
  const text = await res.text();
  const rows = text.split("\n");
  const chains = {};
  const heme = [];
  for (const l of rows) {
    if (l.startsWith("ATOM") && l.slice(12, 16).trim() === "CA") {
      const c = l[21];
      (chains[c] ??= []).push([
        +l.slice(30, 38),
        +l.slice(38, 46),
        +l.slice(46, 54),
      ]);
    }
    if (l.startsWith("HETATM") && l.slice(17, 20) === "HEM" && l[21] === "A")
      heme.push({
        p: [+l.slice(30, 38), +l.slice(38, 46), +l.slice(46, 54)],
        e: l.slice(76, 78).trim(),
      });
  }
  if (kind === "heme") {
    const center = heme.find((x) => x.e === "FE").p;
    const atoms = heme.map((x) => ({
      ...x,
      p: x.p.map((n, i) => (n - center[i]) * 0.45),
    }));
    atoms.forEach((x) =>
      sphere(g, x.p, x.e === "FE" ? 0.35 : 0.13, palette[x.e] || palette.C),
    );
    for (let i = 0; i < atoms.length; i++)
      for (let j = i + 1; j < atoms.length; j++) {
        const d = v(atoms[i].p).distanceTo(v(atoms[j].p));
        if (d < 0.84 && d > 0.3) bond(g, atoms[i].p, atoms[j].p, 0.055);
      }
    g.rotation.x = -0.3;
  } else {
    const all = Object.values(chains).flat();
    const center = [0, 1, 2].map(
      (i) => all.reduce((s, p) => s + p[i], 0) / all.length,
    );
    Object.entries(chains).forEach(([c, ps], i) => {
      let sub = new T.Group();
      sub.userData.chain = true;
      sub.userData.direction = v([i % 2 ? 1 : -1, i < 2 ? 1 : -1, 0]);
      tube(
        sub,
        ps.map((p) => p.map((n, j) => (n - center[j]) * 0.1)),
        ["#528ea4", "#bfa278", "#81aba5", "#6686ad"][i],
        0.065,
      );
      g.add(sub);
    });
    for (const l of rows.filter(
      (x) => x.startsWith("HETATM") && x.slice(12, 16).trim() === "FE",
    ))
      sphere(
        g,
        [+l.slice(30, 38), +l.slice(38, 46), +l.slice(46, 54)].map(
          (n, i) => (n - center[i]) * 0.1,
        ),
        0.2,
        "#c99850",
      );
  }
}
export default function MolecularScene({
  model = "protein",
  hero = false,
  uncoupled = false,
  paused = false,
}) {
  const ref = useRef();
  const api = useRef({});
  const [play, setPlay] = useState(true);
  const [explode, setExplode] = useState(false);
  const [variant, setVariant] = useState("Cis");
  const [error, setError] = useState("");
  const settings = useRef({ play: true, explode: false, paused: false });
  settings.current = { play, explode, paused };
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let renderer,
      frame,
      ownedScene,
      dead = false;
    const abort = new AbortController();
    const moving = [];
    let observer, controls;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = T.SRGBColorSpace;
      host.appendChild(renderer.domElement);
      const scene = new T.Scene(),
        camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 1, 12);
      ownedScene = scene;
      scene.add(new T.HemisphereLight("#ffffff", "#b9c8ce", 2.5));
      const light = new T.DirectionalLight("#ffffff", 3);
      light.position.set(4, 6, 5);
      scene.add(light);
      const rim = new T.DirectionalLight("#8bbacb", 2);
      rim.position.set(-4, -1, 3);
      scene.add(rim);
      const g = new T.Group();
      scene.add(g);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 5;
      controls.maxDistance = 18;
      controls.autoRotate = hero;
      controls.autoRotateSpeed = 0.5;
      api.current.reset = () => {
        controls.reset();
        g.rotation.set(0, 0, 0);
      };
      if (model === "protein" || model === "heme") {
        pdbModel(g, model, abort.signal).catch((e) => {
          if (!dead) {
            setError("3D coordinates unavailable. Reload to retry.");
            glycine(g);
          }
        });
      } else if (model === "glycine") glycine(g);
      else if (model === "glucose") glucose(g);
      else if (model === "glycogen") glycogen(g);
      else if (model === "bilayer") bilayer(g);
      else if (model === "fatty") fatty(g, variant);
      else if (model === "lipoprotein") lipoprotein(g);
      else etc(g, moving);
      const size = () => {
        const w = host.clientWidth,
          h = host.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      observer = new ResizeObserver(size);
      observer.observe(host);
      size();
      let time = 0;
      let previous = 0;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const animate = (now) => {
        if (dead) return;
        const s = settings.current,
          dt = Math.min((now - previous) / 1000, 0.05);
        previous = now;
        const active = s.play && !s.paused && !reduced;
        if (active) time += dt;
        controls.autoRotate = active;
        g.children.forEach((c) => {
          if (c.userData.chain)
            c.position
              .copy(c.userData.direction)
              .multiplyScalar(s.explode ? 1.3 : 0);
        });
        moving.forEach(({ mesh, rotor, proton, index }) => {
          if (rotor) mesh.rotation.y = time * (uncoupled ? 0.05 : 0.6);
          if (proton)
            mesh.position.y = uncoupled
              ? 1.6 - ((time * 0.5 + index * 0.15) % 2.5)
              : 1.3 + Math.sin(time + index) * 0.15;
        });
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      api.current.export = () => renderer.domElement.toDataURL();
    } catch (e) {
      setError(
        "WebGL is unavailable on this device. The chapter diagrams and notes remain accessible.",
      );
    }
    return () => {
      dead = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer?.disconnect();
      controls?.dispose();
      ownedScene?.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [model, hero, variant, uncoupled]);
  return (
    <div className={`molecular ${hero ? "hero-molecular" : ""}`}>
      <div
        ref={ref}
        className="webgl"
        role="img"
        aria-label={`Interactive ${model} 3D model. Drag to rotate and scroll to zoom.`}
      />
      {error && <div className="model-error">{error}</div>}
      {!hero && (
        <>
          <div className="model-toolbar">
            <button
              onClick={() => setPlay(!play)}
              aria-label={play ? "Pause rotation" : "Play rotation"}
            >
              {play ? <Pause /> : <Play />}
            </button>
            <button
              onClick={() => api.current.reset?.()}
              aria-label="Reset model view"
            >
              <ArrowCounterClockwise />
            </button>
            {model === "protein" && (
              <button
                className={explode ? "selected" : ""}
                onClick={() => setExplode(!explode)}
              >
                <ArrowsOut /> Subunits
              </button>
            )}
            {model === "fatty" && (
              <div className="segmented">
                {["Saturated", "Cis", "Trans"].map((x) => (
                  <button
                    key={x}
                    className={variant === x ? "selected" : ""}
                    onClick={() => setVariant(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="model-caption">
            {["protein", "heme"].includes(model)
              ? "RCSB PDB 4HHB · experimental coordinates"
              : "Educational schematic · not to scale"}
            <span>Drag to rotate · Scroll to zoom</span>
          </span>
        </>
      )}
    </div>
  );
}
