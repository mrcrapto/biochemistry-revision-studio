import fs from "node:fs";
import assert from "node:assert/strict";
import { chapters } from "../src/data/chapters.js";
import { parameters, velocity } from "../src/lib/kinetics.js";
const qs = JSON.parse(
  fs.readFileSync(new URL("../src/data/questions.json", import.meta.url)),
);
assert.equal(chapters.length, 11);
assert.equal(qs.length, 165);
assert.equal(new Set(qs.map((q) => q.id)).size, 165);
let pageCount = 0,
  sceneCount = 0;
for (const c of chapters) {
  pageCount += c.pages;
  sceneCount += c.slides.length;
  const cq = qs.filter((q) => q.chapter === c.id);
  assert.equal(cq.length, 15);
  for (const d of ["Recall", "Mechanism", "Application"])
    assert.equal(cq.filter((q) => q.difficulty === d).length, 5);
  for (let i = 1; i <= c.pages; i++)
    assert.ok(
      fs.existsSync(`public/originals/${c.id}/${i}.webp`),
      `Missing original ${c.id}/${i}`,
    );
  for (const s of c.slides) {
    assert.ok(s.page >= 1 && s.page <= c.pages);
    assert.ok(s.bullets.length <= 3);
    assert.ok(s.notes.length > 40);
    assert.ok(s.title.length < 100);
    for (const b of s.bullets) assert.ok(b.length < 100, `Long bullet: ${b}`);
  }
}
for (const q of qs) {
  const c = chapters.find((c) => c.id === q.chapter);
  assert.ok(c);
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options).size, 4);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3);
  assert.equal(q.source.file, c.file);
  assert.ok(q.source.page >= 1 && q.source.page <= c.pages);
  assert.equal(
    q.provenance,
    "Original practice question based on supplied lecture",
  );
  assert.ok(q.explanation.length > 40);
}
assert.equal(pageCount, 326);
assert.equal(sceneCount, 74);
assert.equal(velocity(3, 3, 10), 5);
assert.equal(velocity(3, 3, 10, 2), 5);
assert.equal(velocity(0, 3, 10), 0);
assert.deepEqual(parameters(3, 10, "Competitive", 2), { km: 9, vmax: 10 });
assert.deepEqual(parameters(3, 10, "Noncompetitive", 1), { km: 3, vmax: 5 });
assert.deepEqual(parameters(3, 10, "Uncompetitive", 1), { km: 1.5, vmax: 5 });
for (const mode of [
  "None",
  "Competitive",
  "Noncompetitive",
  "Mixed",
  "Uncompetitive",
])
  assert.deepEqual(parameters(3, 10, mode, 0), { km: 3, vmax: 10 });
assert.ok(velocity(20, 3, 10) > velocity(3, 3, 10));
const pdb = fs.readFileSync("public/models/4hhb.pdb", "utf8");
assert.ok(pdb.includes("4HHB"));
assert.equal(
  pdb
    .split("\n")
    .filter((l) => l.startsWith("ATOM") && l.slice(12, 16).trim() === "CA")
    .length,
  574,
);
console.log(
  `PASS: ${chapters.length} chapters, ${sceneCount} concise scenes, ${pageCount} preserved original pages, ${qs.length} sourced questions, 574 hemoglobin residues.`,
);
