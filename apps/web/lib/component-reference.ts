// `type` (free-text display string) and `schema` (JSON Schema fragment) describe the
// same prop from two angles — keep them in sync whenever either is edited. `schema` is
// hand-authored only for the flagship components (social-clip, creator-reel, intro,
// fade-in, caption-highlight); it is partial coverage, not present on every component.
export type PropDefinition = {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
  schema?: Record<string, unknown>;
};

export type ComponentReference = {
  category: "primitive" | "scene" | "composition" | "utility";
  usage: string;
  props: PropDefinition[];
  related?: string[];
  note?: string;
};

const motionChildProps: PropDefinition[] = [
  {
    name: "children",
    type: "ReactNode",
    required: true,
    description: "Content to animate.",
  },
  {
    name: "durationInFrames",
    type: "number",
    default: "30",
    description: "Length of the enter animation in frames.",
  },
  {
    name: "delayInFrames",
    type: "number",
    default: "0",
    description: "Frames to wait before the animation starts.",
  },
  {
    name: "spring",
    type: '"smooth" | "snappy" | "bouncy" | Partial<SpringConfig> | boolean',
    description: "Drive the entrance with a spring instead of the ease-out curve.",
  },
  {
    name: "exit",
    type: "boolean",
    default: "false",
    description:
      "Animate back out, landing on the last frame of the surrounding Sequence.",
  },
  {
    name: "exitInFrames",
    type: "number",
    default: "70% of durationInFrames",
    description: "Length of the exit. Exits are shorter than entrances.",
  },
  {
    name: "exitAtInFrames",
    type: "number",
    description: "Frame the exit starts on, overriding the end-of-window timing.",
  },
  {
    name: "exitTravel",
    type: "number",
    default: "0.6",
    description: "Share of the enter distance the exit travels.",
  },
  {
    name: "exitDirection",
    type: '"reverse" | "continue"',
    default: '"reverse"',
    description:
      "reverse leaves the way it came in, continue carries on through.",
  },
  {
    name: "block",
    type: "boolean",
    default: "false",
    description: "Fill the parent's width instead of shrink-wrapping the child.",
  },
  {
    name: "style",
    type: "CSSProperties",
    description: "Styles merged onto the wrapper.",
  },
];

// JSON Schema fragments for the shared `motionChildProps`, keyed by prop name. Kept
// separate from `motionChildProps` itself so `schema` can be attached only where a
// component is explicitly authored for it (fade-in) without mutating the shared array
// that other, not-yet-authored primitives (slide-up, slide-left, scale-in, blur-in,
// rotate-in, spring-in) also spread from.
const motionChildPropSchemas: Record<string, Record<string, unknown>> = {
  children: {},
  durationInFrames: { type: "number" },
  delayInFrames: { type: "number" },
  spring: {
    oneOf: [
      { type: "string", enum: ["smooth", "snappy", "bouncy"] },
      { type: "boolean" },
      { type: "object" },
    ],
  },
  exit: { type: "boolean" },
  exitInFrames: { type: "number" },
  exitAtInFrames: { type: "number" },
  exitTravel: { type: "number" },
  exitDirection: { type: "string", enum: ["reverse", "continue"] },
  block: { type: "boolean" },
  style: { type: "object" },
};

export const componentReference: Record<string, ComponentReference> = {
  "fade-in": {
    category: "primitive",
    usage: `import { FadeIn } from "@/remotion/primitives/fade-in";

<FadeIn durationInFrames={30} exit>
  <div>Hello world</div>
</FadeIn>`,
    props: [
      ...motionChildProps.map((prop) => ({
        ...prop,
        schema: motionChildPropSchemas[prop.name] ?? {},
      })),
      {
        name: "from",
        type: "number",
        default: "0",
        description: "Opacity the fade starts from.",
        schema: { type: "number" },
      },
      {
        name: "to",
        type: "number",
        default: "1",
        description: "Opacity the fade settles on.",
        schema: { type: "number" },
      },
    ],
    note: "Opacity runs the full duration here; the transform primitives finish theirs at 55% so the element lands solid.",
    related: ["fade-out", "slide-up"],
  },
  "fade-out": {
    category: "primitive",
    usage: `import { FadeOut } from "@/remotion/primitives/fade-out";

<FadeOut durationInFrames={24}>
  <div>Goodbye</div>
</FadeOut>`,
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Content to fade away.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "30",
        description: "Length of the fade in frames.",
      },
      {
        name: "delayInFrames",
        type: "number",
        default: "end of the sequence",
        description:
          "Frame the fade starts on. Omitted, it lands on the last frame of the surrounding Sequence.",
      },
      {
        name: "from",
        type: "number",
        default: "1",
        description: "Opacity held before the fade.",
      },
      {
        name: "to",
        type: "number",
        default: "0",
        description: "Opacity it ends on.",
      },
      {
        name: "block",
        type: "boolean",
        default: "false",
        description: "Fill the parent's width instead of shrink-wrapping.",
      },
      {
        name: "style",
        type: "CSSProperties",
        description: "Styles merged onto the wrapper.",
      },
    ],
    note: "Uses an ease-in curve — an exit accelerates away, it never decelerates into nothing.",
    related: ["fade-in"],
  },
  "slide-up": {
    category: "primitive",
    usage: `import { SlideUp } from "@/remotion/primitives/slide-up";

<SlideUp mask exit>
  <h1>Title</h1>
</SlideUp>`,
    props: [
      ...motionChildProps,
      {
        name: "distance",
        type: "number",
        default: "scaled 40px",
        description:
          "Vertical offset in pixels at the start. Under mask, defaults to the element's own height.",
      },
      {
        name: "mask",
        type: "boolean",
        default: "false",
        description:
          "Clip the child to its own box so it rises out of a mask instead of fading up.",
      },
      {
        name: "maskPadding",
        type: "number",
        default: "0",
        description: "Extra room inside the mask so descenders are not clipped.",
      },
    ],
    related: ["slide-left", "fade-in"],
  },
  "slide-left": {
    category: "primitive",
    usage: `import { SlideLeft } from "@/remotion/primitives/slide-left";

<SlideLeft distance={60} from="left">
  <p>Slide in from the left</p>
</SlideLeft>`,
    props: [
      ...motionChildProps,
      {
        name: "distance",
        type: "number",
        default: "scaled 60px",
        description:
          "Horizontal offset in pixels at the start. Under mask, defaults to the element's own width.",
      },
      {
        name: "from",
        type: '"left" | "right"',
        default: '"left"',
        description: "Side the child travels in from.",
      },
      {
        name: "mask",
        type: "boolean",
        default: "false",
        description: "Clip the child to its own box so it slides out of a mask.",
      },
    ],
    related: ["slide-up", "stagger-children"],
  },
  "scale-in": {
    category: "primitive",
    usage: `import { ScaleIn } from "@/remotion/primitives/scale-in";

<ScaleIn from={0.9} spring="snappy">
  <img src={staticFile("logo.png")} />
</ScaleIn>`,
    props: [
      ...motionChildProps,
      {
        name: "from",
        type: "number",
        default: "0.92",
        description: "Scale at the start of the entrance.",
      },
      {
        name: "origin",
        type: "TransformOrigin",
        default: '"center"',
        description: "Corner or edge the scale grows out of.",
      },
    ],
    note: "Anything below ~0.85 wants a spring behind it, or the growth reads as a camera zoom.",
    related: ["spring-in", "fade-in"],
  },
  typewriter: {
    category: "primitive",
    usage: `import { Typewriter } from "@/remotion/primitives/typewriter";

<Typewriter
  text="Build videos with React.[pause:0.5] One frame at a time."
  charFrames={2}
  humanize
  respectPunctuation
  cursorStyle="block"
/>`,
    props: [
      {
        name: "text",
        type: "string",
        required: true,
        description: "Full string to reveal character by character. Use [pause:0.5] for inline pauses.",
      },
      {
        name: "charFrames",
        type: "number",
        description:
          "Frames per character (preferred over durationInFrames). Values below 1 type more than one character a frame.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "60",
        description: "Total duration when charFrames is omitted.",
      },
      {
        name: "delayInFrames",
        type: "number",
        default: "0",
        description: "Frames before typing begins.",
      },
      {
        name: "pauseAfter",
        type: "string",
        description: "Pause after this substring is typed.",
      },
      {
        name: "pauseSeconds",
        type: "number",
        default: "0.6",
        description: "Length of the pauseAfter pause in seconds.",
      },
      {
        name: "showCursor",
        type: "boolean",
        default: "true",
        description: "Show the caret.",
      },
      {
        name: "cursorBlinkFrames",
        type: "number",
        default: "30",
        description: "Caret blink cycle length in frames, used while it rests.",
      },
      {
        name: "cursorColor",
        type: "string",
        description: "Caret colour. Defaults to the text colour.",
      },
      {
        name: "cursorWidth",
        type: "number",
        description: "Caret width in pixels (bar/underscore only).",
      },
      {
        name: "cursorStyle",
        type: '"bar" | "block" | "underscore"',
        default: '"bar"',
        description: "Caret shape.",
      },
      {
        name: "humanize",
        type: "boolean",
        default: "false",
        description: "Uneven key rhythm — the difference between typing and a progress bar.",
      },
      {
        name: "respectPunctuation",
        type: "boolean",
        default: "false",
        description: "Pause automatically after . ! ? ; : ,",
      },
      {
        name: "punctuationPauseSeconds",
        type: "number",
        default: "0.25",
        description: "Length of automatic punctuation pauses.",
      },
      {
        name: "loop",
        type: "boolean",
        default: "false",
        description: "Type, pause, backspace, and repeat.",
      },
      {
        name: "loopPauseSeconds",
        type: "number",
        default: "1",
        description: "Pause at full text before backspacing.",
      },
      {
        name: "backspaceCharFrames",
        type: "number",
        default: "1",
        description: "Frames per character when backspacing.",
      },
      {
        name: "reserveSpace",
        type: "boolean",
        default: "true",
        description:
          "Measure the full block up front so a wrapping line never reflows mid-sentence.",
      },
      {
        name: "fontSize",
        type: "number",
        default: "scaled 84px",
        description: "Text size in pixels.",
      },
      {
        name: "fontWeight",
        type: "number",
        default: "600",
        description: "Text weight.",
      },
      {
        name: "color",
        type: "string",
        default: '"#ececec"',
        description: "Text colour.",
      },
      {
        name: "fontFamily",
        type: "string",
        description: "Font family for the typed text.",
      },
      {
        name: "style",
        type: "CSSProperties",
        description: "Styles merged onto the text span.",
      },
    ],
    note: "The caret holds solid while keys land and only blinks once it rests. Inline [pause:0.5] markers are stripped from the rendered text.",
    related: ["marker-highlight", "counter"],
  },
  counter: {
    category: "primitive",
    usage: `import { Counter } from "@/remotion/primitives/counter";

<Counter from={0} to={124000} roll durationInFrames={64} />`,
    props: [
      {
        name: "to",
        type: "number",
        required: true,
        description: "Value the count lands on.",
      },
      {
        name: "from",
        type: "number",
        default: "0",
        description: "Value the count starts from.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "60",
        description: "Frames over which the value ramps.",
      },
      {
        name: "delayInFrames",
        type: "number",
        default: "0",
        description: "Frames before the ramp starts.",
      },
      {
        name: "decimals",
        type: "number",
        default: "0",
        description: "Fixed decimal places. Also fixes the width, so nothing shifts.",
      },
      {
        name: "grouping",
        type: "boolean",
        default: "true",
        description: "Group thousands with the locale's separator.",
      },
      {
        name: "locale",
        type: "string",
        description: "Locale for grouping and decimal marks.",
      },
      {
        name: "format",
        type: "(value: number) => string",
        description: "Full override of the number formatting.",
      },
      {
        name: "prefix",
        type: "string",
        description: "Text before the number, e.g. a currency mark.",
      },
      {
        name: "suffix",
        type: "string",
        description: "Text after the number, e.g. %, K, M.",
      },
      {
        name: "roll",
        type: "boolean",
        default: "false",
        description:
          "Roll each digit like an odometer. Lower digits spin continuously; higher ones turn over on the carry.",
      },
      {
        name: "spring",
        type: "MotionSpring",
        description: "Drive the ramp with a spring instead of the ease-out curve.",
      },
      {
        name: "settle",
        type: "boolean",
        default: "true",
        description: "Small scale pop on the frame the number lands.",
      },
      {
        name: "fontSize",
        type: "number",
        default: "scaled 96px",
        description: "Text size in pixels.",
      },
      {
        name: "fontWeight",
        type: "number",
        default: "700",
        description: "Text weight.",
      },
      {
        name: "color",
        type: "string",
        description: "Text colour.",
      },
      {
        name: "fontFamily",
        type: "string",
        description: "Font family for the number.",
      },
      {
        name: "style",
        type: "CSSProperties",
        description: "Styles merged onto the number.",
      },
    ],
    note: "The width is reserved from the longest value the ramp can produce, so a centred number never reflows the line around it.",
    related: ["stat-card", "progress-bar"],
  },
  "blur-in": {
    category: "primitive",
    usage: `import { BlurIn } from "@/remotion/primitives/blur-in";

<BlurIn maxBlur={12}>
  <h1>Focus reveal</h1>
</BlurIn>`,
    props: [
      ...motionChildProps,
      {
        name: "maxBlur",
        type: "number",
        default: "10",
        description: "Blur radius in pixels at the start.",
      },
      {
        name: "scaleFrom",
        type: "number",
        default: "0.98",
        description: "Scale at the start — the push that sells the pull into focus.",
      },
    ],
    note: "The blur clears at 80% of the travel; held to the last frame the whole entrance feels soft.",
    related: ["fade-in", "scale-in"],
  },
  "spring-in": {
    category: "primitive",
    usage: `import { SpringIn } from "@/remotion/primitives/spring-in";

<SpringIn config="bouncy" durationInFrames={40}>
  <div>Physical entrance</div>
</SpringIn>`,
    props: [
      ...motionChildProps.filter((prop) => prop.name !== "spring"),
      {
        name: "config",
        type: '"smooth" | "snappy" | "bouncy" | Partial<SpringConfig>',
        default: '"snappy"',
        description: "Spring preset, or an override on the snappy config.",
      },
      {
        name: "from",
        type: "number",
        default: "0.88",
        description: "Scale at the start of the entrance.",
      },
      {
        name: "travel",
        type: "number",
        default: "scaled 14px",
        description: "How far it rises as it springs.",
      },
      {
        name: "origin",
        type: "TransformOrigin",
        default: '"center"',
        description: "Point the scale grows from.",
      },
    ],
    note: "`config=\"bouncy\"` overshoots both the scale and the rise, then settles — the reason to use a spring at all.",
    related: ["scale-in", "rotate-in"],
  },
  "stagger-children": {
    category: "primitive",
    usage: `import { StaggerChildren } from "@/remotion/primitives/stagger-children";
import { SlideLeft } from "@/remotion/primitives/slide-left";

<StaggerChildren staggerInFrames={8} exitStaggerInFrames={6}>
  {items.map((item) => (
    <SlideLeft key={item} exit><span>{item}</span></SlideLeft>
  ))}
</StaggerChildren>`,
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: "Child elements to stagger in sequence.",
      },
      {
        name: "staggerInFrames",
        type: "number",
        default: "8",
        description: "Frames between one child starting and the next.",
      },
      {
        name: "baseDelayInFrames",
        type: "number",
        default: "0",
        description: "Frames before the first child starts.",
      },
      {
        name: "order",
        type: '"forward" | "reverse" | "center" | "edges"',
        default: '"forward"',
        description:
          "Which child goes first. center runs outwards from the middle, edges runs inwards.",
      },
      {
        name: "exitStaggerInFrames",
        type: "number",
        default: "0",
        description:
          "Frames between one child leaving and the next, in the order they arrived. 0 lands the group together.",
      },
    ],
    note: "Each child gets a Sequence with layout=\"none\", so it animates from its own frame 0. Inside a bounded window the slot carries an end too, which is what times each child's exit.",
    related: ["slide-left", "fade-in"],
  },
  "marker-highlight": {
    category: "primitive",
    usage: `import { MarkerHighlight } from "@/remotion/primitives/marker-highlight";

<MarkerHighlight
  text="The best motion is code you can read and change."
  phrase="code you can read and change"
  markerColor="#f97316"
/>`,
    props: [
      {
        name: "text",
        type: "string",
        required: true,
        description: "Full sentence to render.",
      },
      {
        name: "phrase",
        type: "string",
        description:
          "Phrase to sweep. Matched case-insensitively and may span several words.",
      },
      {
        name: "highlightWord",
        type: "string",
        description: "Single-word form of phrase.",
      },
      {
        name: "variant",
        type: '"marker" | "knockout" | "underline" | "box"',
        default: '"marker"',
        description: "How the emphasis is drawn.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "12",
        description: "Length of the sweep across one word.",
      },
      {
        name: "delayInFrames",
        type: "number",
        default: "0",
        description: "Frames before the first word is struck.",
      },
      {
        name: "staggerInFrames",
        type: "number",
        default: "4",
        description: "Frames between one word being struck and the next.",
      },
      {
        name: "tilt",
        type: "number",
        default: "-0.7",
        description: "Tilt of the stroke in degrees — a hand does not draw level.",
      },
      {
        name: "markerColor",
        type: "string",
        default: '"#fbbf24"',
        description: "Colour of the stroke.",
      },
      {
        name: "invertOnHighlight",
        type: "boolean",
        default: "knockout only",
        description:
          "Flip the ink under the leading edge of the stroke as it passes.",
      },
      {
        name: "inkColor",
        type: "string",
        default: '"#080810"',
        description: "Ink used over a covered word.",
      },
      {
        name: "color",
        type: "string",
        default: '"#f8fafc"',
        description: "Base text colour.",
      },
      {
        name: "textAlign",
        type: '"left" | "center" | "right"',
        default: '"left"',
        description: "Alignment of the wrapped words.",
      },
      {
        name: "fontSize",
        type: "number",
        default: "scaled 84px",
        description: "Text size in pixels.",
      },
      {
        name: "fontWeight",
        type: "number",
        default: "600",
        description: "Text weight.",
      },
      {
        name: "fontFamily",
        type: "string",
        description: "Font family for the text.",
      },
      {
        name: "style",
        type: "CSSProperties",
        description: "Styles merged onto the wrapper.",
      },
    ],
    note: "The stroke crosses each marked word in turn, so it reads as a hand moving rather than a background appearing.",
    related: ["quote-card", "typewriter"],
  },
  "progress-bar": {
    category: "primitive",
    usage: `import { ProgressBar } from "@/remotion/primitives/progress-bar";

<ProgressBar progress={0.75} label="Rendering" showValue segments={4} />`,
    props: [
      {
        name: "progress",
        type: "number",
        default: "1",
        description: "Value the bar fills to, 0–1.",
      },
      {
        name: "from",
        type: "number",
        default: "0",
        description: "Value the bar starts from, 0–1.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "60",
        description: "Frames the fill takes.",
      },
      {
        name: "delayInFrames",
        type: "number",
        default: "0",
        description: "Frames before the fill starts.",
      },
      {
        name: "spring",
        type: "MotionSpring",
        description: "Drive the fill with a spring instead of the ease-out curve.",
      },
      {
        name: "indeterminate",
        type: "boolean",
        default: "false",
        description: "Loop a shuttle across the track — work with no known end.",
      },
      {
        name: "label",
        type: "string",
        description: "Label above the track.",
      },
      {
        name: "showValue",
        type: "boolean",
        default: "false",
        description: "Percentage readout on the right of the label row.",
      },
      {
        name: "formatValue",
        type: "(progress: number) => string",
        description: "Override the readout text.",
      },
      {
        name: "segments",
        type: "number",
        description: "Divide the track into equal steps.",
      },
      {
        name: "color",
        type: "string",
        default: '"#e8b86d"',
        description: "Fill colour.",
      },
      {
        name: "trackColor",
        type: "string",
        description: "Colour of the empty track.",
      },
      {
        name: "labelColor",
        type: "string",
        description: "Colour of the label row.",
      },
      {
        name: "height",
        type: "number",
        default: "scaled 12px",
        description: "Bar thickness in pixels.",
      },
      {
        name: "radius",
        type: "number",
        default: "height",
        description: "Corner radius.",
      },
      {
        name: "glow",
        type: "boolean",
        default: "true",
        description: "Soft light carried by the leading edge of the fill.",
      },
      {
        name: "width",
        type: "number | string",
        default: '"100%"',
        description: "Width of the whole control.",
      },
    ],
    note: "Lays out inline rather than filling the frame, so it composes inside a card or a stat row.",
    related: ["counter", "intro"],
  },
  "rotate-in": {
    category: "primitive",
    usage: `import { RotateIn } from "@/remotion/primitives/rotate-in";

<RotateIn axis="x" degrees={-24} origin="bottom">
  <div>Hinge into place</div>
</RotateIn>`,
    props: [
      ...motionChildProps,
      {
        name: "degrees",
        type: "number",
        default: "-12",
        description: "Angle it starts at. Negative tilts anticlockwise.",
      },
      {
        name: "axis",
        type: '"z" | "x" | "y"',
        default: '"z"',
        description: "z spins in plane; x and y hinge in depth.",
      },
      {
        name: "perspective",
        type: "number",
        default: "1200",
        description: "Depth of the 3D projection for the x and y axes.",
      },
      {
        name: "scaleFrom",
        type: "number",
        default: "0.96",
        description: "Scale at the start — a rotation that also grows reads as one gesture.",
      },
      {
        name: "origin",
        type: "TransformOrigin",
        default: '"center"',
        description: "Point the rotation pivots around.",
      },
    ],
    related: ["spring-in", "scale-in"],
  },
  "transition-fade": {
    category: "primitive",
    usage: `import { TransitionSeries } from "@remotion/transitions";
import { transitionFade } from "@/remotion/primitives/transition-fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>...</TransitionSeries.Sequence>
  <TransitionSeries.Transition {...transitionFade({ durationInFrames: 15 })} />
  <TransitionSeries.Sequence durationInFrames={60}>...</TransitionSeries.Sequence>
</TransitionSeries>`,
    props: [
      {
        name: "durationInFrames",
        type: "number",
        default: "18",
        description: "Overlap duration between scenes.",
      },
      {
        name: "dipTo",
        type: "string",
        description:
          "Colour the cut passes through. Omit to crossfade the scenes directly.",
      },
      {
        name: "variant",
        type: '"linear" | "spring" | "editorial"',
        default: '"editorial"',
        description: "Timing curve for the fade.",
      },
    ],
    note: "Returns a config object for `TransitionSeries.Transition`, not a React component.",
    related: ["transition-slide", "showcase"],
  },
  "transition-slide": {
    category: "primitive",
    usage: `import { transitionSlide } from "@/remotion/primitives/transition-slide";

<TransitionSeries.Transition
  {...transitionSlide({ direction: "from-left", durationInFrames: 20 })}
/>`,
    props: [
      {
        name: "durationInFrames",
        type: "number",
        default: "20",
        description: "Overlap duration between scenes.",
      },
      {
        name: "direction",
        type: "string",
        default: '"from-right"',
        description: "Slide direction: from-left, from-right, from-top, from-bottom.",
      },
    ],
    note: "Returns a config object for `TransitionSeries.Transition`, not a React component.",
    related: ["transition-fade", "showcase"],
  },
  "lower-third": {
    category: "scene",
    usage: `import { LowerThird } from "@/remotion/scenes/lower-third";

<LowerThird
  title="Jane Doe"
  subtitle="Product Designer"
  accentColor="#f97316"
  align="left"
/>`,
    props: [
      { name: "title", type: "string", required: true, description: "Primary line." },
      { name: "subtitle", type: "string", description: "Secondary line." },
      { name: "badge", type: "string", description: "Small tag on the plate — LIVE, EP 12, the segment." },
      { name: "align", type: '"left" | "right"', default: '"left"', description: "Edge the plate wipes out from." },
      { name: "holdSeconds", type: "number", description: "Seconds before the plate retreats. Omit to leave it on screen." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Badge colour." },
      { name: "backgroundColor", type: "string", description: "Overrides the plate background." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Transparent overlay scene designed to sit over footage.",
    related: ["title-card", "end-card"],
  },
  "title-card": {
    category: "scene",
    usage: `import { TitleCard } from "@/remotion/scenes/title-card";

<TitleCard title="Launch Week" subtitle="Day 1" />`,
    props: [
      { name: "title", type: "string", required: true, description: "Headline. Newlines honoured; otherwise lines are balanced." },
      { name: "subtitle", type: "string", description: "Supporting line." },
      { name: "eyebrow", type: "string", description: "Chip above the headline." },
      { name: "meta", type: "string", description: "Small line under the subtitle — date, author, run time." },
      { name: "charsPerLine", type: "number", default: "22", description: "Characters per line the headline balances to." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Chip, glow, and sweep colour." },
      { name: "backgroundColor", type: "string", description: "Overrides the page background." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["intro", "end-card"],
  },
  "feature-list": {
    category: "scene",
    usage: `import { FeatureList } from "@/remotion/scenes/feature-list";

<FeatureList
  title="Why RemotionUI"
  items={["Own your components", "Live previews", "CLI workflow"]}
/>`,
    props: [
      { name: "items", type: "(string | FeatureItem)[]", required: true, description: "Rows, as strings or { label, detail }. Up to five are shown." },
      { name: "title", type: "string", description: "Section heading." },
      { name: "eyebrow", type: "string", description: "Small label above the heading." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Check and eyebrow colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Self-contained scene. Uses layout and motion-tokens helpers only.",
    related: ["stat-card", "showcase"],
  },
  "stat-card": {
    category: "scene",
    usage: `import { StatCard } from "@/remotion/scenes/stat-card";

<StatCard value={98} label="Satisfaction" suffix="%" />`,
    props: [
      { name: "value", type: "number", default: "98", description: "Number the counter lands on." },
      { name: "max", type: "number", description: "What the value is out of. With it the ring is a meter; without it the ring draws a full sweep." },
      { name: "suffix", type: "string", default: '"%"', description: "Unit after the number." },
      { name: "prefix", type: "string", description: "Unit before the number." },
      { name: "decimals", type: "number", default: "0", description: "Decimal places while counting and at rest." },
      { name: "label", type: "string", default: '"Satisfaction"', description: "Metric label." },
      { name: "caption", type: "string", description: "Line under the label — source, window, cohort." },
      { name: "delta", type: "number", description: "Change against the previous period; lands after the number settles." },
      { name: "deltaSuffix", type: "string", default: '"%"', description: "Unit on the delta chip." },
      { name: "accentColor", type: "string", default: '"#2DD4BF"', description: "Ring, suffix, and delta colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["counter", "feature-list"],
  },
  "quote-card": {
    category: "scene",
    usage: `import { QuoteCard } from "@/remotion/scenes/quote-card";

<QuoteCard
  quote="The best motion is code you can read and change"
  emphasis="motion"
  author="Team"
/>`,
    props: [
      { name: "quote", type: "string", required: true, description: "Quote body." },
      { name: "emphasis", type: "string", description: "Phrase swept with a marker; matched over the whole quote, so it may span a line break." },
      { name: "author", type: "string", description: "Attribution name." },
      { name: "role", type: "string", description: "Second attribution line — role, company, handle." },
      { name: "initials", type: "string", description: "Initials in the attribution disc. Defaults to the author's." },
      { name: "charsPerLine", type: "number", default: "30", description: "Characters per line the quote balances to." },
      { name: "accentColor", type: "string", default: '"#F472B6"', description: "Mark, marker, and disc colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["text-emphasis", "title-card"],
  },
  "end-card": {
    category: "scene",
    usage: `import { EndCard } from "@/remotion/scenes/end-card";

<EndCard title="Thanks for watching" cta="Subscribe" url="youtube.com" />`,
    props: [
      { name: "title", type: "string", required: true, description: "Closing headline." },
      { name: "subtitle", type: "string", description: "Line under the title." },
      { name: "eyebrow", type: "string", description: "Chip above the title." },
      { name: "cta", type: "string", description: "Button label. Omit to end on the title alone." },
      { name: "url", type: "string", description: "Address typed under the button." },
      { name: "handles", type: "string[]", description: "Handles or channels listed along the foot." },
      { name: "logoSrc", type: "string", description: "Brand mark image (staticFile or URL)." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Button, pulse, and eyebrow colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["title-card", "intro"],
  },
  intro: {
    category: "composition",
    usage: `import { Intro } from "@/remotion/compositions/intro";

<Intro title="My Product" subtitle="Launch video" />`,
    props: [
      { name: "title", type: "string", default: '"RemotionUI"', description: "Main title.", schema: { type: "string" } },
      { name: "subtitle", type: "string", description: "Tagline under the title.", schema: { type: "string" } },
      { name: "backgroundColor", type: "string", description: "Page background behind the intro.", schema: { type: "string" } },
      { name: "accentColor", type: "string", description: "Accent used by the progress bar and title.", schema: { type: "string" } },
    ],
    note: "Full intro sequence with staggered title, subtitle, and progress bar.",
    related: ["showcase", "title-card"],
  },
  showcase: {
    category: "composition",
    usage: `import { Showcase } from "@/remotion/compositions/showcase";

<Showcase title="Product story" subtitle="Install source, compose scenes, render on your timeline" statValue={3} statLabel="Runtime dependencies" />`,
    props: [
      { name: "title", type: "string", description: "Opening title." },
      { name: "subtitle", type: "string", description: "Opening subtitle." },
      { name: "featureTitle", type: "string", default: '"Three layers you own"', description: "Headline on the feature list scene." },
      { name: "featureItems", type: "string[]", description: "Rows ticked off in the feature list." },
      { name: "statValue", type: "number", default: "3", description: "Counter value for the stat scene." },
      { name: "statLabel", type: "string", default: '"Runtime dependencies"', description: "Stat card label." },
      { name: "statSuffix", type: "string", default: '""', description: "Unit appended to the stat value, e.g. \"%\"." },
      { name: "ctaLabel", type: "string", description: "End card CTA pill label." },
      { name: "ctaUrl", type: "string", description: "URL shown on the end card." },
    ],
    note: "Demo reel using TransitionSeries across multiple scenes.",
    related: ["transition-fade", "feature-list"],
  },
  "hero-loop": {
    category: "composition",
    usage: `import { HeroLoop } from "@/compositions/hero-loop";

<HeroLoop />`,
    props: [],
    note: "12-second silent hero composition for website embeds. The final frame resolves back into frame 0, so it loops without a seam. Installs as source and demonstrates the primitives it uses.",
    related: ["typewriter", "counter", "stagger-children"],
  },
  "caption-highlight": {
    category: "primitive",
    usage: `import { CaptionHighlight } from "@/remotion/primitives/caption-highlight";

<CaptionHighlight page={page} activeColor="#60a5fa" />`,
    props: [
      { name: "page", type: "TikTokPage", required: true, description: "Caption page from createTikTokStyleCaptions.", schema: { type: "object" } },
      { name: "activeColor", type: "string", default: '"#ff6b00"', description: "Highlight color for the active word.", schema: { type: "string" } },
      { name: "inactiveColor", type: "string", default: '"#111111"', description: "Color for inactive words.", schema: { type: "string" } },
      { name: "fontSize", type: "number", default: "64 (scaled)", description: "Caption font size in pixels.", schema: { type: "number" } },
      { name: "fontWeight", type: "number | string", default: "650", description: "Resting weight.", schema: { oneOf: [{ type: "number" }, { type: "string" }] } },
      { name: "activeWeight", type: "number | string", default: "800", description: "Weight the active word steps to.", schema: { oneOf: [{ type: "number" }, { type: "string" }] } },
      { name: "emphasisScale", type: "number", default: "EMPHASIS.subtle (1.05)", description: "Peak scale of the active word.", schema: { type: "number" } },
      { name: "textAlign", type: '"left" | "center"', default: '"center"', description: "Line alignment.", schema: { type: "string", enum: ["left", "center"] } },
      { name: "frame", type: "number", description: "Frame override — pass the parent frame inside a Sequence.", schema: { type: "number" } },
    ],
    note: "Advanced. Installs @remotion/captions.",
    related: ["caption-scene", "caption-utils"],
  },
  "caption-scene": {
    category: "scene",
    usage: `import { CaptionScene } from "@/remotion/scenes/caption-scene";

<CaptionScene captions={captions} />`,
    props: [
      { name: "captions", type: "Caption[]", required: true, description: "Remotion caption array." },
      { name: "combineTokensWithinMilliseconds", type: "number", default: "1200", description: "Words per caption page." },
      { name: "placement", type: '"lower-third" | "center"', default: '"lower-third"', description: "Caption vertical placement." },
      { name: "mode", type: '"highlight" | "karaoke-scale" | "karaoke-underline"', default: '"karaoke-scale"', description: "Caption emphasis style." },
    ],
    note: "Advanced. Installs @remotion/captions.",
    related: ["caption-highlight", "social-clip"],
  },
  "audiogram-bars": {
    category: "primitive",
    usage: `import { AudiogramBars } from "@/remotion/primitives/audiogram-bars";

<AudiogramBars src={staticFile("podcast.wav")} height={120} />`,
    props: [
      { name: "src", type: "string", required: true, description: "Audio file URL or staticFile path." },
      { name: "height", type: "number", default: "120", description: "Bar container height." },
      { name: "barColor", type: "string", default: '"#e8b86d"', description: "Bar fill color." },
      { name: "barColorEnd", type: "string", description: "Second color for a gradient across the spectrum. Defaults to barColor." },
      { name: "barGap", type: "number", default: "3", description: "Gap between bars in px." },
      { name: "numberOfSamples", type: "number", default: "128", description: "FFT size used to sample the spectrum." },
      { name: "maxBarCount", type: "number", default: "48", description: "Log-spaced bands drawn from the spectrum." },
      { name: "align", type: '"bottom" | "center"', default: '"bottom"', description: "Grow bars from the baseline or mirror them around it." },
      { name: "showPeaks", type: "boolean", default: "true", description: "Draw the decaying peak cap above each bar." },
      { name: "showReflection", type: "boolean", default: "false", description: "Faded mirrored copy below the baseline. Ignored when align is center." },
      { name: "frame", type: "number", description: "Frame override — pass the parent frame inside a Sequence." },
    ],
    note: "Advanced. Installs @remotion/media-utils.",
    related: ["audiogram-scene"],
  },
  "audiogram-scene": {
    category: "scene",
    usage: `import { AudiogramScene } from "@/remotion/scenes/audiogram-scene";

<AudiogramScene src={staticFile("podcast.wav")} title="Episode 1" />`,
    props: [
      { name: "src", type: "string", required: true, description: "Audio file URL or staticFile path." },
      { name: "title", type: "string", description: "Episode title." },
      { name: "subtitle", type: "string", description: "Optional subtitle." },
      { name: "logoSrc", type: "string", description: "Optional brand mark above the title." },
    ],
    related: ["audiogram-bars", "social-clip"],
  },
  "path-draw": {
    category: "primitive",
    usage: `import { PathDraw } from "@/remotion/primitives/path-draw";

<PathDraw d={["M 20 180 L 100 20 L 180 180", "M 60 120 L 140 120"]} durationInFrames={60} />`,
    props: [
      { name: "d", type: "string | string[]", required: true, description: "One path, or several drawn in order." },
      { name: "durationInFrames", type: "number", default: "60", description: "Draw length for each path." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the first path starts." },
      { name: "staggerInFrames", type: "number", default: "8", description: "Offset between paths when d is an array." },
      { name: "stroke", type: "string", default: '"#e8b86d"', description: "Stroke color." },
      { name: "strokeWidth", type: "number", default: "4", description: "Stroke width in path units." },
      { name: "width", type: "number", default: "200", description: "Rendered SVG width in px." },
      { name: "height", type: "number", default: "200", description: "Rendered SVG height in px." },
      { name: "viewBox", type: "string", description: "Omit to frame the artwork from its bounding box." },
      { name: "fill", type: "string", description: "Fill flooded in once the stroke closes." },
      { name: "head", type: "boolean", default: "true", description: "Dot riding the tip while it draws." },
      { name: "glow", type: "boolean", default: "true", description: "Soft bloom around the stroke." },
    ],
    note: "Advanced. Installs @remotion/paths.",
    related: ["logo-reveal", "cursor-path"],
  },
  "logo-reveal": {
    category: "scene",
    usage: `import { LogoReveal } from "@/remotion/scenes/logo-reveal";

<LogoReveal pathD="M 100 20 L 180 180 L 20 180 Z" wordmark="Acme" tagline="Ship faster" />`,
    props: [
      { name: "pathD", type: "string | string[]", required: true, description: "Logo path, or paths drawn in sequence." },
      { name: "viewBox", type: "string", description: "Omit to frame the mark automatically." },
      { name: "size", type: "number", description: "Mark size in px. Defaults to a share of the short edge." },
      { name: "wordmark", type: "string", description: "Brand name rising after the mark completes." },
      { name: "tagline", type: "string", description: "Supporting line, entering last." },
      { name: "stroke", type: "string", default: '"#e8b86d"', description: "Mark stroke color." },
      { name: "strokeWidth", type: "number", description: "Defaults to a share of the mark size." },
      { name: "fill", type: "string", description: "Fill flooded into the mark after the draw." },
      { name: "backgroundColor", type: "string", default: '"#080810"', description: "Scene background." },
    ],
    related: ["path-draw", "title-card"],
  },
  "map-canvas": {
    category: "primitive",
    usage: `import { MapCanvas } from "@/remotion/primitives/map-canvas";

<MapCanvas center={[8.54, 47.38]} zoom={7} onMapReady={setMap} />`,
    props: [
      { name: "center", type: "[number, number]", required: true, description: "Map center [lng, lat]." },
      { name: "zoom", type: "number", default: "7", description: "Initial zoom level." },
      { name: "onMapReady", type: "(map: Map) => void", description: "Called when map is idle." },
    ],
    note: "Advanced. Installs maplibre-gl. Render with --gl=angle --concurrency=1.",
    related: ["map-route", "map-flight"],
  },
  "map-route": {
    category: "primitive",
    usage: `import { MapRoute } from "@/remotion/primitives/map-route";

<MapRoute map={map} route={targetRoute} progress={0.5} />`,
    props: [
      { name: "map", type: "Map | null", required: true, description: "MapLibre map instance." },
      { name: "route", type: "Feature<LineString>", required: true, description: "GeoJSON line to animate." },
      { name: "progress", type: "number", description: "Route reveal progress 0–1." },
    ],
    related: ["map-flight", "map-utils"],
  },
  "map-markers": {
    category: "primitive",
    usage: `import { MapMarkers } from "@/remotion/primitives/map-markers";

<MapMarkers map={map} markers={markerCollection} />`,
    props: [
      { name: "map", type: "Map | null", required: true, description: "MapLibre map instance." },
      { name: "markers", type: "FeatureCollection<Point>", required: true, description: "GeoJSON points with name property." },
    ],
    related: ["map-flight"],
  },
  "map-flight": {
    category: "scene",
    usage: `import { MapFlight } from "@/remotion/scenes/map-flight";

<MapFlight from={[8.54, 47.38]} to={[-74, 40.71]} fromLabel="Zurich" toLabel="New York" />`,
    props: [
      { name: "from", type: "[number, number]", description: "Start coordinates [lng, lat]." },
      { name: "to", type: "[number, number]", description: "End coordinates [lng, lat]." },
      { name: "fromLabel", type: "string", description: "Start marker label." },
      { name: "toLabel", type: "string", description: "End marker label." },
    ],
    note: "Render with npx remotion render --gl=angle --concurrency=1.",
    related: ["map-canvas", "map-route", "map-markers"],
  },
  "transition-wipe": {
    category: "primitive",
    usage: `import { transitionWipe } from "@/remotion/primitives/transition-wipe";

<TransitionSeries.Transition {...transitionWipe({ direction: "from-left" })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "20", description: "Transition overlap length." },
      { name: "direction", type: "string", default: '"from-left"', description: "Wipe direction." },
    ],
    related: ["transition-fade", "transition-clock-wipe"],
  },
  "transition-clock-wipe": {
    category: "primitive",
    usage: `import { transitionClockWipe } from "@/remotion/primitives/transition-clock-wipe";

<TransitionSeries.Transition {...transitionClockWipe({ width: 1920, height: 1080 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "26", description: "Transition overlap length." },
      { name: "width", type: "number", description: "Sweep width. Defaults to the composition width." },
      { name: "height", type: "number", description: "Sweep height. Defaults to the composition height." },
    ],
    related: ["transition-wipe"],
  },
  "transition-light-leak": {
    category: "primitive",
    usage: `import { TransitionLightLeak } from "@/remotion/primitives/transition-light-leak";

<TransitionSeries.Overlay durationInFrames={30}>
  <TransitionLightLeak seed={2} hueShift={45} />
</TransitionSeries.Overlay>`,
    props: [
      { name: "durationInFrames", type: "number", description: "Length of the flare. Defaults to the overlay's own length." },
      { name: "seed", type: "number", default: "0", description: "Light leak pattern seed." },
      { name: "hueShift", type: "number", default: "28", description: "Hue rotation in degrees — warm amber by default." },
      { name: "intensity", type: "number", default: "1", description: "Peak opacity of the leak." },
      { name: "peakAt", type: "number", default: "0.4", description: "Where the flare peaks in its window. Sit it on the cut to hide the seam." },
      { name: "blendMode", type: '"screen" | "plus-lighter" | "normal"', default: '"screen"', description: "How the leak composites over the frame." },
    ],
    note: "Advanced. Installs @remotion/light-leaks. Rendering needs the ANGLE backend — pass --gl=angle.",
    related: ["transition-fade"],
  },
  "blur-reveal": {
    category: "primitive",
    usage: `import { transitionBlurReveal } from "@/remotion/primitives/blur-reveal";

<TransitionSeries.Transition {...transitionBlurReveal({ maxBlur: 24 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "22", description: "Transition overlap length." },
      { name: "maxBlur", type: "number", default: "24", description: "Peak blur radius in px, reached only mid-transition." },
      { name: "scaleBy", type: "number", default: "0.03", description: "Scale headroom the blur rides on. 0 keeps the frame still." },
      { name: "shouldBlurOutExitingScene", type: "boolean", default: "true", description: "Blur the outgoing scene too. false holds it sharp underneath." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"editorial"', description: "Timing curve." },
    ],
    related: ["transition-fade", "frosted-glass-wipe"],
  },
  "grid-pixelate-wipe": {
    category: "primitive",
    usage: `import { transitionGridPixelateWipe } from "@/remotion/primitives/grid-pixelate-wipe";

<TransitionSeries.Transition {...transitionGridPixelateWipe({ cols: 12, rows: 8 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "26", description: "Transition overlap length." },
      { name: "cols", type: "number", default: "12", description: "Grid column count." },
      { name: "rows", type: "number", default: "8", description: "Grid row count." },
      { name: "order", type: '"from-left" | "from-top" | "diagonal" | "center"', default: '"from-left"', description: "Which axis or point the cells light up from." },
      { name: "shape", type: '"square" | "dot"', default: '"square"', description: "Cells fill as blocks, or as points that grow with their own reveal." },
      { name: "stagger", type: "number", default: "0.82", description: "0 pops every cell together; 1 spreads them across the whole window." },
    ],
    related: ["transition-wipe", "blur-reveal"],
  },
  "frosted-glass-wipe": {
    category: "primitive",
    usage: `import { transitionFrostedGlassWipe } from "@/remotion/primitives/frosted-glass-wipe";

<TransitionSeries.Transition {...transitionFrostedGlassWipe({ blur: 20 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "24", description: "Transition overlap length." },
      { name: "blur", type: "number", default: "20", description: "Frost panel blur radius." },
      { name: "panelWidth", type: "number", default: "0.14", description: "Sweep panel width as fraction of frame." },
      { name: "direction", type: '"from-left" | "from-right" | "from-top" | "from-bottom"', default: '"from-left"', description: "Sweep direction." },
      { name: "frostColor", type: "string", default: '"rgba(255,255,255,0.12)"', description: "Tint of the glass panel." },
    ],
    related: ["blur-reveal", "transition-wipe"],
  },
  "auto-fit-title": {
    category: "scene",
    usage: `import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";

<AutoFitTitle title="Headlines that always fit" subtitle="Any resolution" />`,
    props: [
      { name: "title", type: "string", required: true, description: "Headline, fitted to the safe area whatever its length." },
      { name: "subtitle", type: "string", description: "Subtitle; scales with the fitted headline." },
      { name: "logoSrc", type: "string", description: "Brand mark above the headline." },
      { name: "logoSize", type: "number", description: "Logo size in composition pixels." },
      { name: "maxFontSize", type: "number", default: "128", description: "Ceiling for the fitted size, at a 1080-wide stage." },
      { name: "minFontSize", type: "number", default: "34", description: "Floor for the fitted size." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Background glow colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["title-card", "social-clip"],
  },
  "waveform-line": {
    category: "primitive",
    usage: `import { WaveformLine } from "@/remotion/primitives/waveform-line";

<WaveformLine src={staticFile("voice.wav")} />`,
    props: [
      { name: "src", type: "string", required: true, description: "Audio source." },
      { name: "width", type: "number", description: "Drawing width. Defaults to the composition width — pass the slot width inside padding." },
      { name: "height", type: "number", default: "144", description: "SVG waveform height." },
      { name: "variant", type: '"envelope" | "line"', default: '"envelope"', description: "Mirrored amplitude band, or the raw oscilloscope trace." },
      { name: "samples", type: "number", default: "88 / 128", description: "Envelope buckets (88) or trace samples (128)." },
      { name: "windowInSeconds", type: "number", default: "1.2", description: "Audio window drawn around the current frame." },
      { name: "mirror", type: "boolean", default: "false", description: "Reflected copy of the trace. Ignored by the envelope variant, which is already mirrored." },
      { name: "progress", type: "number", description: "Optional 0-1 played progress override." },
      { name: "amplitudeScale", type: "number", default: "0.94 / 0.48", description: "Vertical gain — envelope default 0.94, line default 0.48." },
      { name: "normalize", type: "boolean", default: "true", description: "Normalize the visible window for readable quiet audio." },
      { name: "showBaseline", type: "boolean", default: "true", description: "Render the center baseline." },
    ],
    note: "Advanced. Installs @remotion/media-utils.",
    related: ["audiogram-bars", "audio-pulse"],
  },
  "audio-pulse": {
    category: "primitive",
    usage: `import { AudioPulse } from "@/remotion/primitives/audio-pulse";

<AudioPulse src={staticFile("voice.wav")} />`,
    props: [
      { name: "src", type: "string", required: true, description: "Audio source." },
      { name: "size", type: "number", default: "240", description: "Pulse diameter in px." },
      { name: "color", type: "string", default: '"#e8b86d"', description: "Ring and core color." },
      { name: "ringCount", type: "number", default: "3", description: "Number of reactive rings." },
      { name: "sensitivity", type: "number", default: "1", description: "Multiplier on the measured level before it drives the rings." },
      { name: "frame", type: "number", description: "Frame override — pass the parent frame inside a Sequence." },
    ],
    note: "Advanced. Installs @remotion/media-utils.",
    related: ["waveform-line", "audiogram-scene"],
  },
  "karaoke-captions": {
    category: "primitive",
    usage: `import { KaraokeCaptions } from "@/remotion/primitives/karaoke-captions";

<KaraokeCaptions page={page} mode="scale" />`,
    props: [
      { name: "page", type: "TikTokPage", required: true, description: "Caption page from @remotion/captions." },
      { name: "mode", type: '"scale" | "underline"', default: '"underline"', description: "Active word emphasis style — both modes also pop and lift the word." },
      { name: "fontSize", type: "number", default: "66 (scaled)", description: "Caption size in px." },
      { name: "fontWeight", type: "number | string", default: "800", description: "Caption weight." },
      { name: "emphasisScale", type: "number", default: "EMPHASIS.subtle (1.05)", description: "Peak scale of the active word." },
      { name: "activeColor", type: "string", default: '"#ff6b00"', description: "Color the active word crosses to." },
      { name: "completedColor", type: "string", default: '"#111111"', description: "Color for words already spoken." },
      { name: "inactiveColor", type: "string", default: '"rgba(17,17,17,0.32)"', description: "Color for words not yet spoken." },
      { name: "trackColor", type: "string", description: "Underline track behind the wipe. Defaults to inactiveColor." },
      { name: "frame", type: "number", description: "Frame override — pass the parent frame inside a Sequence." },
    ],
    note: "Use with caption-utils groupCaptionsIntoPages().",
    related: ["caption-highlight", "caption-scene"],
  },
  "line-chart-draw": {
    category: "primitive",
    usage: `import { LineChartDraw } from "@/remotion/primitives/line-chart-draw";

<LineChartDraw
  points={[
    { x: 0, y: 12000, label: "Jan" },
    { x: 1, y: 24000, label: "Feb" },
  ]}
/>`,
    props: [
      { name: "points", type: "ChartPoint[]", required: true, description: "Chart points. `label` supplies the x-axis tick." },
      { name: "width", type: "number", description: "Drawing width. Defaults to the composition width — pass the slot width inside padding." },
      { name: "height", type: "number", description: "Drawing height. Defaults to 40% of the composition height." },
      { name: "color", type: "string", default: '"#e8b86d"', description: "Line, area and dot colour." },
      { name: "strokeWidth", type: "number", description: "Line weight. Scales with the chart width by default." },
      { name: "variant", type: '"smooth" | "linear"', default: '"smooth"', description: "Clamped cardinal spline, or straight segments." },
      { name: "showAxis", type: "boolean", default: "true", description: "Gridlines and value labels on rounded ticks." },
      { name: "showXLabels", type: "boolean", default: "true", description: "Category labels under the plot." },
      { name: "showArea", type: "boolean", default: "true", description: "Gradient fill, wiped in with the draw." },
      { name: "showDots", type: "boolean", default: "true", description: "Dot deposited on each point as the line passes it." },
      { name: "showHead", type: "boolean", default: "true", description: "Glowing dot riding the tip while the line draws." },
      { name: "showEndLabel", type: "boolean", default: "false", description: "Value callout on the final point." },
      { name: "includeZero", type: "boolean", default: "true", description: "Anchor the axis at zero. Turn off for sparklines." },
      { name: "valueFormatter", type: "(value: number) => string", description: "Formats axis ticks and the end label." },
      { name: "durationInFrames", type: "number", default: "70", description: "Draw-on duration." },
      { name: "delayInFrames", type: "number", default: "0", description: "Delay before the draw starts." },
      { name: "frame", type: "number", description: "Frame override — pass the parent frame inside a Sequence." },
    ],
    note: "Advanced. Installs @remotion/paths.",
    related: ["animated-bar-chart", "metric-ticker", "path-draw"],
  },
  "cursor-path": {
    category: "primitive",
    usage: `import { CursorPath } from "@/remotion/primitives/cursor-path";

<CursorPath points={[{ x: 80, y: 120 }, { x: 320, y: 80 }]} clickAt={[1]} />`,
    props: [
      { name: "points", type: "{ x: number; y: number }[]", description: "Route waypoints in the parent's coordinates." },
      { name: "d", type: "string", description: "Authored SVG path to follow instead of points." },
      { name: "durationInFrames", type: "number", default: "90", description: "Travel duration." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the cursor sets off." },
      { name: "color", type: "string", default: '"#e8b86d"', description: "Trail and ripple color." },
      { name: "size", type: "number", default: "34", description: "Cursor size in px." },
      { name: "smoothing", type: "number", default: "0.6", description: "0 hops in straight lines; higher rounds corners." },
      { name: "trail", type: '"draw" | "guide" | "none"', default: '"draw"', description: "Reveal the route behind the cursor, show it up front, or hide it." },
      { name: "clickAt", type: "number[]", description: "Waypoint indices that ripple as the cursor arrives." },
    ],
    note: "Advanced. Installs @remotion/paths.",
    related: ["simulated-cursor", "callout-spotlight", "zoom-pan-frame"],
  },
  "media-frame": {
    category: "scene",
    usage: `import { MediaFrame } from "@/remotion/scenes/media-frame";

<MediaFrame src={staticFile("demo.png")} title="Product demo" />`,
    props: [
      { name: "src", type: "string", required: true, description: "Image or video source." },
      { name: "title", type: "string", description: "Headline above the frame; masks up out of its own line." },
      { name: "caption", type: "string", description: "Supporting line under the frame." },
      { name: "eyebrow", type: "string", description: "Small label above the title." },
      { name: "fit", type: '"cover" | "contain"', default: '"contain"', description: "Media object-fit behaviour. Use contain for UI screenshots." },
      { name: "aspect", type: "number", default: "16 / 9", description: "Aspect the frame is cut to, so contain media fills it." },
      { name: "radius", type: "number", description: "Corner radius in composition pixels." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Rim light and eyebrow colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Advanced. Installs @remotion/media for video sources.",
    related: ["media-sequence", "split-screen"],
  },
  "media-sequence": {
    category: "scene",
    usage: `import { MediaSequence } from "@/remotion/scenes/media-sequence";

<MediaSequence items={[{ src: staticFile("one.png"), title: "Hook" }]} />`,
    props: [
      { name: "items", type: "MediaItem[]", required: true, description: "Timed media items." },
      { name: "defaultDurationInFrames", type: "number", default: "78", description: "Length of an item that sets no duration of its own." },
      { name: "transitionDurationInFrames", type: "number", default: "14", description: "Overlap between neighbouring items." },
      { name: "transition", type: '"slide" | "fade"', default: '"slide"', description: "Push the next item on, or dissolve to it." },
      { name: "showProgress", type: "boolean", default: "true", description: "Chapter strip along the foot." },
      { name: "aspect", type: "number", default: "16 / 9", description: "Aspect the frames are cut to." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Strip fill and frame rim colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
    ],
    related: ["media-frame", "tutorial-clip"],
  },
  "split-screen": {
    category: "scene",
    usage: `import { SplitScreen } from "@/remotion/scenes/split-screen";

<SplitScreen left={{ src: before }} right={{ src: after }} />`,
    props: [
      { name: "left", type: "SplitScreenPanel", required: true, description: "Left panel: { src, label, fit }." },
      { name: "right", type: "SplitScreenPanel", required: true, description: "Right panel; sits underneath so the wipe uncovers it." },
      { name: "title", type: "string", description: "Headline above the comparison." },
      { name: "wipeAtSeconds", type: "number", description: "When the divider travels right to leave the right panel whole." },
      { name: "split", type: "number", default: "0.5", description: "Where the divider rests before any wipe, 0–1." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Divider and label colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["media-frame", "b-roll-stack"],
  },
  "b-roll-stack": {
    category: "scene",
    usage: `import { BRollStack } from "@/remotion/scenes/b-roll-stack";

<BRollStack
  kicker="Cutaway"
  title="Layer proof shots behind the narration"
  items={[{ src: staticFile("shot.png"), title: "Proof", fit: "cover" }]}
/>`,
    props: [
      { name: "items", type: "BRollItem[]", description: "Image or video cards to layer. Omit for styled placeholders." },
      { name: "kicker", type: "string", default: '"Supporting visuals"', description: "Short label above the headline." },
      { name: "title", type: "string", description: "Scene headline." },
      { name: "caption", type: "string", description: "Supporting copy below the headline." },
      { name: "holdSeconds", type: "number", default: "1.35", description: "Seconds a shot holds at the front before the deck advances." },
      { name: "aspect", type: "number", default: "16 / 9", description: "Aspect the cards are cut to." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Kicker, card rim, and label colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["media-frame", "media-sequence"],
  },
  "caption-bumper": {
    category: "scene",
    usage: `import { CaptionBumper } from "@/remotion/scenes/caption-bumper";

<CaptionBumper text="This is the key moment." />`,
    props: [
      { name: "text", type: "string", required: true, description: "The line the bumper exists to land." },
      { name: "eyebrow", type: "string", description: "Small label above it — segment, chapter, timestamp." },
      { name: "maxFontSize", type: "number", default: "84", description: "Largest type size at a 1280-wide stage." },
      { name: "holdSeconds", type: "number", description: "Seconds before the card wipes out. Omit to hold to the end." },
      { name: "accentColor", type: "string", default: '"#F472B6"', description: "Ground, eyebrow, and rule colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["karaoke-captions", "data-story"],
  },
  "animated-bar-chart": {
    category: "scene",
    usage: `import { AnimatedBarChart } from "@/remotion/scenes/animated-bar-chart";

<AnimatedBarChart
  title="Views by format"
  data={[{ label: "Shorts", value: 124000, delta: "+32%" }]}
  highlightLabel="Shorts"
/>`,
    props: [
      { name: "data", type: "ChartDatum[]", required: true, description: "Bar labels and values. Optional `color` and `delta` per bar." },
      { name: "title", type: "string", description: "Scene headline." },
      { name: "subtitle", type: "string", description: "Supporting line under the title." },
      { name: "maxValue", type: "number", description: "Fixed axis top. Defaults to a rounded domain above the largest bar." },
      { name: "valueFormatter", type: "(value: number) => string", default: "formatCompactNumber", description: "Formats the value on the end of each bar." },
      { name: "highlightLabel", type: "string", description: "Label of the bar that carries accentColor." },
      { name: "showAxis", type: "boolean", default: "true", description: "Gridlines and the value axis under the bars." },
      { name: "maxBars", type: "number", default: "6", description: "Bars beyond this count are dropped rather than squeezed." },
      { name: "barColor", type: "string", default: '"#2dd4bf"', description: "Series colour." },
      { name: "accentColor", type: "string", default: '"#e8b86d"', description: "Colour for the highlighted bar." },
    ],
    note: "Bars and their counters share one spring, so the number never leads the bar.",
    related: ["metric-ticker", "line-chart-draw", "data-story"],
  },
  "metric-ticker": {
    category: "scene",
    usage: `import { MetricTicker } from "@/remotion/scenes/metric-ticker";

<MetricTicker
  title="Channel momentum"
  metrics={[
    { label: "Views", value: 124000, delta: "+18%", trend: [62, 84, 96, 124] },
  ]}
/>`,
    props: [
      { name: "metrics", type: "MetricTickerItem[]", required: true, description: "Metric cards — label, value, and optional prefix, suffix, delta, trend, color." },
      { name: "title", type: "string", description: "Scene title." },
      { name: "eyebrow", type: "string", description: "Short label above the title." },
      { name: "valueFormatter", type: "(value: number) => string", default: "formatCompactNumber", description: "Formats the counted value." },
      { name: "maxCards", type: "number", default: "4", description: "Cards beyond this count are dropped rather than squeezed." },
      { name: "accentColor", type: "string", default: '"#e8b86d"', description: "Value colour, overridable per metric." },
      { name: "backgroundColor", type: "string", default: '"#080810"', description: "Scene background." },
    ],
    note: "A signed delta (+/-) picks the arrow, the chip colour, and the sparkline tint.",
    related: ["animated-bar-chart", "line-chart-draw", "data-story"],
  },
  "timeline-steps": {
    category: "scene",
    usage: `import { TimelineSteps } from "@/remotion/scenes/timeline-steps";

<TimelineSteps steps={[{ title: "Record" }, { title: "Render" }]} />`,
    props: [
      { name: "steps", type: "TimelineStep[]", required: true, description: "Steps in order; up to five are walked." },
      { name: "title", type: "string", description: "Heading above the rail." },
      { name: "eyebrow", type: "string", description: "Small label above the heading." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Rail, node, and check colour." },
      { name: "backgroundColor", type: "string", description: "Overrides the page background." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["data-story", "feature-list"],
  },
  "callout-spotlight": {
    category: "scene",
    usage: `import { CalloutSpotlight } from "@/remotion/scenes/callout-spotlight";

<CalloutSpotlight kicker="Tutorial" title="Click export" target={{ x: 320, y: 180, width: 420, height: 180 }} />`,
    props: [
      { name: "title", type: "string", required: true, description: "Callout headline." },
      { name: "kicker", type: "string", description: "Small label above the headline." },
      { name: "subtitle", type: "string", description: "Supporting line below the headline." },
      { name: "target", type: "SpotlightTarget", required: true, description: "Region to spotlight, in source pixels; clamped to the safe area. The card flips above it when bottom clearance is low." },
      { name: "backgroundSrc", type: "string", description: "Screenshot or capture under the spotlight." },
      { name: "sourceWidth", type: "number", description: "Size the target was measured against. Defaults to the composition." },
      { name: "sourceHeight", type: "number", description: "As above, vertically." },
      { name: "dim", type: "number", default: "0.72", description: "How far the rest of the frame is knocked back, 0–1." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Outline, ping, and connector colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["zoom-pan-frame", "tutorial-clip"],
  },
  "zoom-pan-frame": {
    category: "scene",
    usage: `import { ZoomPanFrame } from "@/remotion/scenes/zoom-pan-frame";

<ZoomPanFrame src={staticFile("screenshot.png")} to={{ x: 0.38, y: 0.4, scale: 1.2 }} />`,
    props: [
      { name: "src", type: "string", required: true, description: "Image or video source." },
      { name: "from", type: "FocalPoint", description: "Where the move starts: { x, y, scale } with x/y in 0–1." },
      { name: "to", type: "FocalPoint", description: "Where the move lands. Defaults to a centred 1.24 push." },
      { name: "moveInFrames", type: "number", description: "Length of the move. Defaults to the composition minus a short settle." },
      { name: "label", type: "string", description: "Chip that rises once the move lands." },
      { name: "vignette", type: "number", default: "0.34", description: "Corner darkening; 0 turns it off." },
      { name: "fit", type: '"cover" | "contain"', default: '"cover"', description: "Media object-fit behaviour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
    ],
    related: ["callout-spotlight", "cursor-path"],
  },
  "code-reveal": {
    category: "scene",
    usage: `import { CodeReveal } from "@/remotion/scenes/code-reveal";

<CodeReveal title="pipeline.ts" code={source} highlightedLines={[4, 5]} />`,
    props: [
      { name: "code", type: "string", description: "Source shown in the editor; surrounding blank lines are trimmed." },
      { name: "highlightedLines", type: "number[]", description: "1-based lines focused once the listing finishes writing." },
      { name: "title", type: "string", default: '"explainer.tsx"', description: "Filename on the editor tab." },
      { name: "language", type: "string", default: '"tsx"', description: "Language badge on the right of the header." },
      { name: "startLine", type: "number", default: "1", description: "First line number in the gutter, for excerpts." },
      { name: "showLineNumbers", type: "boolean", default: "true", description: "Shows the gutter." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Caret, focus band and glow color." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Editor palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["tutorial-clip", "terminal-simulator", "code-diff-wipe"],
  },
  "terminal-simulator": {
    category: "scene",
    usage: `import { TerminalSimulator } from "@/remotion/scenes/terminal-simulator";

<TerminalSimulator command="pnpm build" summary="done in 4.2s" />`,
    props: [
      { name: "command", type: "string", default: '"pnpm registry:build"', description: "Command typed at the prompt before anything runs." },
      { name: "steps", type: "TerminalStep[]", description: "Steps printed in order; each spins, then resolves to a glyph and timing." },
      { name: "summary", type: "string", default: '"6 blocks · 1.9 MB · done in 4.2s"', description: "Dim line printed after the last step." },
      { name: "prompt", type: "string", default: '"~/remotion-ui"', description: "Prompt prefix, usually a working directory." },
      { name: "title", type: "string", default: '"Build output"', description: "Terminal window title." },
      { name: "shell", type: "string", default: '"zsh"', description: "Shell label on the right of the header." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Prompt, spinner and glow color." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Terminal palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["code-reveal", "claude-code", "opencode"],
  },
  "code-accordion": {
    category: "scene",
    usage: `import { CodeAccordion } from "@/remotion/scenes/code-accordion";

<CodeAccordion sections={sections} />`,
    props: [
      { name: "sections", type: "AccordionSection[]", description: "Steps played in order; each has a title, code, and optional meta." },
      { name: "activeIndex", type: "number", description: "Pins one step open instead of walking the list." },
      { name: "title", type: "string", default: '"Add it to your project"', description: "Label above the steps." },
      { name: "holdSeconds", type: "number", default: "0.75", description: "Seconds an opened step is held before it closes." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Chevron, fill and glow color." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Panel palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["code-reveal", "code-diff-wipe"],
  },
  "code-diff-wipe": {
    category: "scene",
    usage: `import { CodeDiffWipe } from "@/remotion/scenes/code-diff-wipe";

<CodeDiffWipe before={before} after={after} title="render.ts" />`,
    props: [
      { name: "before", type: "string", description: "Source before the patch." },
      { name: "after", type: "string", description: "Source after the patch; the scene diffs the two." },
      { name: "title", type: "string", default: '"render.ts"', description: "Filename on the window header." },
      { name: "wipeSeconds", type: "number", default: "1.7", description: "Seconds the apply front takes to travel the file." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Apply front and glow color." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Editor palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["code-reveal", "code-accordion"],
  },
  "data-flow-pipes": {
    category: "scene",
    usage: `import { DataFlowPipes } from "@/remotion/scenes/data-flow-pipes";

<DataFlowPipes stages={[{ label: "Ingest" }, { label: "Deliver" }]} />`,
    props: [
      { name: "stages", type: "PipeStage[]", description: "Stages in order, each { label, detail }. Two to five read best." },
      { name: "unit", type: "string", default: '"clips"', description: "Unit counted at each stage." },
      { name: "packets", type: "number", default: "9", description: "Payloads pushed through the pipeline." },
      { name: "accentColor", type: "string", default: '"#2DD4BF"', description: "Pipe, packet, and node colour." },
      { name: "backgroundColor", type: "string", description: "Overrides the page background." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["timeline-steps", "metric-ticker"],
  },
  "drag-drop-flow": {
    category: "scene",
    usage: `import { DragDropFlow } from "@/remotion/scenes/drag-drop-flow";

<DragDropFlow fileName="hero-loop.tsx" />`,
    props: [
      { name: "fileName", type: "string", default: '"hero-take.mp4"', description: "File the cursor picks up." },
      { name: "fileSize", type: "string", default: '"48.2 MB"', description: "Size shown once the upload completes." },
      { name: "siblings", type: "string[]", description: "Other rows in the source list." },
      { name: "sourceLabel", type: "string", default: '"Media library"', description: "Heading on the source panel." },
      { name: "label", type: "string", default: '"Drop your clip"', description: "Idle prompt in the drop zone." },
      { name: "hint", type: "string", description: "Second line under the prompt." },
      { name: "activeLabel", type: "string", default: '"Release to upload"', description: "Prompt while the file is held over the zone." },
      { name: "doneLabel", type: "string", default: '"Uploaded"', description: "Label once the upload finishes." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Zone, cursor ring, and progress colour." },
      { name: "backgroundColor", type: "string", description: "Overrides the page background." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["cursor-path", "simulated-cursor", "tutorial-clip"],
  },
  "chat-to-preview": {
    category: "scene",
    usage: `import { ChatToPreview } from "@/remotion/scenes/chat-to-preview";

<ChatToPreview messages={messages} previewTitle="Ship the scene" />`,
    props: [
      { name: "messages", type: "ChatMessage[]", description: "The exchange, in order. User turns type and send; assistant turns stream. Drives the whole clock." },
      { name: "previewTitle", type: "string", default: '"Ship the scene"', description: "Title the finished preview renders." },
      { name: "previewCaption", type: "string", description: "Supporting line under the preview title." },
      { name: "previewLabel", type: "string", default: '"Preview"', description: "Name of the preview surface in its header." },
      { name: "placeholder", type: "string", description: "Composer placeholder before anything is typed." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Assistant bubble, status, and render tint." },
      { name: "backgroundColor", type: "string", description: "Overrides the page background." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["talking-head-layout", "media-frame"],
  },
  "claude-chat": {
    category: "scene",
    usage: `import { ClaudeChat } from "@/remotion/scenes/claude-chat";

<ClaudeChat prompt="Draft a launch tweet for our new release" />`,
    props: [
      { name: "placeholder", type: "string", default: '"Try: draft an email · summarize a doc · plan your week"', description: "Empty composer placeholder text." },
      { name: "prompt", type: "string", default: '"Draft a launch tweet for our new release"', description: "Prompt typed into the composer." },
      { name: "modelName", type: "string", default: '"Opus 4.8"', description: "Model label in the toolbar." },
      { name: "modelTier", type: "string", default: '"Max"', description: "Tier label beside the model." },
      { name: "accentColor", type: "string", default: '"#D97757"', description: "Terracotta send button color." },
      { name: "theme", type: '"light" | "dark"', default: '"light"', description: "Light or dark surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["chat-gpt", "v0", "chat-to-preview"],
  },
  "chat-gpt": {
    category: "scene",
    usage: `import { ChatGpt } from "@/remotion/scenes/chat-gpt";

<ChatGpt prompt="Make a sunset over a calm ocean" />`,
    props: [
      { name: "greeting", type: "string", default: `"What's on your mind today?"`, description: "Headline above the composer." },
      { name: "placeholder", type: "string", default: '"Ask anything"', description: "Empty input placeholder." },
      { name: "prompt", type: "string", default: '"Make a sunset over a calm ocean"', description: "Prompt typed into the ChatGPT composer." },
      { name: "accentColor", type: "string", default: '"#2F6FED"', description: "Voice button color before it morphs to send." },
      { name: "theme", type: '"light" | "dark"', default: '"light"', description: "Light or dark surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["claude-chat", "v0", "chat-to-preview"],
  },
  v0: {
    category: "scene",
    usage: `import { V0Composer } from "@/remotion/scenes/v0";

<V0Composer prompt="a landing page for my SaaS with pricing" />`,
    props: [
      { name: "greeting", type: "string", default: '"What do you want to create?"', description: "Bold heading above the box." },
      { name: "placeholder", type: "string", default: '"Ask v0 to build…"', description: "Empty textarea placeholder." },
      { name: "prompt", type: "string", default: '"a landing page for my SaaS with pricing and testimonials"', description: "Build prompt typed into the textarea." },
      { name: "modelName", type: "string", default: '"v0 Max"', description: "Model chip label in the toolbar." },
      { name: "projectName", type: "string", default: '"Project"', description: "Project selector label." },
      { name: "theme", type: '"light" | "dark"', default: '"dark"', description: "Light or dark surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["claude-chat", "chat-gpt", "chat-to-preview"],
  },
  "claude-code": {
    category: "scene",
    usage: `import { ClaudeCode } from "@/remotion/scenes/claude-code";

<ClaudeCode prompt='edit src/theme.ts to add a dark mode toggle' />`,
    props: [
      { name: "title", type: "string", default: '"Claude Code v2.0.0"', description: "Legend label on the dashed welcome box." },
      { name: "userName", type: "string", default: '"Meaghan"', description: "Welcome message name." },
      { name: "model", type: "string", default: '"Opus 4.8 • Max 20x"', description: "Active model label." },
      { name: "cwd", type: "string", default: '"/users/meaghan/code/apps"', description: "Working directory shown in the welcome panel." },
      { name: "placeholder", type: "string", default: `'Try "edit <filepath> to ..."'`, description: "CLI prompt placeholder before typing." },
      { name: "prompt", type: "string", default: '"edit src/theme.ts to add a dark mode toggle"', description: "Command typed at the CLI prompt." },
      { name: "accentColor", type: "string", default: '"#D97757"', description: "Dashed border and highlight color." },
      { name: "theme", type: '"light" | "dark"', default: '"dark"', description: "Light or dark terminal palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["terminal-simulator", "code-reveal", "opencode"],
  },
  opencode: {
    category: "scene",
    usage: `import { Opencode } from "@/remotion/scenes/opencode";

<Opencode query='"What is the tech stack of this project?"' />`,
    props: [
      { name: "placeholder", type: "string", default: '"Ask anything... "', description: "Muted prefix before the typed query." },
      { name: "query", type: "string", default: `'"What is the tech stack of this project?"'`, description: "Query typed after the placeholder." },
      { name: "agentName", type: "string", default: '"Build"', description: "Active agent label." },
      { name: "modelName", type: "string", default: '"Kimi K2.5"', description: "Model name in the status row." },
      { name: "provider", type: "string", default: '"Moonshot AI"', description: "Model provider label." },
      { name: "accentColor", type: "string", default: '"#2B7FFF"', description: "Left accent bar and agent color." },
      { name: "theme", type: '"light" | "dark"', default: '"dark"', description: "Light or dark TUI palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    related: ["claude-code", "terminal-simulator", "chat-gpt"],
  },
  "hook-card": {
    category: "scene",
    usage: `import { HookCard } from "@/remotion/scenes/hook-card";

<HookCard
  kicker="Creator insight"
  headline="Make the first second count"
  emphasis="first second"
  subtitle="Hook viewers before they scroll"
/>`,
    props: [
      { name: "headline", type: "string", required: true, description: "The hook. Newlines are honoured as written; otherwise it is balanced across lines." },
      { name: "kicker", type: "string", description: "Small live label that counts in above the hook." },
      { name: "subtitle", type: "string", description: "Supporting line that settles once the hook has landed." },
      { name: "emphasis", type: "string", description: "Substring of headline that takes the accent colour and the underline. Matched case-insensitively, and may span a line break." },
      { name: "align", type: '"left" | "center"', description: "Hook alignment. Default \"left\"." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Label, underline, and bloom colour." },
      { name: "backgroundColor", type: "string", description: "Overrides the page background." },
      { name: "theme", type: '"dark" | "light"', description: "Page palette. Default \"dark\"." },
      { name: "speed", type: "number", description: "Animation speed multiplier for fitting a fixed-length Sequence. Default 1." },
    ],
    related: ["creator-reel", "title-card", "auto-fit-title"],
  },
  "talking-head-layout": {
    category: "scene",
    usage: `import { TalkingHeadLayout } from "@/remotion/scenes/talking-head-layout";

<TalkingHeadLayout
  mediaSrc={staticFile("speaker.mp4")}
  audioSrc={staticFile("voice.wav")}
  eyebrow="On camera"
  title="Maya Okonkwo"
  subtitle="Founder, Northlight Studio"
  captions={["Keep the speaker readable.", "Reserve the lower frame."]}
/>`,
    props: [
      { name: "mediaSrc", type: "string", description: "Speaker image or video. Falls back to a framed placeholder." },
      { name: "audioSrc", type: "string", description: "Voice track the waveform is drawn from. Omit to hide the waveform." },
      { name: "eyebrow", type: "string", description: "Small label above the name on the plate, e.g. a role." },
      { name: "title", type: "string", description: "Name plate headline." },
      { name: "subtitle", type: "string", description: "Second plate line." },
      { name: "captions", type: "string[]", description: "Spoken lines. They play one at a time, word by word, in the zone reserved under the frame. Omit and the zone collapses." },
      { name: "fit", type: '"cover" | "contain"', default: '"cover"', description: "Media object-fit behavior." },
      { name: "accentColor", type: "string", default: '"#2DD4BF"', description: "Plate label, waveform, and ambient light color." },
      { name: "backgroundColor", type: "string", description: "Overrides the page background behind the frame." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Palette the page and plate are drawn from." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier for shorter Sequences." },
    ],
    note: "Advanced. Installs @remotion/media and waveform-line for optional audio visuals.",
    related: ["creator-reel", "caption-scene", "media-frame"],
  },
  "comment-callout": {
    category: "scene",
    usage: `import { CommentCallout } from "@/remotion/scenes/comment-callout";

<CommentCallout
  author="Mina Lee"
  handle="@minamakes"
  body="Can you turn this into a quick video breakdown?"
  highlight="a quick video breakdown"
  reply="Dropping it Thursday — here's the short version."
/>`,
    props: [
      { name: "body", type: "string", description: "The viewer comment being answered." },
      { name: "author", type: "string", description: "Display name of the commenter." },
      { name: "handle", type: "string", description: "Social handle, also shown on the reply line." },
      { name: "initials", type: "string", description: "Avatar initials. Defaults to the first two letters of author." },
      { name: "timestamp", type: "string", description: "Relative time shown after the handle, e.g. \"2h\"." },
      { name: "highlight", type: "string", description: "Substring of body the marker sweeps across. Matched case-insensitively; omit to skip the beat." },
      { name: "reply", type: "string", description: "Answer typed into the composer and sent. Pass an empty string to end on the comment." },
      { name: "replyLabel", type: "string", description: "Label on the reply action. Defaults to \"Reply\"." },
      { name: "likes", type: "number", description: "Like count before the creator hearts the comment. Default 128." },
      { name: "accentColor", type: "string", description: "Avatar, marker, heart, and send colour." },
      { name: "backgroundColor", type: "string", description: "Overrides the page background behind the card." },
      { name: "theme", type: '"dark" | "light"', description: "Card palette. Default \"dark\"." },
      { name: "speed", type: "number", description: "Animation speed multiplier for fitting a fixed-length Sequence. Default 1." },
    ],
    related: ["creator-reel", "quote-card", "caption-bumper"],
  },
  "social-clip": {
    category: "composition",
    usage: `import { SocialClip } from "@/compositions/social-clip";

<SocialClip audioSrc={staticFile("podcast.wav")} captions={captions} />`,
    props: [
      { name: "audioSrc", type: "string", required: true, description: "Podcast audio source.", schema: { type: "string" } },
      { name: "captions", type: "Caption[]", required: true, description: "Synced caption array.", schema: { type: "array", items: { type: "object" } } },
      { name: "hookTitle", type: "string", description: "Opening hook headline.", schema: { type: "string" } },
      { name: "hookSubtitle", type: "string", description: "Supporting line under the hook.", schema: { type: "string" } },
      { name: "podcastTitle", type: "string", default: '"Weekly Brief"', description: "Show name shown over the audiogram body.", schema: { type: "string" } },
      { name: "logoSrc", type: "string", description: "Optional brand mark shown in hook, body, and end card.", schema: { type: "string" } },
      { name: "ctaTitle", type: "string", default: '"Hear the full episode"', description: "End card headline.", schema: { type: "string" } },
      { name: "ctaLabel", type: "string", description: "End card CTA pill label.", schema: { type: "string" } },
      { name: "ctaUrl", type: "string", description: "URL shown on the end card.", schema: { type: "string" } },
    ],
    note: "9:16 social template (1080×1920). Advanced tier.",
    related: ["caption-scene", "audiogram-scene", "auto-fit-title"],
  },
  "creator-reel": {
    category: "composition",
    usage: `import { CreatorReel } from "@/compositions/creator-reel";

<CreatorReel
  mediaSrc={staticFile("speaker.mp4")}
  audioSrc={staticFile("voice.wav")}
  captions={captions}
/>`,
    props: [
      { name: "hookHeadline", type: "string", description: "Opening hook headline (auto-fit in portrait).", schema: { type: "string" } },
      { name: "hookSubtitle", type: "string", description: "Supporting line under the hook.", schema: { type: "string" } },
      { name: "mediaSrc", type: "string", description: "Speaker image or video source.", schema: { type: "string" } },
      { name: "mediaFit", type: '"cover" | "contain"', default: '"cover"', description: "Speaker media object-fit behavior.", schema: { type: "string", enum: ["cover", "contain"] } },
      { name: "audioSrc", type: "string", description: "Optional audio source for waveform visuals.", schema: { type: "string" } },
      { name: "captions", type: "Caption[]", description: "Synced captions layered over the talking-head scene.", schema: { type: "array", items: { type: "object" } } },
      { name: "talkingHeadEyebrow", type: "string", description: "Eyebrow label above the talking-head title.", schema: { type: "string" } },
      { name: "talkingHeadTitle", type: "string", description: "Short title in the talking-head layout.", schema: { type: "string" } },
      { name: "comment", type: "string", description: "Comment callout body text.", schema: { type: "string" } },
      { name: "author", type: "string", description: "Comment author display name.", schema: { type: "string" } },
      { name: "handle", type: "string", description: "Comment author handle.", schema: { type: "string" } },
      { name: "bRollItems", type: "BRollItem[]", description: "Media cards for the proof/b-roll section.", schema: { type: "array", items: { type: "object" } } },
      { name: "bRollTitle", type: "string", description: "Headline beside the b-roll stack.", schema: { type: "string" } },
      { name: "bRollKicker", type: "string", default: '"Proof beats"', description: "Eyebrow above the b-roll headline.", schema: { type: "string" } },
      { name: "accentColor", type: "string", description: "Accent used across hook, captions, and end card.", schema: { type: "string" } },
      { name: "ctaTitle", type: "string", description: "End card headline (separate from hook).", schema: { type: "string" } },
      { name: "ctaLabel", type: "string", description: "End card CTA pill label.", schema: { type: "string" } },
    ],
    note: "9:16 creator template. Advanced tier.",
    related: ["hook-card", "talking-head-layout", "comment-callout"],
  },
  "tutorial-clip": {
    category: "composition",
    usage: `import { TutorialClip } from "@/compositions/tutorial-clip";

<TutorialClip mediaSrc={staticFile("demo.png")} />`,
    props: [
      { name: "mediaSrc", type: "string", required: true, description: "Screenshot or video source." },
      { name: "mediaWidth", type: "number", default: "1280", description: "Pixel width `calloutTarget` was measured against." },
      { name: "mediaHeight", type: "number", default: "720", description: "Pixel height `calloutTarget` was measured against." },
      { name: "title", type: "string", description: "Opening hook title." },
      { name: "subtitle", type: "string", description: "Supporting line under the hook." },
      { name: "calloutTitle", type: "string", default: '"Spotlight the control"', description: "Headline on the spotlight callout card." },
      { name: "calloutSubtitle", type: "string", description: "Supporting line on the callout card." },
      { name: "calloutTarget", type: "SpotlightTarget", description: "Region to spotlight, in media pixels." },
      { name: "code", type: "string", description: "Code reveal content." },
      { name: "ctaTitle", type: "string", description: "End card headline. Defaults to `title`." },
      { name: "ctaLabel", type: "string", description: "End card CTA pill label." },
    ],
    note: "9:16 walkthrough template. `calloutTarget` is read in media pixels and mapped through the same cover crop as the background, so pass `mediaWidth`/`mediaHeight` whenever the capture is not the composition size.",
    related: ["media-frame", "callout-spotlight", "code-reveal"],
  },
  "data-story": {
    category: "composition",
    usage: `import { DataStory } from "@/compositions/data-story";

<DataStory barData={barData} metrics={metrics} steps={steps} />`,
    props: [
      { name: "title", type: "string", description: "Opening hook headline (auto-fit)." },
      { name: "subtitle", type: "string", description: "Supporting line under the hook." },
      { name: "barData", type: "ChartDatum[]", required: true, description: "Bar chart data." },
      { name: "metrics", type: "MetricTickerItem[]", required: true, description: "Metric cards." },
      { name: "steps", type: "TimelineStep[]", required: true, description: "Context steps." },
      { name: "chartTitle", type: "string", description: "Headline on the bar chart scene." },
      { name: "metricsTitle", type: "string", description: "Headline on the metric ticker scene." },
      { name: "timelineTitle", type: "string", description: "Headline on the timeline scene." },
      { name: "insight", type: "string", description: "Takeaway quote in the insight bumper." },
      { name: "insightEyebrow", type: "string", description: "Eyebrow above the insight quote." },
      { name: "ctaTitle", type: "string", description: "End card headline (separate from hook)." },
      { name: "ctaLabel", type: "string", description: "End card CTA pill label." },
    ],
    note: "1920×1080 data explainer template. Advanced tier.",
    related: ["animated-bar-chart", "metric-ticker", "timeline-steps"],
  },
  "podcast-clip": {
    category: "composition",
    usage: `import { PodcastClip } from "@/compositions/podcast-clip";

<PodcastClip audioSrc={staticFile("podcast.wav")} captions={captions} />`,
    props: [
      { name: "audioSrc", type: "string", required: true, description: "Audio source." },
      { name: "captions", type: "Caption[]", required: true, description: "Synced captions." },
      { name: "title", type: "string", description: "Opening title, reused as the episode title." },
      { name: "subtitle", type: "string", default: '"Pull one quote into a vertical clip"', description: "Supporting line under the opening title." },
      { name: "showName", type: "string", default: '"Studio Sessions"', description: "Show name above the episode title." },
      { name: "ctaTitle", type: "string", description: "End card headline. Defaults to `showName`." },
      { name: "ctaLabel", type: "string", description: "End card CTA pill label." },
    ],
    note: "9:16 podcast template (1080×1920).",
    related: ["audio-pulse", "waveform-line", "caption-scene"],
  },
  "blur-focus-in": {
    category: "primitive",
    usage: `import { BlurFocusIn } from "@/remotion/primitives/blur-focus-in";

<BlurFocusIn text="Sharp focus" maxBlur={18} />`,
    props: [
      { name: "text", type: "string", required: true, description: "Text to reveal from blur." },
      { name: "durationInFrames", type: "number", default: "36", description: "Blur-to-sharp duration." },
      { name: "maxBlur", type: "number", default: "18", description: "Starting blur in pixels." },
    ],
    related: ["blur-in", "tracking-in"],
  },
  "staggered-fade-up": {
    category: "primitive",
    usage: `import { StaggeredFadeUp } from "@/remotion/primitives/staggered-fade-up";

<StaggeredFadeUp text="Words rise in sequence" />`,
    props: [
      { name: "text", type: "string", required: true, description: "Space-separated words to stagger." },
      { name: "staggerInFrames", type: "number", default: "4", description: "Delay between words." },
    ],
    related: ["stagger-children", "masked-slide-reveal"],
  },
  "masked-slide-reveal": {
    category: "primitive",
    usage: `import { MaskedSlideReveal } from "@/remotion/primitives/masked-slide-reveal";

<MaskedSlideReveal
  lines={[
    "Three layers in your repo",
    "Drop scenes into",
    "TransitionSeries",
  ]}
/>`,
    props: [
      {
        name: "text",
        type: "string",
        description:
          "Copy to reveal. Splits on newlines for line mode, or words on a single line. Omit when using lines.",
      },
      {
        name: "lines",
        type: "string[]",
        description:
          "Explicit lines to reveal through the mask. Preferred for multi-line headlines.",
      },
      {
        name: "staggerInFrames",
        type: "number",
        default: "6",
        description: "Frames between each line or word reveal.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "16",
        description: "Frames for each masked slide-in.",
      },
      {
        name: "delayInFrames",
        type: "number",
        default: "0",
        description: "Delay before the first item animates.",
      },
      {
        name: "textAlign",
        type: '"left" | "center" | "right"',
        default: '"center"',
        description: "Horizontal alignment of lines.",
      },
      {
        name: "lineGap",
        type: "number",
        default: "0.18",
        description: "Gap between lines in em units (line mode only).",
      },
    ],
    related: ["staggered-fade-up"],
  },
  "tracking-in": {
    category: "primitive",
    usage: `import { TrackingIn } from "@/remotion/primitives/tracking-in";

<TrackingIn text="Tracking snap" />`,
    props: [{ name: "text", type: "string", required: true, description: "Headline with tracking collapse." }],
    related: ["blur-focus-in", "typewriter"],
  },
  "light-sweep-text": {
    category: "primitive",
    usage: `import { LightSweepText } from "@/remotion/primitives/light-sweep-text";

<LightSweepText text="Light pass" />`,
    props: [{ name: "text", type: "string", required: true, description: "Text with gradient sweep." }],
    related: ["marker-highlight"],
  },
  "slot-roll": {
    category: "primitive",
    usage: `import { SlotRoll } from "@/remotion/primitives/slot-roll";

<SlotRoll from="1200" to="9840" />`,
    props: [
      { name: "from", type: "string", required: true, description: "Starting characters." },
      { name: "to", type: "string", required: true, description: "Target characters." },
    ],
    related: ["counter"],
  },
  "matrix-decode": {
    category: "primitive",
    usage: `import { MatrixDecode } from "@/remotion/primitives/matrix-decode";

<MatrixDecode text="DECODED" />`,
    props: [{ name: "text", type: "string", required: true, description: "Target string." }],
    related: ["rgb-glitch-text"],
  },
  "rgb-glitch-text": {
    category: "primitive",
    usage: `import { RgbGlitchText } from "@/remotion/primitives/rgb-glitch-text";

<RgbGlitchText text="SIGNAL LOCK" glitchDurationInFrames={34} />`,
    props: [
      { name: "text", type: "string", required: true, description: "Readable text rendered under the glitch layers." },
      { name: "glitchStartFrame", type: "number", description: "Frame where the RGB/slice glitch begins." },
      { name: "glitchDurationInFrames", type: "number", description: "Length of the signal-lock glitch window." },
      { name: "intensity", type: "number", description: "Channel offset and slice displacement multiplier, clamped from 0 to 2." },
      { name: "sliceCount", type: "number", description: "Number of deterministic horizontal glitch slices, clamped from 3 to 9." },
      { name: "redChannelColor", type: "string", description: "Warm channel split color." },
      { name: "cyanChannelColor", type: "string", description: "Cool channel split color." },
      { name: "accentColor", type: "string", description: "Scanline and final slice accent." },
    ],
    related: ["matrix-decode"],
  },
  "infinite-marquee": {
    category: "primitive",
    usage: `import { InfiniteMarquee } from "@/remotion/primitives/infinite-marquee";

<InfiniteMarquee text="Scrolling band" speed={2} />`,
    props: [{ name: "text", type: "string", required: true, description: "Marquee copy." }],
    related: ["perspective-marquee"],
  },
  "perspective-marquee": {
    category: "primitive",
    usage: `import { PerspectiveMarquee } from "@/remotion/primitives/perspective-marquee";

<PerspectiveMarquee text="Depth scroll" speed={10} floorTilt={70} perspective={640} />`,
    props: [
      { name: "text", type: "string", required: true, description: "Marquee copy." },
      { name: "speed", type: "number", default: "10", description: "Scroll speed in pixels per frame along the floor plane." },
      { name: "gap", type: "number", default: "72", description: "Gap between repeated items in px." },
      { name: "floorTilt", type: "number", default: "70", description: "Floor plane tilt in degrees — higher values exaggerate depth receding toward the horizon." },
      { name: "perspective", type: "number", default: "640", description: "Perspective distance in px — lower values exaggerate depth." },
      { name: "showFloorGrid", type: "boolean", default: "true", description: "Draw a perspective grid behind the marquee plane." },
    ],
    related: ["infinite-marquee"],
    note: "Unlike InfiniteMarquee, text scrolls on a receding 3D floor with horizon fade — not a flat band.",
  },
  "strikethrough-replace": {
    category: "primitive",
    usage: `import { StrikethroughReplace } from "@/remotion/primitives/strikethrough-replace";

<StrikethroughReplace from="Old label" to="New label" />`,
    props: [
      { name: "from", type: "string", required: true, description: "Text struck through." },
      { name: "to", type: "string", required: true, description: "Replacement text." },
    ],
    related: ["typewriter"],
  },
  "mesh-gradient-bg": {
    category: "primitive",
    usage: `import { MeshGradientBg } from "@/remotion/primitives/mesh-gradient-bg";

<MeshGradientBg />`,
    props: [
      { name: "backgroundColor", type: "string", default: '"#080810"', description: "Stage color." },
      { name: "colors", type: "[string, string, string]", default: '["#e8b86d", "#2dd4bf", "#f472b6"]', description: "Blob accent colors — solid hex, screen-blended over the stage." },
      { name: "intensity", type: "number", default: "1", description: "Drift amplitude multiplier." },
    ],
    related: ["dynamic-grid"],
  },
  "dynamic-grid": {
    category: "primitive",
    usage: `import { DynamicGrid } from "@/remotion/primitives/dynamic-grid";

<DynamicGrid spacing={64} />`,
    props: [
      { name: "spacing", type: "number", default: "64", description: "Grid cell size in px." },
      { name: "lineColor", type: "string", default: '"rgba(255,255,255,0.1)"', description: "Grid line color." },
      { name: "sweepColor", type: "string", default: '"rgba(232,184,109,0.55)"', description: "Diagonal light-sweep color." },
      { name: "speed", type: "number", default: "0.4", description: "Grid drift speed in px per frame." },
      { name: "sweepDurationInFrames", type: "number", default: "150", description: "Frames for one full sweep loop." },
    ],
    related: ["mesh-gradient-bg"],
  },
  "directional-wipe": {
    category: "primitive",
    usage: `import { transitionDirectionalWipe } from "@/remotion/primitives/directional-wipe";

<TransitionSeries.Transition {...transitionDirectionalWipe({ direction: "from-left" })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "22", description: "Transition overlap length." },
      { name: "direction", type: '"from-left" | "from-right" | "from-top" | "from-bottom"', default: '"from-left"', description: "Wipe direction." },
      { name: "edgeSoftness", type: "number", default: "0.12", description: "Soft edge width as a share of the frame. 0 cuts hard." },
      { name: "depth", type: "number", default: "0.08", description: "Parallax the scenes carry under the wipe." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"editorial"', description: "Timing curve." },
    ],
    related: ["transition-wipe", "spatial-push"],
  },
  "spatial-push": {
    category: "primitive",
    usage: `import { transitionSpatialPush } from "@/remotion/primitives/spatial-push";

<TransitionSeries.Transition {...transitionSpatialPush()} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "24", description: "Transition overlap length." },
      { name: "direction", type: '"from-left" | "from-right" | "from-top" | "from-bottom"', default: '"from-left"', description: "Push direction." },
      { name: "pushDepth", type: "number", default: "1", description: "Share of the frame each scene travels. Below 1 leaves background showing mid-push." },
      { name: "tilt", type: "number", default: "0", description: "Degrees each panel rotates in 3D. Off by default — a tilted full-frame panel uncovers bare background." },
      { name: "perspective", type: "number", default: "1200", description: "Perspective distance in px, used when tilt is set." },
    ],
    related: ["directional-wipe", "zoom-through"],
  },
  "chromatic-aberration-wipe": {
    category: "primitive",
    usage: `import { transitionChromaticAberrationWipe } from "@/remotion/primitives/chromatic-aberration-wipe";

<TransitionSeries.Transition {...transitionChromaticAberrationWipe({ intensity: 12 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "14", description: "Transition overlap length." },
      { name: "intensity", type: "number", default: "12", description: "Peak channel separation in px, reached in the middle of the cut." },
      { name: "axis", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Axis the scenes slide along and the channels separate on." },
      { name: "slide", type: "number", default: "1", description: "Share of the frame the scenes travel. Below 1 shows background." },
    ],
    related: ["blur-reveal", "directional-wipe"],
  },
  "zoom-through": {
    category: "primitive",
    usage: `import { transitionZoomThrough } from "@/remotion/primitives/zoom-through";

<TransitionSeries.Transition {...transitionZoomThrough({ maxScale: 2.4 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "20", description: "Transition overlap length." },
      { name: "maxScale", type: "number", default: "2.4", description: "Scale the camera travels through." },
      { name: "blurPeak", type: "number", default: "18", description: "Blur radius in px at full displacement." },
      { name: "direction", type: '"in" | "out"', default: '"in"', description: "Push the camera through the frame, or pull back from it." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"spring"', description: "Timing curve." },
    ],
    related: ["spatial-push", "blur-reveal"],
  },
  "simulated-cursor": {
    category: "primitive",
    usage: `import { SimulatedCursor } from "@/remotion/primitives/simulated-cursor";

<SimulatedCursor
  points={[
    { x: 20, y: 60, frame: 0 },
    { x: 70, y: 40, frame: 30, target: 96, label: "Render" },
  ]}
  clickFrames={[32]}
/>`,
    props: [
      { name: "points", type: "Array<{ x: number; y: number; frame: number; label?: string; target?: number }>", description: "Percent-based waypoints with arrival frames. `label` chips the point, `target` rings the hit area in px." },
      { name: "clickFrames", type: "number[]", default: "[48]", description: "Frames that press the pointer and fire a ripple." },
      { name: "color", type: "string", default: '"#f4f4f5"', description: "Pointer fill." },
      { name: "accent", type: "string", default: '"#e8b86d"', description: "Ripple and target ring color." },
      { name: "size", type: "number", default: "26", description: "Cursor size in px." },
    ],
    note: "Each hop runs its own spring, so the cursor decelerates into a target instead of gliding at a fixed rate.",
    related: ["cursor-path", "tutorial-clip"],
  },
  "confetti-burst": {
    category: "primitive",
    usage: `import { ConfettiBurst } from "@/remotion/primitives/confetti-burst";

<ConfettiBurst originX={50} originY={40} seed="launch" />`,
    props: [
      { name: "count", type: "number", default: "48", description: "Particle count." },
      { name: "originX", type: "number", default: "50", description: "Burst origin X in percent." },
      { name: "originY", type: "number", default: "42", description: "Burst origin Y in percent." },
      { name: "seed", type: "string", default: '"confetti"', description: "Deterministic random seed." },
    ],
    related: ["spring-in"],
  },
  "device-mockup-zoom": {
    category: "scene",
    usage: `import { DeviceMockupZoom } from "@/remotion/scenes/device-mockup-zoom";

<DeviceMockupZoom src={staticFile("app.png")} device="laptop" />`,
    props: [
      { name: "src", type: "string", description: "Optional screen content image. When omitted, the scene renders a polished product dashboard mockup." },
      { name: "title", type: "string", description: "Optional headline. When omitted, the device remains the sole focal point." },
      { name: "subtitle", type: "string", description: "Optional supporting line under the headline." },
      { name: "eyebrow", type: "string", description: "Optional accent label above the headline." },
      { name: "device", type: '"phone" | "browser" | "laptop"', default: '"laptop"', description: "Mockup shell. Laptop includes a physical base, browser renders chrome only, phone renders a handheld frame." },
      { name: "children", type: "React.ReactNode", description: "Custom screen content rendered inside the device." },
    ],
    related: ["media-frame", "zoom-pan-frame"],
  },
  "hero-device-assemble": {
    category: "composition",
    usage: `import { HeroDeviceAssemble } from "@/compositions/hero-device-assemble";

<HeroDeviceAssemble title="Ship on every screen" />`,
    props: [
      { name: "title", type: "string", description: "Opening title card headline." },
      { name: "subtitle", type: "string", description: "Supporting line under the title." },
    ],
    note: "1920×1080 product hero. Title card then device mockup assemble.",
    related: ["title-card", "device-mockup-zoom"],
  },
  "ecosystem-orbit": {
    category: "composition",
    usage: `import { EcosystemOrbit } from "@/compositions/ecosystem-orbit";

<EcosystemOrbit centerLabel="Your product" satellites={["GitHub", "Vercel", "Stripe"]} />`,
    props: [
      { name: "centerLabel", type: "string", default: '"RemotionUI"', description: "Center brand label." },
      { name: "satellites", type: "string[]", description: "Orbiting integration labels." },
      { name: "accentColor", type: "string", default: '"#e8b86d"', description: "Center accent color." },
    ],
    note: "1920×1080 integration orbit with pulsing connection lines.",
    related: ["logo-reveal", "showcase"],
  },
  "bento-pan": {
    category: "composition",
    usage: `import { BentoPan } from "@/compositions/bento-pan";

<BentoPan />`,
    props: [
      { name: "backgroundColor", type: "string", default: '"#080810"', description: "Stage background." },
    ],
    note: "1920×1080 diagonal bento grid pan with vignette.",
    related: ["media-sequence", "showcase"],
  },
  "browser-flow": {
    category: "composition",
    usage: `import { BrowserFlow } from "@/compositions/browser-flow";

<BrowserFlow url="remotionui.com/docs" title="Browse the registry" />`,
    props: [
      { name: "url", type: "string", description: "URL shown in the title card subtitle." },
      { name: "title", type: "string", description: "Opening headline." },
    ],
    note: "1920×1080 URL-to-preview flow using chat-to-preview scene.",
    related: ["chat-to-preview", "title-card"],
  },
  "ai-generation-canvas": {
    category: "composition",
    usage: `import { AiGenerationCanvas } from "@/compositions/ai-generation-canvas";

<AiGenerationCanvas
  prompt="Generate a revenue dashboard for this launch"
  accentColor="#e8b86d"
  cardCount={4}
/>`,
    props: [
      { name: "prompt", type: "string", description: "Prompt typed into the input during phase one." },
      { name: "accentColor", type: "string", description: "Accent for border, shimmer, and chart highlights." },
      { name: "cardCount", type: "number", description: "Dashboard cards revealed in the grid. Clamped between 1 and 6." },
      { name: "metrics", type: "AiGenerationMetric[]", description: "Labels, values, and optional deltas for the revealed dashboard cards." },
      { name: "eyebrow", type: "string", description: "Small label above the generated dashboard headline." },
      { name: "statusLabel", type: "string", description: "Header status text shown after the prompt morphs." },
      { name: "speed", type: "number", description: "Timeline multiplier for the composition beat." },
    ],
    note: "Responsive prompt-to-dashboard generation beat with safe-area layout, skeleton shimmer, and card flips.",
    related: ["dashboard-populate", "chat-to-preview"],
  },
  "ai-composer-showcase": {
    category: "composition",
    usage: `import { AiComposerShowcase } from "@/compositions/ai-composer-showcase";

<AiComposerShowcase />`,
    props: [],
    note: "1920×1080 showcase reel: title card, five AI composer scenes (ChatGPT, Claude, v0, Claude Code, OpenCode) each with a feature label, then an end card. No props — customize by editing the SCENES list in source.",
    related: ["chat-gpt", "claude-chat", "v0", "claude-code", "opencode"],
  },
  "live-code-split": {
    category: "composition",
    usage: `import { LiveCodeSplit } from "@/compositions/live-code-split";

<LiveCodeSplit code={sourceCode} />`,
    props: [
      { name: "code", type: "string", description: "Code reveal content." },
    ],
    note: "1920×1080 code editor then live device preview.",
    related: ["code-reveal", "device-mockup-zoom"],
  },
  "deploy-reveal": {
    category: "composition",
    usage: `import { DeployReveal } from "@/compositions/deploy-reveal";

<DeployReveal />`,
    props: [],
    note: "1920×1080 terminal deploy log then browser reveal.",
    related: ["terminal-simulator", "device-mockup-zoom"],
  },
  "dashboard-populate": {
    category: "composition",
    usage: `import { DashboardPopulate } from "@/compositions/dashboard-populate";

<DashboardPopulate metrics={metrics} barData={barData} />`,
    props: [
      { name: "metrics", type: "MetricTickerItem[]", description: "Metric cards shown in the opening ticker beat." },
      { name: "barData", type: "ChartDatum[]", description: "Bars charted in the closing beat." },
      { name: "metricsTitle", type: "string", default: '"Dashboard waking up"', description: "Title over the metric ticker beat." },
      { name: "chartTitle", type: "string", default: '"Weekly throughput"', description: "Title over the bar chart beat." },
      { name: "backgroundColor", type: "string", default: '"#080810"', description: "Scene background color." },
    ],
    note: "1920×1080 metric ticker then animated bar chart, fading between beats.",
    related: ["metric-ticker", "animated-bar-chart"],
  },
  "pricing-focus": {
    category: "composition",
    usage: `import { PricingFocus } from "@/compositions/pricing-focus";

<PricingFocus tiers={[{ name: "Starter", price: "$0" }, { name: "Studio", price: "$29", featured: true }]} />`,
    props: [
      { name: "tiers", type: "Array<{ name: string; price: string; featured?: boolean }>", description: "Pricing cards." },
    ],
    note: "1920×1080 pricing tier focus with lift and dim siblings.",
    related: ["stat-card", "feature-list"],
  },
  "landing-code-showcase": {
    category: "composition",
    usage: `import { LandingCodeShowcase } from "@/compositions/landing-code-showcase";

<LandingCodeShowcase />`,
    props: [],
    note: "1920×1080 title card plus install command code reveal.",
    related: ["title-card", "code-reveal"],
  },
  "tool-menu-slide": {
    category: "composition",
    usage: `import { ToolMenuSlide } from "@/compositions/tool-menu-slide";

<ToolMenuSlide />`,
    props: [],
    note: "1920×1080 staggered tool menu slide-in.",
    related: ["feature-list", "slide-left"],
  },
  "image-expand": {
    category: "composition",
    usage: `import { ImageExpand } from "@/compositions/image-expand";

<ImageExpand accentColor="#e8b86d" />`,
    props: [
      { name: "accentColor", type: "string", default: '"#e8b86d"', description: "Thumbnail accent color." },
    ],
    note: "1920×1080 thumbnail expands to full frame.",
    related: ["media-frame", "zoom-pan-frame"],
  },
  "split-text-chars": {
    category: "primitive",
    usage: `import { SplitTextChars } from "@/remotion/primitives/split-text-chars";

<SplitTextChars text="Ship it on Friday" mode="chars" order="center" />

// Headless: build your own effect on the same split and stagger.
import { useSplitText } from "@/remotion/lib/text-split";
const { lines } = useSplitText({ text, mode: "words" });`,
    props: [
      { name: "text", type: "string", required: true, description: "Copy to split. `\\n` starts a new line.", schema: { type: "string" } },
      { name: "mode", type: '"chars" | "words" | "lines"', default: '"chars"', description: "What one animated unit is. `words` is a word-by-word reveal.", schema: { type: "string", enum: ["chars", "words", "lines"] } },
      { name: "order", type: '"start" | "end" | "center" | "edges" | "random"', default: '"start"', description: "Which unit animates first. Document order is never changed.", schema: { type: "string", enum: ["start", "end", "center", "edges", "random"] } },
      { name: "effect", type: '"fade-up" | "fade" | "scale" | "blur" | "none"', default: '"fade-up"', description: "Built-in look. `none` positions the units and animates nothing.", schema: { type: "string" } },
      { name: "renderUnit", type: "(unit: SplitUnitState) => ReactNode", description: "Draws one unit from its own 0-1 progress. This is the composition point for custom text effects.", schema: { type: "object" } },
      { name: "staggerInFrames", type: "number", default: "2 chars / 4 words / 7 lines", description: "Frames between consecutive units.", schema: { type: "number" } },
      { name: "durationInFrames", type: "number", default: "20 chars / 24 words / 28 lines", description: "Length of one unit's entrance.", schema: { type: "number" } },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the first unit starts.", schema: { type: "number" } },
      { name: "spring", type: "boolean | 'smooth' | 'snappy' | 'bouncy' | Partial<SpringConfig>", description: "Drive the entrance with a spring instead of the ease-out curve.", schema: { type: "string" } },
      { name: "exit", type: "boolean", default: "false", description: "Animate back out, landing inside the surrounding Sequence.", schema: { type: "boolean" } },
      { name: "exitStaggerInFrames", type: "number", default: "= staggerInFrames", description: "Frames between consecutive units leaving.", schema: { type: "number" } },
      { name: "travel", type: "number", default: "0.42", description: "`fade-up` travel distance in em.", schema: { type: "number" } },
      { name: "fontSize", type: "number", default: "84 (scaled)", description: "Font size in pixels.", schema: { type: "number" } },
      { name: "frame", type: "number", description: "Frame override — pass the parent frame inside a Sequence.", schema: { type: "number" } },
    ],
    note: "The splitting foundation. Other text effects should call `useSplitText()` from `text-split` rather than re-implementing a split.",
    related: ["staggered-fade-up", "tracking-in", "typewriter"],
  },
  "audio-reactive-scale": {
    category: "primitive",
    usage: `import { AudioReactiveScale } from "@/remotion/primitives/audio-reactive-scale";

<AudioReactiveScale src={staticFile("track.wav")} maxScale={1.2}>
  <Img src={staticFile("logo.png")} />
</AudioReactiveScale>`,
    props: [
      { name: "src", type: "string", required: true, description: "Audio source. `useWindowedAudioData()` requires an uncompressed .wav.", schema: { type: "string" } },
      { name: "children", type: "ReactNode", required: true, description: "Anything to scale with the track.", schema: { type: "object" } },
      { name: "minScale", type: "number", default: "1", description: "Scale at silence.", schema: { type: "number" } },
      { name: "maxScale", type: "number", default: "1.16", description: "Scale at a full-amplitude hit.", schema: { type: "number" } },
      { name: "band", type: '"low" | "mid" | "high" | "full" | "bass"', default: '"bass"', description: "Which slice of the spectrum drives the motion.", schema: { type: "string", enum: ["low", "mid", "high", "full", "bass"] } },
      { name: "sensitivity", type: "number", default: "1", description: "Multiplies the level before compression.", schema: { type: "number" } },
      { name: "compression", type: "number", default: "0.78", description: "Exponent on the level. Below 1 lifts quiet passages.", schema: { type: "number" } },
      { name: "axis", type: '"both" | "x" | "y"', default: '"both"', description: "Restrict the scale to one axis.", schema: { type: "string", enum: ["both", "x", "y"] } },
      { name: "tilt", type: "number", default: "0", description: "Degrees of rotation at a full hit.", schema: { type: "number" } },
      { name: "minOpacity", type: "number", default: "1", description: "Opacity at silence. Left at 1 the wrapper never touches opacity.", schema: { type: "number" } },
      { name: "frame", type: "number", description: "Frame override — pass the parent frame inside a Sequence.", schema: { type: "number" } },
    ],
    note: "Shares `useAudioAmplitude()` with audio-pulse, so two components on one track pump in step.",
    related: ["audio-pulse", "audiogram-bars", "waveform-line"],
  },
  "srt-caption-track": {
    category: "primitive",
    usage: `import { SrtCaptionTrack } from "@/remotion/primitives/srt-caption-track";

<SrtCaptionTrack src={staticFile("episode.srt")} />

// Any caption style can render the pages.
<SrtCaptionTrack
  src={staticFile("episode.srt")}
  renderPage={(page) => <KaraokeCaptions page={page} mode="underline" />}
/>`,
    props: [
      { name: "src", type: "string", description: "URL of an SRT or WebVTT file. Fetched behind delayRender().", schema: { type: "string" } },
      { name: "source", type: "string", description: "Raw subtitle text, when the transcript is already in hand.", schema: { type: "string" } },
      { name: "captions", type: "Caption[]", description: "Pre-parsed captions — e.g. from Whisper, which has real word timing.", schema: { type: "array" } },
      { name: "wordTiming", type: '"distribute" | "cue"', default: '"distribute"', description: "Subtitle files have no word timestamps. `distribute` spreads each cue across its words by length so highlight styles have something to highlight.", schema: { type: "string", enum: ["distribute", "cue"] } },
      { name: "combineTokensWithinMilliseconds", type: "number", default: "1200", description: "Tokens closer than this share a page.", schema: { type: "number" } },
      { name: "offsetInFrames", type: "number", default: "0", description: "Shift the whole track. Positive delays it.", schema: { type: "number" } },
      { name: "renderPage", type: "(page: TikTokPage, index: number) => ReactNode", description: "Draws one page. Defaults to CaptionHighlight.", schema: { type: "object" } },
      { name: "activeColor", type: "string", default: '"#ff6b00"', description: "Passed to the default renderer.", schema: { type: "string" } },
      { name: "inactiveColor", type: "string", default: '"#ffffff"', description: "Passed to the default renderer.", schema: { type: "string" } },
      { name: "fontSize", type: "number", description: "Passed to the default renderer.", schema: { type: "number" } },
    ],
    note: "Utility, not a look. Installs @remotion/captions and caption-highlight.",
    related: ["caption-highlight", "karaoke-captions", "caption-scene"],
  },
  "transition-circle-reveal": {
    category: "primitive",
    usage: `import { transitionCircleReveal } from "@/remotion/primitives/transition-circle-reveal";

<TransitionSeries.Transition {...transitionCircleReveal({ originX: 0.3, originY: 0.4 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "22", description: "Transition overlap length." },
      { name: "originX", type: "number", default: "0.5", description: "Centre of the circle, 0→1 of the frame width." },
      { name: "originY", type: "number", default: "0.5", description: "Centre of the circle, 0→1 of the frame height." },
      { name: "edgeSoftness", type: "number", default: "0.04", description: "Feathered edge as a share of the final radius. 0 cuts hard." },
      { name: "underScale", type: "number", default: "1", description: "Scale the outgoing scene drifts to under the hole. 1 holds it still." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"editorial"', description: "Timing curve." },
    ],
    related: ["transition-morph-shape", "transition-wipe"],
  },
  "transition-card-flip": {
    category: "primitive",
    usage: `import { transitionCardFlip } from "@/remotion/primitives/transition-card-flip";

<TransitionSeries.Transition {...transitionCardFlip({ axis: "y" })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "24", description: "Transition overlap length." },
      { name: "axis", type: '"y" | "x"', default: '"y"', description: "y flips left-to-right like a page; x flips top over bottom." },
      { name: "perspective", type: "number", default: "1600", description: "Perspective distance in px. Lower is a wider-angle flip." },
      { name: "backdrop", type: "string", default: '"#05060a"', description: "Colour behind the card while it is edge-on. Without it the page background shows at the halfway frame." },
      { name: "shading", type: "number", default: "0.55", description: "Peak darkening of the face turning away, 0→1." },
      { name: "dip", type: "number", default: "0.86", description: "How far the card recedes at the halfway point." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"editorial"', description: "Timing curve." },
    ],
    related: ["transition-whip-pan", "spatial-push"],
  },
  "transition-blinds": {
    category: "primitive",
    usage: `import { transitionBlinds } from "@/remotion/primitives/transition-blinds";

<TransitionSeries.Transition {...transitionBlinds({ slats: 12, stagger: 0.45 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "24", description: "Transition overlap length." },
      { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Horizontal slats stack top to bottom and sweep sideways." },
      { name: "slats", type: "number", default: "12", description: "Number of slats. Above ~24 it stops reading as slats at 1080p." },
      { name: "stagger", type: "number", default: "0.45", description: "Share of the window the cascade spans. 0 opens every slat together." },
      { name: "alternate", type: "boolean", default: "false", description: "Reverse alternate slats for a woven counter-sweep." },
      { name: "edgeSoftness", type: "number", default: "0.06", description: "Soft leading edge per slat, as a share of its length." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"editorial"', description: "Timing curve." },
    ],
    related: ["grid-pixelate-wipe", "directional-wipe"],
  },
  "transition-whip-pan": {
    category: "primitive",
    usage: `import { transitionWhipPan } from "@/remotion/primitives/transition-whip-pan";

<TransitionSeries.Transition {...transitionWhipPan({ direction: "from-left", blur: 26 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "14", description: "Transition overlap length. A whip is short by definition." },
      { name: "direction", type: '"from-left" | "from-right" | "from-top" | "from-bottom"', default: '"from-left"', description: "Side the next scene arrives from." },
      { name: "blur", type: "number", default: "26", description: "Peak blur in px along the travel axis, at the fastest point." },
      { name: "travel", type: "number", default: "1", description: "Share of the frame each scene travels. Below 1 shows background between them." },
      { name: "punch", type: "number", default: "2.2", description: "How hard the move is front-loaded into the middle. 1 is the house ease and reads as a push." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"editorial"', description: "Timing curve." },
    ],
    related: ["spatial-push", "chromatic-aberration-wipe"],
  },
  "transition-morph-shape": {
    category: "primitive",
    usage: `import { transitionMorphShape } from "@/remotion/primitives/transition-morph-shape";

<TransitionSeries.Transition {...transitionMorphShape({ from: "circle", to: "diamond" })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "24", description: "Transition overlap length." },
      { name: "from", type: '"circle" | "square" | "squircle" | "triangle" | "diamond" | "blob" | string', default: '"circle"', description: "Shape the reveal starts as, at zero size. A raw path d also works." },
      { name: "to", type: '"circle" | "square" | "squircle" | "triangle" | "diamond" | "blob" | string', default: '"squircle"', description: "Shape it has become once it covers the frame." },
      { name: "originX", type: "number", default: "0.5", description: "Where the shape grows from, 0→1 of the frame width." },
      { name: "originY", type: "number", default: "0.5", description: "Where the shape grows from, 0→1 of the frame height." },
      { name: "overshoot", type: "number", default: "1.06", description: "Final size as a multiple of the frame diagonal. Below 1 leaves corners unrevealed." },
      { name: "warp", type: "number", default: "0", description: "Optional turbulence on the revealed scene, in px. 0 keeps the silhouette crisp." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"editorial"', description: "Timing curve." },
    ],
    note: "Configuration of the shared displacement presentation: the mask channel with turbulence off.",
    related: ["transition-circle-reveal", "transition-liquid-warp", "path-morph"],
  },
  "transition-liquid-warp": {
    category: "primitive",
    usage: `import { transitionLiquidWarp } from "@/remotion/primitives/transition-liquid-warp";

<TransitionSeries.Transition {...transitionLiquidWarp({ scale: 140 })} />`,
    props: [
      { name: "durationInFrames", type: "number", default: "26", description: "Transition overlap length. Long enough for the field to boil." },
      { name: "scale", type: "number", default: "140", description: "Peak displacement in px at the middle of the cut." },
      { name: "frequency", type: "number", default: "0.006", description: "Turbulence base frequency. Below 0.004 reads as a lens, above 0.02 as noise." },
      { name: "octaves", type: "number", default: "2", description: "Turbulence octaves. Above 3 costs a lot and adds almost nothing." },
      { name: "churn", type: "number", default: "6", description: "How much the noise field re-seeds across the cut. 0 holds one static lens." },
      { name: "blur", type: "number", default: "3", description: "Peak blur in px, on the same curve as the displacement." },
      { name: "seed", type: "number", default: "7", description: "Turbulence seed." },
      { name: "affect", type: '"both" | "entering"', default: '"both"', description: "Warp both scenes, or only the arriving one." },
      { name: "variant", type: '"linear" | "spring" | "editorial"', default: '"editorial"', description: "Timing curve." },
    ],
    note: "Configuration of the shared displacement presentation: the turbulence channel with no mask.",
    related: ["transition-morph-shape", "transition-fade"],
  },
  "skew-in": {
    category: "primitive",
    usage: `import { SkewIn } from "@/remotion/primitives/skew-in";

<SkewIn skew={16} travel={72} durationInFrames={40}>
  <h1>Leans in, straightens up</h1>
</SkewIn>`,
    props: [
      { name: "children", type: "ReactNode", description: "What leans in." },
      { name: "skew", type: "number", default: "14", description: "Horizontal shear it starts at, in degrees." },
      { name: "skewY", type: "number", default: "0", description: "Vertical shear it starts at. Small values only." },
      { name: "travel", type: "number", default: "56", description: "How far it slides in, in px. Travels against the lean." },
      { name: "direction", type: '"left" | "right"', default: '"left"', description: "Which way the element leans on the way in." },
      { name: "origin", type: "TransformOrigin", default: '"bottom left"', description: "Pivot. A centre pivot lifts the baseline and the line below jumps." },
      { name: "durationInFrames", type: "number", default: "30", description: "Length of the entrance." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before it starts." },
      { name: "spring", type: "MotionSpring", description: "Drive the entrance with a spring instead of the ease-out curve." },
      { name: "exit", type: "boolean", default: "false", description: "Land out at the end of the surrounding Sequence." },
      { name: "exitAtInFrames", type: "number", description: "Frame the exit starts on. Overrides the automatic timing." },
      { name: "exitInFrames", type: "number", description: "Length of the exit. Defaults to 70% of the entrance." },
      { name: "exitDirection", type: '"reverse" | "continue"', default: '"reverse"', description: "Straighten back, or carry the lean on through." },
      { name: "block", type: "boolean", default: "false", description: "Fill the parent's width instead of shrink-wrapping." },
    ],
    note: "The shear opposes the travel on purpose — the element looks dragged upright by its own momentum.",
    related: ["slide-left", "rotate-in", "spring-in"],
  },
  "scramble-text": {
    category: "primitive",
    usage: `import { ScrambleText } from "@/remotion/primitives/scramble-text";

<ScrambleText text="Resolve out of noise" order="center" charset="symbols" />`,
    props: [
      { name: "text", type: "string", description: "The string that resolves. `\\n` breaks a line." },
      { name: "charset", type: '"latin" | "symbols" | "digits" | "blocks" | string', default: '"symbols"', description: "Glyph pool the noise is drawn from. Any string is used as-is." },
      { name: "tickInFrames", type: "number", default: "2", description: "Frames one noise glyph is held. 1 is a blur, 4 is a slot machine." },
      { name: "scrambleColor", type: "string", description: "Colour of the unresolved glyphs. Defaults to `color`." },
      { name: "scrambleOpacity", type: "number", default: "0.72", description: "Opacity of the unresolved glyphs." },
      { name: "scrambleOnExit", type: "boolean", default: "true", description: "Scramble again on the way out." },
      { name: "order", type: '"start" | "end" | "center" | "edges" | "random"', default: '"start"', description: "Which character resolves first. Document order is never affected." },
      { name: "staggerInFrames", type: "number", default: "2", description: "Frames between one character resolving and the next." },
      { name: "durationInFrames", type: "number", default: "20", description: "Length of one character's resolve." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the first character starts." },
      { name: "seed", type: "number", default: "1", description: "Seeds the glyph noise and `order=\"random\"`." },
      { name: "exitAtInFrames", type: "number", description: "Frame the first character starts leaving on." },
      { name: "fontFamily", type: "string", default: "ui-monospace stack", description: "Monospace by default — a proportional face re-flows on every tick." },
    ],
    note: "Per-character clocks, so any stagger order works. `matrix-decode` resolves strictly left to right from one shared progress value.",
    related: ["split-text-chars", "matrix-decode", "slot-roll"],
  },
  "text-mask-video": {
    category: "primitive",
    usage: `import { staticFile } from "remotion";
import { TextMaskVideo } from "@/remotion/primitives/text-mask-video";

<TextMaskVideo
  text={"IN\\nMOTION"}
  src={staticFile("clips/skyline.mp4")}
  fontSize={172}
  fontWeight={900}
/>`,
    props: [
      { name: "text", type: "string", description: "The letterforms the media is seen through. `\\n` breaks a line." },
      { name: "src", type: "string", description: "Video or image source. Wrap local files in `staticFile()`." },
      { name: "media", type: '"video" | "image" | "gradient"', default: "video with a src, gradient without", description: "Which layer is drawn behind the letters." },
      { name: "gradient", type: "string", description: "Any CSS background, used by `media=\"gradient\"`." },
      { name: "mediaFilter", type: "string", description: "CSS filter on the media. Footage is usually too dark inside letterforms." },
      { name: "reveal", type: '"left" | "right" | "up" | "down" | "none"', default: '"left"', description: "Which way the letters are uncovered." },
      { name: "width", type: "number", description: "Clip coordinate space. Defaults to a multiple of `fontSize`." },
      { name: "height", type: "number", description: "Clip coordinate space. Defaults from the line count." },
      { name: "drift", type: "number", default: "26", description: "Peak sideways travel of the media, in px." },
      { name: "zoom", type: "number", default: "0.12", description: "Extra scale the media breathes through. 0 holds it still." },
      { name: "startFrom", type: "number", description: "Frame offset into the video." },
      { name: "durationInFrames", type: "number", default: "30", description: "Length of the reveal." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the reveal starts." },
      { name: "exitAtInFrames", type: "number", description: "Frame the reveal starts unwinding on." },
    ],
    note: "An SVG clipPath on a real element, not `background-clip: text` — that only takes a paint, so it can never carry a video.",
    related: ["light-sweep-text", "svg-mask-reveal", "stroke-to-fill-text"],
  },
  "handwriting-text": {
    category: "primitive",
    usage: `import { HandwritingText } from "@/remotion/primitives/handwriting-text";

<HandwritingText text="Signed by hand" staggerInFrames={9} penColor="#e8b86d" />`,
    props: [
      { name: "text", type: "string", description: "The line that gets written." },
      { name: "penSize", type: "number", default: "0.14", description: "Diameter of the nib, in em. 0 hides it." },
      { name: "penColor", type: "string", description: "Nib colour. Defaults to `color`." },
      { name: "inkSoftness", type: "number", default: "0.18", description: "Softness of the ink edge, as a share of one glyph." },
      { name: "wobble", type: "number", default: "1.6", description: "Per-character tilt and baseline drift, in degrees. Fixed, not animated." },
      { name: "staggerInFrames", type: "number", default: "3", description: "Frames between one character and the next. This is the writing speed." },
      { name: "durationInFrames", type: "number", default: "10", description: "Frames one character takes to be drawn." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the first stroke." },
      { name: "exitAtInFrames", type: "number", description: "Frame the ink starts fading on." },
      { name: "fontFamily", type: "string", default: "script stack", description: "Ends in generic `cursive`; pass a webfont for identical renders everywhere." },
    ],
    note: "Takes a string, so there is no stroke order — the ink is wiped on per glyph. `path-draw` takes a path and strokes it properly. `order` and `mode` are deliberately not props.",
    related: ["path-draw", "split-text-chars", "marker-highlight"],
  },
  "stroke-to-fill-text": {
    category: "primitive",
    usage: `import { StrokeToFillText } from "@/remotion/primitives/stroke-to-fill-text";

<StrokeToFillText
  text="Ship faster with source"
  strokeColor="#e8b86d"
  staggerInFrames={5}
/>`,
    props: [
      { name: "text", type: "string", description: "The line that outlines and then fills." },
      { name: "strokeWidth", type: "number", default: "2", description: "Outline weight in px, before it thins into the fill." },
      { name: "strokeColor", type: "string", description: "Outline colour. Defaults to `color`." },
      { name: "fillColor", type: "string", description: "Colour the letter fills with. Defaults to `color`." },
      { name: "direction", type: '"up" | "down" | "left" | "right"', default: '"up"', description: "Which way the fill floods the letter." },
      { name: "edgeSoftness", type: "number", default: "0.12", description: "Softness of the fill edge, as a share of the glyph. 0 is a hard line." },
      { name: "strokeRetain", type: "number", default: "0.35", description: "Share of the outline weight left once the letter is full." },
      { name: "outlineInFrames", type: "number", default: "16", description: "Frames the outline takes to draw. It arrives as a whole word, unstaggered." },
      { name: "staggerInFrames", type: "number", default: "2", description: "Frames between one letter flooding and the next." },
      { name: "durationInFrames", type: "number", default: "20", description: "Length of one letter's flood." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the outline starts." },
      { name: "order", type: '"start" | "end" | "center" | "edges" | "random"', default: '"start"', description: "Which letter floods first." },
      { name: "exitAtInFrames", type: "number", description: "Frame the fill starts draining on." },
    ],
    note: "The outline is unstaggered and the fill is staggered. Running both on one clock leaves the un-flooded half of the line absent, which reads as truncated type.",
    related: ["split-text-chars", "text-mask-video", "path-draw"],
  },
  "variable-font-morph": {
    category: "primitive",
    usage: `import { VariableFontMorph } from "@/remotion/primitives/variable-font-morph";

<VariableFontMorph text="Weight in motion" weight={[200, 900]} oscillate />`,
    props: [
      { name: "text", type: "string", description: "The line whose axes are swept." },
      { name: "weight", type: "[number, number]", default: "[200, 800]", description: "`wght` axis. Also mirrored onto `font-weight`." },
      { name: "width", type: "[number, number]", description: "`wdth` axis in percent. Also mirrored onto `font-stretch`." },
      { name: "slant", type: "[number, number]", description: "`slnt` axis in degrees. Negative leans right, per the spec." },
      { name: "axes", type: "Record<string, [number, number]>", description: "Any further axes by four-letter tag, e.g. `{ opsz: [14, 96] }`." },
      { name: "oscillate", type: "boolean", default: "false", description: "Keep travelling between the two ends instead of landing on `to`." },
      { name: "periodInFrames", type: "number", default: "60", description: "Frames for one there-and-back when oscillating." },
      { name: "phaseStep", type: "number", default: "0.55", description: "Radians of offset per character along the wave." },
      { name: "staggerInFrames", type: "number", default: "2", description: "Frames between one character starting and the next." },
      { name: "durationInFrames", type: "number", default: "20", description: "Length of one character's ramp." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the first character starts." },
      { name: "fontFamily", type: "string", description: "Pass a variable face here — the fallback only steps between static weights." },
    ],
    note: "One 0–1 position drives every axis at once. On a static face the values fall back to `font-weight`/`font-stretch`, which steps rather than glides.",
    related: ["split-text-chars", "wave-text", "tracking-in"],
  },
  "liquid-text-morph": {
    category: "primitive",
    usage: `import { LiquidTextMorph } from "@/remotion/primitives/liquid-text-morph";

<LiquidTextMorph words={["Melt", "Merge", "Reform"]} morphInFrames={22} />`,
    props: [
      { name: "words", type: "string[]", description: "Two or more words. The last melts back into the first when looping." },
      { name: "holdInFrames", type: "number", default: "12", description: "Frames a word is held before it starts melting." },
      { name: "morphInFrames", type: "number", default: "22", description: "Frames one word takes to become the next." },
      { name: "loop", type: "boolean", default: "true", description: "Keep cycling. When false the last word is held forever." },
      { name: "gooStrength", type: "number", default: "0.045", description: "Blur feeding the threshold, in em. This is what makes letters merge." },
      { name: "gooContrast", type: "number", default: "18", description: "Alpha contrast on the blurred layer. Lower is softer and wetter." },
      { name: "staggerInFrames", type: "number", default: "2", description: "Frames between neighbouring letters melting. Clamped to fit the morph." },
      { name: "fontSize", type: "number", description: "Defaults to a scaled 96px at the composition width." },
      { name: "color", type: "string", default: '"#f4f4f5"', description: "Ink colour." },
      { name: "fontWeight", type: "number | string", default: "700", description: "Heavier weights fuse more readily under the threshold." },
    ],
    note: "A gooey threshold filter, not path interpolation — two arbitrary letters do not have matching node counts. Use `shape-morph` for paths you control.",
    related: ["shape-morph", "split-text-chars", "blob-morph"],
  },
  "wave-text": {
    category: "primitive",
    usage: `import { WaveText } from "@/remotion/primitives/wave-text";

<WaveText text="Ride the sine" amplitude={0.2} wavelength={5} />`,
    props: [
      { name: "text", type: "string", description: "The line the wave runs along." },
      { name: "amplitude", type: "number", default: "0.16", description: "Peak displacement, in em of the font size." },
      { name: "wavelength", type: "number", default: "6", description: "Characters per full wave. Higher spreads the crest wider." },
      { name: "periodInFrames", type: "number", default: "48", description: "Frames for one full cycle." },
      { name: "direction", type: '"forward" | "backward"', default: '"forward"', description: "Travel direction along the line." },
      { name: "scale", type: "number", default: "0.06", description: "Extra scale on the crest, so it reads as depth rather than jitter." },
      { name: "shade", type: "number", default: "0.25", description: "How far the trough fades. 0 keeps every character at full opacity." },
      { name: "staggerInFrames", type: "number", default: "2", description: "Frames between one character arriving and the next." },
      { name: "durationInFrames", type: "number", default: "20", description: "Length of one character's entrance." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the first character arrives." },
      { name: "exitAtInFrames", type: "number", description: "Frame the line starts leaving on. The wave lowers with it." },
    ],
    note: "Ambient: the wave is a function of the frame and never settles. Phase follows document order, not the stagger rank.",
    related: ["split-text-chars", "infinite-marquee", "variable-font-morph"],
  },
  "neon-flicker-text": {
    category: "primitive",
    usage: `import { NeonFlickerText } from "@/remotion/primitives/neon-flicker-text";

<NeonFlickerText text="Open all night" order="random" glowColor="#f472b6" />`,
    props: [
      { name: "text", type: "string", description: "The sign." },
      { name: "glowColor", type: "string", default: '"#f472b6"', description: "Colour of the halo around the tube." },
      { name: "glowSize", type: "number", default: "26", description: "Halo radius in px at full brightness. Four stacked shadows, so it stays soft." },
      { name: "offColor", type: "string", default: "faint pink", description: "The tube with no gas lit — cold glass, not invisible." },
      { name: "offLevel", type: "number", default: "0.14", description: "Brightness of an unlit tube, 0–1." },
      { name: "hum", type: "number", default: "0.12", description: "Depth of the mains hum once the sign has settled." },
      { name: "buzz", type: "number", default: "0.06", description: "Chance per beat that a settled tube stutters. 0 disables it." },
      { name: "flickerOnExit", type: "boolean", default: "true", description: "Stutter back off instead of fading cleanly." },
      { name: "order", type: '"start" | "end" | "center" | "edges" | "random"', default: '"start"', description: "Which tube strikes first. `random` is the natural fit." },
      { name: "staggerInFrames", type: "number", default: "2", description: "Frames between one tube striking and the next." },
      { name: "durationInFrames", type: "number", default: "20", description: "Length of one tube's ignition. Longer sputters more." },
      { name: "seed", type: "number", default: "1", description: "Seeds the flicker and `order=\"random\"`." },
      { name: "exitAtInFrames", type: "number", description: "Frame the sign starts cutting out on." },
    ],
    note: "A gas-discharge model: unlit tubes are still cold glass, strike probability climbs so the sign resolves, and a lit tube keeps a hum. A settled state with no hum looks like a PNG.",
    related: ["split-text-chars", "glow-pulse", "rgb-glitch-text"],
  },
  "aurora-bg": {
    category: "primitive",
    usage: `import { AuroraBg } from "@/remotion/primitives/aurora-bg";

<AbsoluteFill>
  <AuroraBg ribbonCount={4} />
  <YourScene />
</AbsoluteFill>`,
    props: [
      { name: "backgroundColor", type: "string", default: '"#05070f"', description: "Plate behind the curtains. `transparent` layers them over footage." },
      { name: "colors", type: "string[]", default: '["#4cd6a6", "#4f9cf9", "#a273ff"]', description: "Curtain colours, cycled." },
      { name: "ribbonCount", type: "number", default: "4", description: "How many curtains." },
      { name: "amplitude", type: "number", default: "9", description: "Vertical travel of a fold, in percent of the frame." },
      { name: "thickness", type: "number", default: "15", description: "Curtain height at its thickest point, in percent." },
      { name: "centerY", type: "number", default: "46", description: "Where the band sits, in percent of the frame height." },
      { name: "spread", type: "number", default: "34", description: "How far the curtains spread around `centerY`." },
      { name: "speed", type: "number", default: "1", description: "Drift speed. 0 freezes the sky." },
      { name: "blur", type: "number", default: "14", description: "Softness in px. Much above 20 and the folds become blobs." },
      { name: "intensity", type: "number", default: "1.3", description: "Overall brightness." },
      { name: "horizonGlow", type: "number", default: "0.5", description: "Ground glow under the band. 0 removes it." },
      { name: "striation", type: "number", default: "0.55", description: "Vertical ray structure through the curtains, 0-1." },
      { name: "seed", type: "number", default: "1", description: "Changes the fold layout without changing any other prop." },
    ],
    note: "Tapered paths whose shape changes every frame, not gradients that move — that is the line between this and `mesh-gradient-bg`. Two incommensurate fold clocks (2.3s against 1.1s) mean a curtain never repeats a shape. Background layer, so it has no entrance.",
    related: ["mesh-gradient-bg", "light-rays", "particle-field"],
  },
  "particle-field": {
    category: "primitive",
    usage: `import { ParticleField } from "@/remotion/primitives/particle-field";

<AbsoluteFill>
  <ParticleField count={70} angle={8} />
  <YourScene />
</AbsoluteFill>`,
    props: [
      { name: "backgroundColor", type: "string", default: '"#05070f"', description: "Plate behind the field. `transparent` layers it over footage." },
      { name: "color", type: "string", default: '"#e8b86d"', description: "Particle colour." },
      { name: "count", type: "number", default: "70", description: "How many particles." },
      { name: "angle", type: "number", default: "8", description: "Direction of travel in degrees. 0 drifts straight up." },
      { name: "speed", type: "number", default: "1", description: "Traverse speed. 1 crosses the frame in about eight seconds." },
      { name: "size", type: "number", default: "14", description: "Diameter of the nearest particle, in px." },
      { name: "minSize", type: "number", default: "2", description: "Diameter of the furthest particle, in px." },
      { name: "depthBlur", type: "number", default: "3", description: "Defocus on the furthest particles. 0 flattens the field." },
      { name: "drift", type: "number", default: "4", description: "Sideways wander, in percent of the frame." },
      { name: "intensity", type: "number", default: "1", description: "Overall brightness." },
      { name: "glow", type: "number", default: "1.6", description: "Halo per particle, as a multiple of its size. 0 draws hard dots." },
      { name: "seed", type: "number", default: "1", description: "Changes the layout without changing any other prop." },
    ],
    note: "Continuous, unlike `confetti-burst`, which is a single impulse. One depth value per particle drives size, speed, brightness and focus together — that correlation is what makes a plane of divs read as volume. Travel wraps on a track whose ends sit outside the frame.",
    related: ["confetti-burst", "aurora-bg", "mesh-gradient-bg"],
  },
  "topographic-lines-bg": {
    category: "primitive",
    usage: `import { TopographicLinesBg } from "@/remotion/primitives/topographic-lines-bg";

<AbsoluteFill>
  <TopographicLinesBg speed={1} />
  <YourScene />
</AbsoluteFill>`,
    props: [
      { name: "backgroundColor", type: "string", default: '"#07080e"', description: "Plate behind the contours. `transparent` layers them over footage." },
      { name: "lineColor", type: "string", default: '"rgba(232,184,109,0.5)"', description: "Contour colour." },
      { name: "indexColor", type: "string", default: '"rgba(232,184,109,0.95)"', description: "Colour of the heavier index contour." },
      { name: "peaks", type: "TopographicPeak[]", default: "two peaks", description: "Landforms: `{ x, y, size, roughness }` in percent. One peak reads as a target; two read as terrain." },
      { name: "lineCount", type: "number", default: "12", description: "Contours per landform." },
      { name: "indexEvery", type: "number", default: "4", description: "Every n-th contour is drawn heavier. 0 makes them uniform." },
      { name: "lineWidth", type: "number", default: "1.4", description: "Contour weight in px, independent of output size." },
      { name: "speed", type: "number", default: "1", description: "How fast elevation rises. 0 freezes the map." },
      { name: "intensity", type: "number", default: "1", description: "Overall brightness." },
      { name: "seed", type: "number", default: "1", description: "Changes the terrain without changing any other prop." },
    ],
    note: "Not marching squares — far too expensive per frame. Each landform is a stack of polar curves modulated by three harmonics, so the family is nested by construction. Contours travel outward and wrap, fading in at the peak and out at the rim.",
    related: ["dynamic-grid", "map-canvas", "aurora-bg"],
  },
  "caustics-bg": {
    category: "primitive",
    usage: `import { CausticsBg } from "@/remotion/primitives/caustics-bg";

<AbsoluteFill>
  <CausticsBg scale={130} />
  <YourScene />
</AbsoluteFill>`,
    props: [
      { name: "backgroundColor", type: "string", default: "deep water gradient", description: "Water behind the light. `transparent` layers the caustics over footage." },
      { name: "color", type: "string", default: '"#9fe8ff"', description: "Colour of the light itself." },
      { name: "scale", type: "number", default: "120", description: "Cell size, in px." },
      { name: "speed", type: "number", default: "1", description: "Swim speed. 0 freezes the surface." },
      { name: "contrast", type: "number", default: "3.4", description: "How hard the cells threshold. Too low and the web dissolves into plaid." },
      { name: "blur", type: "number", default: "8", description: "Softness of a cell edge, in px." },
      { name: "intensity", type: "number", default: "1", description: "Overall brightness." },
      { name: "falloff", type: "number", default: "0.55", description: "Depth shading down the frame. 0 lights it evenly." },
    ],
    note: "Five wave trains at incommensurate angles, added with `plus-lighter`, dimmed in patches by a slow swell, then thresholded with `contrast()`. Three trains — at any wavelengths — make a lattice, and a lattice reads as wallpaper; five make the sum quasi-periodic. No shader and no per-frame noise.",
    related: ["mesh-gradient-bg", "light-rays", "aurora-bg"],
  },
  "animated-noise-grain": {
    category: "primitive",
    usage: `import { AnimatedNoiseGrain } from "@/remotion/primitives/animated-noise-grain";

<AnimatedNoiseGrain opacity={0.18}>
  <YourScene />
</AnimatedNoiseGrain>`,
    props: [
      { name: "children", type: "ReactNode", description: "Content the grain sits over. Omit to use it as a bare overlay." },
      { name: "opacity", type: "number", default: "0.18", description: "Grain strength. Film sits around 0.12-0.25; above 0.4 reads as damage." },
      { name: "size", type: "number", default: "220", description: "Tile size on screen, in px. Larger grain is coarser and cheaper." },
      { name: "density", type: "number", default: "0.85", description: "Noise frequency inside the tile. Higher is finer." },
      { name: "detail", type: "number", default: "3", description: "Octaves of noise. 1 is smooth, 4 is gritty." },
      { name: "holdInFrames", type: "number", default: "2", description: "Frames each pattern is held. 2 gives the 15fps chatter of film." },
      { name: "blendMode", type: "CSS mix-blend-mode", default: '"overlay"', description: "How the grain composites. Use `screen` over a near-black plate — overlay pivots on mid grey and does nothing to blacks." },
      { name: "colored", type: "boolean", default: "false", description: "Keep the noise coloured instead of desaturating it to silver." },
      { name: "vignette", type: "number", default: "0.35", description: "Extra grain in the corners, where film grain actually lives." },
      { name: "seed", type: "number", default: "1", description: "Changes the pattern without changing any other prop." },
    ],
    note: "The noise is one stitched `feTurbulence` tile baked into a data URI, so the browser rasterises it once for the whole render. Per-frame variation comes from a hashed sub-tile offset plus one of four mirrorings — never from regenerating noise. Rendering the preview costs about 3% more per frame than the same frame without it.",
    related: ["scanline-crt", "mesh-gradient-bg", "light-rays"],
  },
  "light-rays": {
    category: "primitive",
    usage: `import { LightRays } from "@/remotion/primitives/light-rays";

<AbsoluteFill>
  <LightRays originX={28} originY={-14} angle={20} spread={56} />
  <YourScene />
</AbsoluteFill>`,
    props: [
      { name: "backgroundColor", type: "string", default: '"#080810"', description: "Plate behind the rays. `transparent` layers them over footage." },
      { name: "color", type: "string", default: '"#e8b86d"', description: "Colour of the shafts." },
      { name: "rayCount", type: "number", default: "11", description: "How many shafts. Odd counts avoid a symmetric seam down the middle." },
      { name: "spread", type: "number", default: "52", description: "Total fan angle, in degrees." },
      { name: "angle", type: "number", default: "22", description: "Direction the fan points. 0 points straight down." },
      { name: "originX", type: "number", default: "26", description: "Source position in percent of the frame. Usually outside it." },
      { name: "originY", type: "number", default: "-12", description: "Source position in percent of the frame." },
      { name: "intensity", type: "number", default: "1", description: "Overall brightness." },
      { name: "speed", type: "number", default: "1", description: "Sway speed. 0 freezes the fan into a poster frame." },
      { name: "blur", type: "number", default: "13", description: "Softness of a shaft's edge, in px. A heavy blur swallows the sway." },
      { name: "bloom", type: "number", default: "42", description: "Bloom radius at the source, in percent. 0 removes it." },
    ],
    note: "Tapered wedges on `screen`, with width, brightness and sway period hashed per index — an even fan reads as a printed sunburst. Background layer, so it has no entrance.",
    related: ["mesh-gradient-bg", "light-sweep-text", "aurora-bg"],
  },
  "parallax-layers": {
    category: "primitive",
    usage: `import { ParallaxLayers } from "@/remotion/primitives/parallax-layers";

<ParallaxLayers
  travel={420}
  layers={[
    { content: <Sky />, depth: 0.2, blur: 2 },
    { content: <Headline />, depth: 0.55 },
    { content: <Foreground />, depth: 1, blur: 8 },
  ]}
/>`,
    props: [
      { name: "layers", type: "ParallaxLayer[]", description: "Back to front. Each is `{ content, depth, blur, opacity, scale }`; depth 0 is the focal plane, 1 travels furthest, negative travels the other way." },
      { name: "travel", type: "number", default: "320", description: "Travel of a depth-1 plane across the whole move, in px." },
      { name: "angle", type: "number", default: "0", description: "Direction of the camera move. 0 tracks right, 90 cranes down." },
      { name: "zoom", type: "number", default: "0.12", description: "Extra scale the nearest plane picks up. 0 is a flat track." },
      { name: "progress", type: "number", description: "Drive the move yourself, 0-1. Overrides the frame-based sweep." },
      { name: "startAtInFrames", type: "number", default: "0", description: "Frame the sweep starts on." },
      { name: "durationInFrames", type: "number", default: "the composition", description: "Length of the sweep." },
      { name: "motion", type: '"ease" | "linear"', default: '"ease"', description: "`ease` settles at both ends; `linear` is a constant-speed dolly." },
      { name: "backgroundColor", type: "string", default: '"#07080e"', description: "Plate behind every plane." },
    ],
    note: "Multi-layer, unlike `zoom-pan-frame`, which moves a camera over one still. Parallax is a relationship, so one driver feeds every plane and `depth` is the only number a caller sets. The sweep runs -0.5 to 0.5, so the middle of the window is the layout you composed.",
    related: ["zoom-pan-frame", "depth-of-field-blur", "bento-pan"],
  },
  "shake-emphasis": {
    category: "primitive",
    usage: `import { ShakeEmphasis } from "@/remotion/primitives/shake-emphasis";

<ShakeEmphasis startAtInFrames={24}>
  <Headline />
</ShakeEmphasis>`,
    props: [
      { name: "children", type: "ReactNode", description: "What gets hit." },
      { name: "startAtInFrames", type: "number", default: "0", description: "Frame the impact lands on." },
      { name: "durationInFrames", type: "number", default: "18", description: "How long the shake takes to die out. Impacts are short." },
      { name: "intensity", type: "number", default: "16", description: "Peak displacement, in px." },
      { name: "rotation", type: "number", default: "1.6", description: "Peak rotation in degrees. 3 already reads as violent." },
      { name: "punch", type: "number", default: "0.05", description: "Scale compression on impact. 0 shakes without a hit." },
      { name: "frequency", type: "number", default: "22", description: "Rattle rate, in shakes per second." },
      { name: "axis", type: '"both" | "x" | "y"', default: '"both"', description: "Which way it moves." },
      { name: "decay", type: "number", default: "2.2", description: "How fast the shake dies. 1 is even, 3 is a sharp hit." },
      { name: "repeatEveryInFrames", type: "number", description: "Repeat the impact on this interval. Omit for a single hit." },
      { name: "seed", type: "number", default: "1", description: "Changes the rattle without changing any other prop." },
    ],
    note: "Value noise, not a sine: every swing is a different size, which is the difference between an impact and a motor. The envelope decays to rest, so the element is still before and after — a shake that keeps going is a vibration.",
    related: ["squash-stretch", "glow-pulse", "rgb-glitch-text"],
  },
  "glow-pulse": {
    category: "primitive",
    usage: `import { GlowPulse } from "@/remotion/primitives/glow-pulse";

<GlowPulse mode="beat" periodInFrames={36}>
  <CtaPill />
</GlowPulse>`,
    props: [
      { name: "children", type: "ReactNode", description: "What glows." },
      { name: "color", type: "string", default: '"#e8b86d"', description: "Glow colour." },
      { name: "radius", type: "number", default: "26", description: "Glow radius at full brightness, in px." },
      { name: "intensity", type: "number", default: "1", description: "Brightness at the top of the pulse." },
      { name: "floor", type: "number", default: "0.28", description: "Brightness at the bottom. Never 0 for a live indicator." },
      { name: "periodInFrames", type: "number", default: "36", description: "Length of one pulse." },
      { name: "mode", type: '"breathe" | "beat"', default: '"breathe"', description: "`breathe` is a sine; `beat` is a fast attack and a long decay." },
      { name: "scale", type: "number", default: "0.04", description: "Scale added at the top of the pulse. 0 glows without moving." },
      { name: "halo", type: "number", default: "2.4", description: "Halo behind the element, as a multiple of `radius`. 0 removes it." },
      { name: "echo", type: "number", default: "0", description: "Second, smaller tap per cycle — a heartbeat rather than a metronome." },
    ],
    note: "The glow is a `drop-shadow` filter, so it follows the alpha of whatever it wraps — a pill, a ring, type, an SVG mark — rather than the bounding box. `floor` matters more than `intensity`: a live indicator that reaches zero reads as broken.",
    related: ["shake-emphasis", "neon-flicker-text", "end-card"],
  },
  "motion-trail": {
    category: "primitive",
    usage: `import { MotionTrail } from "@/remotion/primitives/motion-trail";

<MotionTrail count={6} gapInFrames={3}>
  <TheMovingThing />
</MotionTrail>`,
    props: [
      { name: "children", type: "ReactNode", description: "The moving element. It must animate from `useCurrentFrame()`." },
      { name: "count", type: "number", default: "6", description: "How many echoes trail behind." },
      { name: "gapInFrames", type: "number", default: "3", description: "Frames between echoes. Wider gaps stretch the trail for free." },
      { name: "opacity", type: "number", default: "0.45", description: "Opacity of the freshest echo." },
      { name: "falloff", type: "number", default: "1.6", description: "How fast echoes fade. 1 is linear, 2 keeps the tail short." },
      { name: "scale", type: "number", default: "0.82", description: "Scale of the oldest echo. 1 keeps them all the same size." },
      { name: "blur", type: "number", default: "4", description: "Blur on the oldest echo, in px." },
      { name: "color", type: "string", description: "Tint the echoes. Omit to echo the element's own colours." },
      { name: "blendMode", type: "CSS mix-blend-mode", default: '"screen"', description: "How echoes composite. `screen` is right on a dark stage." },
      { name: "block", type: "boolean", default: "false", description: "Fill the parent instead of shrink-wrapping the subject." },
    ],
    note: "An echo is not a copy of a position — it is the subject re-rendered at an earlier frame, via `<Sequence from={gap * i}>`. That makes the trail correct for any motion, including rotation and colour change, with no path to describe. It also costs `count + 1` renders of the subtree per frame, so prefer a wider gap over a higher count.",
    related: ["cursor-path", "confetti-burst", "orbit-motion"],
  },
  "squash-stretch": {
    category: "primitive",
    usage: `import { SquashStretch } from "@/remotion/primitives/squash-stretch";

<SquashStretch mode="bounce" periodInFrames={36}>
  <Ball />
</SquashStretch>`,
    props: [
      { name: "children", type: "ReactNode", description: "What deforms." },
      { name: "mode", type: '"bounce" | "pulse" | "impact"', default: '"bounce"', description: "Travel and deform, breathe in place, or deform once." },
      { name: "periodInFrames", type: "number", default: "36", description: "Length of one cycle." },
      { name: "travel", type: "number", default: "90", description: "Bounce height, in px. 0 deforms in place." },
      { name: "squash", type: "number", default: "0.28", description: "How hard it flattens on contact. Above 0.4 reads as cartoon." },
      { name: "stretch", type: "number", default: "0.16", description: "How far it elongates at speed." },
      { name: "startAtInFrames", type: "number", default: "0", description: "Frame the cycle starts on." },
      { name: "contact", type: "number", default: "0.22", description: "How much of the cycle the contact lasts, 0-1." },
      { name: "origin", type: '"bottom" | "center" | "top"', default: '"bottom"', description: "Pivot. `bottom` is the floor contact." },
    ],
    note: "Volume is preserved: `scaleX` is the reciprocal square root of `scaleY`, because the eye tracks area and a one-axis squash reads as a scale bug. The pivot is the bottom by default — deforming around the centre lifts the element off its own baseline and the floor stops reading as a floor.",
    related: ["spring-in", "shake-emphasis", "counter"],
  },
  "orbit-motion": {
    category: "primitive",
    usage: `import { OrbitMotion } from "@/remotion/primitives/orbit-motion";

<OrbitMotion periodInFrames={120} center={<Logo />}>
  <Chip label="One" />
  <Chip label="Two" />
</OrbitMotion>`,
    props: [
      { name: "children", type: "ReactNode", description: "Each child gets its own slot on the ring, evenly spaced." },
      { name: "radiusX", type: "number", default: "210", description: "Horizontal radius, in px." },
      { name: "radiusY", type: "number", default: "78", description: "Vertical radius. Smaller reads as a tilted ring." },
      { name: "periodInFrames", type: "number", default: "120", description: "Frames for one revolution." },
      { name: "phase", type: "number", default: "0", description: "Where the first child starts, in degrees." },
      { name: "tilt", type: "number", default: "-12", description: "Tilt of the whole ring, in degrees." },
      { name: "direction", type: '"cw" | "ccw"', default: '"cw"', description: "Which way it turns." },
      { name: "centerX", type: "number", default: "50", description: "Centre of the orbit, in percent of the frame." },
      { name: "centerY", type: "number", default: "50", description: "Centre of the orbit, in percent of the frame." },
      { name: "depth", type: "number", default: "0.28", description: "Scale difference between the near and far side. 0 is flat." },
      { name: "depthFade", type: "number", default: "0.4", description: "How much the far side dims." },
      { name: "upright", type: "boolean", default: "true", description: "Keep children upright instead of letting them ride the ring." },
      { name: "showPath", type: "boolean", default: "false", description: "Draw the ring itself." },
      { name: "pathColor", type: "string", default: '"rgba(255,255,255,0.14)"', description: "Colour of the drawn ring." },
      { name: "center", type: "ReactNode", description: "What sits at the centre." },
    ],
    note: "The ellipse is the easy half; depth is what makes it an orbit. One sine drives scale, opacity and `zIndex` together, so a satellite passes behind whatever is at the centre by itself. Give satellites different content — identical ones make the ring repeat every revolution divided by their count.",
    related: ["ecosystem-orbit", "motion-trail", "squash-stretch"],
  },
  "depth-of-field-blur": {
    category: "primitive",
    usage: `import { DepthOfFieldBlur } from "@/remotion/primitives/depth-of-field-blur";

<DepthOfFieldBlur
  focusFrom={1}
  focusTo={0}
  layers={[
    { content: <Background />, depth: 1 },
    { content: <Card />, depth: 0.4 },
    { content: <Foreground />, depth: 0 },
  ]}
/>`,
    props: [
      { name: "layers", type: "DepthOfFieldLayer[]", description: "Back to front. Each is `{ content, depth }`, depth 0 nearest to 1 furthest." },
      { name: "focusFrom", type: "number", default: "0", description: "Depth the lens starts focused on." },
      { name: "focusTo", type: "number", default: "1", description: "Depth the lens racks to. Equal to `focusFrom` holds focus." },
      { name: "startAtInFrames", type: "number", default: "6", description: "Frame the rack starts on." },
      { name: "durationInFrames", type: "number", default: "78% of the window", description: "Length of the rack." },
      { name: "maxBlur", type: "number", default: "16", description: "Blur at maximum defocus, in px." },
      { name: "aperture", type: "number", default: "2.2", description: "How fast focus falls off with distance. Higher is a wider aperture." },
      { name: "dim", type: "number", default: "0.35", description: "How much an out-of-focus plane darkens." },
      { name: "breathe", type: "number", default: "0.03", description: "Scale a defocused plane picks up — focus breathing." },
      { name: "progress", type: "number", description: "Drive the rack yourself, 0-1." },
      { name: "backgroundColor", type: "string", default: '"#07080e"', description: "Plate behind every plane." },
    ],
    note: "Spatial, unlike `blur-focus-in`, which resolves one piece of type. Blur comes from each plane's distance to the focal plane, so racking pulls one layer in exactly as it pushes another out. Time the rack so it lands *on* planes: a rack that is between two planes at the moment anyone looks has nothing sharp in frame.",
    related: ["blur-focus-in", "parallax-layers", "zoom-pan-frame"],
  },
  "scanline-crt": {
    category: "primitive",
    usage: `import { ScanlineCrt } from "@/remotion/primitives/scanline-crt";

<ScanlineCrt curvature={0.6}>
  <YourScene />
</ScanlineCrt>`,
    props: [
      { name: "children", type: "ReactNode", description: "What the tube is showing. Omit to use it as a bare overlay." },
      { name: "lineCount", type: "number", default: "90", description: "How many scanlines across the frame." },
      { name: "lineOpacity", type: "number", default: "0.34", description: "Darkness of a scanline." },
      { name: "lineWidth", type: "number", default: "1.6", description: "Scanline weight in px, independent of output size." },
      { name: "curvature", type: "number", default: "0.55", description: "How hard the tube face bows. 0 draws dead straight lines." },
      { name: "cornerRadius", type: "number", default: "22", description: "Corner radius of the tube face, in px." },
      { name: "rollInFrames", type: "number", default: "96", description: "Frames for the refresh bar to cross. 0 removes it." },
      { name: "rollOpacity", type: "number", default: "0.16", description: "Brightness of the refresh bar." },
      { name: "flicker", type: "number", default: "0.05", description: "Frame-to-frame brightness jitter." },
      { name: "grille", type: "number", default: "0.22", description: "Strength of the RGB aperture grille." },
      { name: "vignette", type: "number", default: "0.55", description: "Corner darkening." },
      { name: "tint", type: "string", default: '"transparent"', description: "Phosphor tint over the picture." },
      { name: "tintBlend", type: "CSS mix-blend-mode", default: '"overlay"', description: "How the tint composites." },
      { name: "intensity", type: "number", default: "1", description: "Strength of every overlay at once." },
    ],
    note: "Curvature is drawn: each scanline is a quadratic whose midpoint is pushed away from the tube centre, so lines bow up at the top and down at the bottom. Content underneath is not geometrically warped. Every overlay here removes light, so over a near-black plate the component is invisible — give it a picture.",
    related: ["animated-noise-grain", "rgb-glitch-text", "terminal-simulator"],
  },
  "bar-chart-race": {
    category: "primitive",
    usage: `import { BarChartRace } from "@/remotion/primitives/bar-chart-race";

<BarChartRace
  series={[
    { label: "Studio", values: [42, 58, 66, 72, 78, 84] },
    { label: "Motion", values: [18, 34, 57, 76, 92, 108] },
  ]}
  steps={["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]}
  framesPerStep={18}
/>`,
    props: [
      { name: "series", type: "RaceSeries[]", default: "required", description: "One entry per contender: `{ label, values, color? }`, one value per keyframe." },
      { name: "steps", type: "string[]", default: "undefined", description: "Keyframe captions, e.g. years. Shown as the running clock." },
      { name: "framesPerStep", type: "number", default: "26", description: "Frames spent travelling between two keyframes." },
      { name: "visibleRows", type: "number", default: "6", description: "How many rows stay on the board. Below that, series fade out." },
      { name: "width", type: "number", default: "900", description: "Overall width, label column included." },
      { name: "rowHeight", type: "number", default: "66", description: "Bar height. Type scales off it." },
      { name: "gap", type: "number", default: "14", description: "Space between rows." },
      { name: "labelWidth", type: "number", default: "200", description: "Width reserved for the row labels." },
      { name: "showStepLabel", type: "boolean", default: "true", description: "Large step caption in the bottom-right corner." },
      { name: "valueFormatter", type: "(value: number) => string", default: "compact", description: "Formats the figure inside each bar." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before the clock starts." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the bars collapse on. Omit to hold the final standings." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Rank is fractional, not an integer sort position: each series measures how far above it the others sit, softened by a sigmoid. Integer ranks make bars teleport a full row the instant two values cross — the exact moment the format exists to show. Takes raw time series and interpolates them, not pre-computed rankings.",
    related: ["animated-bar-chart", "leaderboard-rows", "counter"],
  },
  "donut-chart": {
    category: "primitive",
    usage: `import { DonutChart } from "@/remotion/primitives/donut-chart";

<DonutChart
  segments={[
    { label: "Direct", value: 4820 },
    { label: "Search", value: 3140 },
    { label: "Social", value: 1960 },
  ]}
  totalLabel="Sessions"
  staggerInFrames={16}
/>`,
    props: [
      { name: "segments", type: "ChartDatum[]", default: "required", description: "`{ label, value, color? }`, drawn clockwise in the order given." },
      { name: "size", type: "number", default: "360", description: "Outer diameter in px. All type scales off it." },
      { name: "thickness", type: "number", default: "46", description: "Ring thickness. Below a tenth of `size` it reads as a hairline." },
      { name: "colors", type: "string[]", default: "gold / teal / pink / indigo", description: "Fallback colours, cycled for segments with no `color`." },
      { name: "showLegend", type: "boolean", default: "true", description: "Legend rows beside the ring, arriving with their own slice." },
      { name: "showTotal", type: "boolean", default: "true", description: "Running total in the hole." },
      { name: "totalLabel", type: "string", default: '"Total"', description: "Caption under the total." },
      { name: "valueFormatter", type: "(value: number) => string", default: "compact", description: "Formats the centre total." },
      { name: "durationInFrames", type: "number", default: "26", description: "Length of one segment's sweep." },
      { name: "staggerInFrames", type: "number", default: "9", description: "Frames between one segment and the next." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the chart is dismissed on." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "The centre total counts the segments that have actually landed, so ring and number agree on every frame. Each segment is a dashed circle rotated to its own start angle, which keeps every arc on one radius. `stat-card` owns the single-value ring; this one is strictly multi-segment.",
    related: ["pie-slice-reveal", "stat-card", "progress-bar"],
  },
  "pie-slice-reveal": {
    category: "primitive",
    usage: `import { PieSliceReveal } from "@/remotion/primitives/pie-slice-reveal";

<PieSliceReveal
  slices={[
    { label: "Pro", value: 44 },
    { label: "Team", value: 26 },
    { label: "Free", value: 18 },
  ]}
  staggerInFrames={18}
/>`,
    props: [
      { name: "slices", type: "ChartDatum[]", default: "required", description: "`{ label, value, color? }`, swept clockwise from twelve o'clock." },
      { name: "size", type: "number", default: "380", description: "Diameter in px, offset for the explode included." },
      { name: "colors", type: "string[]", default: "gold / teal / pink / indigo / amber", description: "Fallback colours, cycled." },
      { name: "showLabels", type: "boolean", default: "true", description: "Percentages inside each slice, from 70% of its sweep." },
      { name: "explode", type: "number", default: "0.04", description: "How far each slice sits off centre, as a share of the radius." },
      { name: "gapInDegrees", type: "number", default: "1.4", description: "Angular gap, taken off the end of each wedge." },
      { name: "durationInFrames", type: "number", default: "24", description: "Length of one slice's sweep." },
      { name: "staggerInFrames", type: "number", default: "14", description: "Frames between one slice and the next." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the slices fan out on." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "The gap is cut out of the wedge rather than stroked between wedges: a stroked divider sits on top of whichever slice was painted last and nicks the outer edge of the circle. Solid wedges, so the whole is the point — use `donut-chart` when the centre should carry a number.",
    related: ["donut-chart", "stat-card", "comparison-bars"],
  },
  "scatter-plot-pop": {
    category: "primitive",
    usage: `import { ScatterPlotPop } from "@/remotion/primitives/scatter-plot-pop";

<ScatterPlotPop
  points={[{ x: 4, y: 24, weight: 0.8 }, { x: 11, y: 39 }]}
  xLabel="Scenes per project"
  staggerInFrames={3}
/>`,
    props: [
      { name: "points", type: "ScatterPoint[]", default: "required", description: "`{ x, y, weight?, color? }` in data units." },
      { name: "width", type: "number", default: "860", description: "Drawing width. Type scales off it." },
      { name: "height", type: "number", default: "480", description: "Drawing height." },
      { name: "minRadius", type: "number", default: "7", description: "Dot radius at weight 0." },
      { name: "maxRadius", type: "number", default: "20", description: "Dot radius at the heaviest weight present." },
      { name: "showTrend", type: "boolean", default: "true", description: "Least-squares trend line, drawn after the last dot lands." },
      { name: "showAxis", type: "boolean", default: "true", description: "Gridlines and value labels on both axes." },
      { name: "xLabel", type: "string", default: "undefined", description: "Caption under the x axis." },
      { name: "yLabel", type: "string", default: "undefined", description: "Rotated caption beside the y axis." },
      { name: "durationInFrames", type: "number", default: "16", description: "Length of one dot's pop." },
      { name: "staggerInFrames", type: "number", default: "2.5", description: "Frames between dots, in ascending x order." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the cloud drains on." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "The stagger follows ascending x, not array order, so the cloud fills the way the axis is read. The fit is least squares over the raw values and only then projected — fitting in screen space inverts the slope, since y grows downward there.",
    related: ["line-chart-draw", "bubble-chart-pack", "sparkline-row"],
  },
  "bubble-chart-pack": {
    category: "primitive",
    usage: `import { BubbleChartPack } from "@/remotion/primitives/bubble-chart-pack";

<BubbleChartPack
  bubbles={[
    { label: "Atoms", value: 42 },
    { label: "Blocks", value: 31 },
    { label: "Signals", value: 26 },
  ]}
  staggerInFrames={12}
/>`,
    props: [
      { name: "bubbles", type: "ChartDatum[]", default: "required", description: "`{ label, value, color? }`. Area is proportional to value." },
      { name: "width", type: "number", default: "860", description: "Box the cluster is scaled to fit." },
      { name: "height", type: "number", default: "520", description: "Box height." },
      { name: "colors", type: "string[]", default: "gold / teal / pink / indigo / amber", description: "Fallback colours, cycled." },
      { name: "showLabels", type: "boolean", default: "true", description: "Labels inside bubbles large enough to hold them." },
      { name: "showValues", type: "boolean", default: "true", description: "Value line under the label, hidden on small bubbles." },
      { name: "padding", type: "number", default: "6", description: "Gap held between neighbours, in layout units." },
      { name: "durationInFrames", type: "number", default: "26", description: "Length of one bubble's settle." },
      { name: "staggerInFrames", type: "number", default: "7", description: "Frames between bubbles, largest first." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the cluster contracts on." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Radius scales with the square root of the value, so area — what the eye compares — stays proportional. The pack is a deterministic spiral placement followed by a compaction pass toward the centre: the same data always produces the same arrangement, which is worth more here than density.",
    related: ["scatter-plot-pop", "donut-chart", "treemap-blocks"],
  },
  "gauge-dial": {
    category: "primitive",
    usage: `import { GaugeDial } from "@/remotion/primitives/gauge-dial";

<GaugeDial value={78} label="Render budget" unit="%" durationInFrames={70} />`,
    props: [
      { name: "value", type: "number", default: "required", description: "Target the needle sweeps to." },
      { name: "min", type: "number", default: "0", description: "Value at the start of the arc." },
      { name: "max", type: "number", default: "100", description: "Value at the end of the arc." },
      { name: "size", type: "number", default: "360", description: "Outer diameter in px. Type scales off it." },
      { name: "thickness", type: "number", default: "26", description: "Track and fill thickness." },
      { name: "sweepInDegrees", type: "number", default: "250", description: "Total travel, centred on twelve o'clock. 180 gives a half-moon meter." },
      { name: "label", type: "string", default: "undefined", description: "Caption under the readout." },
      { name: "unit", type: "string", default: '""', description: "Suffix on the readout, e.g. `\"%\"`." },
      { name: "tickCount", type: "number", default: "9", description: "Tick marks around the arc. 0 hides them." },
      { name: "valueFormatter", type: "(value: number) => string", default: "rounded", description: "Formats the readout." },
      { name: "durationInFrames", type: "number", default: "44", description: "Length of the sweep." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before the sweep starts." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the dial unwinds on." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "The needle rides the overshoot curve and the arc does not — a needle that settles back is instrument-like, while a coloured arc that retreats reads as the value changing its mind. The readout counts from the arc's progress, so number and fill never disagree.",
    related: ["progress-bar", "stat-card", "counter"],
  },
  "sparkline-row": {
    category: "primitive",
    usage: `import { SparklineRow } from "@/remotion/primitives/sparkline-row";

<SparklineRow
  rows={[
    { label: "Renders / day", values: [180, 240, 320, 480, 610], delta: "+24%" },
    { label: "Median render", values: [92, 86, 74, 66, 61], delta: "-18%" },
  ]}
  staggerInFrames={20}
/>`,
    props: [
      { name: "rows", type: "SparklineSeries[]", default: "required", description: "`{ label, values, value?, delta?, color? }`, oldest value first." },
      { name: "width", type: "number", default: "720", description: "Overall width of the stack." },
      { name: "rowHeight", type: "number", default: "96", description: "Height of one row. Type scales off it." },
      { name: "sparkWidth", type: "number", default: "260", description: "Width of the spark itself." },
      { name: "upColor", type: "string", default: '"#2dd4bf"', description: "Colour for a `+` delta." },
      { name: "downColor", type: "string", default: '"#f472b6"', description: "Colour for a `-` delta." },
      { name: "showArea", type: "boolean", default: "true", description: "Gradient wash under each line." },
      { name: "durationInFrames", type: "number", default: "34", description: "Length of one row's draw." },
      { name: "staggerInFrames", type: "number", default: "12", description: "Frames between one row and the next." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the stack starts emptying on, top-down." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Every row scales to its own domain: a sparkline is read for shape, and a shared axis would flatten a metric that moves between 4 and 6 next to one in the thousands. Only the spark is SVG — label, value and delta are CSS, so the row keeps tabular figures without fighting SVG text metrics.",
    related: ["line-chart-draw", "stat-card", "scatter-plot-pop"],
  },
  "heatmap-grid": {
    category: "primitive",
    usage: `import { HeatmapGrid } from "@/remotion/primitives/heatmap-grid";

<HeatmapGrid
  cells={weeks}
  rowLabels={["Mon", "", "Wed", "", "Fri", "", "Sun"]}
  columnStaggerInFrames={3.4}
/>`,
    props: [
      { name: "cells", type: "number[][]", default: "required", description: "Row-major intensities. Ragged rows are padded with empty cells." },
      { name: "maxValue", type: "number", default: "busiest cell", description: "Top of the ramp. Set it explicitly to compare two grids." },
      { name: "cellSize", type: "number", default: "34", description: "Cell edge length in px." },
      { name: "gap", type: "number", default: "8", description: "Space between cells." },
      { name: "color", type: "string", default: '"#e8b86d"', description: "Colour at full intensity." },
      { name: "emptyColor", type: "string", default: "rgba(250,250,250,0.07)", description: "Colour of a zero cell." },
      { name: "rowLabels", type: "string[]", default: "undefined", description: "Labels down the left gutter, one per row." },
      { name: "columnLabels", type: "string[]", default: "undefined", description: "Labels along the top. Sparse arrays are fine." },
      { name: "showLegend", type: "boolean", default: "true", description: "\"Less → more\" ramp under the grid." },
      { name: "durationInFrames", type: "number", default: "14", description: "Length of one cell's fill." },
      { name: "columnStaggerInFrames", type: "number", default: "3", description: "Frames added per column as the wave crosses." },
      { name: "rowStaggerInFrames", type: "number", default: "1.5", description: "Frames added per row. Keep it below the column stagger." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the grid drains on, along the same diagonal." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Staggering by column plus row makes the fill sweep as a diagonal front; a flat index stagger snakes back to the left edge on every new row and reads as a glitch. Intensity drives colour and a small scale step together — colour alone is hard to judge at cell size on a dark stage.",
    related: ["commit-graph", "beat-pulse-grid", "treemap-blocks"],
  },
  "comparison-bars": {
    category: "primitive",
    usage: `import { ComparisonBars } from "@/remotion/primitives/comparison-bars";

<ComparisonBars
  rows={[
    { label: "Time to first cut", before: 240, after: 96 },
    { label: "Renders / week", before: 120, after: 310 },
  ]}
  seriesLabels={["Before", "After"]}
  staggerInFrames={18}
/>`,
    props: [
      { name: "rows", type: "ComparisonRowDatum[]", default: "required", description: "`{ label, before, after, delta? }`. The delta is computed when omitted." },
      { name: "width", type: "number", default: "820", description: "Overall width, label column included." },
      { name: "rowHeight", type: "number", default: "74", description: "Height of one pair, both bars and their gap included." },
      { name: "gap", type: "number", default: "26", description: "Space between rows." },
      { name: "labelWidth", type: "number", default: "190", description: "Width reserved for the row labels." },
      { name: "beforeColor", type: "string", default: "rgba(250,250,250,0.22)", description: "Baseline bar. Muted on purpose — it is the thing being beaten." },
      { name: "afterColor", type: "string", default: '"#e8b86d"', description: "New-value bar, and the colour of a rising delta." },
      { name: "downColor", type: "string", default: '"#f472b6"', description: "Delta colour when the change is a fall." },
      { name: "seriesLabels", type: "[string, string]", default: "undefined", description: "Legend above the rows, e.g. `[\"Before\", \"After\"]`." },
      { name: "showDelta", type: "boolean", default: "true", description: "Percentage-change chip at the end of the second bar." },
      { name: "durationInFrames", type: "number", default: "30", description: "Length of one bar's growth." },
      { name: "staggerInFrames", type: "number", default: "12", description: "Frames between one row and the next." },
      { name: "pairOffsetInFrames", type: "number", default: "6", description: "Frames the second bar trails the first by." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the rows start leaving on, in arrival order." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Every bar is measured against the largest value in the whole set, so pairs stay comparable to each other and not only internally. The second bar trails the first by a few frames, which is what makes a pair read as one change rather than two adjacent bars.",
    related: ["animated-bar-chart", "stat-card", "funnel-chart"],
  },
  "funnel-chart": {
    category: "primitive",
    usage: `import { FunnelChart } from "@/remotion/primitives/funnel-chart";

<FunnelChart
  stages={[
    { label: "Visited docs", value: 42800 },
    { label: "Ran the CLI", value: 18600 },
    { label: "Shipped it", value: 1750 },
  ]}
  staggerInFrames={15}
/>`,
    props: [
      { name: "stages", type: "FunnelStage[]", default: "required", description: "`{ label, value, color? }`, top to bottom." },
      { name: "width", type: "number", default: "820", description: "Overall width: label gutter, funnel and drop-off gutter." },
      { name: "height", type: "number", default: "420", description: "Overall height. Bands split it evenly." },
      { name: "gap", type: "number", default: "10", description: "Space between bands." },
      { name: "tailOpacity", type: "number", default: "0.5", description: "Opacity of the last band; earlier bands ramp toward 1." },
      { name: "labelWidth", type: "number", default: "30% of width", description: "Left gutter holding stage names and values." },
      { name: "showDropoff", type: "boolean", default: "true", description: "Drop-off chip between consecutive stages." },
      { name: "showConversion", type: "boolean", default: "false", description: "Share of the first stage, printed beside each value." },
      { name: "durationInFrames", type: "number", default: "22", description: "Length of one band's wipe." },
      { name: "staggerInFrames", type: "number", default: "12", description: "Frames between one band and the next." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the funnel drains on, narrow end first." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Each band tapers from its own width to the next stage's, so the shape carries the loss before a label is read; the last band is a rectangle because there is no next stage to taper to. Names and values sit in a left gutter — a real funnel ends narrow, and type inside the last band would have to shrink until it was unreadable.",
    related: ["comparison-bars", "animated-bar-chart", "stat-card"],
  },
  "radar-chart": {
    category: "primitive",
    usage: `import { RadarChart } from "@/remotion/primitives/radar-chart";

<RadarChart
  axes={["Speed", "Polish", "Reuse", "Docs", "Types", "Motion"]}
  series={[
    { label: "Before", values: [42, 38, 24, 30, 46, 34] },
    { label: "After", values: [88, 92, 84, 78, 90, 86] },
  ]}
  maxValue={100}
/>`,
    props: [
      { name: "axes", type: "string[]", default: "required", description: "Axis names, clockwise from the top. Three minimum." },
      { name: "series", type: "RadarSeries[]", default: "required", description: "`{ label, values, color? }`, one value per axis in axis order." },
      { name: "size", type: "number", default: "420", description: "Diameter of the web. Labels sit outside it." },
      { name: "maxValue", type: "number", default: "largest value", description: "Value at the outer ring. Pin it when comparing two charts." },
      { name: "ringCount", type: "number", default: "4", description: "Concentric rings behind the polygons." },
      { name: "showLabels", type: "boolean", default: "true", description: "Axis names around the web." },
      { name: "showVertices", type: "boolean", default: "true", description: "Dot on each vertex." },
      { name: "fillOpacity", type: "number", default: "0.22", description: "Fill under each polygon." },
      { name: "durationInFrames", type: "number", default: "18", description: "Length of one vertex's reach." },
      { name: "staggerInFrames", type: "number", default: "5", description: "Frames between axes, sweeping clockwise." },
      { name: "seriesOffsetInFrames", type: "number", default: "10", description: "Frames one series trails the previous one by." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the polygons collapse to the centre on." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Vertices reach out one axis at a time rather than the polygon scaling as a whole: a growing polygon says nothing about which axis is strong. The web arrives whole and ahead of the data — it is the instrument, and animating it would suggest the scale was changing. The box grows with the longest axis label so nothing clips.",
    related: ["line-chart-draw", "comparison-bars", "scatter-plot-pop"],
  },
  "treemap-blocks": {
    category: "primitive",
    usage: `import { TreemapBlocks } from "@/remotion/primitives/treemap-blocks";

<TreemapBlocks
  blocks={[
    { label: "Atoms", value: 46 },
    { label: "Blocks", value: 31 },
    { label: "Signals", value: 26 },
  ]}
  staggerInFrames={12}
/>`,
    props: [
      { name: "blocks", type: "ChartDatum[]", default: "required", description: "`{ label, value, color? }`. Area is proportional to value." },
      { name: "width", type: "number", default: "820", description: "Box the tiles fill." },
      { name: "height", type: "number", default: "460", description: "Box height." },
      { name: "gap", type: "number", default: "8", description: "Space between tiles." },
      { name: "cornerRadius", type: "number", default: "12", description: "Tile corner radius, clamped on small tiles." },
      { name: "showShare", type: "boolean", default: "true", description: "Percentage of the total, printed beside the value." },
      { name: "durationInFrames", type: "number", default: "20", description: "Length of one tile's arrival." },
      { name: "staggerInFrames", type: "number", default: "6", description: "Frames between tiles, largest first." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the map collapses on, smallest first." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Squarified layout (Bruls, Huizing & van Wijk): rows grow along the shorter free side and close when the next value would worsen the aspect ratio. Slice-and-dice turns small values into unlabelable splinters. A tile prints its label only when it can hold it — overflowing type reads as a rendering fault, and the area still carries the small values.",
    related: ["bubble-chart-pack", "heatmap-grid", "donut-chart"],
  },
  "waterfall-chart": {
    category: "primitive",
    usage: `import { WaterfallChart } from "@/remotion/primitives/waterfall-chart";

<WaterfallChart
  steps={[
    { label: "Q1 open", value: 320, isTotal: true },
    { label: "New", value: 180 },
    { label: "Churn", value: -74 },
    { label: "Q2 close", value: 484, isTotal: true },
  ]}
  staggerInFrames={15}
/>`,
    props: [
      { name: "steps", type: "WaterfallStep[]", default: "required", description: "`{ label, value, isTotal?, color? }`. `value` is a signed change unless `isTotal`." },
      { name: "width", type: "number", default: "860", description: "Drawing width. Type scales off it." },
      { name: "height", type: "number", default: "440", description: "Drawing height." },
      { name: "upColor", type: "string", default: '"#2dd4bf"', description: "Bars that add to the running total." },
      { name: "downColor", type: "string", default: '"#f472b6"', description: "Bars that subtract." },
      { name: "totalColor", type: "string", default: '"#e8b86d"', description: "Subtotal columns drawn from the axis." },
      { name: "showConnectors", type: "boolean", default: "true", description: "Dashed rules from one bar's landing level to the next bar's base." },
      { name: "showValues", type: "boolean", default: "true", description: "Signed change printed above or below each bar." },
      { name: "showAxis", type: "boolean", default: "true", description: "Gridlines and value labels down the left gutter." },
      { name: "durationInFrames", type: "number", default: "20", description: "Length of one bar's growth." },
      { name: "staggerInFrames", type: "number", default: "10", description: "Frames between one step and the next." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the bridge starts clearing on, left to right." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Bars grow from the running total they start at, not from the axis: in a waterfall the position carries as much as the length. `isTotal` draws from the axis and resets the running total, which is how an opening or closing column stays honest. Connectors wait for their bar to stop before extending.",
    related: ["animated-bar-chart", "comparison-bars", "funnel-chart"],
  },
  "stacked-area-chart": {
    category: "primitive",
    usage: `import { StackedAreaChart } from "@/remotion/primitives/stacked-area-chart";

<StackedAreaChart
  series={[
    { label: "Reels", values: [140, 210, 300, 430, 520] },
    { label: "Ads", values: [90, 130, 210, 300, 340] },
  ]}
  labels={["Jan", "Mar", "May", "Jul", "Aug"]}
  durationInFrames={62}
/>`,
    props: [
      { name: "series", type: "StackedSeries[]", default: "required", description: "`{ label, values, color? }`, first entry is the baseline band." },
      { name: "labels", type: "string[]", default: "undefined", description: "Category labels along the x axis, one per value." },
      { name: "width", type: "number", default: "880", description: "Drawing width. Type scales off it." },
      { name: "height", type: "number", default: "460", description: "Drawing height." },
      { name: "showAxis", type: "boolean", default: "true", description: "Gridlines and value labels down the left gutter." },
      { name: "showLegend", type: "boolean", default: "true", description: "Series names above the plot, arriving with their band." },
      { name: "showBoundaries", type: "boolean", default: "true", description: "Hairline along the top of each band." },
      { name: "fillOpacity", type: "number", default: "0.85", description: "Band fill opacity." },
      { name: "durationInFrames", type: "number", default: "60", description: "Length of the wipe across the whole plot." },
      { name: "bandOffsetInFrames", type: "number", default: "8", description: "Frames one band trails the band below it by." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the stack retreats on, top band first." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "The reveal is a clip travelling across the plot, not a fade or a vertical grow: a stacked area is read as a history, so uncovering it in time order is the only reveal that agrees with the axis. Band edges share one spline and the lower edge is walked backwards to close the shape, so no sliver appears at the seam.",
    related: ["line-chart-draw", "sparkline-row", "animated-bar-chart"],
  },
  "candlestick-chart": {
    category: "primitive",
    usage: `import { CandlestickChart } from "@/remotion/primitives/candlestick-chart";

<CandlestickChart
  candles={[{ open: 101, high: 106, low: 99, close: 104, label: "W1" }]}
  movingAverage={6}
  staggerInFrames={3.4}
/>`,
    props: [
      { name: "candles", type: "Candle[]", default: "required", description: "`{ open, high, low, close, label? }`, oldest first." },
      { name: "width", type: "number", default: "900", description: "Drawing width. Type scales off it." },
      { name: "height", type: "number", default: "460", description: "Drawing height." },
      { name: "upColor", type: "string", default: '"#2dd4bf"', description: "Candles that closed at or above their open." },
      { name: "downColor", type: "string", default: '"#f472b6"', description: "Candles that closed below their open." },
      { name: "movingAverage", type: "number", default: "7", description: "Window for the simple moving average. 0 hides the line." },
      { name: "showLastPrice", type: "boolean", default: "true", description: "Final close pinned against the right edge." },
      { name: "showAxis", type: "boolean", default: "true", description: "Gridlines and price labels down the left gutter." },
      { name: "durationInFrames", type: "number", default: "12", description: "Length of one candle's growth." },
      { name: "staggerInFrames", type: "number", default: "3", description: "Frames between one candle and the next." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the tape clears on, oldest first." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Candles grow out of their own open in both directions, so a half-drawn candle still tells the truth; the wick runs a little ahead of the body, as a real tape prints. The average is plotted only where a full window exists. The axis is not anchored at zero — price is read for range, and a zero baseline flattens the movement.",
    related: ["line-chart-draw", "sparkline-row", "stacked-area-chart"],
  },
  "gantt-timeline": {
    category: "primitive",
    usage: `import { GanttTimeline } from "@/remotion/primitives/gantt-timeline";

<GanttTimeline
  tasks={[
    { label: "Registry build", start: 1, end: 4, progress: 0.8 },
    { label: "Launch", start: 7.6, end: 7.6, milestone: true },
  ]}
  columns={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]}
  markerAt={5.5}
  markerLabel="Today"
/>`,
    props: [
      { name: "tasks", type: "GanttTask[]", default: "required", description: "`{ label, start, end, progress?, color?, milestone? }` in column units." },
      { name: "columns", type: "string[]", default: "required", description: "Column headings. Their count sets the span of the timeline." },
      { name: "width", type: "number", default: "900", description: "Overall width, label column included." },
      { name: "rowHeight", type: "number", default: "48", description: "Height of one task row. Type scales off it." },
      { name: "gap", type: "number", default: "12", description: "Space between rows." },
      { name: "labelWidth", type: "number", default: "240", description: "Width reserved for the task names." },
      { name: "markerAt", type: "number", default: "undefined", description: "Column position for a dashed vertical rule, e.g. today." },
      { name: "markerLabel", type: "string", default: "undefined", description: "Chip label on that rule." },
      { name: "durationInFrames", type: "number", default: "24", description: "Length of one bar's wipe." },
      { name: "staggerInFrames", type: "number", default: "8", description: "Frames between one row and the next." },
      { name: "exitAtInFrames", type: "number", default: "undefined", description: "Frame the rows start leaving on, top-down." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Positions are column units rather than pixels, so a task moves by editing one number and everything stays in register. Bars wipe out from their own start edge — never from the left margin — so the animation says when a task begins as well as how long it runs. The marker label sits on a filled chip because the rule can land through a column heading.",
    related: ["roadmap-lanes", "kanban-move", "changelog-entry"],
  },
  "word-pop-captions": {
    category: "primitive",
    usage: `import { WordPopCaptions } from "@/remotion/primitives/word-pop-captions";
import { groupCaptionsIntoPages } from "@/remotion/lib/caption-utils";

const [page] = groupCaptionsIntoPages(captions, 4000);

<WordPopCaptions page={page} strokeWidth={4} />`,
    props: [
      { name: "page", type: "TikTokPage", default: "required", description: "Token page from `groupCaptionsIntoPages`. One token is shown at a time." },
      { name: "color", type: "string", default: '"#fafafa"', description: "Word ink." },
      { name: "accentColor", type: "string", default: '"#e8b86d"', description: "Ink for every nth word." },
      { name: "accentEvery", type: "number", default: "3", description: "Accent cadence. 0 keeps one colour throughout." },
      { name: "fontSize", type: "number", default: "scaled 120", description: "Defaults to a width-scaled 120px." },
      { name: "uppercase", type: "boolean", default: "true", description: "Uppercase the word — the default look for this style." },
      { name: "popScale", type: "number", default: "1.16", description: "Peak scale on arrival before it settles to 1." },
      { name: "tiltInDegrees", type: "number", default: "2.5", description: "Arrival tilt. Alternates direction word to word." },
      { name: "popInFrames", type: "number", default: "6", description: "Frames the pop takes to settle." },
      { name: "strokeWidth", type: "number", default: "0", description: "Chunky outline behind the word, as used on social captions." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "No line context at all, which is what separates it from `caption-highlight` and `karaoke-captions`. Between tokens it renders nothing rather than holding the last word — a word left standing through a pause attributes the silence to whoever spoke it. The tilt alternates because one direction at speed reads as a stutter.",
    related: ["karaoke-captions", "caption-highlight", "srt-caption-track"],
  },
  "caption-emoji-beat": {
    category: "primitive",
    usage: `import { CaptionEmojiBeat } from "@/remotion/primitives/caption-emoji-beat";

<CaptionEmojiBeat
  text="Punctuate the beat, not the sentence"
  beats={[
    { emoji: "🔥", atInFrames: 10, x: 22, y: 26, rotate: -8 },
    { emoji: "🚀", atInFrames: 80, x: 50, y: 16, scale: 96 },
  ]}
/>`,
    props: [
      { name: "beats", type: "EmojiBeat[]", default: "required", description: "`{ emoji, atInFrames, x, y, scale?, rotate? }`. x/y are percentages of the frame." },
      { name: "text", type: "string", default: "undefined", description: "Caption line the emoji punctuate. Omit for emoji alone." },
      { name: "size", type: "number", default: "84", description: "Base emoji size in px, overridable per beat." },
      { name: "landInFrames", type: "number", default: "7", description: "Frames an emoji takes to land." },
      { name: "holdInFrames", type: "number", default: "26", description: "Frames it holds at full size before releasing." },
      { name: "overshoot", type: "number", default: "1.35", description: "Scale overshoot on the way in. 1 lands flat." },
      { name: "wobbleInDegrees", type: "number", default: "9", description: "Swing after landing. Decays to nothing." },
      { name: "textAtInFrames", type: "number", default: "0", description: "Frame the caption line arrives on." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Beats are scheduled on frames rather than detected from audio: the beats are known when the edit is cut, and a render-time detector drifts against the music it is meant to hit. The wobble is keyed to each stamp's own landing, so it decays to nothing and a held frame is still.",
    related: ["confetti-burst", "karaoke-captions", "beat-pulse-grid"],
  },
  "speaker-label-captions": {
    category: "primitive",
    usage: `import { SpeakerLabelCaptions } from "@/remotion/primitives/speaker-label-captions";
import { parseSubtitles } from "@/remotion/lib/caption-utils";

<SpeakerLabelCaptions
  cues={parseSubtitles(vttSource)}
  speakers={[
    { name: "Nadia", color: "#e8b86d", align: "left" },
    { name: "Sam", color: "#2dd4bf", align: "right" },
  ]}
/>`,
    props: [
      { name: "cues", type: "SubtitleCue[]", default: "required", description: "`{ text, startMs, endMs, speaker? }` — the shape `parseSubtitles` returns." },
      { name: "speakers", type: "SpeakerStyle[]", default: "[]", description: "`{ name, color?, align? }` per voice. Undeclared voices are assigned." },
      { name: "defaultSpeaker", type: "string", default: '"Speaker"', description: "Name for cues that carry none." },
      { name: "fontSize", type: "number", default: "42", description: "Caption size. Tag and padding scale off it." },
      { name: "cardColor", type: "string", default: "rgba(12,12,18,0.82)", description: "Plate behind a line." },
      { name: "maxWidth", type: "number", default: "0.7", description: "Card width as a share of the frame." },
      { name: "showPrevious", type: "boolean", default: "true", description: "Keep the previous speaker's card on screen, dimmed." },
      { name: "enterInFrames", type: "number", default: "10", description: "Frames a card takes to arrive." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Speaker identity is carried by tag, colour and side at once, because each fails alone: a tag is slow to read at caption speed, colour is invisible to many viewers, and alignment cannot separate three voices. Between cues the last card holds — blinking out in every pause is worse than waiting.",
    related: ["srt-caption-track", "transcript-scroll", "talking-head-layout"],
  },
  "transcript-scroll": {
    category: "primitive",
    usage: `import { TranscriptScroll } from "@/remotion/primitives/transcript-scroll";
import { parseSubtitles } from "@/remotion/lib/caption-utils";

<TranscriptScroll cues={parseSubtitles(vttSource)} width={740} height={400} />`,
    props: [
      { name: "cues", type: "SubtitleCue[]", default: "required", description: "`{ text, startMs, endMs, speaker? }`, in order." },
      { name: "width", type: "number", default: "720", description: "Block width. Wrapping is estimated at this measure." },
      { name: "height", type: "number", default: "420", description: "Visible height of the scrolling window." },
      { name: "fontSize", type: "number", default: "34", description: "Body size. Tags and spacing scale off it." },
      { name: "activeColor", type: "string", default: '"#fafafa"', description: "Ink of the line being spoken." },
      { name: "idleColor", type: "string", default: "rgba(250,250,250,0.3)", description: "Ink of lines not yet reached." },
      { name: "readColor", type: "string", default: "idleColor", description: "Ink of lines already read, when it should differ." },
      { name: "showSpeakers", type: "boolean", default: "true", description: "Name printed above a line when the speaker changes." },
      { name: "showMarker", type: "boolean", default: "true", description: "Accent rule down the left edge of the active line." },
      { name: "fadeEdges", type: "number", default: "90", description: "Mask height at the top and bottom, in px. 0 disables it." },
      { name: "settleInFrames", type: "number", default: "16", description: "Frames the scroll takes to settle on a new line." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "A document, not an overlay: surrounding lines stay on screen so a quote keeps its place in the conversation. Scroll position interpolates between the outgoing and incoming offsets rather than snapping to the active index, and every line's height is measured because a speaker tag would otherwise drift a fixed pitch out of register.",
    related: ["srt-caption-track", "speaker-label-captions", "karaoke-captions"],
  },
  "subtitle-translate": {
    category: "primitive",
    usage: `import { SubtitleTranslate } from "@/remotion/primitives/subtitle-translate";

<SubtitleTranslate
  cues={[
    {
      text: "The transcript is the edit.",
      translation: "La transcripción es el montaje.",
      startMs: 0,
      endMs: 1450,
    },
  ]}
  languageLabels={["EN", "ES"]}
/>`,
    props: [
      { name: "cues", type: "TranslatedCue[]", default: "required", description: "A `SubtitleCue` plus `translation`." },
      { name: "primary", type: '"source" | "translation"', default: '"source"', description: "Which language leads. Swaps without touching the data." },
      { name: "fontSize", type: "number", default: "46", description: "Size of the primary line." },
      { name: "secondaryScale", type: "number", default: "0.72", description: "Secondary size, as a share of `fontSize`." },
      { name: "languageLabels", type: "[string, string]", default: "undefined", description: "Fixed-width tags beside each line, e.g. `[\"EN\", \"ES\"]`." },
      { name: "backgroundColor", type: "string", default: "rgba(10,10,14,0.72)", description: "Plate behind both lines. `transparent` drops it." },
      { name: "maxWidth", type: "number", default: "0.78", description: "Block width as a share of the frame." },
      { name: "enterInFrames", type: "number", default: "10", description: "Frames a cue takes to arrive." },
      { name: "secondaryOffsetInFrames", type: "number", default: "4", description: "Frames the second line trails the first by." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "The two lines are deliberately unequal in weight and ink — styled the same, the block reads as one four-line caption and the viewer has to work out which half is theirs. The secondary trails by a few frames so the eye is given an order. Nothing renders between cues; the block is tall enough that holding it would cover the shot.",
    related: ["srt-caption-track", "speaker-label-captions", "caption-highlight"],
  },
  "waveform-bars-radial": {
    category: "primitive",
    usage: `import { WaveformBarsRadial } from "@/remotion/primitives/waveform-bars-radial";

<WaveformBarsRadial src={audioSrc} radius={112} barCount={80}>
  <CoverArt />
</WaveformBarsRadial>`,
    props: [
      { name: "src", type: "string", default: "required", description: "Audio source. `.wav` only — `useWindowedAudioData` accepts nothing else." },
      { name: "children", type: "ReactNode", default: "undefined", description: "Content in the middle of the ring: artwork, a logo, a title." },
      { name: "radius", type: "number", default: "150", description: "Radius of the circle the bars stand on." },
      { name: "barCount", type: "number", default: "72", description: "Bars around the ring." },
      { name: "barWidth", type: "number", default: "5", description: "Bar thickness in px." },
      { name: "minLength", type: "number", default: "10", description: "Bar length at silence." },
      { name: "maxLength", type: "number", default: "90", description: "Bar length at full level." },
      { name: "peakColor", type: "string", default: "undefined", description: "Second colour for bars above 75% level." },
      { name: "mirror", type: "boolean", default: "true", description: "Reflect the spectrum across the vertical axis." },
      { name: "spinPerSecond", type: "number", default: "6", description: "Degrees the ring turns per second. 0 holds it still." },
      { name: "bidirectional", type: "boolean", default: "false", description: "Bars grow inward as well as outward." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Mirroring is on by default because a ring running low-to-high all the way round puts every bit of energy on one side, so it wobbles rather than pulses; it also halves the bands needed. The slow spin matters: through a quiet passage a still ring is exactly what the preview audit reports as dead.",
    related: ["audiogram-bars", "audio-pulse", "waveform-line"],
  },
  "vu-meter": {
    category: "primitive",
    usage: `import { VuMeter } from "@/remotion/primitives/vu-meter";

<VuMeter src={audioSrc} orientation="vertical" labels={["L", "R"]} />`,
    props: [
      { name: "src", type: "string", default: "required", description: "Audio source. `.wav` only." },
      { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Which way the segments stack." },
      { name: "segments", type: "number", default: "18", description: "Segments in one channel." },
      { name: "channels", type: "1 | 2", default: "2", description: "Second channel is weighted toward the upper spectrum." },
      { name: "thickness", type: "number", default: "26", description: "Segment size across the short axis." },
      { name: "length", type: "number", default: "260", description: "Meter length along its own axis." },
      { name: "color", type: "string", default: '"#2dd4bf"', description: "Segments below the warm zone." },
      { name: "warnColor", type: "string", default: '"#e8b86d"', description: "Segments in the top third." },
      { name: "peakColor", type: "string", default: '"#f472b6"', description: "Segments in the top eighth." },
      { name: "showPeakHold", type: "boolean", default: "true", description: "Peak marker that falls back slowly." },
      { name: "peakFallPerFrame", type: "number", default: "0.018", description: "How fast the peak marker drops." },
      { name: "labels", type: "[string, string]", default: "undefined", description: "Channel captions, e.g. `[\"L\", \"R\"]`." },
      { name: "sensitivity", type: "number", default: "1", description: "Lifts or lowers the reading before it hits the segments." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Level rather than spectrum — the reading that still works at 40px wide. The peak marker is reconstructed from the library's decaying peaks on every frame instead of being held in state: a render is stateless and may start on any frame, so a ref-held marker would differ between a preview scrub and a full render.",
    related: ["audiogram-bars", "audio-pulse", "waveform-bars-radial"],
  },
  "voice-note-bubble": {
    category: "primitive",
    usage: `import { VoiceNoteBubble } from "@/remotion/primitives/voice-note-bubble";

<VoiceNoteBubble durationInFrames={120} sender="Sam" avatar="S" />`,
    props: [
      { name: "durationInFrames", type: "number", default: "required", description: "Length of the note. The playhead crosses the bar over exactly this." },
      { name: "waveform", type: "number[]", default: "generated", description: "Bar heights 0–1. Omitted, a deterministic envelope is built from `seed`." },
      { name: "barCount", type: "number", default: "42", description: "Bars drawn when the waveform is generated." },
      { name: "seed", type: "number", default: "1", description: "Changes the generated envelope and nothing else." },
      { name: "barHeight", type: "number", default: "44", description: "Tallest bar. Type and padding scale off it." },
      { name: "avatar", type: "string", default: "undefined", description: "Initial or emoji in the round badge." },
      { name: "sender", type: "string", default: "undefined", description: "Name above the waveform." },
      { name: "showTime", type: "boolean", default: "true", description: "Elapsed / total readout under the bar." },
      { name: "align", type: '"left" | "right"', default: '"left"', description: "Side of the frame the bubble sits on." },
      { name: "showPlayhead", type: "boolean", default: "true", description: "Dot riding the played/unplayed boundary." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the playhead starts moving." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "The waveform is static and only the colour moves through it, as every messaging app draws it — animating bar heights would be a live spectrum, which contradicts the fact that a voice note's shape is known before playback. Position comes from frames, not analysis, so the bubble can front a note that is only described.",
    related: ["audio-scrubber", "audiogram-bars", "chat-bubble"],
  },
  "beat-pulse-grid": {
    category: "primitive",
    usage: `import { BeatPulseGrid } from "@/remotion/primitives/beat-pulse-grid";

<BeatPulseGrid src={audioSrc} columns={14} rows={7} mapping="radial" />`,
    props: [
      { name: "src", type: "string", default: "required", description: "Audio source. `.wav` only." },
      { name: "columns", type: "number", default: "12", description: "Cells across." },
      { name: "rows", type: "number", default: "6", description: "Cells down." },
      { name: "cellSize", type: "number", default: "34", description: "Cell edge length in px." },
      { name: "mapping", type: '"column" | "radial" | "row"', default: '"radial"', description: "How the spectrum is laid over the geometry." },
      { name: "idleColor", type: "string", default: "rgba(250,250,250,0.07)", description: "Cell colour at rest." },
      { name: "color", type: "string", default: '"#e8b86d"', description: "Cell colour at level." },
      { name: "peakColor", type: "string", default: '"#f472b6"', description: "Colour of the loudest cells." },
      { name: "pulseScale", type: "number", default: "0.28", description: "Extra scale a cell takes at full level." },
      { name: "floor", type: "number", default: "0.06", description: "Level below which a cell stays dark. Cuts the noise floor." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Each cell is bound to a band rather than the overall level — a grid where every cell agrees is one flashing rectangle. Cells carry their band's decaying peak under the live level, the same trick as a peak-hold meter, because a one-frame transient is invisible at 30fps.",
    related: ["caption-emoji-beat", "audiogram-bars", "heatmap-grid"],
  },
  "audio-scrubber": {
    category: "primitive",
    usage: `import { AudioScrubber } from "@/remotion/primitives/audio-scrubber";

<AudioScrubber
  durationInFrames={120}
  marks={[{ atInFrames: 66, label: "Quote" }]}
/>`,
    props: [
      { name: "durationInFrames", type: "number", default: "required", description: "Clip length. The playhead crosses the track over exactly this." },
      { name: "waveform", type: "number[]", default: "generated", description: "Bar heights 0–1. Omitted, a deterministic envelope is built from `seed`." },
      { name: "barCount", type: "number", default: "96", description: "Bars drawn when the waveform is generated." },
      { name: "width", type: "number", default: "720", description: "Overall width, time labels included." },
      { name: "height", type: "number", default: "96", description: "Track height. Type scales off it." },
      { name: "playedColor", type: "string", default: '"#e8b86d"', description: "Bars already played." },
      { name: "unplayedColor", type: "string", default: "rgba(250,250,250,0.2)", description: "Bars not yet reached." },
      { name: "marks", type: "{ atInFrames, label? }[]", default: "undefined", description: "Chapter rules at frame positions." },
      { name: "mirrored", type: "boolean", default: "true", description: "Centre the bars the way an editor draws them." },
      { name: "showTime", type: "boolean", default: "true", description: "Elapsed and total readouts either side of the track." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames before the playhead starts moving." },
      { name: "frame", type: "number", default: "undefined", description: "Frame override — pass the parent frame inside a `<Sequence>`." },
    ],
    note: "Position comes from frames rather than audio analysis, so the playhead lands on the frame the edit says it should. The waveform is static and the colour boundary moves through it — animating the heights would make it a live spectrum, which is `audiogram-bars`. Marks sit under the playhead so it is never hidden behind one.",
    related: ["voice-note-bubble", "audiogram-bars", "waveform-line"],
  },
  "poll-overlay": {
    category: "scene",
    usage: `import { PollOverlay } from "@/remotion/scenes/poll-overlay";

<PollOverlay
  badge="Poll"
  question="Which should we build next?"
  options={[
    { label: "Timeline editor", votes: 412 },
    { label: "Batch renders", votes: 268 },
    { label: "Team presets", votes: 143 },
  ]}
  totalLabel="823 votes · closes in 2m"
  holdSeconds={4}
/>`,
    props: [
      { name: "question", type: "string", required: true, description: "The question the card asks." },
      { name: "options", type: "PollOption[]", required: true, description: "Each option's label and raw vote tally. Shares are computed from the tallies." },
      { name: "badge", type: "string", description: "Small tag above the question — POLL, AUDIENCE, EP 12." },
      { name: "align", type: '"left" | "right" | "center"', default: '"left"', description: "Edge the card sits against." },
      { name: "holdSeconds", type: "number", description: "Seconds the result holds before the card retreats. Omit to leave it up." },
      { name: "totalLabel", type: "string", description: "Total-vote line under the options. Omit to hide it." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Colour the leading option takes." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Transparent overlay scene designed to sit over footage. Unlike quiz-question there is no correct answer — the winner is whichever option the votes gave it.",
    related: ["quiz-question", "reaction-burst", "comparison-bars"],
  },
  "reaction-burst": {
    category: "scene",
    usage: `import { ReactionBurst } from "@/remotion/scenes/reaction-burst";

<ReactionBurst align="right" ratePerSecond={7} />`,
    props: [
      { name: "reactions", type: "string[]", default: '["❤️", "👍", "🔥", "😂", "✨"]', description: "Glyphs cycled through as reactions spawn." },
      { name: "ratePerSecond", type: "number", default: "6", description: "Reactions spawned per second." },
      { name: "align", type: '"left" | "right"', default: '"right"', description: "Edge the stream rises along." },
      { name: "lifeSeconds", type: "number", default: "2.6", description: "Seconds a single reaction takes to travel its arc." },
      { name: "drift", type: "number", default: "46", description: "Horizontal sway in units, peak to peak." },
      { name: "size", type: "number", default: "44", description: "Glyph size in units at full scale." },
      { name: "rise", type: "number", default: "0.72", description: "Fraction of the frame height a reaction climbs." },
      { name: "stopAfterSeconds", type: "number", description: "Seconds after which no new reactions spawn. Ones in flight finish their arc." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Deliberately narrower than confetti-burst, which is a single impulse fired on one beat — here the reactions keep coming for as long as the scene runs. Jitter is a pure function of the spawn index, so frames render identically in any order.",
    related: ["confetti-burst", "poll-overlay", "chat-bubble"],
  },
  "countdown-timer": {
    category: "scene",
    usage: `import { CountdownTimer } from "@/remotion/scenes/countdown-timer";

<CountdownTimer from={5} label="Starting in" zeroLabel="Live" />`,
    props: [
      { name: "from", type: "number", default: "5", description: "Seconds on the clock when the scene opens." },
      { name: "variant", type: '"ring" | "numeric"', default: '"ring"', description: "Ring sweep with the number inside, or the number alone." },
      { name: "label", type: "string", description: "Caption above the clock — STARTING IN, DOORS OPEN." },
      { name: "zeroLabel", type: "string", description: "Shown once the clock reaches zero. Omit to hold on 0." },
      { name: "startDelaySeconds", type: "number", default: "0.35", description: "Seconds before the clock starts running." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Ring colour above the urgent threshold." },
      { name: "urgentColor", type: "string", default: '"#F97362"', description: "Accent applied over the last urgentUnder seconds." },
      { name: "urgentUnder", type: "number", default: "3", description: "Seconds remaining at which the urgent accent takes over." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "The ring drains continuously while the digit swaps on each whole second, so the clock reads as running rather than as a number that happens to change. It stops at zero instead of ticking into negative time.",
    related: ["metric-ticker", "sports-scorebug", "end-card"],
  },
  "sports-scorebug": {
    category: "scene",
    usage: `import { SportsScorebug } from "@/remotion/scenes/sports-scorebug";

<SportsScorebug
  away={{ abbr: "NOR", score: 66, color: "#7DD3E8" }}
  home={{ abbr: "VAL", score: 71, color: "#E8B86D", possession: true }}
  period="Q4"
  clockSeconds={154}
  changes={[{ side: "away", atSeconds: 1.1, points: 3 }]}
/>`,
    props: [
      { name: "home", type: "ScorebugTeam", required: true, description: "Home side — abbreviation, score, colour, possession." },
      { name: "away", type: "ScorebugTeam", required: true, description: "Away side — abbreviation, score, colour, possession." },
      { name: "period", type: "string", default: '"Q3"', description: "Period furniture — Q3, 2ND HALF, SET 2." },
      { name: "clockSeconds", type: "number", default: "154", description: "Game clock at the top of the scene, in seconds. Counts down." },
      { name: "changes", type: "ScoreChange[]", default: "[]", description: "Scores landing mid-scene. Each flashes its side and bumps the total." },
      { name: "align", type: '"left" | "center" | "right"', default: '"center"', description: "Edge the bug sits against." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Period label and possession dot colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "holdSeconds", type: "number", description: "Seconds the bug holds before it retreats. Omit to leave it up." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Transparent overlay scene designed to sit over footage. Points landing mid-scene bump the total and flash that side rather than silently swapping the number.",
    related: ["countdown-timer", "lower-third", "news-ticker-bar"],
  },
  "news-ticker-bar": {
    category: "scene",
    usage: `import { NewsTickerBar } from "@/remotion/scenes/news-ticker-bar";

<NewsTickerBar
  flag="Breaking"
  headlines={["Registry crosses 165 components", "CLI adds batch install"]}
  strapline="Live from the newsroom"
  timestamp="21:04"
/>`,
    props: [
      { name: "headlines", type: "string[]", required: true, description: "Headlines cycled through the crawl, separated by a bullet." },
      { name: "flag", type: "string", default: '"Breaking"', description: "Standing flag on the left — BREAKING, MARKETS, LIVE." },
      { name: "strapline", type: "string", description: "Second line under the crawl. Omit for a single-line bar." },
      { name: "timestamp", type: "string", description: "Clock or dateline pinned to the right edge. Omit to hide it." },
      { name: "pixelsPerSecond", type: "number", default: "118", description: "Crawl speed in units per second." },
      { name: "accentColor", type: "string", default: '"#F97362"', description: "Flag fill and top rule colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "holdSeconds", type: "number", description: "Seconds the bar holds before it retreats. Omit to leave it up." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Transparent overlay scene designed to sit over footage. infinite-marquee is the generic looping-text primitive — this is the dressed news bar with the chrome a broadcast frame needs.",
    related: ["infinite-marquee", "lower-third", "sports-scorebug"],
  },
  "form-fill-sequence": {
    category: "scene",
    usage: `import { FormFillSequence } from "@/remotion/scenes/form-fill-sequence";

<FormFillSequence
  title="Create your workspace"
  fields={[
    { label: "Full name", value: "Ada Lovelace", placeholder: "Your name" },
    { label: "Work email", value: "ada@northstar.dev" },
  ]}
  submitLabel="Create workspace"
  successLabel="Workspace created"
  holdSeconds={4}
/>`,
    props: [
      { name: "fields", type: "FormField[]", default: "3 sample fields", description: "Label, typed value and placeholder for each field, filled in order." },
      { name: "title", type: "string", default: '"Create your workspace"', description: "Heading on the card. Omit to show the fields alone." },
      { name: "subtitle", type: "string", default: '"Takes about a minute."', description: "Supporting line under the heading." },
      { name: "submitLabel", type: "string", default: '"Create workspace"', description: "Button text while the form is still filling." },
      { name: "successLabel", type: "string", default: '"Workspace created"', description: "Button text once every field has validated." },
      { name: "charsPerSecond", type: "number", default: "34", description: "Typing rate. Each field's duration is its value length divided by this." },
      { name: "holdSeconds", type: "number", description: "Seconds the filled form holds before the card retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Focus ring and armed submit button." },
      { name: "validColor", type: "string", default: '"#7FD1A0"', description: "Tick and settled border. Kept off accentColor so focus and validation stay two states." },
      { name: "backgroundColor", type: "string", description: "Page behind the card. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Field beats are derived from each value's length, so the sequence lengthens with the content rather than running on fixed constants. The submit button stays disabled until the last field ticks. Typing is the subject here; when it is only setup for a result list, use search-results-populate.",
    related: ["search-results-populate", "drag-drop-flow", "tab-switch-panel"],
  },
  "notification-stack": {
    category: "scene",
    usage: `import { NotificationStack } from "@/remotion/scenes/notification-stack";

<NotificationStack
  align="top-right"
  toasts={[
    { title: "Render finished", body: "launch-teaser.mp4", tone: "success", meta: "now" },
    { title: "Storage at 86%", tone: "warn", meta: "2m" },
  ]}
  lifeSeconds={2.3}
/>`,
    props: [
      { name: "toasts", type: "Toast[]", default: "4 sample toasts", description: "Title, optional body and meta, tone, and optional per-toast arrival and dwell." },
      { name: "align", type: '"top-right" | "top-left" | "bottom-right" | "bottom-left"', default: '"top-right"', description: "Corner the stack anchors to. Bottom anchors grow upward." },
      { name: "startAtSeconds", type: "number", default: "0.3", description: "Second the first toast arrives." },
      { name: "staggerSeconds", type: "number", default: "0.62", description: "Seconds between arrivals, for toasts without their own atSeconds." },
      { name: "lifeSeconds", type: "number", default: "2.3", description: "Default seconds a toast stays up before dismissing itself." },
      { name: "showProgress", type: "boolean", default: "true", description: "Draining line along each toast's bottom edge." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Colour used by the warn tone." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Transparent overlay scene designed to sit over an app or capture. Each toast carries its own life, so there is no holdSeconds — the stack fills and drains on its own. Slot offsets are the sum of the live heights above, which is what makes the rows below travel up into a dismissal instead of jumping.",
    related: ["comment-callout", "callout-spotlight", "chat-bubble"],
  },
  "tab-switch-panel": {
    category: "scene",
    usage: `import { TabSwitchPanel } from "@/remotion/scenes/tab-switch-panel";

<TabSwitchPanel
  windowTitle="Northstar Studio"
  tabs={[
    { label: "Overview", title: "1,284 renders", rows: [{ label: "Queued", value: "12" }] },
    { label: "Billing", title: "Studio plan", rows: [{ label: "Seats", value: "9 of 12" }] },
  ]}
  switchEverySeconds={0.9}
  holdSeconds={4}
/>`,
    props: [
      { name: "tabs", type: "PanelTab[]", default: "4 sample tabs", description: "Tab label plus the panel's title, summary and label/value rows." },
      { name: "windowTitle", type: "string", default: '"Northstar Studio"', description: "Title bar text. Omit to drop the chrome header." },
      { name: "startIndex", type: "number", default: "0", description: "Tab shown when the scene opens." },
      { name: "firstSwitchAtSeconds", type: "number", default: "0.95", description: "Second the first switch fires." },
      { name: "switchEverySeconds", type: "number", default: "0.9", description: "Seconds between switches after the first." },
      { name: "transitionSeconds", type: "number", default: "0.5", description: "How long one tab-to-tab move takes." },
      { name: "holdSeconds", type: "number", description: "Seconds the last panel holds before the window retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Indicator pill and active label." },
      { name: "backgroundColor", type: "string", description: "Page behind the window. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Tabs share the bar width evenly so the pill's travel is arithmetic rather than measured text — it can never drift out of register with its label. The scene walks forward to the last tab and stops; it does not wrap, so holdSeconds must clear firstSwitchAtSeconds + switchEverySeconds × (tabs.length - 1) + transitionSeconds.",
    related: ["device-mockup-zoom", "chat-to-preview", "faq-accordion"],
  },
  "search-results-populate": {
    category: "scene",
    usage: `import { SearchResultsPopulate } from "@/remotion/scenes/search-results-populate";

<SearchResultsPopulate
  query="transition between scenes"
  results={[
    { title: "Slide transition", detail: "docs/transitions/slide", score: 0.64 },
    { title: "Cross-fade two compositions", detail: "docs/transitions/fade", score: 0.98 },
  ]}
  holdSeconds={4}
/>`,
    props: [
      { name: "query", type: "string", default: '"transition between scenes"', description: "Text typed into the field." },
      { name: "results", type: "SearchResult[]", default: "5 sample results", description: "Title, detail line and 0–1 score. Array order is arrival order; score decides the final rank." },
      { name: "placeholder", type: "string", default: '"Search the docs"', description: "Greyed prompt shown before the first character lands." },
      { name: "countLabel", type: "string", default: '"{n} results"', description: "Line above the list. {n} is replaced with the result count." },
      { name: "topLabel", type: "string", default: '"Best match"', description: "Tag pinned to the top-ranked result once the list settles." },
      { name: "charsPerSecond", type: "number", default: "30", description: "Typing rate for the query." },
      { name: "searchSeconds", type: "number", default: "0.34", description: "Seconds the indeterminate bar runs between the query and the first row." },
      { name: "holdSeconds", type: "number", description: "Seconds the ranked list holds before the card retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Active field border, top-result tag and score." },
      { name: "backgroundColor", type: "string", description: "Page behind the card. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "The re-rank is the payoff: give the highest score to something other than the first entry and a late arrival climbs past the rows above it. Rows interpolate from arrival slot to ranked slot rather than being re-sorted, so React never remounts one mid-flight.",
    related: ["form-fill-sequence", "comparison-table", "file-tree-reveal"],
  },
  "file-tree-reveal": {
    category: "scene",
    usage: `import { FileTreeReveal } from "@/remotion/scenes/file-tree-reveal";

<FileTreeReveal
  title="northstar-studio"
  nodes={[
    { name: "src", children: [{ name: "index.ts" }] },
    { name: "package.json" },
  ]}
  selectedPath="src/index.ts"
  holdSeconds={4}
/>`,
    props: [
      { name: "nodes", type: "FileNode[]", default: "sample project tree", description: "Recursive tree. A node with a children array is a folder; without one it is a file." },
      { name: "title", type: "string", default: '"northstar-studio"', description: "Title bar over the tree. Omit to drop the header." },
      { name: "selectedPath", type: "string", default: '"src/scenes/lower-third.tsx"', description: "Slash-joined path of the file that lights up at the end. Omit to select nothing." },
      { name: "rowStagger", type: "number", default: "0.18", description: "Seconds between one row appearing and the next." },
      { name: "holdSeconds", type: "number", description: "Seconds the finished tree holds before the panel retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Selected row's bar, tint and label." },
      { name: "backgroundColor", type: "string", description: "Page behind the panel. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Rows reveal in depth-first display order, so a folder is always on screen before its contents, and each row takes its own height as it arrives — the rows beneath are pushed down rather than cross-faded onto a fixed grid. File names take their colour from the extension using the code token palette. Shows structure; code-reveal and code-diff-wipe show the contents of a file.",
    related: ["code-reveal", "code-diff-wipe", "terminal-simulator"],
  },
  "kanban-move": {
    category: "scene",
    usage: `import { KanbanMove } from "@/remotion/scenes/kanban-move";

<KanbanMove
  columns={["Backlog", "In progress", "Shipped"]}
  cards={[
    { title: "Caption presets", meta: "RUI-218 · Ana", column: 0 },
    {
      title: "Render queue retries",
      meta: "RUI-204 · Piotr",
      column: 0,
      moveTo: 1,
      moveAtSeconds: 0.95,
    },
    { title: "Theme tokens", meta: "RUI-177 · Kit", column: 1 },
  ]}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "columns", type: "string[]", default: '["Backlog", "In progress", "Shipped"]', description: "Column headings, left to right. Cards address columns by index." },
      { name: "cards", type: "KanbanCard[]", default: "6 sample cards", description: "Title, meta line, starting column, rail tint, and the one move the card makes." },
      { name: "moveSeconds", type: "number", default: "0.62", description: "How long a card takes to arc from column to column." },
      { name: "dealStaggerSeconds", type: "number", default: "0.08", description: "Seconds between each card's arrival during the opening deal." },
      { name: "holdSeconds", type: "number", description: "Seconds the settled board holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Destination column glow, and the fallback card rail." },
      { name: "backgroundColor", type: "string", description: "Page behind the board. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Give a card `moveTo` and `moveAtSeconds` to send it across; leave both off for cards that hold. Slots are arithmetic — a card lands at the bottom of its destination as that column stands at the moment it arrives, and the cards it left behind close the gap over exactly the frames it is travelling. For a single file dropping into one target, use drag-drop-flow.",
    related: ["drag-drop-flow", "tab-switch-panel", "notification-stack"],
  },
  "commit-graph": {
    category: "scene",
    usage: `import { CommitGraph } from "@/remotion/scenes/commit-graph";

<CommitGraph
  commits={[
    { message: "Seed the registry manifest", hash: "9c41f0a" },
    { message: "Add render queue worker", hash: "3ab77e2" },
    { message: "Branch: retry backoff", hash: "d0e91c4", lane: 1, parent: 1 },
    { message: "Cap retries at five", hash: "51b2fa8", lane: 1 },
    { message: "Ship caption presets", hash: "7f30dd1", lane: 0, parent: 1 },
    { message: "Merge retry backoff", hash: "b8c4e05", parent: 4, mergeFrom: 3, ref: "main" },
  ]}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "commits", type: "GraphCommit[]", default: "6 sample commits", description: "Message, hash, lane, parent index, optional mergeFrom lane and branch ref chip." },
      { name: "windowTitle", type: "string", default: '"git log --graph --oneline"', description: "Text in the title bar. Omit to drop the chrome header." },
      { name: "startAtSeconds", type: "number", default: "0.34", description: "Second the first commit lands." },
      { name: "stepSeconds", type: "number", default: "0.36", description: "Seconds between commits. Each edge draws over this same gap." },
      { name: "holdSeconds", type: "number", description: "Seconds the finished graph holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Trunk colour, and the branch ref chip." },
      { name: "laneColors", type: "string[]", default: "4 lane colours", description: "Colours for branch lanes 1 and up. Lane 0 always takes accentColor." },
      { name: "backgroundColor", type: "string", description: "Page behind the window. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "`parent` defaults to the previous commit, so a straight run needs nothing; point it further back to fork and set `mergeFrom` to bring the fork home. Edges use pathLength={1}, so a long merge curve and a short vertical hop draw at the same apparent speed, and a commit dot only pops once the line feeding it has arrived.",
    related: ["code-diff-wipe", "file-tree-reveal", "terminal-simulator"],
  },
  "comparison-table": {
    category: "scene",
    usage: `import { ComparisonTable } from "@/remotion/scenes/comparison-table";

<ComparisonTable
  title="What you get"
  columns={["Free", "Studio", "Scale"]}
  rows={[
    { label: "Render minutes", cells: ["60", "2,000", "Unlimited"] },
    { label: "4K exports", cells: [false, true, true] },
    { label: "Priority queue", cells: [false, false, true] },
  ]}
  highlightColumn={1}
  highlightLabel="Most picked"
  holdSeconds={3.4}
/>`,
    props: [
      { name: "columns", type: "string[]", default: '["Free", "Studio", "Scale"]', description: "Column headings. The feature-label column is unnamed and sits ahead of these." },
      { name: "rows", type: "MatrixRow[]", default: "6 sample rows", description: "A label plus one cell per column: true ticks, false crosses, a string prints as-is." },
      { name: "title", type: "string", default: '"What you get"', description: "Heading above the table. Omit to drop it." },
      { name: "highlightColumn", type: "number", default: "1", description: "Column kept lit throughout. Pass -1 for a table with no favourite." },
      { name: "highlightLabel", type: "string", default: '"Most picked"', description: "Chip pinned beside the title, above the highlighted column." },
      { name: "startAtSeconds", type: "number", default: "0.5", description: "Second the first row wipes in." },
      { name: "rowStaggerSeconds", type: "number", default: "0.26", description: "Seconds between rows. Cells inside a row trail their label by another 0.07s each." },
      { name: "holdSeconds", type: "number", description: "Seconds the finished table holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Highlight band, its header, and the ticks inside it." },
      { name: "backgroundColor", type: "string", description: "Page behind the card. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Ticks and crosses draw their own strokes rather than fading — a fading glyph spends most of its entrance as grey mush at matrix sizes. The highlighted column is one lit band behind the grid, so rows can never disagree about where its edges are. For a single ticked list rather than a matrix, use feature-list.",
    related: ["feature-list", "pricing-card", "pricing-focus"],
  },
  "pricing-card": {
    category: "scene",
    usage: `import { PricingCard } from "@/remotion/scenes/pricing-card";

<PricingCard
  tier="Studio"
  badge="Most picked"
  price={32}
  period="/mo"
  note="Billed annually. Cancel whenever."
  features={["2,000 render minutes a month", "4K exports, no watermark", "9 team seats"]}
  ctaLabel="Start rendering"
  holdSeconds={3.4}
/>`,
    props: [
      { name: "tier", type: "string", default: '"Studio"', description: "Tier name across the top of the card." },
      { name: "price", type: "number", default: "32", description: "The number the price rolls up to." },
      { name: "currency", type: "string", default: '"$"', description: "Symbol set ahead of the number." },
      { name: "period", type: "string", default: '"/mo"', description: "Cadence after the price — \"/mo\", \"per seat\", anything short." },
      { name: "badge", type: "string", default: '"Most picked"', description: "Chip beside the tier name. Omit to drop it." },
      { name: "note", type: "string", default: '"Billed annually. Cancel whenever."', description: "Line under the price." },
      { name: "wasPrice", type: "number", description: "Old price, struck through beside the new one. Omit when there is no before-and-after." },
      { name: "features", type: "string[]", default: "5 sample features", description: "Ticked lines under the price, revealed in order." },
      { name: "ctaLabel", type: "string", default: '"Start rendering"', description: "Button text. Omit to drop the button." },
      { name: "priceAtSeconds", type: "number", default: "0.42", description: "Second the price starts rolling." },
      { name: "rollSeconds", type: "number", default: "0.9", description: "How long the roll takes." },
      { name: "featuresAtSeconds", type: "number", default: "1.05", description: "Second the first feature ticks in." },
      { name: "featureStaggerSeconds", type: "number", default: "0.22", description: "Seconds between features. The CTA lands 0.16s after the last one." },
      { name: "holdSeconds", type: "number", description: "Seconds the finished card holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Badge, ticks, card border wash and the CTA fill." },
      { name: "backgroundColor", type: "string", description: "Page behind the card. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "The price is a counted number under a blur that clears as it settles, not a spinning digit strip — a strip has to guess glyph widths, a counted number stays in register with tabular-nums at any size. The CTA is scheduled off the last feature, so adding features pushes the button later rather than colliding with it. This is one card at block grain; for a full tier comparison beat, use pricing-focus.",
    related: ["pricing-focus", "comparison-table", "feature-list"],
  },
  "faq-accordion": {
    category: "scene",
    usage: `import { FaqAccordion } from "@/remotion/scenes/faq-accordion";

<FaqAccordion
  title="Questions people ask"
  items={[
    { question: "Do I own the components?", answer: "Yes. The CLI copies the source into your repo." },
    { question: "Can I render on my own machine?", answer: "Renders run wherever Remotion runs." },
  ]}
  openOrder={[0, 1]}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "items", type: "FaqItem[]", default: "4 sample questions", description: "Question and answer for each row." },
      { name: "title", type: "string", default: '"Questions people ask"', description: "Heading above the list. Omit to drop it." },
      { name: "openOrder", type: "number[]", default: "[0, 1, 2]", description: "Row indices opened in turn; each closes the previous. Shorter than items leaves the tail closed." },
      { name: "startAtSeconds", type: "number", default: "0.55", description: "Second the first row opens." },
      { name: "openEverySeconds", type: "number", default: "1", description: "Seconds between one row opening and the next." },
      { name: "transitionSeconds", type: "number", default: "0.55", description: "How long a row takes to open or close. Opens and closes overlap, so the list never jumps height." },
      { name: "holdSeconds", type: "number", description: "Seconds the list holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Open row's chevron and its background wash." },
      { name: "backgroundColor", type: "string", description: "Page behind the list. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Panel heights are estimated from the answer's length against the measured content width, because a headless render has no layout to interrogate mid-animation — a height read from scrollHeight collapses to zero on exactly the frames that matter. Keep answers to two or three lines; long copy inflates the estimate's rounding slack. For code panels use code-accordion, for an ordered process use timeline-steps.",
    related: ["code-accordion", "timeline-steps", "feature-list"],
  },
  "team-grid": {
    category: "scene",
    usage: `import { TeamGrid } from "@/remotion/scenes/team-grid";

<TeamGrid
  title="The people behind it"
  subtitle="Eight of us, four timezones."
  members={[
    { name: "Ada Okonjo", role: "Founder" },
    { name: "Piotr Nowak", role: "Rendering" },
    { name: "Dai Nakamura", role: "Design systems" },
  ]}
  columns={4}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "members", type: "TeamMember[]", default: "8 sample people", description: "Name, role, optional avatar tint and hand-written initials." },
      { name: "title", type: "string", default: '"The people behind it"', description: "Heading above the grid. Omit to drop it." },
      { name: "subtitle", type: "string", default: '"Eight of us, four timezones."', description: "Line under the heading." },
      { name: "columns", type: "number", default: "4", description: "Members per row. Four keeps names on one line at 1080p." },
      { name: "startAtSeconds", type: "number", default: "0.4", description: "Second the first avatar arrives." },
      { name: "staggerSeconds", type: "number", default: "0.2", description: "Seconds between members, in reading order." },
      { name: "holdSeconds", type: "number", description: "Seconds the settled grid holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Role line on the first member — the one you want read first." },
      { name: "avatarColors", type: "string[]", default: "6 tints", description: "Cycled by index for members with no colour of their own." },
      { name: "backgroundColor", type: "string", description: "Page behind the grid. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Initials are the first letters of the first two words — right for most Latin names and wrong for enough others that `initials` is worth passing by hand. The avatar springs up ahead of its name and role so each tile lands as one object with depth rather than three elements agreeing to fade.",
    related: ["org-chart-build", "logo-wall", "feature-list"],
  },
  "logo-wall": {
    category: "scene",
    usage: `import { LogoWall } from "@/remotion/scenes/logo-wall";

<LogoWall
  eyebrow="Trusted by"
  title="Teams shipping with RemotionUI"
  logos={[
    { name: "Northstar", color: "#E8B86D" },
    { name: "Halcyon", color: "#7DD3E8" },
    { name: "Fernweh", color: "#9BD4A0" },
    { name: "Orbital", color: "#C99BE8" },
  ]}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "logos", type: "WallLogo[]", default: "8 sample brands", description: "Wordmark, brand colour, and the glyph in the mark beside it." },
      { name: "eyebrow", type: "string", default: '"Trusted by"', description: "Small line above the heading. Omit to drop it." },
      { name: "title", type: "string", default: '"Teams shipping with RemotionUI"', description: "Heading above the wall. Omit to drop it." },
      { name: "columns", type: "number", default: "4", description: "Tiles per row." },
      { name: "startAtSeconds", type: "number", default: "0.32", description: "Second the first tile arrives." },
      { name: "arriveStaggerSeconds", type: "number", default: "0.06", description: "Seconds between tiles arriving, in reading order. Deliberately fast." },
      { name: "staggerSeconds", type: "number", default: "0.24", description: "Seconds between diagonals of the colour sweep." },
      { name: "warmSeconds", type: "number", default: "0.6", description: "How long one tile takes to go from grey to brand colour." },
      { name: "holdSeconds", type: "number", description: "Seconds the finished wall holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Eyebrow, and the fallback for logos with no colour." },
      { name: "backgroundColor", type: "string", description: "Page behind the wall. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Arrival and colour are separate beats on purpose: tiles land fast so the wall is whole within a second, then the colour sweeps the diagonal across it. Grey is one saturate() on the tile rather than a second set of grey colours, so swapping in your own brand colours brings the monochrome stage with it. Wordmarks are text — no image assets to bundle or fail to load in a headless render.",
    related: ["team-grid", "feature-list", "comparison-table"],
  },
  "changelog-entry": {
    category: "scene",
    usage: `import { ChangelogEntry } from "@/remotion/scenes/changelog-entry";

<ChangelogEntry
  version="v2.4.0"
  date="16 August"
  summary="Captions, webhooks, and a queue that stops sulking."
  changes={[
    { kind: "added", text: "Caption presets for nine languages" },
    { kind: "fixed", text: "Retry backoff no longer stalls the queue" },
    { kind: "removed", text: "Legacy waveform atom" },
  ]}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "changes", type: "ChangeRow[]", default: "5 sample changes", description: "A kind — added, fixed, changed or removed — and the sentence beside it." },
      { name: "version", type: "string", default: '"v2.4.0"', description: "Version string, set at display size." },
      { name: "date", type: "string", default: '"16 August"', description: "Date beside the version." },
      { name: "summary", type: "string", default: '"Captions, webhooks, and a queue that stops sulking."', description: "Headline under the version. Omit for releases without one." },
      { name: "kindColors", type: "Partial<Record<ChangeKind, string>>", default: "green / blue / amber / red", description: "Override any tag colour without supplying the rest." },
      { name: "startAtSeconds", type: "number", default: "0.66", description: "Second the first change row arrives." },
      { name: "staggerSeconds", type: "number", default: "0.28", description: "Seconds between rows. Each sentence trails its own tag by 0.08s." },
      { name: "holdSeconds", type: "number", description: "Seconds the finished entry holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Fallback tag colour for kinds with no colour set." },
      { name: "backgroundColor", type: "string", description: "Page behind the card. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Tags are fixed width so every sentence shares a left edge — ragged text beside ragged tags is what makes a changelog look unmaintained. The tag lands before its sentence because the kind of change is what a viewer scans for. Five or six rows is the ceiling before the card outgrows a 1080p frame; split a larger release into two entries.",
    related: ["commit-graph", "feature-list", "roadmap-lanes"],
  },
  "roadmap-lanes": {
    category: "scene",
    usage: `import { RoadmapLanes } from "@/remotion/scenes/roadmap-lanes";

<RoadmapLanes
  title="What we are building"
  lanes={[
    { title: "Shipped", color: "#9BD4A0", done: true, items: [{ label: "Render API" }] },
    {
      title: "Building",
      color: "#E8B86D",
      showProgress: true,
      items: [{ label: "Timeline scrubber", progress: 0.72 }],
    },
    { title: "Planned", color: "#7A828F", dashed: true, items: [{ label: "Stem export" }] },
  ]}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "lanes", type: "RoadmapLane[]", default: "Shipped / Building / Planned", description: "Title, colour, items, and the flags that set the lane's state: done, showProgress, dashed." },
      { name: "title", type: "string", default: '"What we are building"', description: "Heading above the lanes. Omit to drop it." },
      { name: "startAtSeconds", type: "number", default: "0.42", description: "Second the first lane's items arrive." },
      { name: "laneStaggerSeconds", type: "number", default: "0.42", description: "Seconds between lanes." },
      { name: "itemStaggerSeconds", type: "number", default: "0.14", description: "Seconds between items inside a lane." },
      { name: "fillSeconds", type: "number", default: "0.8", description: "How long a progress bar takes to reach its value, starting 0.3s after the pill lands." },
      { name: "holdSeconds", type: "number", description: "Seconds the settled roadmap holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Fallback colour for lanes with none of their own." },
      { name: "backgroundColor", type: "string", description: "Page behind the lanes. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Lane appearance comes from flags, not from lane names — a blocked lane is `dashed` with a red colour, a next-up lane is `showProgress` with low values. The fill starts after the pill lands and takes longer than the arrival, so progress is a second beat rather than a blur inside the first. Three items per lane is the comfortable maximum at 1080p; item width divides the board rather than wrapping.",
    related: ["kanban-move", "timeline-steps", "changelog-entry"],
  },
  "org-chart-build": {
    category: "scene",
    usage: `import { OrgChartBuild } from "@/remotion/scenes/org-chart-build";

<OrgChartBuild
  title="How the team is wired"
  nodes={[
    { name: "Ada Okonjo", role: "Founder" },
    { name: "Piotr Nowak", role: "Engineering", parent: 0 },
    { name: "Dai Nakamura", role: "Design", parent: 0 },
    { name: "Sam Rhodes", role: "Infrastructure", parent: 1 },
  ]}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "nodes", type: "OrgNode[]", default: "a 7-person tree", description: "Name, role and a `parent` index. Omit parent for the root; parents must appear before their children." },
      { name: "title", type: "string", default: '"How the team is wired"', description: "Heading above the chart. Omit to drop it." },
      { name: "startAtSeconds", type: "number", default: "0.34", description: "Second the root lands." },
      { name: "levelStaggerSeconds", type: "number", default: "0.62", description: "Seconds between levels. Connectors lead their child by 0.34s inside that gap." },
      { name: "siblingStaggerSeconds", type: "number", default: "0.12", description: "Seconds between siblings, ordered left to right by position." },
      { name: "holdSeconds", type: "number", description: "Seconds the finished chart holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Role line on the root." },
      { name: "levelColors", type: "string[]", default: "3 depth colours", description: "One colour per depth. Deeper levels reuse the last entry." },
      { name: "backgroundColor", type: "string", description: "Page behind the chart. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Positions come from a leaf walk rather than a grid: leaves spread evenly and each parent centres over the span of its own children, so a lopsided tree stays balanced. Connectors are elbows, not diagonals — a straight line between two boxes reads as a different kind of relationship entirely. Three levels fits 1080p comfortably; a fourth wants a taller frame rather than a smaller node.",
    related: ["team-grid", "commit-graph", "roadmap-lanes"],
  },
  "quiz-question": {
    category: "scene",
    usage: `import { QuizQuestion } from "@/remotion/scenes/quiz-question";

<QuizQuestion
  question="What does the RemotionUI CLI actually do?"
  options={[
    "It bundles a runtime you ship",
    "It copies the source into your repo",
    "It renders on our servers",
  ]}
  correctIndex={1}
  pickedIndex={2}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "question", type: "string", default: '"What does the RemotionUI CLI actually do?"', description: "The question, set at display size." },
      { name: "options", type: "string[]", default: "4 sample answers", description: "Answer options in display order. Four is the readable maximum at 1080p." },
      { name: "correctIndex", type: "number", default: "1", description: "Index of the right answer." },
      { name: "pickedIndex", type: "number", default: "2", description: "Index picked before the reveal. Set it to correctIndex for a right pick, -1 for none." },
      { name: "eyebrow", type: "string", default: '"Question 3 of 8"', description: "Small line above the question. Omit to drop it." },
      { name: "optionsAtSeconds", type: "number", default: "0.55", description: "Second the first option arrives." },
      { name: "staggerSeconds", type: "number", default: "0.2", description: "Seconds between options." },
      { name: "pickAtSeconds", type: "number", default: "1.75", description: "Second the pick lands." },
      { name: "revealAtSeconds", type: "number", default: "2.35", description: "Second the right answer is revealed." },
      { name: "holdSeconds", type: "number", description: "Seconds the resolved question holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Eyebrow, and the picked-but-not-yet-resolved state." },
      { name: "correctColor", type: "string", default: '"#7FD1A0"', description: "The right answer on reveal." },
      { name: "wrongColor", type: "string", default: '"#E89B9B"', description: "A wrong pick on reveal." },
      { name: "backgroundColor", type: "string", description: "Page behind the card. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "The pick and the reveal are deliberately separate beats — the eye has to settle on a choice before it can register being told it was wrong. On the reveal everything neither picked nor correct steps back rather than changing colour, so the resolution reads as focus narrowing. For audience voting with no right answer, use poll-overlay.",
    related: ["poll-overlay", "comparison-table", "reaction-burst"],
  },
  "weather-card": {
    category: "scene",
    usage: `import { WeatherCard } from "@/remotion/scenes/weather-card";

<WeatherCard
  place="Lisbon"
  temperature={24}
  condition="sun"
  conditionLabel="Clear, light breeze"
  forecast={[
    { label: "Sat", condition: "sun", high: 24, low: 14 },
    { label: "Sun", condition: "cloud", high: 22, low: 13 },
    { label: "Mon", condition: "rain", high: 18, low: 12 },
  ]}
/>`,
    props: [
      { name: "place", type: "string", default: '"Lisbon"', description: "Place name across the top." },
      { name: "detail", type: "string", default: '"Saturday · 14:20"', description: "Line under the place — a time, a date, a feels-like." },
      { name: "temperature", type: "number", default: "24", description: "The temperature the card counts up to." },
      { name: "unit", type: "string", default: '"°"', description: "Degree suffix, used on the headline and the forecast." },
      { name: "condition", type: '"sun" | "cloud" | "rain" | "snow"', default: '"sun"', description: "Which glyph runs beside the headline." },
      { name: "conditionLabel", type: "string", default: '"Clear, light breeze"', description: "Words under the temperature." },
      { name: "forecast", type: "ForecastDay[]", default: "5 sample days", description: "Label, condition, high and low per column." },
      { name: "temperatureAtSeconds", type: "number", default: "0.4", description: "Second the temperature starts counting." },
      { name: "countSeconds", type: "number", default: "1", description: "How long the count takes." },
      { name: "forecastAtSeconds", type: "number", default: "1.15", description: "Second the first forecast day arrives." },
      { name: "staggerSeconds", type: "number", default: "0.2", description: "Seconds between forecast days." },
      { name: "holdSeconds", type: "number", description: "Seconds the card holds before it retreats. Omit to leave it up — the iconography keeps moving either way." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "The degree symbol. Kept off the condition colour on purpose." },
      { name: "backgroundColor", type: "string", description: "Page behind the card. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "Every moving part is a pure function of the frame — frame × rate wrapped into its own period, with per-particle offsets from the particle's index — so a frame rendered out of order on a render farm is identical to the same frame rendered in sequence. Each forecast column runs its own clock nine frames apart, so the row is never five glyphs in lockstep. The card needs no exit to stay alive in a loop.",
    related: ["stat-card", "gauge-dial", "calendar-month-fill"],
  },
  "calendar-month-fill": {
    category: "scene",
    usage: `import { CalendarMonthFill } from "@/remotion/scenes/calendar-month-fill";

<CalendarMonthFill
  month="August"
  year="2026"
  daysInMonth={31}
  startWeekday={5}
  todayDay={15}
  events={[
    { day: 4, label: "Kickoff", color: "#7DD3E8" },
    { day: 15, label: "Render day", color: "#9BD4A0" },
  ]}
  holdSeconds={3.4}
/>`,
    props: [
      { name: "month", type: "string", default: '"August"', description: "Month name in the header." },
      { name: "year", type: "string", default: '"2026"', description: "Year beside the month." },
      { name: "daysInMonth", type: "number", default: "31", description: "How many day cells the month has." },
      { name: "startWeekday", type: "number", default: "5", description: "Column the 1st falls in, counting from Monday as 0." },
      { name: "todayDay", type: "number", default: "15", description: "Day given the accent ring. Pass -1 when the month is a plan." },
      { name: "events", type: "CalendarEvent[]", default: "7 sample events", description: "Day number, label and chip colour. One chip per day." },
      { name: "weekdayLabels", type: "string[]", default: "Mon–Sun", description: "Column headings; their count sets the grid width." },
      { name: "gridAtSeconds", type: "number", default: "0.3", description: "Second the empty grid starts sweeping up." },
      { name: "eventsAtSeconds", type: "number", default: "0.95", description: "Second the first event drops." },
      { name: "staggerSeconds", type: "number", default: "0.2", description: "Seconds between events." },
      { name: "holdSeconds", type: "number", description: "Seconds the filled month holds before it retreats. Omit to leave it up." },
      { name: "accentColor", type: "string", default: '"#E8B86D"', description: "Today's ring, and the fallback chip colour." },
      { name: "backgroundColor", type: "string", description: "Page behind the card. Defaults to the theme page colour." },
      { name: "theme", type: '"dark" | "light"', default: '"dark"', description: "Surface palette." },
      { name: "speed", type: "number", default: "1", description: "Animation speed multiplier." },
    ],
    note: "The month comes from daysInMonth and startWeekday rather than from a date — a scene needs a month that looks right, not one correct for a particular year, and this keeps the component free of a date library and a timezone bug. Chips drop onto their day rather than fading in place, so a filling month reads as things being scheduled. One chip per day is the ceiling at 1080p.",
    related: ["gantt-timeline", "roadmap-lanes", "weather-card"],
  },
  "arrow-annotate": {
    category: "primitive",
    usage: `import { ArrowAnnotate } from "@/remotion/primitives/arrow-annotate";

<ArrowAnnotate
  from={{ x: 0.08, y: 0.16 }}
  to={{ x: 0.82, y: 0.74 }}
  bow={0.28}
  label="this one"
  durationInFrames={70}
  exitAtInFrames={92}
/>`,
    props: [
      { name: "from", type: "{ x: number; y: number }", default: "{ x: 0.08, y: 0.16 }", description: "Start of the shaft, as a fraction of the box." },
      { name: "to", type: "{ x: number; y: number }", default: "{ x: 0.82, y: 0.74 }", description: "The point the head lands on, as a fraction of the box." },
      { name: "bow", type: "number", default: "0.28", description: "How far the shaft bows off the straight line, as a fraction of the distance. Negative bows the other way." },
      { name: "label", type: "string", description: "Text set beside the start of the shaft." },
      { name: "width", type: "number", default: "320", description: "Box width in pixels." },
      { name: "height", type: "number", default: "220", description: "Box height in pixels." },
      { name: "stroke", type: "string", default: '"#E8B86D"', description: "Colour of the shaft, head and label." },
      { name: "strokeWidth", type: "number", default: "3", description: "Shaft weight. The second sketch pass runs at 60% of it." },
      { name: "headSize", type: "number", default: "18", description: "Length of the head's barbs, in box units." },
      { name: "sketch", type: "boolean", default: "true", description: "Draws the shaft twice at a sub-pixel offset. False for a single clean stroke." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before the shaft starts drawing." },
      { name: "durationInFrames", type: "number", default: "40", description: "Frames the shaft takes. The head lands over the last quarter." },
      { name: "exitAtInFrames", type: "number", description: "Frame the arrow starts leaving. Omit to leave it on screen." },
      { name: "exitInFrames", type: "number", default: "14", description: "Frames the exit takes." },
    ],
    note: "The head is angled to the curve's own tangent, not to the straight line between the ends, so the arrow points where it is travelling. The hand-drawn quality is two passes at a sub-pixel offset — not a path whose points move per frame, which reads as a shaking arrow. The stroke draws on an editorial curve; a strong ease-out would finish in its first frames and then crawl.",
    related: ["path-draw", "handwriting-text", "cursor-path"],
  },
  "badge-stamp": {
    category: "primitive",
    usage: `import { BadgeStamp } from "@/remotion/primitives/badge-stamp";

<BadgeStamp
  label="APPROVED"
  ringText="REMOTIONUI"
  ringTextBottom="VERIFIED BUILD"
  sublabel="2026"
  delayInFrames={14}
  exitAtInFrames={92}
/>`,
    props: [
      { name: "label", type: "string", default: '"APPROVED"', description: "The word in the middle of the seal." },
      { name: "ringText", type: "string", default: '"REMOTIONUI"', description: "Text curved around the top. Keep it short enough not to run past the sides." },
      { name: "ringTextBottom", type: "string", default: '"VERIFIED BUILD"', description: "Text curved around the bottom, on its own left-to-right arc so it reads upright." },
      { name: "sublabel", type: "string", default: '"2026"', description: "Line under the label." },
      { name: "size", type: "number", default: "220", description: "Rendered size in pixels." },
      { name: "color", type: "string", default: '"#E8B86D"', description: "Ink colour for every part of the seal." },
      { name: "rotation", type: "number", default: "-9", description: "Degrees the stamp settles at." },
      { name: "windUp", type: "number", default: "16", description: "How much further round it starts, in degrees." },
      { name: "delayInFrames", type: "number", default: "6", description: "Frame the stamp lands on." },
      { name: "exitAtInFrames", type: "number", description: "Frame the stamp starts leaving. Omit to leave it on screen." },
      { name: "exitInFrames", type: "number", default: "16", description: "Frames the exit takes." },
      { name: "impactRing", type: "boolean", default: "true", description: "Shockwave thrown off on impact." },
    ],
    note: "Scale and rotation run on separate springs, so the rotation is still unwinding after the scale has stopped — that offset is what sells the weight, and collapsing them onto one spring makes the seal read as a sticker being placed. The shockwave is thrown from the impact frame rather than from the start, so it cannot arrive before its cause. Ring text uses two half-arcs because letters stand up from the direction of travel.",
    related: ["confetti-burst", "glow-pulse", "logo-reveal"],
  },
  "shape-morph": {
    category: "primitive",
    usage: `import { ShapeMorph } from "@/remotion/primitives/shape-morph";

<ShapeMorph
  shapes={["circle", "squircle", "triangle", "diamond"]}
  size={300}
  durationInFrames={96}
  exitAtInFrames={92}
/>`,
    props: [
      { name: "shapes", type: "(MorphShapeName | string)[]", default: '["circle", "squircle", "triangle", "diamond"]', description: "Shapes to travel through. Preset names, or raw d strings authored on a 0–100 box." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before the morph starts." },
      { name: "durationInFrames", type: "number", default: "90", description: "Frames the whole chain takes, end to end." },
      { name: "loop", type: "boolean", default: "false", description: "Returns to the first shape so a looping driver has no seam." },
      { name: "size", type: "number", default: "220", description: "Rendered size in pixels." },
      { name: "fill", type: "string", default: '"#E8B86D"', description: "Shape fill. Pass undefined for an outline only." },
      { name: "stroke", type: "string", description: "Outline colour. Omit for a filled shape with no outline." },
      { name: "strokeWidth", type: "number", default: "3", description: "Outline weight, when stroke is set." },
      { name: "rotation", type: "number", default: "18", description: "Degrees turned across the chain. Stops a symmetrical pair looking static." },
      { name: "exitAtInFrames", type: "number", description: "Frame the shape starts leaving. Omit to leave it on screen." },
      { name: "exitInFrames", type: "number", default: "16", description: "Frames the exit takes." },
    ],
    note: "The chain is prepared once and evaluated per frame — preparation (parsing, winding alignment, box fitting) depends only on the d strings, so doing it in the render would re-parse every path 30 times a second. Steps inside the chain are linear on purpose: easing each hop puts a stall at every shape, which reads as a slideshow. Shapes morph cleanly when they reduce to a similar curve count; the presets are all four-curve closed paths.",
    related: ["blob-morph", "path-draw", "svg-mask-reveal"],
  },
  "blob-morph": {
    category: "primitive",
    usage: `import { BlobMorph } from "@/remotion/primitives/blob-morph";

<BlobMorph size={320} periodInFrames={96} amplitude={0.22} seed={1} />`,
    props: [
      { name: "size", type: "number", default: "260", description: "Rendered size in pixels." },
      { name: "fill", type: "string", default: '"#E8B86D"', description: "Blob fill. Pass undefined for an outline only." },
      { name: "stroke", type: "string", description: "Outline colour. Omit for a filled blob." },
      { name: "strokeWidth", type: "number", default: "3", description: "Outline weight, when stroke is set." },
      { name: "periodInFrames", type: "number", default: "150", description: "Frames for one full trip around the ring of shapes." },
      { name: "states", type: "number", default: "4", description: "How many shapes the loop travels through. Three to six reads as organic." },
      { name: "points", type: "number", default: "10", description: "Points around the outline. More points, more detail and more wobble." },
      { name: "amplitude", type: "number", default: "0.22", description: "How far the outline deviates from a circle, as a fraction of the radius." },
      { name: "seed", type: "number", default: "1", description: "Changes the shape family without changing anything else." },
      { name: "rotation", type: "number", default: "12", description: "Degrees per period. Continuous, so a seamless loop wants 0 or a multiple of 360." },
    ],
    note: "Outlines are generated from three sine harmonics seeded by the seed prop — two alone leave a shape that reads as symmetrical. Every variant shares a point count so they reduce to the same curve commands and morph without invented segments. Control arms are computed from the point count, (4/3)·tan(π/2N) of the radius along the neighbours' chord: a guessed constant gives a polygon when short and scalloped bulges when long. No entrance or exit — it is alive from frame 0.",
    related: ["shape-morph", "aurora-bg", "svg-mask-reveal"],
  },
  "dashed-path-travel": {
    category: "primitive",
    usage: `import { DashedPathTravel } from "@/remotion/primitives/dashed-path-travel";

<DashedPathTravel
  waypoints={[
    { x: 20, y: 150 },
    { x: 90, y: 60 },
    { x: 280, y: 40 },
  ]}
  orient
  durationInFrames={86}
  exitAtInFrames={92}
/>`,
    props: [
      { name: "d", type: "string", description: "The route as a path string. Give this or waypoints." },
      { name: "waypoints", type: "TravelPoint[]", default: "4 sample points", description: "Points the route passes through, in path units." },
      { name: "smoothing", type: "number", default: "0.4", description: "Corner rounding when building from waypoints. 0 gives straight hops." },
      { name: "children", type: "ReactNode", description: "What travels the path. Centred on the point; falls back to a dot." },
      { name: "dotRadius", type: "number", default: "7", description: "Radius of the default dot, used when no children are given." },
      { name: "orient", type: "boolean", default: "false", description: "Turns the traveller to the path's tangent." },
      { name: "width", type: "number", default: "320", description: "Box width in pixels." },
      { name: "height", type: "number", default: "200", description: "Box height in pixels." },
      { name: "viewBox", type: "string", description: "Omit to frame the route automatically from its bounding box." },
      { name: "trailColor", type: "string", default: '"#E8B86D"', description: "The dashed route behind the traveller." },
      { name: "trackColor", type: "string", default: '"rgba(255,255,255,0.12)"', description: "The route not yet travelled. Omit to hide where this is going." },
      { name: "strokeWidth", type: "number", default: "2.5", description: "Weight of both the track and the trail." },
      { name: "dash", type: "number", default: "9", description: "Dash and gap length, in path units." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before setting off." },
      { name: "durationInFrames", type: "number", default: "70", description: "Frames the trip takes." },
      { name: "exitAtInFrames", type: "number", description: "Frame the whole thing starts leaving. Omit to leave it on screen." },
      { name: "exitInFrames", type: "number", default: "16", description: "Frames the exit takes." },
    ],
    note: "The trail is a fixed dash pattern revealed by a mask that grows with the head, not a dashed stroke that grows — growing the pattern slides every dash along the route, which reads as a stretching line rather than a road being marked. Position and angle come from arc-length sampling, so the traveller keeps a constant speed around corners. For a cursor with its own hardware shape and click beats, use cursor-path.",
    related: ["cursor-path", "path-draw", "connector-lines"],
  },
  "connector-lines": {
    category: "primitive",
    usage: `import { ConnectorLines } from "@/remotion/primitives/connector-lines";

<ConnectorLines
  anchors={[
    { id: "source", x: 0.12, y: 0.5 },
    { id: "parse", x: 0.44, y: 0.18 },
    { id: "output", x: 0.86, y: 0.5 },
  ]}
  edges={[
    { from: "source", to: "parse", shape: "curve", bow: 0.12, dot: true },
    { from: "parse", to: "output", shape: "curve", bow: 0.12, dot: true },
  ]}
/>`,
    props: [
      { name: "anchors", type: "ConnectorAnchor[]", default: "4 sample anchors", description: "Named points as fractions of the box, so the same table drives your layout." },
      { name: "edges", type: "ConnectorEdge[]", default: "4 sample edges", description: "from / to anchor ids, plus shape, bow, colour and an optional arrival dot." },
      { name: "width", type: "number", default: "420", description: "Box width in pixels." },
      { name: "height", type: "number", default: "240", description: "Box height in pixels." },
      { name: "stroke", type: "string", default: '"#E8B86D"', description: "Default edge colour." },
      { name: "strokeWidth", type: "number", default: "2", description: "Edge weight." },
      { name: "dashed", type: "boolean", default: "false", description: "Dashes every edge. Dashed edges fade in rather than draw." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before the first edge draws." },
      { name: "durationInFrames", type: "number", default: "26", description: "Frames one edge takes to draw." },
      { name: "staggerInFrames", type: "number", default: "10", description: "Frames between edges." },
      { name: "exitAtInFrames", type: "number", description: "Frame the lines start leaving. Omit to leave them on screen." },
      { name: "exitInFrames", type: "number", default: "16", description: "Frames the exit takes." },
    ],
    note: "This is the primitive under a diagram, not the diagram: position your own nodes at the same fractional anchors and the lines stay in register at any size. Each edge draws on its own pathLength={1}, so a long curve and a short hop take the same time. An edge naming a missing anchor is dropped rather than drawn to the origin. For a full scene with payloads travelling the edges, use data-flow-pipes.",
    related: ["data-flow-pipes", "org-chart-build", "dashed-path-travel"],
  },
  "svg-mask-reveal": {
    category: "primitive",
    usage: `import { SvgMaskReveal } from "@/remotion/primitives/svg-mask-reveal";

<SvgMaskReveal
  shape="squircle"
  origin={{ x: 0.32, y: 0.36 }}
  durationInFrames={90}
  rotation={40}
>
  <YourContent />
</SvgMaskReveal>`,
    props: [
      { name: "children", type: "ReactNode", description: "What the mask reveals — media, a scene, a gradient, another component." },
      { name: "shape", type: "MorphShapeName | string", default: '"circle"', description: "Mask shape: a preset name, or any d string authored on a 0–100 box." },
      { name: "origin", type: "{ x: number; y: number }", default: "{ x: 0.5, y: 0.5 }", description: "Where the shape opens from, as a fraction of the frame." },
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before the reveal starts." },
      { name: "durationInFrames", type: "number", default: "40", description: "Frames the reveal takes." },
      { name: "rotation", type: "number", default: "0", description: "Degrees the shape turns as it opens." },
      { name: "bouncy", type: "boolean", default: "false", description: "Springs the growth instead of easing it." },
      { name: "invert", type: "boolean", default: "false", description: "Shrinks the shape back over the content, to close a scene with the figure that opened it." },
      { name: "backgroundColor", type: "string", description: "Painted behind the masked content. Omit for transparency." },
    ],
    note: "The scale is computed from the distance to the furthest corner, not from the frame width — a shape opening from a corner has much further to travel, and a fixed multiplier either leaves a gap or spends half the animation doing nothing. It uses an SVG <mask> rather than a CSS clip-path, so any authored path drops in and the shape can carry soft edges. Custom paths must be authored on a 0–100 box, which is what the scale maths assumes.",
    related: ["shape-morph", "blob-morph", "directional-wipe"],
  },
  "map-heat-overlay": {
    category: "primitive",
    usage: `import { MapHeatOverlay } from "@/remotion/primitives/map-heat-overlay";

<MapHeatOverlay />`,
    // No `schema` fields: component-reference.test.ts reserves JSON-Schema prop
    // fragments for FLAGSHIP_COMPONENTS, and a scaffold has not earned that.
    // Add them by hand when the component is finished and promoted.
    props: [
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before this starts." },
      { name: "durationInFrames", type: "number", default: "30", description: "Length of the entrance." },
    ],
  },
  "globe-arc": {
    category: "primitive",
    usage: `import { GlobeArc } from "@/remotion/primitives/globe-arc";

<GlobeArc />`,
    // No `schema` fields: component-reference.test.ts reserves JSON-Schema prop
    // fragments for FLAGSHIP_COMPONENTS, and a scaffold has not earned that.
    // Add them by hand when the component is finished and promoted.
    props: [
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before this starts." },
      { name: "durationInFrames", type: "number", default: "30", description: "Length of the entrance." },
    ],
  },
  "multi-device-lineup": {
    category: "primitive",
    usage: `import { MultiDeviceLineup } from "@/remotion/primitives/multi-device-lineup";

<MultiDeviceLineup />`,
    // No `schema` fields: component-reference.test.ts reserves JSON-Schema prop
    // fragments for FLAGSHIP_COMPONENTS, and a scaffold has not earned that.
    // Add them by hand when the component is finished and promoted.
    props: [
      { name: "delayInFrames", type: "number", default: "0", description: "Frames to wait before this starts." },
      { name: "durationInFrames", type: "number", default: "30", description: "Length of the entrance." },
    ],
  },
};

export function getComponentReference(name: string): ComponentReference | undefined {
  return componentReference[name];
}
