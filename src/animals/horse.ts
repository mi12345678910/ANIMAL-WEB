import type { Animal, Oscillator } from "./types";

/**
 * Rig: horse, exported from `horse.blend` by `tools/export_horse_rig.py`.
 *
 * The source was an unskinned sculpt plus a Rigify *metarig*, so the export
 * script binds the mesh with automatic weights and renames the metarig's
 * positional bone names to anatomical ones. As with the dog, the Rigify "spine"
 * chain actually runs rearward and is the tail.
 *
 * Local-axis conventions, verified by posing the rig in Blender and rendering:
 *   Head    +x nose down   | -x nose up      | +z tilt
 *   Neck_*  +x raise/arch  | -x lower
 *   Ear_*   +x pricked forward | -x pinned back | +/-z splay outward
 *   Tail_*  +x raise       | -x clamp down   | +/-z lateral swish
 *
 * Horses are prey animals, and the ears carry most of the signal — which is why
 * the behaviour set below deliberately separates "ears rotated back and soft"
 * (listening) from "ears pinned flat" (threat). Conflating those two is the
 * single most common misreading of a horse.
 */
const TAIL = ["Tail_01", "Tail_02", "Tail_03", "Tail_04", "Tail_05"];
const EAR_L = ["Ear_L_01", "Ear_L_02"];
const EAR_R = ["Ear_R_01", "Ear_R_02"];
const NECK = ["Neck_01", "Neck_02", "Neck_03", "Neck_04"];

/** Breathing and micro-motion under every behaviour. */
const IDLE: Oscillator[] = [
  { bones: ["Chest"], axis: "x", amplitude: 0.011, frequency: 0.24 },
  { bones: ["Neck_02"], axis: "z", amplitude: 0.006, frequency: 0.17 },
];

/** Neck bones share a value; the rotation accumulates down the chain. */
const neck = (v: number): Record<string, [number, number, number]> =>
  Object.fromEntries(NECK.map((b) => [b, [v, 0, 0] as [number, number, number]]));

export const horse: Animal = {
  id: "horse",
  name: "Horse",
  icon: "\u{1F40E}",
  status: "ready",
  accent: { light: "#a8590c", dark: "#fcd34d" },
  blurb: "Domestic horse · Equus caballus",
  model: {
    url: "/models/horse.glb",
    scale: 1,
    // Muzzle already points +Z after the glTF Y-up conversion.
    faceYaw: 0,
    yOffset: 0,
  },
  rig: {
    spine: "Withers",
    head: "Head",
    muzzle: "Jaw",
    ears: { left: EAR_L, right: EAR_R },
    tail: TAIL,
  },
  idle: IDLE,
  starterQuestions: [
    "My horse has its ears back — is it angry?",
    "Why is my horse swishing its tail?",
    "How close is too close to the hindquarters?",
    "What does it mean when a horse rests a back foot?",
  ],
  behaviors: [
    {
      id: "relaxed",
      label: "Relaxed / At Ease",
      icon: "\u{1F33F}",
      tone: "positive",
      pose: {
        ...neck(0.02),
        Head: [0.03, 0, 0],
        Ear_L_01: [0.05, 0, -0.07],
        Ear_R_01: [0.05, 0, 0.07],
        Tail_01: [0.05, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.05, frequency: 0.45, phaseStep: 0.4, falloff: 1.1 },
      ],
      focus: { bone: "Chest", bias: 0.1, distance: 2.95, yaw: 0.6, pitch: 0.13 },
      card: {
        title: "Relaxed / At Ease",
        tagline: "The baseline. Everything else is a change from this, so learn it first.",
        cues: [
          { part: "Ears", text: "Loose and mobile, tipped slightly outward, drifting rather than fixed." },
          { part: "Head", text: "Carried level with the withers, neither high nor rammed down." },
          { part: "Tail", text: "Hanging softly with a gentle swing as they shift weight." },
          { part: "Body", text: "Weight settled, muscles soft, often resting one hind hoof on its toe." },
          { part: "Eyes", text: "Soft and almond-shaped, blinking normally, no white showing." },
        ],
        meaning:
          "The horse feels safe and is not braced for anything. A resting hind hoof is one of the most reliable calm signals there is, because a prey animal will not park a leg it might need.",
        respond: [
          "Approach at the shoulder, where they can see you, rather than head-on or from behind.",
          "Speak before you touch so you never arrive as a surprise.",
          "Good moment for grooming, tacking up or handling.",
        ],
      },
    },
    {
      id: "alert",
      label: "Alert / Focused",
      icon: "\u{1F441}",
      tone: "neutral",
      pose: {
        ...neck(0.13),
        Head: [-0.12, 0, 0],
        Ear_L_01: [0.44, 0, -0.03],
        Ear_R_01: [0.44, 0, 0.03],
        Ear_L_02: [0.12, 0, 0],
        Ear_R_02: [0.12, 0, 0],
        Tail_01: [0.26, 0, 0],
        Tail_02: [0.14, 0, 0],
      },
      oscillators: [
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.02, frequency: 0.8 },
        { bones: TAIL, axis: "z", amplitude: 0.05, frequency: 1.1, phaseStep: 0.35 },
      ],
      focus: { bone: "Head", bias: 0.82, distance: 1.85, yaw: 0.3, pitch: 0.04 },
      card: {
        title: "Alert / Focused",
        tagline: "Both ears aimed at the same thing. The horse has found something worth watching.",
        cues: [
          { part: "Ears", text: "Both pricked hard forward and locked on one point." },
          { part: "Head", text: "Raised, neck lifted, eyes fixed in the direction of the ears." },
          { part: "Body", text: "Suddenly still, weight gathered, no resting hoof." },
          { part: "Tail", text: "Lifted slightly away from the hindquarters." },
        ],
        meaning:
          "Interest and rising arousal, not aggression. A horse's ears point where its attention is, so both ears forward means one target has all of it. This is a fork: it can settle, or it can tip into a spook, and a horse spooks by moving first and thinking after.",
        respond: [
          "Look where the ears point. Knowing the trigger tells you what happens next.",
          "Speak calmly and give them a moment to work out what it is.",
          "Get your feet out of the strike zone before they move, not after.",
        ],
        avoid:
          "Do not crowd or grab at a horse that has locked on to something. A startled horse goes forward or sideways fast, straight through whatever is there.",
      },
    },
    {
      id: "listening",
      label: "Listening / Attentive",
      icon: "\u{1F442}",
      tone: "positive",
      pose: {
        ...neck(0.04),
        Head: [0.02, 0, 0],
        Ear_L_01: [-0.34, 0, 0.04],
        Ear_R_01: [-0.34, 0, -0.04],
        Tail_01: [0.06, 0, 0],
      },
      oscillators: [
        // Ears swivelling independently — the giveaway that this is attention,
        // not threat. Opposite signs make them move out of step.
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.14, frequency: 0.55, sign: [1, -1] },
        { bones: TAIL, axis: "z", amplitude: 0.05, frequency: 0.5, phaseStep: 0.4 },
      ],
      focus: { bone: "Head", bias: 0.86, distance: 1.65, yaw: 0.55, pitch: 0.04 },
      card: {
        title: "Listening / Attentive",
        tagline: "Ears back does NOT mean angry. This is the misreading that gets people hurt — in both directions.",
        cues: [
          { part: "Ears", text: "Rotated backwards but still upright and softly cupped, swivelling independently." },
          { part: "Face", text: "Soft. No wrinkling above the nostrils, no tension around the muzzle." },
          { part: "Body", text: "Working calmly, weight even, no swinging of the hindquarters." },
          { part: "Tail", text: "Hanging softly or swinging gently with movement." },
        ],
        meaning:
          "The horse is listening to something behind it — very often you, the rider or handler. Ears that swivel are gathering information. The difference from a threat is that these ears stay upright and mobile, whereas pinned ears go flat and hard against the neck and stop moving.",
        respond: [
          "Take it as engagement. This is a horse paying attention to you.",
          "Keep talking and working; nothing needs to change.",
          "Learn the difference between this and pinned ears. It is the single most useful thing you can know about horses.",
        ],
      },
    },
    {
      id: "threat",
      label: "Threat / Pinned Ears",
      icon: "\u{1F620}",
      tone: "alert",
      pose: {
        ...neck(-0.09),
        Head: [0.15, 0, 0],
        Ear_L_01: [-0.66, 0, 0],
        Ear_R_01: [-0.66, 0, 0],
        Ear_L_02: [-0.2, 0, 0],
        Ear_R_02: [-0.2, 0, 0],
        Jaw: [0.05, 0, 0],
        Tail_01: [0.12, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.32, frequency: 3.4, phaseStep: 0.45, falloff: 1.1 },
        { bones: ["Neck_02", "Neck_03"], axis: "x", amplitude: 0.02, frequency: 1.5 },
      ],
      focus: { bone: "Head", bias: 0.8, distance: 1.95, yaw: -0.6, pitch: 0.04 },
      card: {
        title: "Threat / Pinned Ears",
        tagline: "A clear warning. Take it seriously and make space.",
        cues: [
          { part: "Ears", text: "Flat back and hard against the neck, pressed down rather than swivelling." },
          { part: "Muzzle", text: "Tight, nostrils drawn back, wrinkles above them. May show teeth." },
          { part: "Head", text: "Lowered and thrust forward, sometimes weaving side to side." },
          { part: "Tail", text: "Swishing hard and fast, not drifting." },
          { part: "Hindquarters", text: "Swinging toward you. That is the last step before a kick." },
        ],
        meaning:
          "This is a threat, and horses are usually honest about it. Pinned ears plus a swinging rear is a horse telling you it is prepared to bite or kick. A half-tonne animal does not need to be aggressive to injure you — it only needs to connect.",
        respond: [
          "Increase distance immediately and get out of range of both ends.",
          "Move to where the horse can see you, never through the blind spot directly behind.",
          "Work out what caused it: pain, food, another horse, or being cornered are the usual causes.",
          "Persistent threat behaviour needs a vet to rule out pain before it is treated as training.",
        ],
        avoid:
          "Never punish the warning. A horse taught that pinned ears bring pain simply stops warning you, and then kicks with no signal at all.",
      },
    },
    {
      id: "anxious",
      label: "Anxious / Ready to Flee",
      icon: "\u{1F630}",
      tone: "caution",
      pose: {
        ...neck(0.19),
        Head: [-0.18, 0, 0],
        Ear_L_01: [0.1, 0, -0.16],
        Ear_R_01: [0.1, 0, 0.16],
        Tail_01: [-0.36, 0, 0],
        Tail_02: [-0.24, 0, 0],
        Tail_03: [-0.16, 0, 0],
        Jaw: [0.03, 0, 0],
      },
      oscillators: [
        // Ears flicking rapidly and out of phase: scanning, unable to settle.
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.26, frequency: 1.9, sign: [1, -1] },
        { bones: ["Chest"], axis: "x", amplitude: 0.008, frequency: 8 },
        { bones: TAIL, axis: "z", amplitude: 0.06, frequency: 2.4, phaseStep: 0.3 },
      ],
      focus: { bone: "Withers", bias: 0.3, distance: 2.95, yaw: 0.55, pitch: 0.12 },
      card: {
        title: "Anxious / Ready to Flee",
        tagline: "A prey animal deciding whether to run. Everything here is preparation for movement.",
        cues: [
          { part: "Head", text: "High and rigid, neck braced upright to see over everything." },
          { part: "Ears", text: "Flicking rapidly and independently, never settling on one thing." },
          { part: "Eyes", text: "Wide, often showing white around the edge." },
          { part: "Tail", text: "Clamped down tight against the hindquarters." },
          { part: "Body", text: "Tight and quivering, weight forward, may sweat or pass droppings." },
        ],
        meaning:
          "Fear, not defiance. Horses survive by leaving, so a frightened horse is loading up to move and is barely processing anything you say. A horse in this state can run over things it would normally avoid, including you.",
        respond: [
          "Increase distance from whatever is worrying them rather than pushing them past it.",
          "Slow everything down. Slow hands, slow feet, low steady voice.",
          "Give them a way out — a frightened horse with no escape route is far more likely to strike.",
          "Let them look at what scared them. Horses settle by inspecting, not by being pulled away.",
        ],
        avoid:
          "Do not tighten down, corner or punish a frightened horse. Fear that has nowhere to go turns into an explosion.",
      },
    },
    {
      id: "dozing",
      label: "Dozing / Content",
      icon: "\u{1F634}",
      tone: "positive",
      pose: {
        ...neck(-0.2),
        Head: [0.14, 0, 0],
        Ear_L_01: [-0.12, 0, -0.44],
        Ear_R_01: [-0.12, 0, 0.44],
        Jaw: [0.1, 0, 0],
        Tail_01: [-0.04, 0, 0],
      },
      oscillators: [
        { bones: ["Chest"], axis: "x", amplitude: 0.02, frequency: 0.2 },
        { bones: TAIL, axis: "z", amplitude: 0.03, frequency: 0.35, phaseStep: 0.4 },
      ],
      focus: { bone: "Head", bias: 0.74, distance: 2.05, yaw: 0.6, pitch: 0.06 },
      card: {
        title: "Dozing / Content",
        tagline: "Ears out sideways and the head dropped — switched off, not sulking.",
        cues: [
          { part: "Ears", text: "Flopped out to the sides, sometimes called aeroplane ears." },
          { part: "Head", text: "Low, level with or below the withers, muzzle relaxed." },
          { part: "Lip", text: "Lower lip loose and often drooping." },
          { part: "Body", text: "One hind hoof tipped up and resting, weight rocked onto three legs." },
          { part: "Eyes", text: "Half closed, blinking slowly." },
        ],
        meaning:
          "Rest. Horses sleep standing by locking the stifle, and they only doze when they feel safe enough to stop watching. Read it together with the rest of the horse though: the same sideways ears and dull expression, on a horse that is NOT resting a hoof, can mean pain or illness.",
        respond: [
          "Announce yourself before touching. Waking a dozing horse by surprise is how people get struck.",
          "Let them rest — a horse that dozes around you trusts you.",
          "If the dull look comes with sweating, a raised heart rate or no interest in food, call a vet.",
        ],
        avoid:
          "Do not walk up quietly behind a dozing horse. They cannot see directly behind them and will react before they identify you.",
      },
    },
  ],
};
