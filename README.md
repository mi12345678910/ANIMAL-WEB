# Body Language Lab

An interactive 3D web app for learning to read animal body language. Pick a
behaviour, watch the model take the posture, and read what the signal means and
how to respond. Ships with the dog; cats and horses are registry entries away.

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run typecheck
```

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · React Three Fiber 9 + drei 10 ·
three 0.180 · Tailwind CSS 4 · Framer Motion · Zustand

## How the 3D actually works

The source model is a **static, unrigged mesh with no animations**. The `.blend`
alongside it, however, contains a 29-bone armature with the mesh fully skinned to
it (31 vertex groups, zero unweighted vertices) — but **no actions**. So there
were no animation clips to export.

Rather than hand-author clips, behaviours are driven **procedurally from bone
rotations** at runtime. That makes a new behaviour a data entry rather than a
Blender round-trip, which is what keeps the app modular.

### The rig

`tools/export_dog_rig.py` renames the armature's generic bones (`Bone.001` …) to
semantic names, renames the matching vertex groups, and exports with Draco
compression. It never writes to the `.blend`.

```bash
blender -b "../Untitled.blend" --python tools/export_dog_rig.py
```

Result: `public/models/dog.glb` — **3.4 MB**, down from 16 MB uncompressed. The
mesh is ~95% flat-shaded, so its vertices are fully unwelded (296k verts for 99k
triangles); Draco absorbs that without changing how the model looks.

Bone groups: `Spine`, `Head`, `Muzzle`, `Ear_L_01..03`, `Ear_R_01..03`,
`Tail_01..08`, `ForeLeg_{L,R}_01..02`, `HindLeg_{L,R}_01..03`.

### Local bone axes

Verified empirically by posing the rig in Blender and rendering the result — the
signs are not guessable from the bone data alone:

| Bone group | `+x` | `-x` | `+y` | `+z` |
|---|---|---|---|---|
| `Head` | nose up | nose down | turn away | head tilt (roll) |
| `Ear_*` | pinned back | perked forward | — | lateral splay |
| `Spine` | lean back / sit tall | lean forward | — | body sway |
| `Tail_*` | tuck under | raise | — | lateral swing (the wag) |

These transfer directly to three.js: local-space bone rotations are unaffected by
glTF's Z-up → Y-up conversion.

The model is **seated**, so every behaviour is a seated variant. A true play bow
or a walk cycle would need either new authored poses or a standing rig.

### The pose engine

`src/lib/poseEngine.ts` — `PoseMixer` keeps a stack of weighted behaviour layers.
Switching behaviour doesn't snap: the outgoing layer's weight decays while the
incoming one rises, and **both the static pose and the oscillators are mixed by
weight**, so a fast wag winds down as a tucked tail settles in. Idle breathing
runs underneath at all times.

Each behaviour contributes a `pose` (static euler deltas per bone) plus
`oscillators` (cyclic motion — the wag is a travelling wave down the eight tail
bones via `phaseStep`).

If a future model ships with real `AnimationClip`s, set `clip` on the behaviour:
`AnimalRig` plays the baked clip when the GLB contains it and falls back to the
procedural path otherwise. Both model types share one UI.

## Adding an animal

Nothing in `src/components` needs to change.

1. Drop a rigged model at `public/models/<id>.glb`.
2. Create `src/animals/<id>.ts` exporting an `Animal` (see `dog.ts`).
3. Add it to `ANIMALS` in `src/animals/registry.ts`.

An entry with `status: "coming-soon"` renders as a disabled selector option and
needs no model or behaviours — that's how Cat and Horse are wired today.

Per-species `accent` colour flows into every glass surface via a CSS variable.

## The chat panel

`POST /api/chat` → `{ message, animalId, behaviorId, history }`
→ `{ reply, sources[] }`

Retrieval sits behind the `Retriever` interface in `src/lib/rag.ts`:

- **`LocalRetriever`** (default) — IDF-weighted keyword search over the behaviour
  cards already in the registry, with light suffix stemming so "wagging" matches
  "wag". Useful with zero setup.
- **`VectorRetriever`** — the seam for the PDF vector database. Implement
  `retrieve()`, carry `title`/`page` through for citations, and set
  `RAG_BACKEND=vector`. Nothing else changes.

Answer generation:

- With `ANTHROPIC_API_KEY` set, retrieved chunks are passed to Claude
  (`claude-opus-5`) under a system prompt that enforces the safety rules below.
- Without a key, the route answers **extractively** from the retrieved material,
  so the panel still works.

The system prompt requires reading signals in combination, never advising
punishment of warning signals such as growling, and referring bite risk or sudden
behaviour changes to a vet or qualified force-free behaviourist.

```bash
# optional
ANTHROPIC_API_KEY=sk-ant-...
RAG_BACKEND=vector
```

## Layout

- **Top bar** — animal selector, panel toggle, chat toggle, light/dark toggle
  (persisted, applied pre-paint so there's no flash).
- **Viewport** — orbit / zoom / pan. Choosing a behaviour eases the camera to
  the relevant body part, then hands control back rather than fighting the user.
  Framing *biases* toward a bone (`focus.bias`) instead of centring on it, so the
  body part is emphasised without pushing the animal out of frame.
- **Side panel** — behaviour buttons and the synced explanation card; becomes a
  bottom sheet below `lg`.
- **Chat** — floating, collapsible, with quick-prompt chips and typing indicator.

## Verified

- Typecheck and production build clean.
- Pose engine: 14 assertions covering pose targets, crossfade gradualness, wag
  symmetry, idle breathing, and bind-pose reset.
- Draco: three's bundled decoder reproduces the source topology (99,698 faces)
  and bounding box exactly, with `JOINTS_0`/`WEIGHTS_0` intact.
- Chat route: retrieval ranking, source citations, and 400 on empty input.

Not verified in-browser: the WebGL render itself — the automated browser
environment used during development never composited frames, so `ResizeObserver`
never fired and R3F correctly declined to mount the scene. Behaviour poses and
camera framing were instead validated by rendering them in Blender.
