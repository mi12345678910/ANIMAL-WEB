/**
 * The body-language reference the chat answers from.
 *
 * Transcribed from "Animal資料" (35 pages, 58 signals: 19 horse, 24 cat,
 * 15 dog). Each entry keeps the source document's own two-part shape —
 * what the signal means, and what the reader should do about it — because that
 * is exactly the shape the chat renders back. `page` is the page in the source
 * PDF, surfaced as a citation chip under the answer.
 *
 * This sits alongside the behaviour cards in the animal registry rather than
 * replacing them: the cards drive the 3D model and are limited to poses the
 * rigs can actually show, while this covers everything else a reader might ask
 * about — purring, hissing, yawning, kneading, bolting — none of which the
 * models can demonstrate.
 *
 * `keywords` exists only for words a reader would plausibly type that do not
 * appear anywhere in `meaning` or `whatToDo`. Do not mirror words already in
 * the text; the retriever already indexes those.
 */

export interface GuideEntry {
  id: string;
  animalId: "dog" | "cat" | "horse";
  /** Section heading, used as the citation label. */
  title: string;
  /** Page in the source PDF. */
  page: number;
  /** Extra search terms not present in the body text. */
  keywords?: string[];
  /** What the signal indicates. Kept to plain language. */
  meaning: string;
  /** Actions for the reader. First item is used as the one-line answer. */
  whatToDo: string[];
}

export const GUIDE: GuideEntry[] = [
  // ─── HORSE ──────────────────────────────────────────────────────────────
  // Ears. The source calls them the horse's emotional "steering wheel":
  // forward = curious or alert, backward = unhappy or listening behind,
  // relaxed to both sides = relaxed.
  {
    id: "horse-ears-erect",
    animalId: "horse",
    title: "Both Ears Erect",
    page: 2,
    keywords: ["pricked", "up"],
    meaning:
      "Interest in something. The horse has noticed something and is gathering information about it.",
    whatToDo: [
      "Stay calm and relaxed, and let the horse look at whatever caught its attention rather than forcing it away, as long as there is no immediate danger.",
      "This focused state is a good moment for quiet training or gentle interaction.",
    ],
  },
  {
    id: "horse-ears-pinned",
    animalId: "horse",
    title: "Both Ears Pinned Back",
    page: 2,
    keywords: ["angry", "mad", "aggressive", "flat"],
    meaning:
      "Anger. Both ears pinned flat against the neck warns other horses or people not to provoke it further. Sometimes accompanied by rolling whites of the eyes or baring teeth.",
    whatToDo: [
      "Stop what you are doing immediately and give the horse space.",
      "Do not approach, reach toward its face, or make sudden movements — this position strongly signals an impending bite or kick.",
      "Look around for whatever is irritating the horse, remove it, and wait for the posture to soften before re-engaging.",
    ],
  },
  {
    id: "horse-ears-turned-back",
    animalId: "horse",
    title: "One or Both Ears Turned Back",
    page: 2,
    keywords: ["riding", "saddle", "tired"],
    meaning:
      "The horse might be angry, listening to sounds behind it, scared, or tired. If you are riding, it usually means the horse is paying attention to your commands.",
    whatToDo: [
      "While riding, keep communicating clearly with your seat, legs and reins — the horse is actively listening to your cues.",
      "On the ground, check whether something behind the horse is startling it, or whether it is showing physical fatigue or minor frustration.",
      "Speak in a soothing voice to keep its focus on you.",
    ],
  },
  {
    id: "horse-ears-forward",
    animalId: "horse",
    title: "Both Ears Pointed Forward",
    page: 2,
    keywords: ["curious", "pricked"],
    meaning:
      "Listening. But if the forward ears are stiff and combined with flared nostrils, it is a signal of fear or danger rather than curiosity.",
    whatToDo: [
      "If the horse is relaxed and curious, carry on normally — it is simply engaged with its environment.",
      "If the nostrils are flared and the body is stiff, do not force the horse toward whatever is scaring it. Stand still, speak softly, and give it time to evaluate the threat.",
      "Keep a safe distance in case it bolts, and gently redirect its attention back to you with basic ground exercises once it settles.",
    ],
  },
  {
    id: "horse-eyes",
    animalId: "horse",
    title: "Eyes: The Window to Emotion",
    page: 3,
    keywords: ["whale", "sclera", "staring"],
    meaning:
      "Wide eyes showing the whites mean fear or tension. A soft gaze means the horse is relaxed and comfortable.",
    whatToDo: [
      "Read the eyes together with the ears and body before deciding what a horse is feeling — no single cue is reliable on its own.",
    ],
  },
  {
    id: "horse-baring-teeth",
    animalId: "horse",
    title: "Baring Teeth",
    page: 4,
    keywords: ["showing", "lip", "curl", "smile"],
    meaning:
      "Usually that the horse is unhappy about something. If nothing appears to be making it unhappy, it can instead be a sign of affection or friendliness.",
    whatToDo: [
      "If it reads as unhappy or threatening, step back, pause what you are doing (grooming, saddling, handling) and look for the trigger — a tight girth, invaded personal space, another horse nearby.",
      "If the horse is curling its lip to smell something interesting (the flehmen response) or making playful mouth movements without tension, speak softly and let it finish.",
    ],
  },
  {
    id: "horse-half-closed-eyes",
    animalId: "horse",
    title: "Half-Closed Eyes",
    page: 4,
    keywords: ["sleepy", "droopy", "content"],
    meaning: "The horse is feeling happy, calm and relaxed.",
    whatToDo: [
      "Keep the environment quiet and low-energy.",
      "This is a good time for gentle grooming, bonding, or simply peaceful downtime. Avoid sudden loud noises or sharp movements that would startle it out of this state.",
    ],
  },
  {
    id: "horse-gentle-nipping",
    animalId: "horse",
    title: "Gentle Nipping",
    page: 4,
    keywords: ["nibble", "mouthy", "hand-fed"],
    meaning:
      "A social gesture. While being groomed or hand-fed, a horse may gently nip your shoulder or hand.",
    whatToDo: [
      "Set clear, gentle boundaries — nipping can easily escalate into biting.",
      "Quietly nudge the horse's head away or block the nip with your forearm.",
      "Avoid slapping or shouting, which causes confusion or fear.",
    ],
  },
  {
    id: "horse-head-up-tail-up",
    animalId: "horse",
    title: "Raising Head & Lifting Tail",
    page: 4,
    keywords: ["curious", "spook", "excited"],
    meaning:
      "A relaxed horse lowers its head. When it is curious or intrigued by something it raises its head high and lifts its tail.",
    whatToDo: [
      "If it is simple curiosity, let the horse look at whatever caught its attention and keep the lead or reins loose enough for it to process the environment.",
      "If the raised head comes with wide eyes showing whites or a stiff body, there is a spooking risk — redirect its focus back to you with simple ground movements such as yielding the hindquarters or walking a small circle.",
    ],
  },
  // Tail and legs. The source calls the tail a mood "flag".
  {
    id: "horse-tail-swishing",
    animalId: "horse",
    title: "Swishing Tail",
    page: 6,
    keywords: ["flick", "lashing", "annoyed"],
    meaning:
      "Irritation. An angry or restless horse swishes its tail to warn other horses to stay away. If insects are around, though, it is simply a natural reaction to drive away flies.",
    whatToDo: [
      "If flies or insects are present, use fly spray, a fly sheet or mask, or move the horse into a shaded stall.",
      "If it is genuine irritation, check for physical discomfort such as a tight girth, a poorly fitting saddle or a sharp bit, and give the horse personal space rather than crowding it.",
    ],
  },
  {
    id: "horse-tail-tucked",
    animalId: "horse",
    title: "Lowered / Tucked Tail",
    page: 6,
    keywords: ["clamped", "between", "shaking", "scared"],
    meaning:
      "Fear. When it senses danger the horse tucks its tail down between its hind legs, sometimes shaking.",
    whatToDo: [
      "Recognise that the horse feels threatened, and stop what you are doing.",
      "Lower your own energy and identify what is frightening it.",
      "Speak softly and do not force the horse into a scary space until it has decompressed and relaxed its posture.",
    ],
  },
  {
    id: "horse-pawing",
    animalId: "horse",
    title: "Pawing the Ground with a Foreleg",
    page: 6,
    keywords: ["digging", "scraping", "impatient"],
    meaning:
      "Gentle pawing indicates discomfort, restlessness, or simply wanting to move out of excitement. Forceful pawing is a sign of anger or fear.",
    whatToDo: [
      "For gentle pawing, redirect the energy into a productive task such as walking or yielding the hindquarters, or check whether the horse is waiting impatiently for food or attention. Do not reward pawing with treats — it reinforces the habit.",
      "For forceful pawing, step out of range of the front feet to stay safe, address the cause of the distress, and wait for the horse to stand quietly before asking for anything.",
    ],
  },
  {
    id: "horse-bucking",
    animalId: "horse",
    title: "Bucking",
    page: 7,
    keywords: ["kick", "hind", "playful"],
    meaning:
      "Usually playfulness, typically accompanied by ears pinned back and squealing or whinnying. It can also indicate fear or an unclear situation, and the tail usually curves right before a buck.",
    // Safety branch first. The source lists the pasture case first, but someone
    // asking about a buck is usually on the horse, not watching from a fence.
    whatToDo: [
      "Under saddle or on a lead line, keep the head up — a horse cannot buck effectively with its head elevated — and disengage the hindquarters by pulling gently on one rein to bring it into a circle, which stops the forward momentum.",
      "Check your gear afterwards for pinching or saddle pain.",
      "If the horse is simply playing in a pasture, let it burn off the energy safely while you watch from outside the fence.",
    ],
  },
  {
    id: "horse-rearing",
    animalId: "horse",
    title: "Rearing",
    page: 7,
    keywords: ["standing", "front", "legs", "up", "stallion"],
    meaning:
      "A dual-natured behaviour. It can be playful, as in young foals frolicking in a pasture. It can also be a battle stance for angry stallions, or express extreme fear when a horse feels trapped and unable to escape.",
    // Safety branch first, for the same reason as bucking above.
    whatToDo: [
      "On the ground with an aggressive or trapped horse, drop the lead rope if necessary to avoid being struck by the front hooves, step far out of the strike zone, and never pull straight down on the rope — that can flip the horse backward onto you or itself. Identify what made it feel cornered and open an exit path.",
      "Under saddle, drive your hips forward and lean close to the horse's neck to keep your weight over its centre of gravity, push your hands forward to yield the reins so you don't pull it over backward, then bend its head to one side as soon as the front hooves land — a horse cannot rear while moving sideways.",
      "If it is foals playing in turnout, enjoy the view from outside the fence and give them room.",
    ],
  },
  {
    id: "horse-fleeing",
    animalId: "horse",
    title: "Fleeing / Bolting",
    page: 8,
    keywords: ["running", "away", "sprint", "panic", "prey"],
    meaning:
      "A horse sprints away when frightened. As prey animals, horses do not stop to assess a situation first — they run from threats immediately to protect themselves and the herd.",
    whatToDo: [
      "On a lead line, do not try to hold a horse that is at a full-sprint bolt — you risk being dragged or trampled. Let go if your safety is compromised and follow calmly from a distance.",
      "If you get advance warning (a sharp freeze before the bolt), disengage the hindquarters immediately by pulling the head toward you in an arc to direct the energy into a tight circle.",
      "Under saddle, stay balanced with your heels down and lean slightly back. Avoid pulling hard on both reins at once — a panicked horse braces against the bit and runs faster. Use a pulley rein or gradually tightening circles instead.",
      "Once the horse stops, do not punish it — it reacted purely on prey instinct. Speak softly, lower your energy and let its heart rate settle.",
    ],
  },
  // Whole-body emotional states.
  {
    id: "horse-relaxed",
    animalId: "horse",
    title: "Relaxed",
    page: 9,
    keywords: ["calm", "content", "peaceful", "sighing"],
    meaning:
      "Gentle movement in the ears and body, calm peaceful eyes, and ears swivelling in various directions. A sigh with a shudder or a full muscle relaxation signals contentment, satisfaction and ease.",
    whatToDo: [
      "Match the horse's calm energy.",
      "This is the best state for routine handling, grooming, tacking up or soft ground exercises. Avoid sudden movements or loud noises that would needlessly startle it out of this restful headspace.",
    ],
  },
  {
    id: "horse-joyful",
    animalId: "horse",
    title: "Joyful / Pleased",
    page: 10,
    keywords: ["happy", "whinny", "nicker", "snort", "greeting"],
    meaning:
      "Soft whinnying with flared nostrils and short snorting sounds. A gentle shake of the head and neck usually means welcoming or saying hello to someone it recognises. Snorting with a closed mouth happens during excitement, while running, meeting companions, or clearing the nasal passage.",
    whatToDo: [
      "Acknowledge the greeting with a gentle voice, a soft pat on the neck, or a favoured scratch spot such as the shoulders or withers.",
      "If it is expressing joy while running in turnout, let it enjoy the playtime safely from outside the enclosure.",
    ],
  },
  {
    id: "horse-tense-fearful",
    animalId: "horse",
    title: "Tense / Fearful",
    page: 10,
    keywords: ["scared", "frightened", "spooked", "danger"],
    meaning:
      "Both ears point forward, the head and neck are held high, and the eyes are wide open. Full-body muscle tension signals fear or a sense of danger, and the horse is ready at any moment to fight back, flee, or react intensely.",
    whatToDo: [
      "Lower your own energy — breathe deeply, relax your shoulders and speak in low comforting tones. Horses mirror human emotion.",
      "Identify the trigger by looking in the direction the horse is focused on.",
      "Give it space and avoid cornering it. Do not force it toward the scary object; let it approach or observe at its own pace.",
      "Redirect its focus with simple familiar movements, like walking a small circle or backing up a step, to re-engage its thinking brain.",
    ],
  },
  {
    id: "horse-angry",
    animalId: "horse",
    title: "Angry",
    page: 10,
    keywords: ["furious", "aggressive", "bite", "kick"],
    meaning:
      "Both ears pinned flat against the neck with a fierce, intense stare. The horse is making or preparing aggressive actions such as biting or kicking, and warning others not to provoke it further — sometimes with rolling eyes or bared teeth.",
    whatToDo: [
      "Prioritise your own safety and step out of the kicking and biting zone — stay clear of the hindquarters and of the area directly in front of the chest.",
      "Immediately stop whatever task is triggering the frustration, such as grooming a sensitive spot, tightening the girth, or invading personal space.",
      "Check for physical pain, ill-fitting equipment, or environmental stress like another horse in its feeding area.",
      "Do not punish an angry horse aggressively — that escalates the conflict into a fight. Give it space to settle, then reintroduce the activity calmly and incrementally.",
    ],
  },

  // ─── CAT ────────────────────────────────────────────────────────────────
  {
    id: "cat-rubbing",
    animalId: "cat",
    title: "Rubbing Against You",
    page: 13,
    keywords: ["bunting", "cheek", "weaving", "legs"],
    meaning:
      "Trust, and leaving scent. Rubbing its cheeks or head against you is both affection and a way of marking you with its scent to claim you as its own.",
    whatToDo: [
      "Reciprocate the affection — speak in a gentle voice and give soft pets around the chin, cheek, or base of the ears where the scent glands are.",
    ],
  },
  {
    id: "cat-tail-up",
    animalId: "cat",
    title: "Straight Upright Tail",
    page: 13,
    keywords: ["vertical", "question", "mark", "hook"],
    meaning:
      "A happy greeting. A tail pointing straight up signals a good mood and a willingness to approach. A slightly curved tip means an even stronger positive feeling.",
    whatToDo: [
      "Welcome your cat. Offer your hand or extend a finger at their nose level to let them sniff you, and let them initiate close contact.",
    ],
  },
  {
    id: "cat-headbutting",
    animalId: "cat",
    title: "Headbutting",
    page: 13,
    keywords: ["bonk", "bump", "forehead"],
    meaning:
      "Confirmation of intimacy. Headbutting, or bunting, happens only when a cat genuinely trusts you and sees you as a dependable companion.",
    whatToDo: [
      "Accept the gesture gently. Offer your hand or lower your forehead to let them butt against it, then give a quiet pet afterwards to reinforce the bond.",
    ],
  },
  {
    id: "cat-slow-blink",
    animalId: "cat",
    title: "Slow Blinking",
    page: 13,
    keywords: ["kiss", "eyes", "closing", "squint"],
    meaning:
      'The feline version of "I love you." Slowly closing its eyes means the cat has let down its guard around you.',
    whatToDo: [
      "Slow-blink back. Soften your gaze and blink slowly to return the signal of trust.",
      "Avoid staring directly or unblinkingly at a cat — that reads as a threat.",
    ],
  },
  {
    id: "cat-rolling",
    animalId: "cat",
    title: "Rolling on the Floor",
    page: 13,
    keywords: ["flopping", "belly", "wriggling"],
    meaning:
      "Wanting interaction, or marking territory. Rolling in front of you signals a joyful mood and a request for attention.",
    whatToDo: [
      "Engage with play or talk to them — but do not immediately reach out to touch their belly.",
      "For many cats, exposing the belly is a sign of trust rather than an invitation for belly rubs, and reaching in may cause them to scratch or bite defensively.",
    ],
  },
  {
    id: "cat-purring",
    animalId: "cat",
    title: "Purring",
    page: 14,
    keywords: ["rumbling", "vibrating", "sick", "unwell"],
    meaning:
      "Contentment, or self-soothing. Purring during petting usually means relaxation and satisfaction, but cats also purr when in pain, anxious or sick in order to soothe themselves — so sound alone cannot tell you the mood.",
    whatToDo: [
      "Read the full context. If the cat is relaxed and enjoying the pets, carry on with gentle affection.",
      "If the body is tense or the cat appears unwell or distressed, stop handling them so much and consider whether they need space or medical attention.",
    ],
  },
  {
    id: "cat-stretching",
    animalId: "cat",
    title: "Deep Stretch",
    page: 15,
    keywords: ["waking", "yawn", "extending"],
    meaning:
      "Peace and comfort. Stretching the limbs and torso after waking relaxes the muscles, and doing it right in front of you shows they feel completely safe.",
    whatToDo: [
      "Give them a quiet moment to finish the stretch.",
      "Once they stand up and approach you, offer gentle pets along their back or chin as a greeting.",
    ],
  },
  {
    id: "cat-kneading",
    animalId: "cat",
    title: "Kneading / Making Biscuits",
    page: 15,
    keywords: ["paws", "pressing", "claws", "drool", "nursing"],
    meaning:
      "Reverting to kittenhood comfort. Rhythmic pressing on soft blankets or on your body is an instinctive behaviour carried over from nursing. In adults it signals deep affection, trust and relaxation — some cats even drool while doing it.",
    whatToDo: [
      "Enjoy the bonding moment.",
      "If their claws are sharp or poking through your clothes, place a thick towel or blanket between you and the cat rather than pulling away abruptly.",
    ],
  },
  {
    id: "cat-belly-up",
    animalId: "cat",
    title: "Belly-Up / Lying on Back",
    page: 15,
    keywords: ["exposed", "stomach", "trap", "trust"],
    meaning:
      "High trust, but not an open invitation. Exposing the belly means they have dropped their guard and feel safe. Because the stomach is their most vulnerable area, showing it is a sign of trust rather than a request for belly rubs.",
    whatToDo: [
      "Speak softly or offer your hand for them to sniff, but avoid touching the belly directly.",
      "Reaching for the stomach often triggers a defensive reflex that makes the cat bite or scratch.",
    ],
  },
  {
    id: "cat-side-recline",
    animalId: "cat",
    title: "Side Recline",
    page: 15,
    keywords: ["lying", "sideways", "imperial", "sprawled"],
    meaning:
      "Relaxation and heat dissipation. Lying comfortably on their side indicates total security with their surroundings, and in hot weather it also helps them spread out to cool down.",
    whatToDo: [
      "Let them rest undisturbed.",
      "If it is hot, make sure they have fresh water, shade, or a fan to stay comfortable.",
    ],
  },
  {
    id: "cat-splooting",
    animalId: "cat",
    title: "Splooting / Sprawling",
    page: 15,
    keywords: ["flat", "spread", "cool", "floor", "tiles"],
    meaning:
      "Relaxing and cooling off. Lying flat with the limbs spread out and the belly against a cool floor is common in hot weather and shows the cat is relaxed.",
    whatToDo: [
      "Let them enjoy the cool surface.",
      "If you notice this posture alongside lethargy, loss of appetite, or difficulty walking, monitor them closely or consult a vet to rule out an underlying health problem.",
    ],
  },
  {
    id: "cat-loaf",
    animalId: "cat",
    title: "Tucked Paws / Cat Loaf",
    page: 16,
    keywords: ["bread", "sitting", "hunched", "resting"],
    meaning:
      "Rest mode. Tucking the front paws under the body keeps them warm while resting and observing their surroundings. A relaxed posture indicates peace.",
    whatToDo: [
      "If they look relaxed, let them rest calmly or offer a gentle head pet.",
      "If the body is tense with the head lowered, check for signs of illness or pain — hunching tightly over tucked paws can be a sign of physical discomfort.",
    ],
  },
  {
    id: "cat-splay-sit",
    animalId: "cat",
    title: "Wide-Legged Sitting",
    page: 17,
    keywords: ["splay", "hind", "apart", "grooming", "licking"],
    meaning:
      "Casual rest, or getting ready to groom. The cat sits with its hind legs spread apart to relax or to get into position to lick its fur clean.",
    whatToDo: [
      "If their daily behaviour is otherwise normal, no action is needed — just let them rest or groom in peace.",
    ],
  },
  {
    id: "cat-neat-sit",
    animalId: "cat",
    title: "Proper / Neat Sitting",
    page: 18,
    keywords: ["upright", "wrapped", "swivel", "observing"],
    meaning:
      "Observing, not zoning out. Sitting upright with the tail wrapped neatly around the body lets the cat rest while staying aware of its surroundings. Forward ears signal peace; ears that keep swivelling mean it is tracking sounds.",
    whatToDo: [
      "Notice what has caught their attention.",
      "Feel free to talk softly to them or offer your hand for a nose-sniff greeting.",
    ],
  },
  {
    id: "cat-crouch-hunt",
    animalId: "cat",
    title: "Crouching Low",
    page: 18,
    keywords: ["stalking", "pounce", "prey", "hunting", "coiled"],
    meaning:
      "Locking onto prey. The cat lowers its body, coils its hind legs and stays intensely focused, ready to pounce on bugs, toys, or moving hands and feet.",
    whatToDo: [
      "Redirect the hunting instinct toward a toy such as a feather wand or laser pointer.",
      "Do not use your hands or feet as play targets — it teaches biting and scratching.",
    ],
  },
  {
    id: "cat-dilated-pupils",
    animalId: "cat",
    title: "Dilated Pupils",
    page: 18,
    keywords: ["big", "black", "wide", "round", "saucer"],
    meaning:
      "Excitement, fear, or simply low light. Large pupils mean the cat is processing sensory input for hunting, feeling excited or scared, or just adjusting to a dim room — so this cue means nothing on its own.",
    whatToDo: [
      "Check the other body cues before acting. If the ears are flat or the body is tense, step back and give them space.",
      "If they are in play mode, engage them with a toy.",
    ],
  },
  {
    id: "cat-butt-wiggle",
    animalId: "cat",
    title: "Butt Wiggle",
    page: 18,
    keywords: ["hips", "wiggling", "leap", "jump"],
    meaning:
      "Pounce prep. Crouched low with the hips wiggling back and forth, the cat is adjusting its footing and measuring the exact distance it needs to leap.",
    whatToDo: [
      "Toss a toy into their target area so they can complete a satisfying pounce and fulfil the predatory drive.",
      "Keep your hands out of the strike zone.",
    ],
  },
  {
    id: "cat-flehmen",
    animalId: "cat",
    title: "Slightly Open Mouth (Flehmen Response)",
    page: 19,
    keywords: ["stink", "face", "gaping", "sniffing", "smell", "choking"],
    meaning:
      "Analysing a scent. When sniffing something unfamiliar, the cat holds its mouth slightly open to route airborne chemicals to its vomeronasal organ, also called Jacobson's organ, to gather scent information. It is not choking or disgusted.",
    whatToDo: [
      "Let them finish analysing the scent uninterrupted — it is completely normal, healthy behaviour when exploring new objects, shoes or smells.",
    ],
  },
  {
    id: "cat-tail-swishing",
    animalId: "cat",
    title: "Tail Swishing",
    page: 22,
    keywords: ["wagging", "thumping", "flicking", "lashing", "twitching"],
    meaning:
      "The mood is shifting. Unlike in dogs, fast tail movement does not mean happiness. Subtle tip twitches signal focus, while wide, heavy swishes mean patience is running out.",
    whatToDo: [
      "Stop whatever you are doing — petting, playing, or holding them — and give them space before the frustration escalates into a scratch or a bite.",
    ],
  },
  {
    id: "cat-love-bites",
    animalId: "cat",
    title: "Love Bites / Nipping",
    page: 22,
    keywords: ["biting", "petting", "threshold", "suddenly", "attacks"],
    meaning:
      "Playfulness or overstimulation. Soft nips are an interaction signal, but firm bites mean the cat has reached its petting threshold.",
    whatToDo: [
      "Pause petting or touching immediately.",
      "Keep your hand completely still — pulling away fast triggers their hunting instinct — until they release, then leave them alone.",
    ],
  },
  {
    id: "cat-tense-crouch",
    animalId: "cat",
    title: "Tense Crouch",
    page: 22,
    keywords: ["guarded", "hiding", "bolt", "unwell", "stressed"],
    meaning:
      "Guarded, or unwell. Limbs tucked under a lowered body signals that the cat is on guard, stressed by a new environment, or in physical discomfort.",
    whatToDo: [
      "If it is environmental, provide quiet surroundings and let them hide without forcing interaction.",
      "If the posture is prolonged, monitor their food intake and behaviour. If it persists alongside a loss of appetite, take them to a vet.",
    ],
  },
  {
    id: "cat-airplane-ears",
    animalId: "cat",
    title: "Airplane Ears",
    page: 22,
    keywords: ["flat", "sideways", "flattened", "annoyed", "uneasy"],
    meaning:
      "Currently uneasy. Ears flattened backward and sideways signal anxiety, fear, or annoyance.",
    whatToDo: [
      "Back away and remove any potential triggers — loud noises, children, other pets.",
      "Do not attempt to hug or pick up the cat, and do not put your face near it.",
    ],
  },
  {
    id: "cat-tucked-tail",
    animalId: "cat",
    title: "Tucked Tail",
    page: 22,
    keywords: ["between", "legs", "wrapped", "insecure", "shrinking"],
    meaning:
      "Lacking security. Wrapping or tucking the tail tightly between the legs shows severe fear and a desire to shrink away.",
    whatToDo: [
      "Make sure there are accessible hiding spots such as cardboard boxes or an open carrier.",
      "Never drag a scared cat out of its hiding space — let it emerge when it feels safe.",
    ],
  },
  {
    id: "cat-arched-back",
    animalId: "cat",
    title: "Arched Back & Puffed Fur",
    page: 23,
    keywords: ["halloween", "piloerection", "bottle", "brush", "sideways", "bigger"],
    meaning:
      "Defensive mode. Arching the spine, puffing the fur, and standing sideways are all attempts to look larger and intimidate a threat.",
    whatToDo: [
      "Do not approach or corner the cat.",
      "Calmly step back, make sure an escape path is open for them, and let them de-escalate on their own terms.",
    ],
  },
  {
    id: "cat-hissing",
    animalId: "cat",
    title: "Hissing",
    page: 24,
    keywords: ["spitting", "growling", "warning", "aggressive", "mean"],
    meaning:
      'A warning, not provocation. A hiss primarily means "I am very frightened; do not come any closer." It is not an attempt to attack, but an advance warning issued to avoid a confrontation.',
    whatToDo: [
      "Do not yell at, scold, or move toward the cat.",
      "Step back immediately, remove any perceived threats such as other pets or loud noises, and give them plenty of space and time to calm down on their own.",
    ],
  },

  // ─── DOG ────────────────────────────────────────────────────────────────
  {
    id: "dog-play-bow",
    animalId: "dog",
    title: "Play Bow",
    page: 24,
    keywords: ["front", "paws", "lowered", "bum", "invitation"],
    meaning:
      "The dog is inviting you to play. It is a sign that they are relaxed, friendly and eager to interact.",
    whatToDo: [
      "Engage with them — grab their favourite toy, play fetch, or do a playful shuffle to match their energy and build the bond.",
    ],
  },
  {
    id: "dog-belly-up",
    animalId: "dog",
    title: "Belly Facing Up",
    page: 24,
    keywords: ["rolling", "back", "exposing", "stomach"],
    meaning:
      "The dog trusts you deeply and feels safe and at ease in its surroundings.",
    whatToDo: [
      "Reward that trust with gentle belly rubs or soft scratches around the chest and chin, as long as they stay relaxed and happy.",
    ],
  },
  {
    id: "dog-tucked-tail",
    animalId: "dog",
    title: "Tightly Tucking the Tail",
    page: 25,
    keywords: ["between", "legs", "guilty", "timid", "curled"],
    meaning:
      "Internally fearful, timid or nervous — or acknowledging a mistake with a guilty conscience. Either way the dog is lacking a sense of security.",
    whatToDo: [
      "Avoid sudden movements or loud noises.",
      "Lower your body position, speak in a gentle tone, and give them space so they can regain confidence safely.",
    ],
  },
  {
    id: "dog-tense-upright-tail",
    animalId: "dog",
    title: "Tense Body with Upright Tail",
    page: 26,
    keywords: ["stiff", "rigid", "high", "guard", "frozen"],
    meaning:
      "Highly alert, sensing a potential threat, and ready to go on the defensive.",
    whatToDo: [
      "Identify what is causing the stress, such as an unfamiliar dog or person, and create distance immediately.",
      "Avoid direct eye contact or sudden approaches while they are in this tense state.",
    ],
  },
  {
    id: "dog-slow-wag",
    animalId: "dog",
    title: "Tail Wagging Slowly and Gently",
    page: 26,
    keywords: ["soft", "sweeping", "content", "calm"],
    meaning:
      "The dog is peaceful and relaxed, in a steady and pleasant state, and feels very comfortable inside.",
    whatToDo: [
      "Maintain a calm, friendly demeanour. This is a great time for gentle petting, soft praise, or simply relaxing together.",
    ],
  },
  {
    id: "dog-fast-wag",
    animalId: "dog",
    title: "Tail Wagging Fast and Vigorously",
    page: 27,
    keywords: ["happy", "excited", "whole", "body", "home"],
    meaning:
      "Extremely excited and happy — most commonly seen when their owner comes home — and eager to interact and play.",
    whatToDo: [
      "Greet them enthusiastically. Give them affection, talk in a happy tone, or grab a toy to channel the high energy into a fun game.",
    ],
  },
  {
    id: "dog-licking",
    animalId: "dog",
    title: "Licking Your Hand and Face",
    page: 28,
    keywords: ["kisses", "affection", "appease"],
    meaning:
      "Expressing closeness and affection. It is a dog's innate behaviour to appease and show endearment toward you.",
    whatToDo: [
      "Respond warmly with gentle petting, soft vocal praise, or a calm embrace to reinforce your bond and show affection back.",
    ],
  },
  {
    id: "dog-yawning",
    animalId: "dog",
    title: "Constant Yawning",
    page: 29,
    keywords: ["tired", "sleepy", "displacement", "calming", "signal"],
    meaning:
      "Rarely about sleepiness. Repeated yawning is usually a displacement signal indicating stress, anxiety or high tension, used to self-soothe and calm down.",
    whatToDo: [
      "Identify and remove the immediate stressors — a crowded environment, loud noises, or unwanted physical contact.",
      "Speak in a low, reassuring voice and give the dog space to decompress.",
    ],
  },
  {
    id: "dog-ears-forward",
    animalId: "dog",
    title: "Ears Upright and Forward",
    page: 30,
    keywords: ["pricked", "perked", "curious", "focused"],
    meaning:
      "Listening intently to sounds, full of strong curiosity about what is in front of them.",
    whatToDo: [
      "Allow them to safely investigate their surroundings and avoid sudden interruptions.",
      "Use this moment of high focus to engage them with training or positive reinforcement.",
    ],
  },
  {
    id: "dog-ears-pinned",
    animalId: "dog",
    title: "Ears Pinned Back to the Head",
    page: 30,
    keywords: ["flat", "flattened", "submissive", "nervous", "vulnerable"],
    meaning:
      "Fearful and nervous, or showing gentle submission by actively demonstrating vulnerability.",
    whatToDo: [
      "Lower your body posture, avoid direct eye contact, and speak in soft, gentle tones.",
      "Remove any stressful triggers nearby and give them enough space to feel safe before offering quiet affection.",
    ],
  },
  {
    id: "dog-nudging",
    animalId: "dog",
    title: "Nudging You with Head and Body",
    page: 31,
    keywords: ["leaning", "bumping", "pushing", "scent"],
    meaning:
      "Leaving its own scent, marking you as its own, and declaring a sense of closeness and belonging.",
    whatToDo: [
      "Lean into the affection — pet them behind the ears or stroke their back gently to reciprocate and make them feel secure.",
    ],
  },
  {
    id: "dog-slow-blink",
    animalId: "dog",
    title: "Staring at You with a Slow Blink",
    page: 32,
    keywords: ["squint", "soft", "eyes", "love"],
    meaning:
      "A gentle expression of love — a dog's own reassuring, kiss-like affectionate gesture.",
    whatToDo: [
      "Soften your gaze, blink slowly back at them, and offer gentle verbal praise to send the calm love signal right back.",
    ],
  },
  {
    id: "dog-pacing",
    animalId: "dog",
    title: "Pacing Back and Forth or Circling",
    page: 33,
    keywords: ["restless", "bored", "walking", "around", "toilet"],
    meaning:
      "Restless and bored, eager to go for a walk, or needing to use the toilet.",
    whatToDo: [
      "Take them outside for a potty break or a walk to burn off the excess energy.",
      "If outdoor time isn't immediately possible, offer interactive puzzle toys to stimulate their mind.",
    ],
  },
  {
    id: "dog-piloerection",
    animalId: "dog",
    title: "Fur Standing on End (Piloerection)",
    page: 34,
    keywords: ["hackles", "raised", "ridge", "back", "bristling", "provoked"],
    meaning:
      "Angry and furious, feeling provoked, or about to issue a warning.",
    whatToDo: [
      "Give the dog space immediately.",
      "Avoid direct eye contact, back away calmly without running, and remove whatever stressor or trigger is making them feel threatened.",
    ],
  },
  {
    id: "dog-paw-raise",
    animalId: "dog",
    title: "Gently Raising One Front Paw",
    page: 34,
    keywords: ["lifting", "begging", "cute", "attention", "shake"],
    meaning:
      "Full of curiosity, wanting to beg for snacks, seeking your attention, and acting cute.",
    whatToDo: [
      'Gently acknowledge them. If it is a good time for a reward, practise a simple command like "shake" or "sit" before giving a small treat, so you reinforce good behaviour without encouraging needy pawing.',
    ],
  },
];

const byId = new Map(GUIDE.map((e) => [e.id, e]));

export function getGuideEntry(id: string): GuideEntry | null {
  return byId.get(id) ?? null;
}
