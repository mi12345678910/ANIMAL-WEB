/**
 * Core type system for the animal body-language library.
 *
 * Everything the app renders — the 3D rig, the behaviour buttons, the synced
 * explanation card and the camera moves — is derived from these types. Adding a
 * new species means adding one `Animal` object to the registry; no component
 * code needs to change.
 */

export type Vec3 = [number, number, number];

/** Euler XYZ deltas (radians) applied in each bone's LOCAL space, relative to rest. */
export type BonePose = Record<string, Vec3>;

export type Axis = "x" | "y" | "z";

/**
 * A cyclic motion layered on top of a static pose — tail wags, breathing,
 * ear flicks. `phaseStep` offsets each successive bone so a chain (like a tail)
 * moves as a travelling wave rather than a rigid stick.
 */
export interface Oscillator {
  bones: string[];
  axis: Axis;
  /** Peak rotation in radians, applied to the first bone in `bones`. */
  amplitude: number;
  /** Cycles per second. */
  frequency: number;
  /** Phase offset (radians) added per successive bone — creates the wave. */
  phaseStep?: number;
  /** Amplitude multiplier per successive bone (1 = uniform, >1 = grows to tip). */
  falloff?: number;
  /** Explicit per-bone amplitude multipliers; overrides `falloff` when present. */
  gain?: number[];
  /** Per-bone sign flip, for mirroring left/right pairs. */
  sign?: number[];
  /** Constant radians added to the oscillation. */
  bias?: number;
  /** `sin` swings both ways; `abs` only ever pushes one way (e.g. panting). */
  waveform?: "sin" | "abs";
}

/** Where the camera should settle while a behaviour plays. */
export interface FocusSpec {
  /** Bone to lean the framing toward. Falls back to the body centre. */
  bone?: string;
  /**
   * How far to pull the look-at point from the body centre toward `bone`.
   * 0 keeps the whole animal centred, 1 centres hard on the bone. Values around
   * 0.5–0.7 emphasise a body part while keeping the animal in frame.
   */
  bias?: number;
  /** Distance from the target, as a multiple of the model's bounding radius. */
  distance: number;
  /** Camera azimuth in radians. 0 looks at the animal's front. */
  yaw: number;
  /** Camera elevation in radians. */
  pitch: number;
  /** Extra world-space nudge applied to the look-at point. */
  offset?: Vec3;
}

export type Tone = "positive" | "neutral" | "caution" | "alert";

export interface Cue {
  /** Body region — used as the cue's label chip, e.g. "Tail", "Ears". */
  part: string;
  text: string;
}

export interface BehaviorCard {
  title: string;
  tagline: string;
  cues: Cue[];
  meaning: string;
  respond: string[];
  /** Things that make the situation worse — rendered as a warning block. */
  avoid?: string;
}

export interface Behavior {
  id: string;
  /** Button label, e.g. "Happy / Tail Wag". */
  label: string;
  icon: string;
  tone: Tone;
  /**
   * Name of a baked AnimationClip inside the GLB. When the loaded model
   * actually contains this clip it is played and takes precedence; otherwise
   * the app falls back to the procedural `pose` + `oscillators` below. This is
   * what lets hand-animated models and rig-driven models share one UI.
   */
  clip?: string;
  pose?: BonePose;
  oscillators?: Oscillator[];
  focus?: FocusSpec;
  card: BehaviorCard;
}

/** Semantic names for body regions, so UI copy can reference bones safely. */
export interface RigMap {
  spine?: string;
  head?: string;
  muzzle?: string;
  ears?: { left: string[]; right: string[] };
  tail?: string[];
}

export interface ModelSpec {
  url: string;
  /** Uniform scale applied after load. */
  scale: number;
  /**
   * Y rotation (radians) that turns the model to face the camera's default
   * position. Blender's +Y-forward becomes -Z after the glTF Y-up conversion.
   */
  faceYaw: number;
  /** Vertical nudge so the animal's feet sit on the ground plane. */
  yOffset: number;
}

export interface Animal {
  id: string;
  name: string;
  icon: string;
  status: "ready" | "coming-soon";
  blurb: string;
  /** Accent colour (OKLCH-friendly hex) used for this species' UI theming. */
  accent: string;
  model?: ModelSpec;
  rig?: RigMap;
  /** Subtle motion that always runs underneath any behaviour (breathing etc). */
  idle?: Oscillator[];
  behaviors: Behavior[];
  /** Suggested questions surfaced as chips in the chat panel. */
  starterQuestions: string[];
}
