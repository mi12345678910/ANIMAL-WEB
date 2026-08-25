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
  }

  /** Restore every bone to its captured bind pose. */
  reset() {
    for (const [name, bone] of this.bones) {
      const rest = this.rest.get(name);
      if (rest) bone.quaternion.copy(rest);
    }
  }

  update(delta: number) {
    this.time += delta;

    // Ease layer weights, and retire any that have faded out.
    const k = 1 - Math.exp(-this.blendRate * delta);
    let total = 0;
    for (const layer of this.layers) {
      layer.weight += (layer.target - layer.weight) * k;
      total += layer.weight;
    }
    this.layers = this.layers.filter((l) => l.target > 0 || l.weight > 0.001);

    // Collect every bone touched this frame so bones that just stopped being
    // driven still get reset to rest rather than freezing mid-pose.
    const touched = new Set<string>();
    for (const layer of this.layers) for (const b of layer.compiled.bones) touched.add(b);
    if (this.idle) for (const b of this.idle.bones) touched.add(b);

    const norm = total > 1 ? 1 / total : 1;

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
