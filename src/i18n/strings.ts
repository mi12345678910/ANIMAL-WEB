import type { Locale } from "./config";

/**
 * UI chrome strings — everything that is not species content.
 *
 * `en` is the shape of the dictionary, and `zh` is typed as `typeof en`, so
 * omitting a key or changing an interpolation's arguments is a compile error
 * rather than a string that silently stays English. Values are functions
 * wherever a value is substituted; string concatenation in JSX does not
 * survive translation, because word order differs.
 */
const en = {
  // Header
  appTitle: "Body Language Lab",
  appTagline: "Read the signals, not the stereotype",
  hidePanel: "Hide panel",
  showPanel: "Show panel",
  ask: "Ask",
  switchToLight: "Switch to light theme",
  switchToDark: "Switch to dark theme",
  comingSoonBadge: "Soon",
  chooseSpecies: "Choose a species",
  language: "Language",

  // Behaviour list
  behaviours: "Behaviours",
  reset: "Reset",
  behaviourHint:
    "Pick a behaviour to pose the model and open its explanation. The camera moves to whichever body part carries the signal.",
  noBehaviours: (animal: string) => `No behaviours are defined for ${animal} yet.`,
  panelAriaLabel: "Behaviour controls and explanation",

  // Explanation card
  toneComfortable: "Comfortable",
  toneAroused: "Aroused",
  toneStressed: "Stressed",
  toneNeedsSpace: "Needs space",
  keyVisualCues: "Key visual cues",
  whatItMeans: "What it means",
  howToRespond: "How to respond",
  avoid: "Avoid",
  emptyCardTitle: "Pick a behaviour to begin",
  emptyCardBody:
    "Each one poses the model, moves the camera to the body part that matters, and explains what the signal means and how to respond.",

  // Viewport
  preparingViewport: "Preparing the 3D viewport…",
  loadingModel: (percent: number) => `Loading model ${percent}%`,
  dragToOrbit: "Drag to orbit",
  scrollToZoom: "Scroll to zoom",
  rightDragToPan: "Right-drag to pan",
  speciesComingSoon: (animal: string) => `${animal} is coming soon`,
  speciesComingSoonBody: (animal: string) =>
    `The ${animal} module is not available yet. Switch back to Dog to keep exploring.`,
  modelFailedTitle: (animal: string) => `The ${animal} model didn't load`,
  modelFailedBody: (url: string) =>
    `${url} could not be fetched. If this is a deployed build, check that the file was committed — everything else on the page still works.`,

  // Chat
  chatAriaLabel: "Knowledge chat",
  chatHeading: (animal: string) => `Ask about ${animal}s`,
  chatSubheading: "Answers from the reference library",
  closeChat: "Close chat",
  chatEmpty: (animal: string) =>
    `Ask anything about ${animal} body language — what a signal means, or what to do about it.`,
  chatPlaceholder: "Ask a question…",
  chatThinking: "Thinking…",
  sendMessage: "Send message",
  assistantTyping: "Assistant is typing",
  noResponse: "No response.",
  chatUnreachable: (detail: string) =>
    `Sorry — I couldn't reach the knowledge base. (${detail})`,
  chatFailed: "Sorry — something went wrong.",
  sourcePage: (page: number) => ` · p.${page}`,

  // Answer scaffolding. Server-side: these are part of the reply text the chat
  // composes, not UI chrome, so they must follow the answer's language.
  answerLookFor: "Look for:",
  answerWhatToDo: "What to do:",
  /** Between a cue's body part and its description. */
  answerCueSep: ": ",
  /** Joins a label that already ends in a colon to the text after it. Chinese
   *  full-width punctuation carries its own trailing space, so adding one
   *  produces a visible gap. */
  answerInline: (label: string, text: string) => `${label} ${text}`,
  answerNoMatch:
    "I don't have anything on that yet. Try asking about the tail, the ears, or how the body is held.",
  answerFrom: (source: string) => `From **${source}**.`,
  answerRefused:
    "I'm not able to answer that one. Try rephrasing, or ask about a specific body-language signal.",
  answerEmpty: "I didn't manage to produce an answer — try again?",
};

/** The dictionary's shape, derived from English so the two cannot drift. */
export type Strings = typeof en;

const zh: Strings = {
  // Header
  appTitle: "肢体语言实验室",
  appTagline: "读懂信号，而不是刻板印象",
  hidePanel: "隐藏面板",
  showPanel: "显示面板",
  ask: "提问",
  switchToLight: "切换到浅色主题",
  switchToDark: "切换到深色主题",
  comingSoonBadge: "敬请期待",
  chooseSpecies: "选择动物",
  language: "语言",

  // Behaviour list
  behaviours: "行为",
  reset: "重置",
  behaviourHint:
    "选择一个行为，模型会摆出相应姿态并打开说明。镜头会自动移向传达该信号的身体部位。",
  noBehaviours: (animal: string) => `${animal}的行为内容尚未收录。`,
  panelAriaLabel: "行为控制与说明",

  // Explanation card
  toneComfortable: "放松",
  toneAroused: "警觉",
  toneStressed: "紧张",
  toneNeedsSpace: "需要空间",
  keyVisualCues: "关键视觉信号",
  whatItMeans: "这代表什么",
  howToRespond: "该如何回应",
  avoid: "切勿如此",
  emptyCardTitle: "先选择一个行为",
  emptyCardBody:
    "每个行为都会让模型摆出姿态，把镜头移到关键部位，并说明这个信号的含义以及你该如何回应。",

  // Viewport
  preparingViewport: "正在准备 3D 视图…",
  loadingModel: (percent: number) => `模型加载中 ${percent}%`,
  dragToOrbit: "拖动旋转",
  scrollToZoom: "滚轮缩放",
  rightDragToPan: "右键拖动平移",
  speciesComingSoon: (animal: string) => `${animal}即将推出`,
  speciesComingSoonBody: (animal: string) =>
    `${animal}模块尚未上线。可以先切换回狗继续探索。`,
  modelFailedTitle: (animal: string) => `${animal}模型未能加载`,
  modelFailedBody: (url: string) =>
    `无法获取 ${url}。如果这是已部署的版本，请检查该文件是否已提交到代码库——页面上的其他功能仍可正常使用。`,

  // Chat
  chatAriaLabel: "知识问答",
  chatHeading: (animal: string) => `关于${animal}的提问`,
  chatSubheading: "答案来自参考资料库",
  closeChat: "关闭问答",
  chatEmpty: (animal: string) =>
    `关于${animal}的肢体语言，什么都可以问——某个信号是什么意思，或者你该怎么做。`,
  chatPlaceholder: "输入你的问题…",
  chatThinking: "思考中…",
  sendMessage: "发送",
  assistantTyping: "助手正在输入",
  noResponse: "没有返回内容。",
  chatUnreachable: (detail: string) => `抱歉，无法连接知识库。（${detail}）`,
  chatFailed: "抱歉，出了点问题。",
  sourcePage: (page: number) => ` · 第 ${page} 页`,

  // Answer scaffolding
  answerLookFor: "观察这些：",
  answerWhatToDo: "该怎么做：",
  answerCueSep: "：",
  answerInline: (label: string, text: string) => `${label}${text}`,
  answerNoMatch: "这个问题我暂时还没有资料。可以试着问尾巴、耳朵，或者身体的姿态。",
  answerFrom: (source: string) => `来自 **${source}**。`,
  answerRefused: "这个问题我没办法回答。可以换个说法，或者问某个具体的肢体语言信号。",
  answerEmpty: "我这次没能给出答案——要不要再试一次？",
};

export const STRINGS: Record<Locale, Strings> = { en, zh };
