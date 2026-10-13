import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { respiratoryState } from "./physiology";

const C = {
  membrane: "#718da8",
  I: "#aa9cfa",
  II: "#e89fc9",
  III: "#69c7ee",
  IV: "#74dfc3",
  V: "#f4cb76",
  electron: "#70edee",
  proton: "#ff82ac",
};
const positions = { I: -9, II: -4.9, III: -0.7, IV: 3.8, V: 10.2 };
const entries = [
  ["I", [-9, 2.15, 0], "Complex I"],
  ["II", [-4.9, -2.1, 0.3], "Complex II"],
  ["III", [-0.7, 2.4, 0], "Complex III"],
  ["IV", [3.8, 2.3, 0], "Complex IV"],
  ["V", [10.2, -3.9, 0], "ATP synthase"],
  ["Q", [-3, 0.15, 1.25], "Coenzyme Q"],
  ["cytc", [1.5, 3.3, 0.3], "Cytochrome c"],
];
const annotations = [
  ["nadh", [-9, -3.9, 0.4]],
  ["succinate", [-4.9, -2.9, 0.4]],
  ["water", [5, -2.7, 1.4]],
];

export default function RespirationModel({
  step,
  condition,
  entry,
  paused,
  onSelect,
}) {
  const host = useRef(),
    labelRefs = useRef({}),
    hoverTimer = useRef(),
    settings = useRef({ step, condition, entry, paused });
  const [failed, setFailed] = useState(false);
  settings.current = { step, condition, entry, paused };
  useEffect(() => {
    const container = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.prepend(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive schematic of the mitochondrial inner membrane and respiratory complexes",
    );
    renderer.domElement.setAttribute("role", "img");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 160);
    camera.position.set(1, 9, 42);
    scene.add(new THREE.HemisphereLight("#dbe9ff", "#20243b", 1.8));
    const key = new THREE.DirectionalLight("#edf7ff", 3.5);
    key.position.set(-12, 16, 22);
    scene.add(key);
    const rim = new THREE.DirectionalLight("#83b0ff", 3);
    rim.position.set(12, 6, -14);
    scene.add(rim);
    const warm = new THREE.PointLight("#ffc683", 100, 32);
    warm.position.set(11, -2, 7);
    scene.add(warm);
    const membrane = new THREE.Group();
    scene.add(membrane);
    const mat = (color, extra = {}) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.36,
        metalness: 0.12,
        ...extra,
      });
    const sphere = new THREE.SphereGeometry(1, 24, 16);
    const add = (
      parent,
      geometry,
      material,
      pos = [0, 0, 0],
      scale = [1, 1, 1],
    ) => {
      const m = new THREE.Mesh(geometry, material);
      m.position.set(...pos);
      m.scale.set(...scale);
      parent.add(m);
      return m;
    };
    const tube = (parent, points, radius, material) =>
      add(
        parent,
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(
            points.map((p) => new THREE.Vector3(...p)),
          ),
          48,
          radius,
          8,
          false,
        ),
        material,
      );
    // The lipid bilayer uses instancing: two head layers and paired hydrocarbon tails.
    const coords = [];
    for (let ix = 0; ix < 68; ix++)
      for (let iz = 0; iz < 9; iz++) {
        const x = -13.8 + ix * 0.415,
          z = -1.8 + iz * 0.43;
        if (Object.values(positions).some((px) => Math.abs(x - px) < 1.32))
          continue;
        coords.push([x, z]);
      }
    function bilayer(points) {
      const group = new THREE.Group();
      const heads = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.17, 10, 8),
        mat(C.membrane, { metalness: 0.3, roughness: 0.45 }),
        points.length * 2,
      );
      const tails = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.035, 0.035, 1.05, 5),
        mat("#3b516b", { roughness: 0.85 }),
        points.length * 4,
      );
      const dummy = new THREE.Object3D();
      let hi = 0,
        ti = 0;
      points.forEach(([x, z]) => {
        [-1, 1].forEach((side) => {
          dummy.position.set(x, side * 0.8, z);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          heads.setMatrixAt(hi++, dummy.matrix);
          [-0.06, 0.06].forEach((dx) => {
            dummy.position.set(x + dx, side * 0.3, z);
            dummy.rotation.z = dx * 1.1;
            dummy.updateMatrix();
            tails.setMatrixAt(ti++, dummy.matrix);
          });
        });
      });
      group.add(heads, tails);
      membrane.add(group);
      return group;
    }
    const wholeBilayer = bilayer(coords),
      closeCoords = [];
    for (let ix = 0; ix < 18; ix++)
      for (let iz = 0; iz < 9; iz++) {
        const x = 6.6 + ix * 0.415;
        if (Math.abs(x - positions.V) > 1.15)
          closeCoords.push([x, -1.8 + iz * 0.43]);
      }
    const motorBilayer = bilayer(closeCoords);
    const proteins = {};
    function lobe(parent, color, pos, scale, seed = 0) {
      const geo = new THREE.SphereGeometry(1, 36, 26),
        a = geo.attributes.position;
      for (let i = 0; i < a.count; i++) {
        const x = a.getX(i),
          y = a.getY(i),
          z = a.getZ(i);
        const bump =
          1 +
          0.045 *
            Math.sin(x * 17 + seed) *
            Math.cos(y * 15) *
            Math.sin(z * 12 + seed);
        a.setXYZ(i, x * bump, y * bump, z * bump);
      }
      geo.computeVertexNormals();
      return add(parent, geo, mat(color), pos, scale);
    }
    function protein(id) {
      const g = new THREE.Group();
      g.position.x = positions[id];
      membrane.add(g);
      proteins[id] = g;
      return g;
    }
    const one = protein("I");
    lobe(one, C.I, [0, -0.15, 0], [1.5, 0.85, 0.9]);
    lobe(one, C.I, [-0.75, -1.6, 0.05], [0.8, 1.4, 0.8]);
    lobe(one, "#c3b8ff", [-0.45, -2.6, 0.1], [0.72, 0.7, 0.65]);
    const two = protein("II");
    lobe(two, C.II, [0, -0.1, 0], [0.66, 0.76, 0.65]);
    lobe(two, C.II, [0.1, -1.1, 0], [0.95, 0.85, 0.85]);
    const three = protein("III");
    [-0.63, 0.63].forEach((x, i) => {
      lobe(three, C.III, [x, 0, 0], [0.65, 1.65, 0.8], i);
      lobe(three, "#a2e3ff", [x, 1.1, 0], [0.55, 0.65, 0.65], i + 1);
    });
    const four = protein("IV");
    lobe(four, C.IV, [0, 0, 0], [0.88, 1.5, 0.85]);
    lobe(four, "#a4ebcd", [0.6, 0.1, 0.1], [0.55, 1.1, 0.6]);
    const five = protein("V");
    const rotor = new THREE.Group();
    five.add(rotor);
    for (let i = 0; i < 10; i++) {
      const t = (i * Math.PI * 2) / 10;
      lobe(
        rotor,
        C.V,
        [Math.cos(t) * 0.66, 0, Math.sin(t) * 0.66],
        [0.24, 0.7, 0.24],
        i,
      );
    }
    const shaft = add(
      rotor,
      new THREE.CylinderGeometry(0.12, 0.16, 2.65, 16),
      mat("#fce3a5"),
      [0, -1.45, 0],
    );
    shaft.rotation.z = 0.045;
    for (let i = 0; i < 6; i++) {
      const t = (i * Math.PI) / 3;
      lobe(
        five,
        i % 2 ? "#ffe1a3" : "#d9aa55",
        [Math.cos(t) * 0.64, -2.8, Math.sin(t) * 0.64],
        [0.55, 0.75, 0.52],
        i,
      );
    }
    lobe(five, "#a29ef6", [1, 0, 0], [0.4, 0.7, 0.6]);
    tube(
      five,
      [
        [1, 0, 0.4],
        [1.15, -1.5, 0.4],
        [1, -2.45, 0.3],
        [0.65, -3, 0.3],
      ],
      0.09,
      mat("#aaa5fa"),
    );
    // Fine helical ridges add structural legibility without claiming atomic accuracy.
    Object.entries(proteins).forEach(([id, g]) => {
      for (let h = 0; h < (id === "V" ? 0 : 4); h++) {
        const pts = Array.from({ length: 52 }, (_, i) => {
          const t = i / 51;
          return [
            (h - 1.5) * 0.24 + 0.09 * Math.cos(t * 8 * Math.PI),
            -0.8 + t * 1.6,
            0.75 + 0.09 * Math.sin(t * 8 * Math.PI),
          ];
        });
        tube(
          g,
          pts,
          0.025,
          mat("#e4f4ff", { transparent: true, opacity: 0.38 }),
        );
      }
    });
    const q = add(
      membrane,
      sphere,
      mat("#f2cb75", { emissive: "#8a5c15", emissiveIntensity: 0.5 }),
      [-3, 0.1, 1.25],
      [0.25, 0.25, 0.25],
    );
    const cytc = add(
      membrane,
      sphere,
      mat("#e9a9cf"),
      [1.5, 1.85, 0.3],
      [0.3, 0.3, 0.3],
    );
    const curve = (points) =>
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const paths = [
      {
        from: "I",
        to: "Q",
        c: curve([
          [-9, -3.6, 0.3],
          [-9, -1, 0.8],
          [-7, 0.1, 1.3],
          [-3, 0.1, 1.3],
        ]),
      },
      {
        from: "II",
        to: "Q",
        c: curve([
          [-4.9, -2.8, 0.3],
          [-4.9, -1, 1],
          [-3, 0.1, 1.3],
        ]),
      },
      {
        from: "Q",
        to: "III",
        c: curve([
          [-3, 0.1, 1.3],
          [-2, 0.25, 1.35],
          [-0.7, 0.4, 1.25],
        ]),
      },
      {
        from: "III",
        to: "IV",
        c: curve([
          [-0.7, 0.6, 1.3],
          [-0.5, 1.9, 0.6],
          [1.5, 1.85, 0.3],
          [3.8, 0.6, 1.1],
        ]),
      },
      {
        from: "IV",
        to: "water",
        c: curve([
          [3.8, 0.6, 1.1],
          [4, -1.2, 1.3],
          [5.2, -2.3, 1.4],
        ]),
      },
    ];
    const tracks = paths.map((p) =>
      add(
        membrane,
        new THREE.TubeGeometry(p.c, 48, 0.022, 5, false),
        mat(C.electron, {
          transparent: true,
          opacity: 0.2,
          emissive: C.electron,
          emissiveIntensity: 0.4,
        }),
      ),
    );
    const eMaterial = mat(C.electron, {
      emissive: C.electron,
      emissiveIntensity: 2,
    });
    const electrons = paths.flatMap((p, j) =>
      [0, 1, 2].map((i) => ({
        m: add(membrane, sphere, eMaterial, [0, 0, 0], [0.115, 0.115, 0.115]),
        path: p,
        j,
        phase: i / 3,
      })),
    );
    const pMaterial = mat(C.proton, {
      emissive: C.proton,
      emissiveIntensity: 1.1,
    });
    const pumps = ["I", "III", "IV"].flatMap((id, j) =>
      Array.from({ length: 4 }, (_, i) => ({
        id,
        m: add(membrane, sphere, pMaterial, [0, 0, 0], [0.13, 0.13, 0.13]),
        phase: i / 4 + j * 0.1,
      })),
    );
    const cloud = Array.from({ length: 42 }, (_, i) => ({
      m: add(membrane, sphere, pMaterial, [0, 0, 0], [0.095, 0.095, 0.095]),
      x: -11 + ((i * 1.713) % 24),
      y: 2.6 + ((i * 0.329) % 1.4),
      z: -1.5 + ((i * 0.719) % 3),
      i,
    }));
    const returns = Array.from({ length: 5 }, (_, i) => ({
      m: add(membrane, sphere, pMaterial, [0, 0, 0], [0.13, 0.13, 0.13]),
      phase: i / 5,
    }));
    const leaks = Array.from({ length: 7 }, (_, i) => ({
      m: add(membrane, sphere, pMaterial, [0, 0, 0], [0.13, 0.13, 0.13]),
      phase: i / 7,
    }));
    const atps = Array.from({ length: 3 }, (_, i) => ({
      m: add(
        membrane,
        sphere,
        mat(C.V, { emissive: C.V, emissiveIntensity: 0.7 }),
        [0, 0, 0],
        [0.19, 0.19, 0.19],
      ),
      phase: i / 3,
    }));

    // Opening: a cutaway mitochondrial envelope with folded inner membrane.
    const mito = new THREE.Group();
    scene.add(mito);
    mito.position.set(7, 0.5, 0);
    mito.rotation.z = -0.16;
    mito.scale.setScalar(0.94);
    const outline = [];
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      outline.push([8 * Math.cos(t), 3.5 * Math.sin(t), 0.1]);
    }
    tube(
      mito,
      outline,
      0.12,
      mat("#a5c6ed", { emissive: "#364a75", emissiveIntensity: 0.35 }),
    );
    tube(
      mito,
      outline.map(([x, y, z]) => [x * 0.96, y * 0.91, z - 0.3]),
      0.055,
      mat("#e3c8ad"),
    );
    const body = add(
      mito,
      new THREE.SphereGeometry(1, 64, 36, 0, Math.PI * 2, 0, Math.PI),
      mat("#375c85", {
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      [0, 0, -0.5],
      [8, 3.5, 2],
    );
    for (let i = 0; i < 11; i++) {
      const x = -6.7 + i * 1.33,
        extent = 2.8 * Math.sqrt(1 - (x / 8) ** 2);
      const pts = [
        [x - 0.42, extent, 0],
        [x + 0.1, extent * 0.78, 0.2],
        [x - 0.15, -extent * 0.68, 0.5],
        [x + 0.3, -extent * 0.87, 0.35],
        [x + 0.5, extent * 0.68, 0.15],
      ];
      tube(
        mito,
        pts,
        0.11,
        mat("#d7b497", {
          metalness: 0.2,
          emissive: "#493022",
          emissiveIntensity: 0.3,
        }),
      );
      tube(
        mito,
        pts.map(([a, b, c]) => [a + 0.11, b, c - 0.13]),
        0.045,
        mat("#f5d9b6"),
      );
    }
    const dots = Array.from({ length: 110 }, (_, i) => {
      const t = i * 2.39996,
        r = Math.sqrt((i + 0.5) / 110);
      return add(
        mito,
        sphere,
        mat("#91c7f1", { emissive: "#4381ac", emissiveIntensity: 0.7 }),
        [Math.cos(t) * r * 7.5, Math.sin(t) * r * 3, -0.15 + (i % 7) * 0.14],
        [0.025, 0.025, 0.025],
      );
    });
    const project = new THREE.Vector3(),
      target = new THREE.Vector3(),
      camTarget = new THREE.Vector3();
    let width = 1,
      height = 1,
      frame,
      time = 0,
      last = performance.now();
    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = matchMedia("(max-width: 767px)");
    function loop(now) {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      const s = settings.current,
        status = respiratoryState(s.condition, s.entry),
        freeze = s.paused || reduce.matches;
      if (!freeze) time += dt;
      const hero = s.step === 0,
        close = s.step === 5;
      const destination = hero
        ? new THREE.Vector3(0, 2, 34)
        : close
          ? new THREE.Vector3(13, 3.5, 16)
          : new THREE.Vector3(
              0,
              7,
              narrow.matches ? 44 : s.step >= 6 ? 32 : 33,
            );
      const focus = hero
        ? new THREE.Vector3(0, 0, 0)
        : close
          ? new THREE.Vector3(10, -0.9, 0)
          : new THREE.Vector3(0, -0.3, 0);
      const a = 1 - Math.exp(-dt * 4.5);
      camera.position.lerp(destination, a);
      camTarget.lerp(focus, a);
      camera.lookAt(camTarget);
      mito.visible = hero;
      membrane.visible = !hero;
      wholeBilayer.visible = !close;
      motorBilayer.visible = close;
      mito.position.x = narrow.matches ? 0 : 7;
      mito.rotation.y = Math.sin(time * 0.18) * 0.055;
      const active = s.step >= 2;
      const pump = s.step >= 3;
      const synth = s.step >= 4;
      Object.entries(proteins).forEach(([id, g]) => {
        g.visible = !close || id === "V";
        const highlight = close
          ? id === "V"
          : s.step === 2
            ? s.entry === "NADH"
              ? id !== "II"
              : id !== "I"
            : true;
        g.traverse((o) => {
          if (
            o.isMesh &&
            o.material !== eMaterial &&
            o.material !== pMaterial
          ) {
            o.material.emissive.set(
              id === status.block
                ? "#e12c58"
                : highlight
                  ? "#000000"
                  : "#000000",
            );
            o.material.emissiveIntensity = id === status.block ? 0.4 : 0;
          }
        });
      });
      q.visible = !close;
      cytc.visible = !close;
      if (!freeze && synth) rotor.rotation.y += dt * status.synthesis * 2.8;
      electrons.forEach(({ m, path, j, phase }) => {
        const branch =
          (path.from !== "I" && path.from !== "II") ||
          path.from === (s.entry === "NADH" ? "I" : "II");
        m.visible = active && status.flow > 0 && branch && !close;
        m.position.copy(
          path.c.getPoint((time * 0.25 * status.flow + phase) % 1),
        );
        tracks[j].visible = active && branch && !close;
      });
      pumps.forEach(({ m, id, phase }) => {
        m.visible =
          pump &&
          status.flow > 0 &&
          (id !== "I" || s.entry === "NADH") &&
          !close;
        const t = (time * 0.4 * status.flow + phase) % 1;
        m.position.set(positions[id] + 0.25, -1.5 + t * 4.5, 1.05);
      });
      cloud.forEach(({ m, x, y, z, i }) => {
        m.visible = pump && i < Math.round(32 * status.gradient) && !close;
        m.position.set(
          x + Math.sin(time * 0.4 + i) * 0.18,
          y + Math.sin(time * 0.7 + i) * 0.1,
          z,
        );
      });
      returns.forEach(({ m, phase }) => {
        m.visible = synth && status.synthesis > 0;
        const t = (time * 0.36 * status.synthesis + phase) % 1;
        m.position.set(
          10.2 + 0.17 * Math.sin(t * Math.PI * 3),
          2.8 - t * 6,
          1.15,
        );
      });
      leaks.forEach(({ m, phase }) => {
        m.visible = s.condition === "Uncoupler";
        const t = (time * 0.55 + phase) % 1;
        m.position.set(7 + Math.sin(t * 7) * 0.18, 3 - t * 5, 1);
      });
      atps.forEach(({ m, phase }) => {
        const t = (time * 0.3 * status.synthesis + phase) % 1;
        m.visible = synth && status.synthesis > 0;
        m.position.set(10.8 + t * 2.2, -2.6 - t * 0.6, 1.4);
        m.scale.setScalar(0.16 * (1 - t * 0.45));
      });
      q.position.y = 0.12 + Math.sin(time * 0.9) * 0.035;
      cytc.position.x = 1.5 + Math.sin(time * 0.7) * 0.18;
      [...entries, ...annotations].forEach(([id, pos]) => {
        const el = labelRefs.current[id];
        if (!el) return;
        project.set(...pos);
        membrane.localToWorld(project);
        project.project(camera);
        el.style.transform = `translate(-50%,-50%) translate(${(project.x * 0.5 + 0.5) * width}px,${(-project.y * 0.5 + 0.5) * height}px)`;
        const annotation = annotations.some(([key]) => key === id);
        const hidden =
          hero ||
          (close && id !== "V") ||
          (annotation && !active) ||
          (id === "nadh" && s.entry !== "NADH") ||
          (id === "succinate" && s.entry !== "Succinate");
        el.style.opacity = hidden ? "0" : "1";
        el.style.pointerEvents = hidden || annotation ? "none" : "auto";
        el.setAttribute("aria-hidden", String(hidden));
        if (!annotation) el.tabIndex = hidden ? -1 : 0;
      });
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);
    return () => {
      clearTimeout(hoverTimer.current);
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      sphere.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="resp-model" ref={host}>
      {failed && (
        <div className="resp-webgl-fallback">
          The 3D scene needs WebGL. Enable hardware acceleration in your
          browser, then reload.
        </div>
      )}
      <div className="resp-model-labels">
        {entries.map(([id, , label]) => (
          <button
            key={id}
            ref={(el) => (labelRefs.current[id] = el)}
            className={"resp-model-label label-" + id}
            onClick={() => onSelect(id)}
            onPointerEnter={() => {
              clearTimeout(hoverTimer.current);
              hoverTimer.current = setTimeout(() => onSelect(id), 600);
            }}
            onPointerLeave={() => clearTimeout(hoverTimer.current)}
            aria-label={"Explain " + label}
          >
            {id === "V" ? "ATP synthase" : id === "cytc" ? "Cyt c" : id}
          </button>
        ))}
      </div>
      <div className="resp-annotations" aria-hidden="true">
        {annotations.map(([id]) => (
          <span
            key={id}
            ref={(el) => (labelRefs.current[id] = el)}
            className={"resp-annotation annotation-" + id}
          >
            {id === "nadh"
              ? "NADH"
              : id === "succinate"
                ? "Succinate"
                : "O₂ → H₂O"}
          </span>
        ))}
      </div>
    </div>
  );
}
