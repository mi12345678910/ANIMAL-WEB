import type { Animal, Oscillator } from "./types";

/**
 * Rig: cat, exported from `cat.blend` by `tools/export_cat_rig.py`.
 *
 * The source arrived already skinned with UVs and a working colour map — the
 * cleanest of the three. The export script fixes one thing: the tail was
 * weighted across three coincident bone chains, so driving one would have moved
 * only a third of it. Those are merged into a single 5-bone tail.
 *
 * Local-axis conventions, verified by posing the rig in Blender and rendering:
 *   Head    +x nose down            | -x nose up   | +z tilt
 *   Neck    +x lowers / tucks head  | -x raises head
 *   Spine   +x front end down (bow) | -x front end up (rears back)
 *   Ear_*   +x forward              | -x pinned back | +/-z splay outward
 *   Tail_*  +x raise                | -x tuck under  | +/-z lateral swish
 *
 * Note Neck is inverted relative to the horse — it pulls the head DOWN on +x.
 * Every rig in this project has needed its own probe; none of them agree.
 *
 * LIMITATION: there is exactly one spine bone, running rear to front, so it can
 * only pivot the front end against the rear. A raised mid-back — the arched
 * "Halloween cat" — is not reachable on this rig, which is why the defensive
 * behaviour below is built as a rear-back rather than an arch.
 *
 * Cats invert two rules people carry over from dogs: a tail held straight up is
 * a friendly greeting rather than arousal, and a swishing tail means irritation
 * rather than happiness. Both are represented below on purpose.
 */
const TAIL = ["Tail_01", "Tail_02", "Tail_03", "Tail_04", "Tail_05"];
const TAIL_TIP = ["Tail_03", "Tail_04", "Tail_05"];
const EAR_L = ["Ear_L_01"];
const EAR_R = ["Ear_R_01"];

/** Breathing and micro-motion under every behaviour. */
const IDLE: Oscillator[] = [
  { bones: ["Spine"], axis: "x", amplitude: 0.01, frequency: 0.3 },
  { bones: ["Head"], axis: "z", amplitude: 0.007, frequency: 0.21 },
];

export const cat: Animal = {
  id: "cat",
  name: "Cat",
  icon: "\u{1F408}",
  status: "ready",
  accent: { light: "#6d3fd4", dark: "#c4b5fd" },
  blurb: "Domestic cat · Felis catus",
  model: {
    url: "/models/cat.glb",
    // Source is ~0.44 units tall; scale up so the scene's absolute values
    // (shadow camera bounds, contact-shadow radius) still fit.
    scale: 4.5,
    // Muzzle already points +Z after the glTF Y-up conversion.
    faceYaw: 0,
    yOffset: 0,
  },
  rig: {
    spine: "Spine",
    head: "Head",
    muzzle: "Jaw",
    ears: { left: EAR_L, right: EAR_R },
    tail: TAIL,
  },
  idle: IDLE,
  starterQuestions: [
    "Why does my cat bite me while I'm petting them?",
    "What does it mean when my cat's tail is straight up?",
    "My cat is swishing its tail — is it happy?",
    "Should I rub my cat's belly when they roll over?",
  ],
  behaviors: [
    {
      id: "relaxed",
      label: "Relaxed / Content",
      icon: "\u{1F33F}",
      tone: "positive",
      pose: {
        Spine: [0.02, 0, 0],
        Neck: [0.03, 0, 0],
        Head: [0.02, 0, 0],
        Ear_L_01: [0.06, 0, -0.05],
        Ear_R_01: [0.06, 0, 0.05],
        Tail_01: [0.24, 0, 0],
        Tail_02: [0.15, 0, 0],
        Tail_03: [0.09, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.06, frequency: 0.5, phaseStep: 0.4, falloff: 1.12 },
      ],
      focus: { bone: "Spine", bias: 0.1, distance: 2.9, yaw: 0.6, pitch: 0.13 },
      card: {
        title: "Relaxed / Content",
        tagline: "The baseline. Cats signal in small movements, so learn what calm looks like first.",
        cues: [
          { part: "Ears", text: "Upright and facing forward, drifting rather than locked." },
          { part: "Eyes", text: "Soft and half closed. A slow blink is a cat telling you it feels safe." },
          { part: "Tail", text: "Carried loosely with a gentle curve, moving slowly if at all." },
          { part: "Body", text: "Loose and settled, sitting or lying with the weight relaxed." },
          { part: "Whiskers", text: "Fanned out and forward, not pressed flat against the cheeks." },
        ],
        meaning:
          "The cat feels safe and is not asking anything of you. Cats communicate far more quietly than dogs, so recognising this baseline is what lets you notice the small changes that come before a swat.",
        respond: [
          "Offer a finger at nose height and let them come to you rather than reaching over.",
          "Return a slow blink. It is one of the few gestures cats reliably read from us.",
          "Stick to the head, cheeks and chin, which is where most cats prefer contact.",
        ],
      },
    },
    {
      id: "greeting",
      label: "Friendly / Tail Up",
      icon: "\u{1F49C}",
      tone: "positive",
      pose: {
        Spine: [0.02, 0, 0],
        Neck: [-0.1, 0, 0],
        Head: [0.04, 0, 0],
        Ear_L_01: [0.22, 0, -0.03],
        Ear_R_01: [0.22, 0, 0.03],
        Tail_01: [0.86, 0, 0],
        Tail_02: [0.5, 0, 0],
        Tail_03: [0.24, 0, 0],
        Tail_04: [0.08, 0, 0],
        Tail_05: [0.16, 0, 0],
      },
      oscillators: [
        { bones: TAIL_TIP, axis: "z", amplitude: 0.09, frequency: 1.1, phaseStep: 0.5 },
        { bones: ["Spine"], axis: "z", amplitude: 0.02, frequency: 0.9 },
      ],
      focus: { bone: "Tail_02", bias: 0.28, distance: 2.85, yaw: 1.55, pitch: 0.14 },
      card: {
        title: "Friendly Greeting / Tail Up",
        tagline: "A tail held straight up is about as unambiguous as cats get. This one is an invitation.",
        cues: [
          { part: "Tail", text: "Vertical, often with a small hook at the tip like a question mark." },
          { part: "Ears", text: "Pricked forward, sometimes with a slight sideways swivel." },
          { part: "Body", text: "Walking toward you, may rub their cheek or flank against your legs." },
          { part: "Voice", text: "Often a short chirp or trill rather than a full meow." },
        ],
        meaning:
          "A genuine friendly approach. Kittens raise their tails to greet their mother and cats keep the gesture for company they trust. The cheek rub that usually follows is scent marking — being claimed is a compliment.",
        respond: [
          "Say hello and let them make contact on their terms.",
          "Scratch the cheeks, chin or base of the ears rather than the belly or the tail base.",
          "This is a good moment for play, feeding or a health check.",
        ],
      },
    },
    {
      id: "alert",
      label: "Alert / Interested",
      icon: "\u{1F441}",
      tone: "neutral",
      pose: {
        Spine: [-0.03, 0, 0],
        Neck: [-0.16, 0, 0],
        Head: [0.06, 0, 0],
        Ear_L_01: [0.34, 0, -0.02],
        Ear_R_01: [0.34, 0, 0.02],
        Tail_01: [-0.16, 0, 0],
        Tail_02: [-0.08, 0, 0],
      },
      oscillators: [
        // Only the tip twitches — the giveaway that a still cat is not a calm one.
        { bones: TAIL_TIP, axis: "z", amplitude: 0.24, frequency: 2.8, phaseStep: 0.6, falloff: 1.2 },
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.02, frequency: 0.9 },
      ],
      focus: { bone: "Head", bias: 0.76, distance: 2.05, yaw: 0.35, pitch: 0.05 },
      card: {
        title: "Alert / Interested",
        tagline: "Completely still except the tip of the tail. That twitch is the tell.",
        cues: [
          { part: "Ears", text: "Both swivelled hard forward and aimed at one point." },
          { part: "Eyes", text: "Wide and fixed, pupils often enlarged." },
          { part: "Tail", text: "Held low and still, with the last few inches twitching." },
          { part: "Body", text: "Frozen, weight gathered, sometimes with a slow crouch." },
        ],
        meaning:
          "Concentration and rising arousal — hunting attention rather than affection. A cat this focused has very little attention left for you, and the same posture precedes both a pounce on a toy and a pounce on your ankle.",
        respond: [
          "Follow the gaze. Knowing the target tells you what happens next.",
          "Redirect it onto a wand toy if the target is your hands or feet.",
          "Let them finish looking. Interrupting a fixated cat often earns a swat.",
        ],
        avoid:
          "Do not use your hands as the toy. A cat that learns skin is prey keeps that habit for years.",
      },
    },
    {
      id: "irritated",
      label: "Overstimulated / Enough",
      icon: "\u{1F62E}",
      tone: "caution",
      pose: {
        Spine: [0.04, 0, 0],
        Neck: [0.02, 0, 0],
        Head: [0.05, 0, 0],
        Ear_L_01: [-0.2, 0, -0.3],
        Ear_R_01: [-0.2, 0, 0.3],
        Tail_01: [-0.1, 0, 0],
      },
      oscillators: [
        // A lash, not a wag: big, fast and driven from the base.
        { bones: TAIL, axis: "z", amplitude: 0.46, frequency: 2.6, phaseStep: 0.5, falloff: 1.15 },
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.09, frequency: 1.7, sign: [1, -1] },
        { bones: ["Spine"], axis: "x", amplitude: 0.012, frequency: 5 },
      ],
      focus: { bone: "Tail_02", bias: 0.42, distance: 2.85, yaw: -2.0, pitch: 0.17 },
      card: {
        title: "Overstimulated / Enough",
        tagline: "A swishing tail on a cat is the opposite of a wagging tail on a dog. This is a complaint.",
        cues: [
          { part: "Tail", text: "Thrashing or thumping, driven from the base rather than the tip." },
          { part: "Ears", text: "Rotating out to the sides — often called aeroplane ears." },
          { part: "Skin", text: "Rippling or twitching along the back, especially near the tail base." },
          { part: "Body", text: "Stiffening, head turning toward your hand, may stop purring abruptly." },
        ],
        meaning:
          "Petting-induced overstimulation. The cat enjoyed the contact and has now had too much, and this is the warning that comes before the bite or swat. Most 'unprovoked' cat bites are this signal being missed.",
        respond: [
          "Stop petting immediately and take your hand away.",
          "Let them move off. Do not follow or try to soothe with more contact.",
          "Learn their limit and stop a few strokes before it. Short and frequent beats long and once.",
          "Stick to head and cheeks; the belly and tail base are the usual triggers.",
        ],
        avoid:
          "Never punish a swat that followed this warning. Suppressing it removes the warning, not the irritation.",
      },
    },
    {
      id: "fearful",
      label: "Fearful / Crouched",
      icon: "\u{1F63F}",
      tone: "alert",
      pose: {
        Spine: [0.16, 0, 0],
        Neck: [0.34, 0, 0],
        Head: [0.12, 0, 0],
        Ear_L_01: [-0.52, 0, -0.18],
        Ear_R_01: [-0.52, 0, 0.18],
        Tail_01: [-0.6, 0, 0],
        Tail_02: [-0.42, 0, 0],
        Tail_03: [-0.3, 0, 0],
        Tail_04: [-0.18, 0, 0],
      },
      oscillators: [
        { bones: ["Spine"], axis: "x", amplitude: 0.008, frequency: 8.5 },
        { bones: ["Ear_L_01", "Ear_R_01"], axis: "x", amplitude: 0.03, frequency: 1.6 },
      ],
      focus: { bone: "Spine", bias: 0.2, distance: 2.7, yaw: 0.7, pitch: 0.1 },
      card: {
        title: "Fearful / Crouched",
        tagline: "A cat trying to disappear. Everything here is about becoming smaller.",
        cues: [
          { part: "Body", text: "Crouched low with the legs tucked underneath, ready to bolt." },
          { part: "Ears", text: "Flattened back and down against the skull." },
          { part: "Tail", text: "Wrapped tight against the body or tucked underneath." },
          { part: "Eyes", text: "Wide with large round pupils, staring or darting for an exit." },
          { part: "Whiskers", text: "Pulled back flat against the cheeks." },
        ],
        meaning:
          "Fear. The cat wants to leave and is looking for a way out. A frightened cat that cannot escape does not stay frightened — it becomes defensive, and a cornered cat has five weapons.",
        respond: [
          "Stop approaching and give them a clear escape route.",
          "Drop below their eye level and turn side on; looming is what a predator does.",
          "Let them hide. A cat under the bed is a cat calming down.",
          "Do not corner, reach into hiding places, or pull them out.",
        ],
        avoid:
          "Never trap a frightened cat to comfort it. That is how a fear response becomes a bite.",
      },
    },
    {
      id: "defensive",
      label: "Defensive / Threat",
      icon: "\u{1F63E}",
      tone: "alert",
      pose: {
        Spine: [-0.34, 0, 0],
        Neck: [0.3, 0, 0],
        Head: [-0.08, 0, 0],
        Ear_L_01: [-0.56, 0, -0.12],
        Ear_R_01: [-0.56, 0, 0.12],
        Jaw: [0.12, 0, 0],
        Tail_01: [0.58, 0, 0],
        Tail_02: [0.4, 0, 0],
        Tail_03: [0.28, 0, 0],
      },
      oscillators: [
        { bones: TAIL, axis: "z", amplitude: 0.12, frequency: 1.6, phaseStep: 0.35 },
        { bones: ["Spine"], axis: "x", amplitude: 0.012, frequency: 6 },
      ],
      focus: { bone: "Spine", bias: 0.15, distance: 2.85, yaw: 1.5, pitch: 0.09 },
      card: {
        title: "Defensive Threat",
        tagline: "Frightened rather than fearless, and one step from lashing out.",
        cues: [
          { part: "Weight", text: "Rocked back onto the hind legs, front end raised and pulled away, a paw ready to swat." },
          { part: "Ears", text: "Flat back against the head." },
          { part: "Mouth", text: "Open, hissing or spitting, teeth visible." },
          { part: "Tail", text: "Bristled into a bottle brush, held rigid or arched." },
          { part: "Back", text: "Arched high with the fur standing on end, turned side on to look bigger. The model cannot show the arch, so watch for it on a real cat." },
        ],
        meaning:
          "Defensive aggression, driven by fear rather than confidence. The side-on arch and raised fur are a bluff to look bigger, and a cat that has to bluff is a cat that feels cornered. Everything after this is teeth and claws.",
        respond: [
          "Back away and give them room. Do not stand your ground.",
          "Remove whatever triggered it — another animal, a noise, a person — rather than moving the cat.",
          "Leave them alone until the fur flattens and the tail drops. That can take twenty minutes or more.",
          "If two cats in the house do this to each other, separate them and reintroduce slowly.",
        ],
        avoid:
          "Do not pick up, corner or scold a cat in this state. Handling it now will get you bitten and will teach the cat that you are part of the threat.",
      },
    },
  ],
};
