# Biochemistry Revision Studio

A responsive academic revision website built from eleven supplied biochemistry lectures. It contains 74 concise teaching scenes, rotatable Three.js molecular views, live enzyme kinetic charts, selectable pathways, physiological control demonstrations, and 165 original MCQs with explanatory feedback and page citations.

## Present

Open the live site, enter a chapter, and click **Present** or press **P**. Keep the originating notes tab on your own screen and project/share the audience tab. Navigation and visual button/slider controls synchronize within that presentation session. Dragging 3D models changes the local view only. Use **F** for fullscreen, arrow keys to navigate, **N** for notes, **B** for blackout and **Escape** to close a panel/exit presentation. Browser pop-ups must be allowed for the audience tab. For Meet, share the audience tab; for Zoom, place the audience view on a visible screen and share its window.

Normal presentation surfaces use three brief bullets or fewer. Explanations, original slides and reference information are available on demand. Speaker notes can be edited and are saved in browser storage. Use a landscape 1920 × 1080 screen or larger for projection; mobile layouts support personal revision rather than lecture-hall projection.

## Practice

Filter by chapter or question level, choose a 20-question session, or review missed questions. All 165 questions are original lecture-based practice: **no authenticated official NU Oman past papers were found**. Questions are balanced at 15 per chapter and five per difficulty level. Progress stores locally and can be exported. First-attempt accuracy and question coverage are separate metrics. Scores are not validated proof of comprehensive mastery.

## Academic provenance

All 326 original slide layouts are preserved as readable WebP source views. The original PDF files remain in the local workspace and are excluded from Git. Original lecture text, illustrations and authorship remain attributable to their source documents; no university endorsement is implied. The redesigned explanatory graphics are new teaching schematics. The hemoglobin backbone and heme view use experimental RCSB PDB **4HHB** coordinates; subunit separation is an illustrative view manipulation, not a conformational simulation. Molecular schematics are not optimized atomic structures. Kinetic curves use declared hypothetical parameters. Clinical associations are for academic learning.

Read [the professor audit](audit/professor-research.md) for search methods, exact institutional links, source gaps and scientific corrections. In-app Sources lists the bibliographies and verified supplementary references. Some source slides contain outdated or oversimplified statements; the presentation corrects them openly. Four lectures lack a printed bibliography; their references are not invented.

## Develop and deploy

```sh
npm ci
npm run check
npm run dev
npm run build
```

React + Vite + Three.js + Motion, with locally bundled Geist fonts. The website is static; no database, account, API key, analytics or backend is needed. A GitHub Actions workflow validates, builds and deploys `dist/` to GitHub Pages on pushes to `main`. Relative build paths support project Pages URLs.

Source audit utilities require Python, PyMuPDF and Pillow. Original slide images and coordinates are committed so production builds do not require Python, OCR or downloads. `scripts/ocr.cjs` is a local extraction utility tied to the workspace's bundled Tesseract runtime, not part of the production build.

# New presentation direction: ETC preview

Open `?experience=etc` for an eight-scene, full-screen prototype of the redesigned presentation. It moves from a mitochondrial cutaway to the inner membrane, electron transfer, proton pumping, chemiosmotic coupling, an isolated ATP synthase view, a live inhibitor experiment and an understanding check. This prototype is a review checkpoint; the other ten chapters still use the existing studio presentation.

The models are original schematic teaching geometry. Electron entry, inhibitors, proton return, the rotor and ATP output respond to the controls; there is no decorative continuous camera rotation. Hover or click a complex label for its mechanism. Arrow keys navigate; O opens the overview, F requests fullscreen and B toggles a black screen. Motion pauses automatically for reduced-motion preferences. The original lecture pages remain available in the source dialog.

The experiment is qualitative, not a physiological rate model. It assumes oxygen, substrate and ADP are available and illustrates steady-state tendencies. In particular, succinate bypasses rotenone-sensitive complex I, oligomycin increases backpressure and slows electron flow, and an uncoupler lowers the gradient and oxidative ATP yield while permitting increased electron flow and heat release. Readout bars and particle counts are illustrative. Full-course MCQs remain accessible at `?practice=1`.
