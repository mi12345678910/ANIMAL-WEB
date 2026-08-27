# Body Language Lab

An interactive 3D web app for learning to read animal body language. Pick a
behaviour, watch the model take the posture, and read what the signal means and
how to respond. Ships with a dog, a cat and a horse, and a chat panel that
answers from a 58-signal reference library covering far more than the models can
pose.

```bash
npm run dev     # http://localhost:3000
npm run build
npm run typecheck
```

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · React Three Fiber 9 + drei 10 ·
three 0.180 · Tailwind CSS 4 · Framer Motion · Zustand

## The models

### Dog

A low-poly rigged German Shepherd — 2,272 triangles, 55 bones, with a baked
31-frame idle-breathing loop. Exported from `New 3D Dog Model.blend`:

```bash
blender -b "../New 3D Dog Model.blend" --python tools/export_shepherd_rig.py
```

That script fixes five things on the way out, none of which modify the .blend:

1. **The action is on the wrong armature.** The file has two identical 55-bone
   armatures. The mesh is skinned to `Rig_1 type.001`, but the breathing action
   sits on `Rig_1 type` — so it would never play. The action, plus its Blender
   4.4+ action *slot*, is rebound to the deforming armature.
2. **Rigify names are misleading.** The `DEF-spine/.001/.002/.003` chain runs
   *rearward* from the hips and is actually the **tail**; the body chain is
   `.004 → .006 → … → .011`. Bones and their vertex groups are renamed to
   semantic names so poses in `dog.ts` are readable.
3. **Texture size.** The 2048² base colour is halved and encoded as WebP. It has
   genuine alpha for fur cards, so JPEG is not an option. **7.8 MB → 0.57 MB.**
4. **Do not delete the parent empties.** The mesh and armature sit under empties
   carrying a `0.01` scale; removing them silently re-scales the rig 100× and the
   GLB exports spanning ~113 units instead of ~1.1. The script strips only
   cameras and lights.
5. **The fur-card material has no texture.** `M_GermanShepherd_Transparent`
   (140 triangles — the neck ruff) ships with a flat grey `(0.8, 0.8, 0.8)` base
   colour and no image node at all, so those faces render as grey slabs. The
   script points it at the same atlas as the body and wires the image alpha into
   the BSDF so the card silhouettes cut out. **This is a material problem, not a
   UV problem** — the UVs were always correct, there was simply nothing to
   sample. It exports as `alphaMode: BLEND`.


### Horse

```bash
blender -b "../horse.blend" --python tools/export_horse_rig.py
```

This source needed far more work than the dog. As authored it is a
work-in-progress sculpt, not a game-ready asset:

- **No skinning at all** — no vertex groups, no armature modifier. The script
  binds the mesh to the rig with automatic weights (0 unweighted vertices).
- **The armature is a Rigify *metarig*** — a template. The `hors rig` collection
  it would have generated into is empty. The metarig is anatomically placed and
  aligned to the mesh, so it is used directly as the deform rig, with eyes,
  nostrils, breast markers and mane tufts excluded from deformation.
- **Three horses in the file.** Collections name them: `curent hors` is the one
  used, `old horse` and `trush` are dropped.
- **The mane/tail is a bevelled curve.** It must be converted to mesh *before*
  its bevel profile (`BezierCircle`) is deleted, or it collapses to bare edges
  and exports empty.
- Modifiers are applied **before** weighting: weighting first and mirroring
  after would flip left/right influence on the mirrored half.

> **The supplied texture cannot be used on this mesh.**
> `Horse_Chestnut_LessMuscules.tif` is a well-made chestnut atlas — head, legs,
> hooves and eyes as separate islands — but it was authored for a *different*
> horse model. This sculpt has its own unwrap occupying a scattered ~35% of the
> UV square, so the atlas islands land on the wrong body parts: leg and hoof
> patches smear across the barrel and a bridle paints itself over the face.
> Flipping V does not help; the islands genuinely do not correspond. The coat is
> therefore solid colour matched to the atlas chestnut, with a darker mane and
> tail. To use the real texture the mesh needs unwrapping onto that atlas, or
> the atlas's original mesh supplied.

Result: 25.5k triangles, **0.39 MB** with Draco.

### Cat

```bash
blender -b "../cat.blend" --python tools/export_cat_rig.py
```

The cleanest of the three: already skinned, with UVs and a colour map that
actually matches its own unwrap. One thing needed fixing:

- **The tail was weighted across three coincident bone chains.** `Bone.023`,
  `Bone.024` and `Bone.025` (and their children) sit at identical positions and
  all carry weights, so driving one would have moved roughly a third of the
  tail. Their weights are merged into the first chain — lossless, since the
  bones share a rest transform exactly — and the spares removed, leaving a clean
  5-bone tail. 38 bones become 28.

Result: 1,600 triangles, **77 KB**.

## How the animation works

`AnimalRig` supports two sources and prefers the authored one:

- If a behaviour names a `clip` and the GLB actually contains it, that baked
  `AnimationClip` plays. `Relaxed` uses the model's own breathing loop.
- Otherwise `PoseMixer` drives the bones procedurally from the behaviour's
  `pose` (static euler deltas) plus `oscillators` (cyclic motion — the wag is a
  travelling wave down the tail via `phaseStep`).

So authored and procedural behaviours coexist, and you can replace them one at a
time as you author more clips.

> **The clone must be `SkeletonUtils.clone`, not `Object3D.clone()`.**
> The latter copies a `SkinnedMesh` still bound to the *original* skeleton, so
> the cloned bones we rotate deform nothing and the model sits frozen in its bind
> pose. This was the cause of "the card changes but the dog doesn't move".

> **Never size a skinned model with `Box3.setFromObject`.**
> It multiplies the geometry AABB by the mesh node's `matrixWorld`, but glTF
> deliberately *ignores* that node transform for skinned meshes — the joint
> matrices place the vertices instead. On this rig (skeleton under a `0.01`
> parent, inverse-bind matrices scaling back up) the two disagree by exactly
> 100×, so the measured radius came out 0.019 instead of 2.26. The camera then
> requested a 0.05-unit distance, `CameraControls` clamped it to `minDistance`
> 1.2, and the viewport filled with one paw. `measureBounds()` in `AnimalRig`
> measures **bone world positions** instead, which are always correct, with 12%
> padding since bones sit inside the silhouette.
>
> It returns the **centre** as well as the radius, and the camera looks at that
> centre. Deriving a look-at height from the radius (the old `radius * 0.72`)
> only holds for a compact subject — on a long quadruped the bounding sphere is
> driven by body length, so that estimate landed at 82% of the dog's height and
> the animal hung below frame centre.

### Local bone axes

Derived empirically **per rig** — pose it in Blender, render, look. Do not assume
they carry across: they came out inverted between the dog's two models, and the
horse's neck axis has no dog equivalent at all.

**Dog**

| Bone group | `+x` | `-x` | `+y` | `+z` |
|---|---|---|---|---|
| `Head` | nose down | nose up | turn away | head tilt (roll) |
| `Ear_*` | forward / perked | back / flattened | — | splay |
| `Chest` / `Spine_*` | crouch, round down | lift and extend | — | sway |
| `Tail_*` | raise | tuck under | — | lateral swing (the wag) |

**Horse**

| Bone group | `+x` | `-x` | `+z` |
|---|---|---|---|
| `Head` | nose down | nose up | tilt |
| `Neck_*` | raise / arch | lower | — |
| `Ear_*` | pricked forward | pinned back | splay outward |
| `Tail_*` | raise | clamp down | lateral swish |

**Cat**

| Bone group | `+x` | `-x` | `+z` |
|---|---|---|---|
| `Head` | nose down | nose up | tilt |
| `Neck` | **lowers / tucks head** | **raises head** | — |
| `Spine` | front end down (bow) | front end up (rears back) | — |
| `Ear_*` | forward | pinned back | splay outward |
| `Tail_*` | raise | tuck under | lateral swish |

Note the cat's `Neck` is inverted relative to the horse's. Assuming otherwise
shipped two visibly wrong poses before a re-probe caught it.

Local-space rotations are unaffected by glTF's Z-up → Y-up conversion, so values
validated in Blender transfer directly to three.js.

### Known limitation — no true play bow

`PoseMixer` applies bone **rotations only**. On an FK rig, rotating the forelegs
swings the legs without moving the torso, so the chest cannot actually descend.
`Playful` is therefore a forward-dipping play *invitation*, not a textbook bow.
Adding an optional position delta to `BonePose` (and applying it as
`bone.position = rest + delta × weight`) would make the real thing reachable.

## Adding an animal

Nothing in `src/components` needs to change.

1. Drop a rigged model at `public/models/<id>.glb`.
2. Create `src/animals/<id>.ts` exporting an `Animal` (see `dog.ts`).
3. Add it to `ANIMALS` in `src/animals/registry.ts`.

An entry with `status: "coming-soon"` renders as a disabled selector option and
needs no model or behaviours.

## The chat panel

`POST /api/chat` → `{ message, animalId, behaviorId, history }`
→ `{ reply, sources[] }`

### What it knows

Two corpora are indexed side by side:

- **Behaviour cards** from the animal registry — tied to poses the rigs can
  actually show, so there are only six per species.
- **`src/knowledge/guide.ts`** — 58 signals transcribed from the supplied
  reference document (19 horse, 24 cat, 15 dog), each with what it means and
  what to do. This is where purring, hissing, kneading, yawning, flehmen,
  bolting and the rest live: things readers ask about constantly that no rig can
  demonstrate. Entries carry a `page`, which becomes the citation chip.

Adding to the guide is pure data — append a `GuideEntry` and it is searchable.

### Retrieval

Behind the `Retriever` interface in `src/lib/rag.ts`:

- **`LocalRetriever`** (default) — BM25 over both corpora, with suffix stemming
  so "wagging" matches "wag". Works with zero setup.
- **`VectorRetriever`** — the seam for an embedding-backed store. Implement
  `retrieve()`, carry `title`/`page` through for citations, and set
  `RAG_BACKEND=vector`. Nothing else changes.

Three details were each load-bearing, found by sweeping every signal in the
guide as a query and checking the top hit:

- **BM25 length normalisation, not raw term counts.** Behaviour cards are several
  times longer than guide entries, so unnormalised term frequency let them win on
  bulk alone. "Horse pins its ears back" returned *Listening / Attentive* — whose
  tagline happens to read "Ears back does NOT mean angry" — instead of *Both Ears
  Pinned Back*, which is anger and the answer that matters for safety.
- **A separate boost for the signal's own name.** Matching a title is much
  stronger evidence than matching a word buried in prose.
- **Hyphens split.** Keeping them made `Belly-Up` a single token that a search
  for "belly up" could never match.

Synonyms live in a `keywords` field that is indexed but never rendered, so
"hackles" finds *Fur Standing on End* without the word appearing in the answer.
Keywords deliberately do **not** earn the title boost — when they did, "belly up"
matched *Rolling on the Floor*, which merely lists "belly" as a keyword.

### Answers

Kept deliberately short — one plain sentence, up to three cues, one or two
actions. With `ANTHROPIC_API_KEY` set, retrieved chunks go to Claude
(`claude-opus-5`) under a system prompt enforcing that shape and a 90-word cap.
Without a key the route answers extractively in the same shape, though it can
only surface the single best-matching entry rather than reasoning across all of
them.

`ChatPanel` renders `**bold**` and `- ` bullets itself (`RichText`) rather than
dumping raw text into a `<p>` — otherwise every answer showed its own asterisks.
It is about thirty lines and handles exactly those two rules; anything else
passes through as plain text.

Two guide entries have their advice **reordered** relative to the source
document: *Rearing* and *Bucking* both open with the foals-in-a-pasture case,
which meant someone asking "the horse reared up, what do I do" was told to enjoy
the view from outside the fence. The safety branch now leads. No branch was
dropped.

```bash
# optional
ANTHROPIC_API_KEY=sk-ant-...
RAG_BACKEND=vector
```

## Palette

Warm "field guide" paper rather than the default cool grey-blue: sand and ink in
light, espresso and cream in dark, with a cool teal accent for contrast against
warm fur. Two low-contrast colour fields drift in opposite directions behind the
glass to give the page depth.

Accents are **per species and per theme** (`Accent { light, dark }`). One shared
value cannot work — a hue bright enough for a dark background is unreadable
under white text on a light one, and the old single `#5eead4` put the send
button at 1.48:1 in light mode.

Two rules that are easy to get wrong here:

- **Accent colours belong in CSS classes, not inline `style` props.** Inline
  `var()` substitution was observed not to re-resolve on a theme flip, leaving
  controls stuck on the previous theme's accent. `.accent-bg` / `.accent-chip` /
  `.accent-soft-bg` re-resolve reliably.
- **Text on a tone pill has to flip with the theme.** Light-theme tones are deep
  and take white; dark-theme tones are bright and need dark ink. Hardcoded white
  failed every dark-mode pill at ~1.7–2.3:1; `.tone-pill` fixes it.

Everything now clears WCAG AA (body text 15–17:1, muted 5.4–6.9:1, buttons and
pills 4.5:1+), with the caution tone on paper at AA-large, which is fine for a
non-text element.

## Layout and contrast

- **Top bar** — animal selector, panel toggle, chat toggle, light/dark toggle
  (persisted, applied pre-paint so there's no flash). Light is the default: the
  models are dark-furred and read badly on a dark background.
- **Viewport** — orbit / zoom / pan. Choosing a behaviour eases the camera to the
  relevant body part then hands control back rather than fighting the user.
  Framing *biases* toward a bone (`focus.bias`) instead of centring on it, so the
  part is emphasised without pushing the animal out of frame.
- **Side panel** — behaviour buttons and the synced explanation card; becomes a
  bottom sheet below `lg`.
- **Chat** — floating and collapsible. It uses the **opaque** `.surface` tokens,
  not the translucent glass: glass over the behaviour buttons made the
  conversation unreadable.

The canvas is transparent and sits on a neutral-grey **lit stage**
(`.viewport-stage`) that stays light in both themes. A near-black coat against
the old page background measured **1.04:1** contrast — effectively invisible.
Lightening the theme alone does not fix it (a much lighter dark page still only
reaches 1.11:1); the subject needs its own backdrop.

Scene lighting is a neutral three-point setup — key with shadows, soft fill
opposite, rim for edge separation, plus a low bounce so the underside doesn't
crush to black. Everything stays white/near-white on purpose: an earlier pass
used the species accent colour as a strong rim and tinted the cream chest fur
green. Tone mapping is `Neutral`, not `ACESFilmic`, which was crushing shadow
detail on the dark coat.

## Verified

- Typecheck and production build clean.
- Pose engine: 14 assertions covering pose targets, crossfade gradualness, wag
  symmetry, idle breathing and bind-pose reset.
- Export: GLB bounding box matches the source (0.201 × 0.698 × 1.129), 31
  animation keyframes, 55 joints, texture alpha preserved.
- All six behaviour poses rendered and visually checked (`behaviour-poses.png`).
- Chat route: retrieval ranking, source citations, 400 on empty input.

Not verified in-browser: the WebGL render itself. The automated browser used
during development never composited frames, so `ResizeObserver` never fired and
R3F correctly declined to mount the scene. Poses, framing and contrast were
validated by rendering in Blender instead.
