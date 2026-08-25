import type { Animal, Oscillator } from "./types";

/**
 * Bone names come from the exported rig (`public/models/dog.glb`). The source
 * armature used generic names (Bone.001 ...); they are renamed to these
 * semantic names during export so the poses below stay readable.
 *
 * Local-axis conventions, verified by posing the rig in Blender and rendering:
 *   Head   +x nose up  |  -x nose down  |  +y turn away  |  +z head tilt (roll)
 *   Ear_*  +x pinned back            |  -x perked forward
 *   Spine  +x lean back / sit tall   |  -x lean forward
 *   Tail   +x tuck under             |  -x raise  |  +/-z lateral swing (wag)
 */
const TAIL = ["Tail_01", "Tail_02", "Tail_03", "Tail_04", "Tail_05", "Tail_06", "Tail_07", "Tail_08"];
const EAR_L = ["Ear_L_01", "Ear_L_02", "Ear_L_03"];
const EAR_R = ["Ear_R_01", "Ear_R_02", "Ear_R_03"];

/** Breathing and micro-motion that runs underneath every behaviour. */
const IDLE: Oscillator[] = [
  { bones: ["Spine"], axis: "x", amplitude: 0.014, frequency: 0.26 },
  { bones: ["Head"], axis: "z", amplitude: 0.01, frequency: 0.19 },
];

export const dog: Animal = {
  id: "dog",
  name: "Dog",
  icon: "\u{1F415}",
  status: "ready",
  accent: "#5eead4",
  blurb: "Domestic dog · Canis familiaris",
  model: {
    url: "/models/dog.glb",
    scale: 1,
    // Blender's +Y forward becomes -Z after the glTF Y-up conversion, so spin
    // the model a half turn to face the camera's home position on +Z.
    faceYaw: Math.PI,
    yOffset: 0,
  },
  rig: {
    spine: "Spine",
    head: "Head",
    muzzle: "Muzzle",
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
      pose: {
        Spine: [0.02, 0, 0],
        Head: [-0.03, 0, 0],
        Ear_L_01: [0.06, 0, 0],
        Ear_R_01: [0.06, 0, 0],
        Tail_01: [0.1, 0, 0],
        Tail_02: [0.06, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.05, frequency: 0.5, phaseStep: 0.3, falloff: 1.05 },
      ],
      focus: { bone: "Spine", bias: 0.15, distance: 3.05, yaw: 0.5, pitch: 0.16 },
      card: {
        title: "Relaxed / Neutral",
        tagline: "The baseline. Learn this one first, because every other signal is a change from here.",
        cues: [
          { part: "Ears", text: "Resting in their natural position, neither pinned nor straining forward." },
          { part: "Mouth", text: "Loose and slightly open, tongue soft, no tension at the corners." },
          { part: "Tail", text: "Carried at mid height, moving in a slow and easy sway." },
          { part: "Body", text: "Weight evenly settled, muscles soft, breathing slow and even." },
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
        Spine: [-0.02, 0, 0],
        Head: [0.05, 0, 0],
        Ear_L_01: [-0.12, 0, 0],
        Ear_R_01: [-0.12, 0, 0],
        Tail_01: [-0.34, 0, 0],
        Tail_02: [-0.2, 0, 0],
        Tail_03: [-0.12, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.3, frequency: 3.3, phaseStep: 0.42, falloff: 1.07 },
        { bones: ["Spine"], axis: "z", amplitude: 0.035, frequency: 1.65 },
        { bones: ["Head"], axis: "y", amplitude: 0.03, frequency: 1.65 },
      ],
      focus: { bone: "Tail_03", bias: 0.45, distance: 2.95, yaw: -2.2, pitch: 0.2 },
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
        Spine: [-0.07, 0, 0],
        Head: [0.13, 0, 0],
        Ear_L_01: [-0.3, 0, 0],
        Ear_R_01: [-0.3, 0, 0],
        Ear_L_02: [-0.12, 0, 0],
        Ear_R_02: [-0.12, 0, 0],
        Tail_01: [-0.5, 0, 0],
        Tail_02: [-0.28, 0, 0],
        Tail_03: [-0.14, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.07, frequency: 5.6, phaseStep: 0.2, falloff: 1.02 },
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.02, frequency: 0.9 },
      ],
      focus: { bone: "Head", bias: 0.75, distance: 2.25, yaw: 0.3, pitch: 0.08 },
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
        Spine: [0.15, 0, 0],
        Head: [-0.2, 0.12, 0],
        Ear_L_01: [0.45, 0, 0.06],
        Ear_R_01: [0.45, 0, -0.06],
        Ear_L_02: [0.18, 0, 0],
        Ear_R_02: [0.18, 0, 0],
        Tail_01: [0.55, 0, 0],
        Tail_02: [0.4, 0, 0],
        Tail_03: [0.3, 0, 0],
        Tail_04: [0.2, 0, 0],
      },
      oscillators: [
        { bones: ["Spine"], axis: "x", amplitude: 0.007, frequency: 7.5 },
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.025, frequency: 1.4 },
      ],
      focus: { bone: "Tail_02", bias: 0.45, distance: 2.9, yaw: -2.0, pitch: 0.22 },
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
        Spine: [0.22, 0, 0],
        Head: [-0.26, 0.5, 0.1],
        Ear_L_01: [0.62, 0, 0.2],
        Ear_R_01: [0.62, 0, -0.2],
        Ear_L_02: [0.24, 0, 0],
        Ear_R_02: [0.24, 0, 0],
        Tail_01: [0.72, 0, 0],
        Tail_02: [0.5, 0, 0],
        Tail_03: [0.36, 0, 0],
        Tail_04: [0.24, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.07, frequency: 2.1, phaseStep: 0.3 },
        { bones: ["Spine"], axis: "x", amplitude: 0.009, frequency: 9 },
      ],
      focus: { bone: "Head", bias: 0.65, distance: 2.45, yaw: -0.8, pitch: 0.1 },
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
      pose: {
        Spine: [-0.17, 0, 0],
        Head: [0.07, 0, 0.3],
        Ear_L_01: [-0.26, 0, 0],
        Ear_R_01: [-0.26, 0, 0],
        Tail_01: [-0.45, 0, 0],
        Tail_02: [-0.26, 0, 0],
        Tail_03: [-0.15, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.38, frequency: 4.9, phaseStep: 0.5, falloff: 1.06 },
        { bones: ["Spine"], axis: "z", amplitude: 0.05, frequency: 2.45 },
        { bones: ["Head"], axis: "z", amplitude: 0.06, frequency: 1.2 },
      ],
      focus: { bone: "Spine", bias: 0.2, distance: 2.95, yaw: 0.65, pitch: 0.13 },
      card: {
        title: "Playful / Play Invitation",
        tagline: "An explicit offer: everything that follows is play, not conflict.",
        cues: [
          { part: "Posture", text: "Front end dropped, rear end up. The classic play bow." },
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
