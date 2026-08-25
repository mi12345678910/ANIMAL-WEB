# Body Language Lab

An interactive 3D web app for learning to read animal body language. Pick a
behaviour, watch the model take the posture, and read what the signal means and
how to respond. Ships with the dog; cats and horses are registry entries away.

```bash
npm run dev     # http://localhost:3000
npm run build
npm run typecheck
```

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · React Three Fiber 9 + drei 10 ·
three 0.180 · Tailwind CSS 4 · Framer Motion · Zustand

## The model

A low-poly rigged German Shepherd — 2,272 triangles, 55 bones, with a baked
31-frame idle-breathing loop. Exported from `New 3D Dog Model.blend`:

```bash
blender -b "../New 3D Dog Model.blend" --python tools/export_shepherd_rig.py
```

That script fixes four things on the way out, none of which modify the .blend:

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

### Local bone axes

Derived empirically — pose the rig in Blender, render, look. They are **inverted**
from the previous seated model, so old pose values must not be carried across.

| Bone group | `+x` | `-x` | `+y` | `+z` |
|---|---|---|---|---|
| `Head` | nose down | nose up | turn away | head tilt (roll) |
| `Ear_*` | forward / perked | back / flattened | — | splay |
| `Chest` / `Spine_*` | crouch, round down | lift and extend | — | sway |
| `Tail_*` | raise | tuck under | — | lateral swing (the wag) |

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
needs no model or behaviours — that's how Cat and Horse are wired today.

## The chat panel

`POST /api/chat` → `{ message, animalId, behaviorId, history }`
→ `{ reply, sources[] }`

Retrieval sits behind the `Retriever` interface in `src/lib/rag.ts`:

- **`LocalRetriever`** (default) — IDF-weighted keyword search over the behaviour
  cards already in the registry, with suffix stemming so "wagging" matches "wag".
  Works with zero setup.
- **`VectorRetriever`** — the seam for the PDF vector database. Implement
  `retrieve()`, carry `title`/`page` through for citations, and set
  `RAG_BACKEND=vector`. Nothing else changes.

Answers are kept deliberately short — one plain sentence, up to three cues, one
action. With `ANTHROPIC_API_KEY` set, retrieved chunks go to Claude
(`claude-opus-5`) under a system prompt that enforces that shape and a 90-word
cap. Without a key the route answers extractively in the same shape, though it
can only surface the single best-matching entry rather than reasoning across all
of them.

```bash
# optional
ANTHROPIC_API_KEY=sk-ant-...
RAG_BACKEND=vector
```

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
