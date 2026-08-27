import * as THREE from "three";
import type { Behavior, Oscillator } from "@/animals/types";

/**
 * A tiny additive pose system for skinned rigs.
 *
 * Each behaviour contributes a static pose plus any number of oscillators. When
 * the user switches behaviours we do not snap: the outgoing behaviour becomes a
 * layer whose weight decays to zero while the incoming one rises to one, and
 * every layer's pose AND oscillation are mixed by weight. That gives a true
 * crossfade of both the shape and the motion, so a fast wag winds down as a
 * tucked tail settles in.
 *
 * Rotations are Euler XYZ deltas in each bone's LOCAL space, applied on top of
 * the bind pose captured at load, which matches how the values were authored
 * and validated in Blender.
 */

const AXIS_INDEX = { x: 0, y: 1, z: 2 } as const;

/** Per-bone, per-axis oscillator terms, flattened once so the frame loop is cheap. */
interface CompiledTerm {
  axis: 0 | 1 | 2;
  amplitude: number;
  frequency: number;
  phase: number;
  bias: number;
  waveform: "sin" | "abs";
}

export interface CompiledBehavior {
  /** boneName -> static euler delta */
  pose: Map<string, THREE.Vector3>;
  /** boneName -> oscillator terms */
  motion: Map<string, CompiledTerm[]>;
  /** Every bone this behaviour touches. */
  bones: Set<string>;
}

function compileOscillators(oscillators: Oscillator[] | undefined, motion: Map<string, CompiledTerm[]>) {
  if (!oscillators) return;
  for (const osc of oscillators) {
    const axis = AXIS_INDEX[osc.axis];
    osc.bones.forEach((boneName, i) => {
      const gain = osc.gain?.[i] ?? (osc.falloff !== undefined ? Math.pow(osc.falloff, i) : 1);
      const sign = osc.sign?.[i] ?? 1;
      const amplitude = osc.amplitude * gain * sign;
      if (amplitude === 0) return;
      const term: CompiledTerm = {
        axis,
        amplitude,
        frequency: osc.frequency,
        phase: (osc.phaseStep ?? 0) * i,
        bias: osc.bias ?? 0,
        waveform: osc.waveform ?? "sin",
      };
      const list = motion.get(boneName);
      if (list) list.push(term);
      else motion.set(boneName, [term]);
    });
  }
}

export function compileBehavior(behavior: Behavior): CompiledBehavior {
  const pose = new Map<string, THREE.Vector3>();
  const motion = new Map<string, CompiledTerm[]>();

  if (behavior.pose) {
    for (const [bone, euler] of Object.entries(behavior.pose)) {
      pose.set(bone, new THREE.Vector3(euler[0], euler[1], euler[2]));
    }
  }
  compileOscillators(behavior.oscillators, motion);

  const bones = new Set<string>([...pose.keys(), ...motion.keys()]);
  return { pose, motion, bones };
}

/** Idle motion (breathing) compiles to the same shape, with no static pose. */
export function compileIdle(oscillators: Oscillator[] | undefined): CompiledBehavior {
  const motion = new Map<string, CompiledTerm[]>();
  compileOscillators(oscillators, motion);
  return { pose: new Map(), motion, bones: new Set(motion.keys()) };
}

function evaluateMotion(terms: CompiledTerm[] | undefined, time: number, out: THREE.Vector3) {
  if (!terms) return;
  for (const t of terms) {
    const wave =
      t.waveform === "abs"
        ? Math.abs(Math.sin(Math.PI * t.frequency * time + t.phase))
        : Math.sin(2 * Math.PI * t.frequency * time + t.phase);
    const v = t.amplitude * wave + t.bias;
    if (t.axis === 0) out.x += v;
    else if (t.axis === 1) out.y += v;
    else out.z += v;
  }
}

/**
 * How many behaviour layers may be alive at once: one fading in plus three
 * fading out. Enough for a natural crossfade, few enough that hammering the
 * buttons cannot turn the pose into an average of everything clicked.
 */
const MAX_LAYERS = 4;

interface Layer {
  compiled: CompiledBehavior;
  /** Current mix weight, eased toward `target`. */
  weight: number;
  target: number;
}

/**
 * Drives a set of bones from a stack of weighted behaviour layers.
 * Create once per loaded model; call `setBehavior` on change and `update` each frame.
 */
export class PoseMixer {
  private bones = new Map<string, THREE.Bone>();
  private rest = new Map<string, THREE.Quaternion>();
  private layers: Layer[] = [];
  private idle: CompiledBehavior | null = null;
  private time = 0;
  /**
   * Bones written on the previous frame. A bone that stops being driven has to
   * be written once more — at exactly rest — or it freezes at its last value.
   */
  private lastTouched = new Set<string>();
  /** Bones owed a one-off restore to the bind pose. */
  private pendingRest = new Set<string>();
  /** True while a baked AnimationClip owns the skeleton. */
  private clipDriven = false;

  /** Scratch objects, reused every frame to avoid per-frame allocation. */
  private scratchVec = new THREE.Vector3();
  private scratchMotion = new THREE.Vector3();
  private scratchEuler = new THREE.Euler();
  private scratchQuat = new THREE.Quaternion();

  /** How fast layer weights move; larger settles faster. */
  blendRate = 3.2;

  constructor(root: THREE.Object3D, idleOscillators?: Oscillator[]) {
    root.traverse((obj) => {
      if ((obj as THREE.Bone).isBone) {
        const bone = obj as THREE.Bone;
        this.bones.set(bone.name, bone);
        this.rest.set(bone.name, bone.quaternion.clone());
      }
    });
    this.idle = compileIdle(idleOscillators);
  }

  get boneNames(): string[] {
    return [...this.bones.keys()];
  }

  getBone(name: string | undefined): THREE.Bone | undefined {
    return name ? this.bones.get(name) : undefined;
  }

  /** Fade in `behavior` (or fade everything out when null). */
  setBehavior(behavior: Behavior | null) {
    for (const layer of this.layers) layer.target = 0;
    if (behavior) {
      this.layers.push({ compiled: compileBehavior(behavior), weight: 0, target: 1 });
    }

    // Cap the stack.
    //
    // A layer only retires once its weight decays below 0.001, which takes
    // roughly a second. Clicking the behaviour buttons faster than that piles
    // up layers without limit — 40 clicks left 40 alive — and because the
    // weights are normalised to sum to 1, the skeleton renders the weighted
    // AVERAGE of everything still fading. The result is a mush that belongs to
    // no behaviour and visibly lags the button the user actually pressed.
    //
    // The layers dropped are always the faintest, so they are the ones
    // contributing least; and any bone left behind is written back to rest on
    // the next frame by the `lastTouched` pass, so dropping them cannot freeze
    // anything mid-pose.
    if (this.layers.length > MAX_LAYERS) {
      const incoming = this.layers[this.layers.length - 1];
      const strongest = this.layers
        .slice(0, -1)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, MAX_LAYERS - 1);
      this.layers = [...strongest, incoming];
    }
  }

  /** Queue every bone for a write back to its captured bind pose. */
  restoreAll() {
    for (const name of this.bones.keys()) this.pendingRest.add(name);
  }

  /**
   * Hand the skeleton to or from a baked `AnimationClip`.
   *
   * The two drivers must never write the same frame — whichever runs last wins
   * and they visibly fight. While a clip is playing this mixer writes nothing;
   * when the clip gives control back, EVERY bone needs restoring, because
   * three.js leaves bones wherever an action stopped rather than returning them
   * to the bind pose.
   *
   * That was the "slanted dog": the dog's idle-breathing clip animates all 55
   * bones, the procedural behaviours touch 19, and the other 36 — both hind
   * legs, all four feet, shoulders, toes — stayed frozen mid-stride the moment
   * the clip stopped.
   */
  setClipDriven(clipDriven: boolean) {
    if (this.clipDriven === clipDriven) return;
    this.clipDriven = clipDriven;
    if (!clipDriven) this.restoreAll();
  }

  update(delta: number) {
    // Time advances even while suspended, so oscillators do not jump when
    // control comes back from a clip.
    this.time += delta;
    if (this.clipDriven) return;

    // Ease layer weights, and retire any that have faded out.
    const k = 1 - Math.exp(-this.blendRate * delta);
    for (const layer of this.layers) layer.weight += (layer.target - layer.weight) * k;
    this.layers = this.layers.filter((l) => l.target > 0 || l.weight > 0.001);

    // Total AFTER retiring, otherwise a layer dropped this frame still shrinks
    // `norm` and the incoming behaviour comes in under-weighted.
    let total = 0;
    for (const layer of this.layers) total += layer.weight;
    const norm = total > 1 ? 1 / total : 1;

    const active = new Set<string>();
    for (const layer of this.layers) for (const b of layer.compiled.bones) active.add(b);
    if (this.idle) for (const b of this.idle.bones) active.add(b);

    // Also write anything driven last frame or awaiting a restore. Those bones
    // accumulate a zero delta below, so they land exactly on rest instead of
    // freezing at whatever the retired layer last left them at.
    const touched = new Set(active);
    for (const b of this.lastTouched) touched.add(b);
    for (const b of this.pendingRest) touched.add(b);
    this.pendingRest.clear();
    this.lastTouched = active;

    for (const boneName of touched) {
      const bone = this.bones.get(boneName);
      const rest = this.rest.get(boneName);
      if (!bone || !rest) continue;

      const accum = this.scratchVec.set(0, 0, 0);

      for (const layer of this.layers) {
        const w = layer.weight * norm;
        if (w <= 0.0001) continue;
        const pose = layer.compiled.pose.get(boneName);
        if (pose) accum.addScaledVector(pose, w);

        const terms = layer.compiled.motion.get(boneName);
        if (terms) {
          const motion = this.scratchMotion.set(0, 0, 0);
          evaluateMotion(terms, this.time, motion);
          accum.addScaledVector(motion, w);
        }
      }

      // Idle breathing always plays underneath, at full strength.
      if (this.idle) {
        const idleTerms = this.idle.motion.get(boneName);
        if (idleTerms) {
          const motion = this.scratchMotion.set(0, 0, 0);
          evaluateMotion(idleTerms, this.time, motion);
          accum.add(motion);
        }
      }

      this.scratchEuler.set(accum.x, accum.y, accum.z, "XYZ");
      this.scratchQuat.setFromEuler(this.scratchEuler);
      bone.quaternion.copy(rest).multiply(this.scratchQuat);
    }
  }
}
