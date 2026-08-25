import type { Animal, Oscillator } from "./types";

/**
 * Rig: German Shepherd, exported from "New 3D Dog Model.blend" by
 * `tools/export_shepherd_rig.py`. The source is a Rigify rig whose DEF- bones
 * are renamed to the semantic names used below.
 *
 * Note the Rigify naming is misleading: its "DEF-spine/.001/.002/.003" chain
 * runs REARWARD from the hips and is actually the tail. The forward body chain
 * is .004 -> .006 -> .007 -> .008 -> .009 -> .010 -> .011. The export script
 * resolves this, so the names here reflect the geometry.
 *
 * Local-axis conventions, verified by posing the rig in Blender and rendering.
 * These are INVERTED from the previous seated model on head, ears and tail, so
 * old pose values must not be carried across:
 *   Head    +x nose down | -x nose up | +y turn away | +z head tilt (roll)
 *   Ear_*   +x forward / perked       | -x back / flattened | +/-z splay
 *   Chest   +x crouch, round down     | -x lift and extend
 *   Tail_*  +x raise                  | -x tuck under       | +/-z wag
 *
 * Unlike the previous model this dog is STANDING, which finally makes a real
 * play bow reachable.
 */
const TAIL = ["Tail_01", "Tail_02", "Tail_03", "Tail_04"];
const EAR_L = ["Ear_L_01", "Ear_L_02"];
const EAR_R = ["Ear_R_01", "Ear_R_02"];

/**
 * Subtle motion under any procedural behaviour. The "relaxed" behaviour does
 * not use this — it plays the model's own baked breathing clip instead.
 */
const IDLE: Oscillator[] = [
  { bones: ["Chest"], axis: "x", amplitude: 0.012, frequency: 0.28 },
  { bones: ["Head"], axis: "z", amplitude: 0.008, frequency: 0.2 },
];

export const dog: Animal = {
  id: "dog",
  name: "Dog",
  icon: "\u{1F415}",
  status: "ready",
  accent: { light: "#0b7a6b", dark: "#5eead4" },
  blurb: "German Shepherd · Canis familiaris",
  model: {
    url: "/models/dog.glb",
    // Source is ~0.70 units tall; scale up so the scene's absolute values
    // (shadow camera bounds, contact-shadow radius, light positions) still fit.
    scale: 2.85,
    // This rig already faces +Z after the glTF Y-up conversion, which is the
    // camera's "front". No correction needed (the old model needed a half turn).
    faceYaw: 0,
    yOffset: 0,
  },
  rig: {
    spine: "Chest",
    head: "Head",
    muzzle: "Jaw",
    ears: { left: EAR_L, right: EAR_R },
    tail: TAIL,
  },
  idle: IDLE,
  starterQuestions: [
    "Why is my dog panting and looking away?",
    "Is a wagging tail always friendly?",
    "What does yawning mean when nothing is tiring?",
    "How should I greet a dog I have never met?",
  ],
  behaviors: [
    {
      id: "relaxed",
      label: "Relaxed / Neutral",
      icon: "\u{1F33F}",
      tone: "positive",
      // The GLB ships with a real 31-frame breathing loop. AnimalRig plays a
      // baked clip when the model actually contains it, so this behaviour uses
      // the authored animation and ignores the procedural pose below.
      clip: "1 type_Idle Breathing",
      pose: {
        Chest: [0.02, 0, 0],
        Head: [0.02, 0, 0],
        Tail_01: [-0.06, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.05, frequency: 0.5, phaseStep: 0.5, falloff: 1.1 },
      ],
      focus: { bone: "Chest", bias: 0.1, distance: 2.95, yaw: 0.55, pitch: 0.14 },
      card: {
        title: "Relaxed / Neutral",
        tagline: "The baseline. Learn this one first, because every other signal is a change from here.",
        cues: [
          { part: "Ears", text: "Resting in their natural position, neither pinned nor straining forward." },
          { part: "Mouth", text: "Loose and slightly open, tongue soft, no tension at the corners." },
          { part: "Tail", text: "Hanging at mid height in an easy curve, moving gently." },
          { part: "Body", text: "Weight evenly over all four feet, muscles soft, breathing slow and even." },
          { part: "Eyes", text: "Soft and blinking normally; the gaze wanders rather than fixing." },
        ],
        meaning:
          "The dog feels safe and is not asking anything of you. This is the posture to recognise instantly, because reading stress depends on knowing what calm looks like on this particular dog.",
        respond: [
          "Let the dog be. Calm does not need intervention.",
          "This is the ideal moment for gentle handling, grooming or training.",
          "Take a mental snapshot: ear set, tail height, mouth tension. That is your reference point.",
        ],
      },
    },
    {
      id: "happy",
      label: "Happy / Tail Wag",
      icon: "\u{1F49A}",
      tone: "positive",
      pose: {
        Chest: [-0.03, 0, 0],
        Neck_01: [-0.05, 0, 0],
        Head: [-0.06, 0, 0],
        Ear_L_01: [0.16, 0, 0],
        Ear_R_01: [0.16, 0, 0],
        Tail_01: [0.34, 0, 0],
        Tail_02: [0.2, 0, 0],
        Tail_03: [0.12, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.34, frequency: 3.2, phaseStep: 0.55, falloff: 1.12 },
        { bones: ["Chest"], axis: "z", amplitude: 0.04, frequency: 1.6 },
        { bones: ["Hips"], axis: "z", amplitude: 0.05, frequency: 1.6 },
        { bones: ["Head"], axis: "y", amplitude: 0.03, frequency: 1.6 },
      ],
      focus: { bone: "Tail_02", bias: 0.45, distance: 2.9, yaw: -2.3, pitch: 0.2 },
      card: {
        title: "Happy / Loose Tail Wag",
        tagline: "Not every wag is friendly. It is the looseness that carries the meaning.",
        cues: [
          { part: "Tail", text: "Broad sweeping wag at mid to high carriage; the whole rear end follows it." },
          { part: "Body", text: "Curved and wiggly rather than straight and stiff, often a soft C shape." },
          { part: "Ears", text: "Naturally forward or neutral, without hard tension." },
          { part: "Mouth", text: "Open and relaxed with long corners. Often read as a smile; it is simply low tension." },
        ],
        meaning:
          "A loose sweeping wag paired with a wiggly body means genuine friendly excitement. The tail alone is not the signal: a high, stiff, fast vibrating tail means arousal, and a low fast wag often means appeasement. Read the tail together with the body and the face.",
        respond: [
          "Greet calmly. Matching high excitement with high excitement can tip it into over-arousal.",
          "Let the dog approach you rather than reaching over their head.",
          "Good moment for play or a walk, since the dog is inviting interaction.",
        ],
        avoid:
          "Do not assume any wag means safe to touch. Check tail height and stiffness, and whether the body is loose or rigid.",
      },
    },
    {
      id: "alert",
      label: "Alert / Ears Up",
      icon: "\u{1F442}",
      tone: "neutral",
      pose: {
        Chest: [-0.08, 0, 0],
        Neck_01: [-0.12, 0, 0],
        Neck_02: [-0.1, 0, 0],
        Head: [-0.12, 0, 0],
        Ear_L_01: [0.32, 0, 0],
        Ear_R_01: [0.32, 0, 0],
        Tail_01: [0.46, 0, 0],
        Tail_02: [0.26, 0, 0],
        Tail_03: [0.14, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.07, frequency: 5.5, phaseStep: 0.25, falloff: 1.04 },
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.02, frequency: 0.9 },
      ],
      focus: { bone: "Head", bias: 0.7, distance: 2.3, yaw: 0.35, pitch: 0.06 },
      card: {
        title: "Alert / Orienting",
        tagline: "Something has the dog's attention. What happens next depends on what they decide it is.",
        cues: [
          { part: "Ears", text: "Swivelled hard forward, aimed at whatever they have noticed." },
          { part: "Head", text: "Raised and still, eyes fixed in one direction." },
          { part: "Tail", text: "High and rigid, sometimes with a fast, small vibrating wag." },
          { part: "Body", text: "Weight shifted forward onto the front legs; movement stops." },
        ],
        meaning:
          "This is arousal rather than emotion, and the dog is gathering information. It is a fork in the road: it can settle back to neutral, tip into play, or escalate into a defensive display. A high stiff tail with a fast tremor is high arousal and deserves caution, even though it is technically wagging.",
        respond: [
          "Give the dog a second to process before you interrupt.",
          "Follow their gaze. Knowing the trigger tells you what comes next.",
          "If you need to move them on, call them away cheerfully rather than grabbing the collar.",
        ],
        avoid:
          "Do not lean over or restrain a dog in this state. A dog fixated on a trigger has very little attention left for you.",
      },
    },
    {
      id: "anxious",
      label: "Anxious / Tucked Tail",
      icon: "\u{1F61F}",
      tone: "caution",
      pose: {
        Chest: [0.18, 0, 0],
        Spine_01: [0.1, 0, 0],
        Neck_01: [0.16, 0, 0],
        Neck_02: [0.12, 0, 0],
        Head: [0.2, 0.14, 0],
        Ear_L_01: [-0.42, 0, 0.08],
        Ear_R_01: [-0.42, 0, -0.08],
        Tail_01: [-0.55, 0, 0],
        Tail_02: [-0.36, 0, 0],
        Tail_03: [-0.24, 0, 0],
        Tail_04: [-0.14, 0, 0],
      },
      oscillators: [
        { bones: ["Chest"], axis: "x", amplitude: 0.007, frequency: 7.5 },
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.022, frequency: 1.4 },
      ],
      focus: { bone: "Tail_01", bias: 0.4, distance: 2.85, yaw: -2.1, pitch: 0.2 },
      card: {
        title: "Anxious / Worried",
        tagline: "The dog is telling you they are uncomfortable, quietly, and while they still can.",
        cues: [
          { part: "Tail", text: "Low or tucked toward the belly. Any wag is fast, small and low." },
          { part: "Ears", text: "Held back and flattened against the head." },
          { part: "Body", text: "Lowered, weight shifted backwards, ready to retreat." },
          { part: "Face", text: "Lip licking, yawning when not tired, and whale eye: the whites showing as they look away without turning their head." },
        ],
        meaning:
          "These are stress signals and they are a request for space. They matter enormously because they come before growling. A dog whose quiet signals are repeatedly ignored learns that only louder signals work.",
        respond: [
          "Increase distance from whatever is worrying them. That is the fastest way to help.",
          "Stop the interaction rather than pushing through it, even a friendly one like petting.",
          "Let them retreat to a safe spot and do not follow.",
          "Note the trigger. Patterns you can name are patterns you can work on.",
        ],
        avoid:
          "Never punish these signals. Suppressing the warning does not remove the fear, it removes your early warning system.",
      },
    },
    {
      id: "appeasing",
      label: "Fearful / Appeasing",
      icon: "\u{1FAE3}",
      tone: "alert",
      pose: {
        Chest: [0.3, 0, 0],
        Spine_01: [0.18, 0, 0],
        Spine_02: [0.12, 0, 0],
        Neck_01: [0.24, 0, 0],
        Neck_02: [0.18, 0, 0],
        Head: [0.24, 0.5, 0.1],
        Ear_L_01: [-0.58, 0, 0.2],
        Ear_R_01: [-0.58, 0, -0.2],
        Tail_01: [-0.75, 0, 0],
        Tail_02: [-0.5, 0, 0],
        Tail_03: [-0.34, 0, 0],
        Tail_04: [-0.2, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.07, frequency: 2.2, phaseStep: 0.4 },
        { bones: ["Chest"], axis: "x", amplitude: 0.009, frequency: 9 },
      ],
      focus: { bone: "Head", bias: 0.6, distance: 2.5, yaw: -0.9, pitch: 0.08 },
      card: {
        title: "Fearful / Appeasing",
        tagline: "A dog trying to make themselves small and end the interaction peacefully.",
        cues: [
          { part: "Head", text: "Turned deliberately away, avoiding direct eye contact." },
          { part: "Ears", text: "Flat against the skull and splayed outward." },
          { part: "Tail", text: "Tucked tightly, sometimes with a low quick wag." },
          { part: "Body", text: "Crouched and shrinking, weight far back; may roll to expose the belly." },
        ],
        meaning:
          "Appeasement behaviour: the dog is actively signalling that they mean no harm and would like the pressure to stop. A belly shown here is not a request for a belly rub, it is a de-escalation gesture. This is the last quiet step before a dog feels they have no option but to snap.",
        respond: [
          "Stop approaching and turn your body side on rather than facing them square.",
          "Look away, soften your posture, and let them come to you if they choose.",
          "Give them a clear escape route and never corner a frightened dog.",
          "If this is a recurring pattern, work with a qualified force-free behaviourist.",
        ],
        avoid:
          "Do not reach over the head, hug, or reassure by leaning in. Cornering a dog in this state is how bites happen.",
      },
    },
    {
      id: "playful",
      label: "Playful / Invitation",
      icon: "\u{1F3BE}",
      tone: "positive",
      /*
       * NOTE: this is a play *invitation*, not a full play bow.
       *
       * A textbook bow needs the chest translated down toward the ground while
       * the hips stay up. The pose engine applies bone ROTATIONS only, and on
       * an FK rig rotating the forelegs swings the legs without moving the
       * torso — so the chest cannot actually descend. What is achievable is a
       * strong forward dip through the spine with the rear raised, forelegs
       * reaching forward, head up and a fast high wag, which still reads as a
       * play solicitation. Adding root translation to the engine would allow
       * the real thing.
       */
      pose: {
        Spine_01: [0.34, 0, 0],
        Spine_02: [0.3, 0, 0],
        Chest: [0.26, 0, 0],
        Hips: [-0.26, 0, 0],
        ForeLeg_L_01: [0.85, 0, 0],
        ForeLeg_R_01: [0.85, 0, 0],
        ForeLeg_L_02: [-0.85, 0, 0],
        ForeLeg_R_02: [-0.85, 0, 0],
        Neck_01: [-0.3, 0, 0],
        Neck_02: [-0.24, 0, 0],
        Head: [-0.34, 0, 0.24],
        Ear_L_01: [0.28, 0, 0],
        Ear_R_01: [0.28, 0, 0],
        Tail_01: [0.5, 0, 0],
        Tail_02: [0.3, 0, 0],
        Tail_03: [0.16, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.4, frequency: 4.8, phaseStep: 0.6, falloff: 1.12 },
        { bones: ["Hips"], axis: "z", amplitude: 0.06, frequency: 2.4 },
        { bones: ["Head"], axis: "z", amplitude: 0.05, frequency: 1.2 },
      ],
      focus: { bone: "Chest", bias: 0.2, distance: 2.9, yaw: 0.6, pitch: 0.12 },
      card: {
        title: "Playful / Play Invitation",
        tagline: "An explicit offer: everything that follows is play, not conflict.",
        cues: [
          { part: "Posture", text: "Front end dropped low with the rear end up. The classic play bow." },
          { part: "Head", text: "Tilted, with bright soft eyes and an open relaxed mouth." },
          { part: "Movement", text: "Bouncy, exaggerated and inefficient. Play looks deliberately clumsy." },
          { part: "Tail", text: "High and wagging fast and loosely across a wide arc." },
        ],
        meaning:
          "The play bow is a metasignal: it frames the chasing, wrestling and mouthing that follows as friendly. Dogs use it to reset play when things get too intense. Its presence is one of the strongest indicators that an interaction is genuinely playful.",
        respond: [
          "Accept the invitation. Play is how dogs build confidence and burn energy.",
          "Watch for regular pauses. Healthy play self-interrupts; play that never breaks is tipping into over-arousal.",
          "Do a consent check by holding still for a moment. A dog that re-invites is still enjoying it.",
        ],
        avoid:
          "Do not let play run without breaks. If one dog is always the one being chased and stops bowing, step in.",
      },
    },
  ],
};
