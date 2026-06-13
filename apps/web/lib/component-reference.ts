export type PropDefinition = {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
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
];

export const componentReference: Record<string, ComponentReference> = {
  "fade-in": {
    category: "primitive",
    usage: `import { FadeIn } from "@/remotion/primitives/fade-in";

<FadeIn durationInFrames={30}>
  <div>Hello world</div>
</FadeIn>`,
    props: motionChildProps,
    related: ["fade-out", "slide-up"],
  },
  "fade-out": {
    category: "primitive",
    usage: `import { FadeOut } from "@/remotion/primitives/fade-out";

<FadeOut durationInFrames={24}>
  <div>Goodbye</div>
</FadeOut>`,
    props: motionChildProps,
    related: ["fade-in"],
  },
  "slide-up": {
    category: "primitive",
    usage: `import { SlideUp } from "@/remotion/primitives/slide-up";

<SlideUp distance={80}>
  <h1>Title</h1>
</SlideUp>`,
    props: [
      ...motionChildProps,
      {
        name: "distance",
        type: "number",
        default: "60",
        description: "Vertical offset in pixels at the start of the animation.",
      },
    ],
    related: ["slide-left", "fade-in"],
  },
  "slide-left": {
    category: "primitive",
    usage: `import { SlideLeft } from "@/remotion/primitives/slide-left";

<SlideLeft distance={60}>
  <p>Slide in from the left</p>
</SlideLeft>`,
    props: [
      ...motionChildProps,
      {
        name: "distance",
        type: "number",
        default: "60",
        description: "Horizontal offset in pixels at the start of the animation.",
      },
    ],
    related: ["slide-up", "stagger-children"],
  },
  "scale-in": {
    category: "primitive",
    usage: `import { ScaleIn } from "@/remotion/primitives/scale-in";

<ScaleIn durationInFrames={24}>
  <img src={staticFile("logo.png")} />
</ScaleIn>`,
    props: motionChildProps,
    related: ["spring-in", "fade-in"],
  },
  typewriter: {
    category: "primitive",
    usage: `import { Typewriter } from "@/remotion/primitives/typewriter";

<Typewriter
  text="Build videos with React."
  charFrames={2}
  pauseAfter="React."
  pauseSeconds={0.5}
/>`,
    props: [
      {
        name: "text",
        type: "string",
        required: true,
        description: "Full string to reveal character by character.",
      },
      {
        name: "charFrames",
        type: "number",
        description: "Frames per character (preferred over durationInFrames).",
      },
      {
        name: "durationInFrames",
        type: "number",
        description: "Legacy total duration when charFrames is omitted.",
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
        description: "Length of the pause in seconds.",
      },
      {
        name: "showCursor",
        type: "boolean",
        default: "true",
        description: "Show a blinking cursor while typing.",
      },
    ],
    related: ["word-highlight", "counter"],
  },
  counter: {
    category: "primitive",
    usage: `import { Counter } from "@/remotion/primitives/counter";

<Counter from={0} to={100} suffix="%" durationInFrames={45} />`,
    props: [
      {
        name: "to",
        type: "number",
        required: true,
        description: "Target value to count toward.",
      },
      {
        name: "from",
        type: "number",
        default: "0",
        description: "Starting value.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "30",
        description: "Frames over which the count animates.",
      },
      {
        name: "suffix",
        type: "string",
        description: "Text appended after the number (e.g. %, K, M).",
      },
    ],
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
        default: "8",
        description: "Maximum blur radius in pixels at frame 0.",
      },
    ],
    related: ["fade-in", "scale-in"],
  },
  "spring-in": {
    category: "primitive",
    usage: `import { SpringIn } from "@/remotion/primitives/spring-in";

<SpringIn durationInFrames={40}>
  <div>Bouncy entrance</div>
</SpringIn>`,
    props: motionChildProps,
    related: ["scale-in", "rotate-in"],
  },
  "stagger-children": {
    category: "primitive",
    usage: `import { StaggerChildren } from "@/remotion/primitives/stagger-children";
import { SlideLeft } from "@/remotion/primitives/slide-left";

<StaggerChildren staggerInFrames={8}>
  {items.map((item) => (
    <SlideLeft key={item}><span>{item}</span></SlideLeft>
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
        default: "6",
        description: "Delay between each child in frames.",
      },
      {
        name: "baseDelayInFrames",
        type: "number",
        default: "0",
        description: "Initial delay before the first child animates.",
      },
    ],
    note: "Installs `motion-wrapper` automatically. Each child should use an enter primitive.",
    related: ["slide-left", "fade-in"],
  },
  "word-highlight": {
    category: "primitive",
    usage: `import { WordHighlight } from "@/remotion/primitives/word-highlight";

<WordHighlight
  text="Ship faster with RemotionUI"
  highlightWord="RemotionUI"
  highlightColor="#f97316"
/>`,
    props: [
      {
        name: "text",
        type: "string",
        required: true,
        description: "Full sentence to render.",
      },
      {
        name: "highlightWord",
        type: "string",
        required: true,
        description: "Substring to highlight with an animated wipe.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "30",
        description: "Highlight wipe duration.",
      },
      {
        name: "highlightColor",
        type: "string",
        description: "Background color behind the highlighted word.",
      },
      {
        name: "fontSize",
        type: "number",
        description: "Text size in pixels.",
      },
    ],
    related: ["quote-card", "typewriter"],
  },
  "progress-bar": {
    category: "primitive",
    usage: `import { ProgressBar } from "@/remotion/primitives/progress-bar";

<ProgressBar progress={0.75} label="Rendering" color="#f97316" />`,
    props: [
      {
        name: "progress",
        type: "number",
        default: "animated 0→1",
        description: "Fill amount from 0 to 1. Animates when omitted.",
      },
      {
        name: "durationInFrames",
        type: "number",
        default: "30",
        description: "Frames to animate progress when not fixed.",
      },
      {
        name: "label",
        type: "string",
        description: "Optional label shown beside the bar.",
      },
      {
        name: "color",
        type: "string",
        description: "Fill color of the progress bar.",
      },
      {
        name: "height",
        type: "number",
        description: "Bar height in pixels.",
      },
    ],
    related: ["counter", "intro"],
  },
  "rotate-in": {
    category: "primitive",
    usage: `import { RotateIn } from "@/remotion/primitives/rotate-in";

<RotateIn degrees={-12} durationInFrames={30}>
  <div>Rotate in</div>
</RotateIn>`,
    props: [
      ...motionChildProps,
      {
        name: "degrees",
        type: "number",
        default: "-10",
        description: "Starting rotation in degrees.",
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
        default: "15",
        description: "Overlap duration between scenes.",
      },
      {
        name: "variant",
        type: '"linear" | "spring"',
        default: '"linear"',
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
/>`,
    props: [
      { name: "title", type: "string", required: true, description: "Primary line." },
      { name: "subtitle", type: "string", description: "Secondary line." },
      { name: "accentColor", type: "string", description: "Accent bar color." },
      { name: "backgroundColor", type: "string", description: "Panel background." },
    ],
    note: "Installs `fade-in` and `slide-left` as dependencies.",
    related: ["title-card", "end-card"],
  },
  "title-card": {
    category: "scene",
    usage: `import { TitleCard } from "@/remotion/scenes/title-card";

<TitleCard title="Launch Week" subtitle="Day 1" />`,
    props: [
      { name: "title", type: "string", required: true, description: "Main heading." },
      { name: "subtitle", type: "string", description: "Supporting line." },
      { name: "accentColor", type: "string", description: "Accent elements." },
      { name: "backgroundColor", type: "string", description: "Scene background." },
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
      { name: "items", type: "string[]", required: true, description: "Bullet list items." },
      { name: "title", type: "string", description: "Section heading." },
      { name: "accentColor", type: "string", description: "Bullet and accent color." },
    ],
    note: "Installs `stagger-children`, `slide-left`, and `fade-in`.",
    related: ["stat-card", "showcase"],
  },
  "stat-card": {
    category: "scene",
    usage: `import { StatCard } from "@/remotion/scenes/stat-card";

<StatCard value={98} label="Satisfaction" suffix="%" />`,
    props: [
      { name: "value", type: "number", required: true, description: "Number to count up to." },
      { name: "label", type: "string", required: true, description: "Metric label." },
      { name: "suffix", type: "string", description: "Appended to the value." },
    ],
    note: "Installs `counter` and `fade-in`.",
    related: ["counter", "feature-list"],
  },
  "quote-card": {
    category: "scene",
    usage: `import { QuoteCard } from "@/remotion/scenes/quote-card";

<QuoteCard
  quote="The best way to ship motion graphics"
  highlightWord="motion"
  author="— Team"
/>`,
    props: [
      { name: "quote", type: "string", required: true, description: "Quote body." },
      { name: "highlightWord", type: "string", required: true, description: "Word to highlight." },
      { name: "author", type: "string", required: true, description: "Attribution line." },
    ],
    note: "Installs `word-highlight`.",
    related: ["word-highlight", "title-card"],
  },
  "end-card": {
    category: "scene",
    usage: `import { EndCard } from "@/remotion/scenes/end-card";

<EndCard title="Thanks for watching" cta="Subscribe" url="youtube.com" />`,
    props: [
      { name: "title", type: "string", required: true, description: "Closing headline." },
      { name: "cta", type: "string", description: "Call-to-action label." },
      { name: "url", type: "string", description: "URL shown with the CTA." },
      { name: "logoSrc", type: "string", description: "Optional brand mark image (staticFile or URL)." },
    ],
    related: ["title-card", "intro"],
  },
  intro: {
    category: "composition",
    usage: `import { Intro } from "@/remotion/compositions/intro";

<Intro title="My Product" subtitle="Launch video" />`,
    props: [
      { name: "title", type: "string", default: '"RemotionUI"', description: "Main title." },
      { name: "subtitle", type: "string", description: "Tagline under the title." },
    ],
    note: "Full intro sequence with staggered title, subtitle, and progress bar.",
    related: ["showcase", "title-card"],
  },
  showcase: {
    category: "composition",
    usage: `import { Showcase } from "@/remotion/compositions/showcase";

<Showcase title="Demo Reel" subtitle="Transitions & scenes" />`,
    props: [
      { name: "title", type: "string", description: "Opening title." },
      { name: "subtitle", type: "string", description: "Opening subtitle." },
    ],
    note: "Demo reel using TransitionSeries across multiple scenes.",
    related: ["transition-fade", "feature-list"],
  },
  "hero-loop": {
    category: "composition",
    usage: `import { HeroLoop } from "@/compositions/hero-loop";

<HeroLoop />`,
    props: [],
    note: "15-second silent looping hero video for website embeds. Installs as source and demonstrates the primitives it uses.",
    related: ["typewriter", "counter", "stagger-children"],
  },
  "caption-highlight": {
    category: "primitive",
    usage: `import { CaptionHighlight } from "@/remotion/primitives/caption-highlight";

<CaptionHighlight page={page} activeColor="#60a5fa" />`,
    props: [
      { name: "page", type: "TikTokPage", required: true, description: "Caption page from createTikTokStyleCaptions." },
      { name: "activeColor", type: "string", default: '"#60a5fa"', description: "Highlight color for the active word." },
      { name: "inactiveColor", type: "string", default: '"#f8fafc"', description: "Color for inactive words." },
      { name: "fontSize", type: "number", default: "48", description: "Caption font size in pixels." },
    ],
    note: "Advanced — installs @remotion/captions.",
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
    ],
    note: "Advanced — installs @remotion/captions.",
    related: ["caption-highlight", "social-clip"],
  },
  "audiogram-bars": {
    category: "primitive",
    usage: `import { AudiogramBars } from "@/remotion/primitives/audiogram-bars";

<AudiogramBars src={staticFile("podcast.wav")} height={120} />`,
    props: [
      { name: "src", type: "string", required: true, description: "Audio file URL or staticFile path." },
      { name: "height", type: "number", default: "120", description: "Bar container height." },
      { name: "barColor", type: "string", default: '"#3b82f6"', description: "Bar fill color." },
    ],
    note: "Advanced — installs @remotion/media-utils.",
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

<PathDraw d="M 10 10 L 190 190" durationInFrames={60} />`,
    props: [
      { name: "d", type: "string", required: true, description: "SVG path d attribute." },
      { name: "durationInFrames", type: "number", default: "60", description: "Draw animation length." },
      { name: "stroke", type: "string", default: '"#ffffff"', description: "Stroke color." },
    ],
    note: "Advanced — installs @remotion/paths.",
    related: ["logo-reveal"],
  },
  "logo-reveal": {
    category: "scene",
    usage: `import { LogoReveal } from "@/remotion/scenes/logo-reveal";

<LogoReveal pathD="M 100 20 L 180 180 L 20 180 Z" />`,
    props: [
      { name: "pathD", type: "string", required: true, description: "SVG path for the logo." },
      { name: "width", type: "number", default: "200", description: "SVG width." },
      { name: "height", type: "number", default: "200", description: "SVG height." },
    ],
    related: ["path-draw"],
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
    note: "Advanced — installs maplibre-gl. Render with --gl=angle --concurrency=1.",
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
      { name: "durationInFrames", type: "number", default: "24", description: "Transition overlap length." },
      { name: "width", type: "number", required: true, description: "Composition width." },
      { name: "height", type: "number", required: true, description: "Composition height." },
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
      { name: "seed", type: "number", default: "0", description: "Light leak pattern seed." },
      { name: "hueShift", type: "number", default: "0", description: "Hue rotation in degrees." },
    ],
    note: "Advanced — installs @remotion/light-leaks.",
    related: ["transition-fade"],
  },
  "auto-fit-title": {
    category: "scene",
    usage: `import { AutoFitTitle } from "@/remotion/scenes/auto-fit-title";

<AutoFitTitle title="Headlines that always fit" subtitle="Any resolution" />`,
    props: [
      { name: "title", type: "string", required: true, description: "Headline text." },
      { name: "subtitle", type: "string", description: "Optional subtitle." },
      { name: "logoSrc", type: "string", description: "Optional brand mark above the headline." },
      { name: "maxFontSize", type: "number", default: "96", description: "Maximum title size in px." },
    ],
    note: "Advanced — installs @remotion/layout-utils and @remotion/google-fonts.",
    related: ["title-card", "social-clip"],
  },
  "waveform-line": {
    category: "primitive",
    usage: `import { WaveformLine } from "@/remotion/primitives/waveform-line";

<WaveformLine src={staticFile("voice.wav")} mirror />`,
    props: [
      { name: "src", type: "string", required: true, description: "Audio source." },
      { name: "height", type: "number", default: "120", description: "SVG waveform height." },
      { name: "mirror", type: "boolean", default: "false", description: "Draw a reflected waveform." },
    ],
    note: "Advanced — installs @remotion/media-utils.",
    related: ["audiogram-bars", "audio-pulse"],
  },
  "audio-pulse": {
    category: "primitive",
    usage: `import { AudioPulse } from "@/remotion/primitives/audio-pulse";

<AudioPulse src={staticFile("voice.wav")} />`,
    props: [
      { name: "src", type: "string", required: true, description: "Audio source." },
      { name: "size", type: "number", default: "240", description: "Pulse diameter in px." },
      { name: "ringCount", type: "number", default: "3", description: "Number of reactive rings." },
    ],
    note: "Advanced — installs @remotion/media-utils.",
    related: ["waveform-line", "audiogram-scene"],
  },
  "karaoke-captions": {
    category: "primitive",
    usage: `import { KaraokeCaptions } from "@/remotion/primitives/karaoke-captions";

<KaraokeCaptions page={page} mode="scale" />`,
    props: [
      { name: "page", type: "TikTokPage", required: true, description: "Caption page from @remotion/captions." },
      { name: "mode", type: '"scale" | "underline"', default: '"scale"', description: "Active word emphasis style." },
      { name: "fontSize", type: "number", default: "56", description: "Caption size in px." },
    ],
    note: "Use with caption-utils groupCaptionsIntoPages().",
    related: ["caption-highlight", "caption-scene"],
  },
  "line-chart-draw": {
    category: "primitive",
    usage: `import { LineChartDraw } from "@/remotion/primitives/line-chart-draw";

<LineChartDraw points={[{ x: 0, y: 12 }, { x: 1, y: 24 }]} />`,
    props: [
      { name: "points", type: "{ x: number; y: number }[]", required: true, description: "Chart points." },
      { name: "showDots", type: "boolean", default: "true", description: "Reveal dots along the line." },
      { name: "durationInFrames", type: "number", default: "70", description: "Draw-on duration." },
    ],
    related: ["animated-bar-chart", "path-draw"],
  },
  "cursor-path": {
    category: "primitive",
    usage: `import { CursorPath } from "@/remotion/primitives/cursor-path";

<CursorPath points={[{ x: 80, y: 120 }, { x: 320, y: 80 }]} />`,
    props: [
      { name: "points", type: "{ x: number; y: number }[]", required: true, description: "Cursor route points." },
      { name: "durationInFrames", type: "number", default: "90", description: "Travel duration." },
      { name: "size", type: "number", default: "34", description: "Cursor size." },
    ],
    related: ["callout-spotlight", "zoom-pan-frame"],
  },
  "media-frame": {
    category: "scene",
    usage: `import { MediaFrame } from "@/remotion/scenes/media-frame";

<MediaFrame src={staticFile("demo.png")} title="Product demo" />`,
    props: [
      { name: "src", type: "string", required: true, description: "Image or video source." },
      { name: "fit", type: '"cover" | "contain"', default: '"cover"', description: "Media object-fit behavior." },
      { name: "caption", type: "string", description: "Optional supporting caption." },
    ],
    note: "Advanced — installs @remotion/media for video sources.",
    related: ["media-sequence", "split-screen"],
  },
  "media-sequence": {
    category: "scene",
    usage: `import { MediaSequence } from "@/remotion/scenes/media-sequence";

<MediaSequence items={[{ src: staticFile("one.png"), title: "Hook" }]} />`,
    props: [
      { name: "items", type: "MediaItem[]", required: true, description: "Timed media items." },
      { name: "defaultDurationInFrames", type: "number", default: "90", description: "Fallback item duration." },
      { name: "transitionDurationInFrames", type: "number", default: "12", description: "Fade overlap." },
    ],
    related: ["media-frame", "tutorial-clip"],
  },
  "split-screen": {
    category: "scene",
    usage: `import { SplitScreen } from "@/remotion/scenes/split-screen";

<SplitScreen left={{ src: before }} right={{ src: after }} />`,
    props: [
      { name: "left", type: "SplitScreenPanel", required: true, description: "Left media panel." },
      { name: "right", type: "SplitScreenPanel", required: true, description: "Right media panel." },
      { name: "title", type: "string", description: "Optional comparison title." },
    ],
    related: ["media-frame", "b-roll-stack"],
  },
  "b-roll-stack": {
    category: "scene",
    usage: `import { BRollStack } from "@/remotion/scenes/b-roll-stack";

<BRollStack items={[{ src: staticFile("shot.png"), title: "Proof" }]} />`,
    props: [
      { name: "items", type: "{ src: string; title?: string }[]", required: true, description: "Media cards to layer." },
      { name: "title", type: "string", description: "Scene headline." },
    ],
    related: ["media-frame", "media-sequence"],
  },
  "caption-bumper": {
    category: "scene",
    usage: `import { CaptionBumper } from "@/remotion/scenes/caption-bumper";

<CaptionBumper text="This is the key moment." />`,
    props: [
      { name: "text", type: "string", required: true, description: "Large quote or caption text." },
      { name: "eyebrow", type: "string", default: '"Key moment"', description: "Small label above the text." },
    ],
    related: ["karaoke-captions", "data-story"],
  },
  "animated-bar-chart": {
    category: "scene",
    usage: `import { AnimatedBarChart } from "@/remotion/scenes/animated-bar-chart";

<AnimatedBarChart data={[{ label: "Views", value: 120000 }]} />`,
    props: [
      { name: "data", type: "ChartDatum[]", required: true, description: "Bar labels and values." },
      { name: "maxValue", type: "number", description: "Optional fixed max domain." },
      { name: "valueFormatter", type: "(value: number) => string", description: "Value label formatter." },
    ],
    related: ["metric-ticker", "data-story"],
  },
  "metric-ticker": {
    category: "scene",
    usage: `import { MetricTicker } from "@/remotion/scenes/metric-ticker";

<MetricTicker metrics={[{ label: "Views", value: 120000, delta: "+32%" }]} />`,
    props: [
      { name: "metrics", type: "MetricTickerItem[]", required: true, description: "Up to three metric cards." },
      { name: "title", type: "string", description: "Scene title." },
    ],
    related: ["animated-bar-chart", "data-story"],
  },
  "timeline-steps": {
    category: "scene",
    usage: `import { TimelineSteps } from "@/remotion/scenes/timeline-steps";

<TimelineSteps steps={[{ title: "Record" }, { title: "Render" }]} />`,
    props: [
      { name: "steps", type: "TimelineStep[]", required: true, description: "Up to four process steps." },
      { name: "title", type: "string", description: "Timeline title." },
    ],
    related: ["data-story", "feature-list"],
  },
  "callout-spotlight": {
    category: "scene",
    usage: `import { CalloutSpotlight } from "@/remotion/scenes/callout-spotlight";

<CalloutSpotlight title="Click export" target={{ x: 320, y: 180, width: 420, height: 180 }} />`,
    props: [
      { name: "title", type: "string", required: true, description: "Callout headline." },
      { name: "target", type: "SpotlightTarget", required: true, description: "Highlighted rectangle." },
      { name: "backgroundSrc", type: "string", description: "Optional screenshot or media background." },
    ],
    related: ["zoom-pan-frame", "tutorial-clip"],
  },
  "zoom-pan-frame": {
    category: "scene",
    usage: `import { ZoomPanFrame } from "@/remotion/scenes/zoom-pan-frame";

<ZoomPanFrame src={staticFile("screenshot.png")} toScale={1.25} />`,
    props: [
      { name: "src", type: "string", required: true, description: "Image source." },
      { name: "toScale", type: "number", default: "1.24", description: "Final zoom scale." },
      { name: "durationInFrames", type: "number", default: "90", description: "Zoom duration." },
    ],
    related: ["callout-spotlight", "cursor-path"],
  },
  "code-reveal": {
    category: "scene",
    usage: `import { CodeReveal } from "@/remotion/scenes/code-reveal";

<CodeReveal code={'npx remotion-ui add media-frame'} highlightedLines={[1]} />`,
    props: [
      { name: "code", type: "string", required: true, description: "Code or terminal text." },
      { name: "highlightedLines", type: "number[]", description: "1-based highlighted line numbers." },
      { name: "title", type: "string", description: "Scene title." },
    ],
    related: ["tutorial-clip"],
  },
  "hook-card": {
    category: "scene",
    usage: `import { HookCard } from "@/remotion/scenes/hook-card";

<HookCard
  kicker="Creator media"
  headline="Make the first second count"
  subtitle="A punchy opener for reels and shorts."
/>`,
    props: [
      { name: "headline", type: "string", required: true, description: "Large hook text." },
      { name: "kicker", type: "string", default: '"Creator insight"', description: "Small label above the headline." },
      { name: "subtitle", type: "string", description: "Optional supporting line." },
      { name: "accentColor", type: "string", default: '"#f97316"', description: "Accent sweep, label, and glow color." },
      { name: "backgroundColor", type: "string", default: '"#09090b"', description: "Scene background color." },
    ],
    related: ["creator-reel", "title-card", "auto-fit-title"],
  },
  "talking-head-layout": {
    category: "scene",
    usage: `import { TalkingHeadLayout } from "@/remotion/scenes/talking-head-layout";

<TalkingHeadLayout
  mediaSrc={staticFile("speaker.mp4")}
  audioSrc={staticFile("voice.wav")}
  title="Put the speaker first"
/>`,
    props: [
      { name: "mediaSrc", type: "string", description: "Optional image or video source for the speaker/media slot." },
      { name: "audioSrc", type: "string", description: "Optional audio source for the waveform line." },
      { name: "title", type: "string", description: "Primary title beside or below the media." },
      { name: "subtitle", type: "string", description: "Supporting copy." },
      { name: "fit", type: '"cover" | "contain"', default: '"cover"', description: "Media object-fit behavior." },
    ],
    note: "Advanced — installs @remotion/media and waveform-line for optional audio visuals.",
    related: ["creator-reel", "caption-scene", "media-frame"],
  },
  "comment-callout": {
    category: "scene",
    usage: `import { CommentCallout } from "@/remotion/scenes/comment-callout";

<CommentCallout
  author="Mina Lee"
  handle="@minamakes"
  body="Can you turn this into a quick video breakdown?"
/>`,
    props: [
      { name: "body", type: "string", required: true, description: "Comment, question, prompt, or testimonial text." },
      { name: "author", type: "string", description: "Display name for the comment author." },
      { name: "handle", type: "string", description: "Social handle or secondary author label." },
      { name: "initials", type: "string", description: "Avatar initials." },
      { name: "replyLabel", type: "string", description: "Optional response status label." },
    ],
    related: ["creator-reel", "quote-card", "caption-bumper"],
  },
  "social-clip": {
    category: "composition",
    usage: `import { SocialClip } from "@/compositions/social-clip";

<SocialClip audioSrc={staticFile("podcast.wav")} captions={captions} />`,
    props: [
      { name: "audioSrc", type: "string", required: true, description: "Podcast audio source." },
      { name: "captions", type: "Caption[]", required: true, description: "Synced caption array." },
      { name: "hookTitle", type: "string", description: "Opening hook headline." },
      { name: "logoSrc", type: "string", description: "Optional brand mark shown in hook, body, and end card." },
      { name: "ctaUrl", type: "string", description: "URL shown on the end card." },
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
      { name: "hookHeadline", type: "string", description: "Opening hook headline." },
      { name: "mediaSrc", type: "string", description: "Speaker image or video source." },
      { name: "mediaFit", type: '"cover" | "contain"', default: '"cover"', description: "Speaker media object-fit behavior." },
      { name: "audioSrc", type: "string", description: "Optional audio source for waveform visuals." },
      { name: "captions", type: "Caption[]", description: "Synced captions layered over the talking-head scene." },
      { name: "bRollItems", type: "BRollItem[]", description: "Media cards for the proof/b-roll section." },
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
      { name: "title", type: "string", description: "Opening hook title." },
      { name: "code", type: "string", description: "Code reveal content." },
    ],
    related: ["media-frame", "callout-spotlight", "code-reveal"],
  },
  "data-story": {
    category: "composition",
    usage: `import { DataStory } from "@/compositions/data-story";

<DataStory barData={barData} metrics={metrics} steps={steps} />`,
    props: [
      { name: "barData", type: "ChartDatum[]", required: true, description: "Bar chart data." },
      { name: "metrics", type: "MetricTickerItem[]", required: true, description: "Metric cards." },
      { name: "steps", type: "TimelineStep[]", required: true, description: "Context steps." },
    ],
    related: ["animated-bar-chart", "metric-ticker", "timeline-steps"],
  },
  "podcast-clip": {
    category: "composition",
    usage: `import { PodcastClip } from "@/compositions/podcast-clip";

<PodcastClip audioSrc={staticFile("podcast.wav")} captions={captions} />`,
    props: [
      { name: "audioSrc", type: "string", required: true, description: "Audio source." },
      { name: "captions", type: "Caption[]", required: true, description: "Synced captions." },
      { name: "title", type: "string", description: "Opening title." },
    ],
    related: ["audio-pulse", "waveform-line", "caption-scene"],
  },
};

export function getComponentReference(name: string): ComponentReference | undefined {
  return componentReference[name];
}
