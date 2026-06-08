# Changelog

## Unreleased

## 0.5.0

### Added

- **Creator Media component pack** — `hook-card`, `talking-head-layout`, `comment-callout`, and `creator-reel` for practical short-form creator videos.
- **Creator docs previews** — live preview pages, Atlas metadata, component references, and AI install metadata for the new registry items.

### Changed

- Docs previews now scale native Remotion players into the preview panel, including 9:16 portrait compositions.
- Portrait component docs reserve a usable preview width so vertical reels can be inspected before install.

### Fixed

- Fixed new animated previews appearing blank at frame 0 by offsetting docs-only preview wrappers to representative frames.
- Improved creator preview media fitting and portrait typography to avoid clipped demo text.

## 0.4.2

### Changed

- Updated npm package metadata to the canonical GitHub repository and public site URLs.
- Hardened release workflow with manual environment-gated publishing and post-publish smoke checks.

## 0.4.1

### Fixed

- Fixed the CLI default registry URL so `npx remotion-ui@latest search` and registry installs resolve against the live hosted registry.

## 0.4.0

### Added

- **Creator Essentials component pack** — media, captions, audio, charts, demos, and composition templates for common Remotion workflows
- **19 new components** — media-frame, media-sequence, split-screen, b-roll-stack, karaoke-captions, waveform-line, audio-pulse, animated-bar-chart, line-chart-draw, metric-ticker, timeline-steps, callout-spotlight, zoom-pan-frame, cursor-path, code-reveal, tutorial-clip, data-story, podcast-clip, caption-bumper
- **Shared utilities** — media-utils, chart-utils, and text-fit-utils registry helpers
- **DESIGN.md** — Remotion-adjacent design system (Studio Blue palette, typography, motion rules)
- **Component cards** — lane icon thumbnails and Atlas filter chips on homepage
- **Sticky preview layout** — component docs use side-by-side preview on large screens

### Changed

- Docs site redesign: Outfit + IBM Plex + JetBrains Mono; cool blue primary; dark default theme
- Homepage: single Atlas browse, “How it works” strip, removed duplicate folder grid
- Preview/install panels: clean chrome without fake window dots
- Logo: SVG frame mark replacing letter-in-square placeholder

## 0.3.0

### Added

- **Component Atlas** — video-native taxonomy (atoms, signals, vectors, spatial, blocks, cuts, reels) with lane/tier metadata and `/docs/atlas`
- **15 advanced components** — captions, audiograms, SVG path draw, MapLibre maps, extended transitions, auto-fit title, social-clip composition
- **Shared libs** — `caption-utils`, `audio-viz-utils`, `map-utils`, `path-utils`
- **Docs sections** — Signals, Vectors, Spatial, Cuts lanes; advanced guides for captions, maps, and audio viz
- **CLI search** — `--lane` and `--tier` filters on registry index

### Changed

- Homepage shows Component Atlas lanes; transition docs moved to Cuts section
- Registry index includes atlas metadata for all components
- Docs previews use RemotionUI brand colors (`#60a5fa` / `#f8fafc`) instead of TikTok green
- `social-clip` docs preview renders in native 9:16 aspect ratio
- `map-flight` docs preview uses SVG stand-in (MapLibre tiles unavailable in embedded player)

### Fixed

- `caption-scene` sequence timing now covers full page duration on the last page
- `caption-scene` docs preview uses centered placement so captions are visible in the player
- `audiogram-bars` loading placeholder animates with clearer bar motion and glow
- Demo logo path updated for `logo-reveal` / `path-draw` previews

## 0.2.3

### Added

- **Docs site redesign** — custom theme, homepage hero with live preview, nav/footer, copy-to-clipboard install commands
- **`ComponentPage`** — usage examples, props tables, and related links on all component reference pages
- **GitHub configuration** — issue/PR templates, Dependabot, `CONTRIBUTING.md`, `SECURITY.md`, release workflow

### Changed

- **Brand positioning** — lead with RemotionUI's own tagline; shadcn/ui referenced only as a familiar workflow comparison
- **CI** — frozen lockfile, lint, and docs site build in pipeline

### Fixed

- Doc preview text clipped off-screen; muted autoplay for Remotion Player
- Nested anchor hydration error in docs nav (`SiteLogo`)
- `pnpm-lock.yaml` sync for Remotion `^4.0.473`
- Release workflow handles existing GitHub releases

## 0.2.2

### Changed

- `spring-in` uses official `spring({ delay })` API
- `intro` uses `premountFor` on full-frame `<Sequence>` blocks
- Counter preview centered with `AbsoluteFill`
- Remotion pin bumped to `^4.0.473`

### Added

- Codex guidance for registry/preview authoring (`AGENTS.md`, `.codex/`, `.agents/skills/`)
- `scripts/patch-remotion-skill-docs.mjs` — preserve docs mirror after skill sync
- `pnpm skills:sync` now refreshes official docs mirror automatically

## 0.2.1

### Fixed

- **Overlap bug** — animation primitives no longer use `AbsoluteFill`; inline `MotionWrapper` keeps list items in flex layout
- **`StaggerChildren`** — uses official `<Sequence layout="none" premountFor>` pattern
- **Scenes** — `feature-list`, `lower-third`, `stat-card`, `title-card`, `end-card` rebuilt with reserved layout slots

### Added

- **`motion-wrapper`** registry lib (auto-installed with enter/exit primitives)
- **Official docs mirror** — `skills/remotion/docs/` fetched from Remotion GitHub MDX (`pnpm docs:remotion`)
- **Browser QA** — `pnpm qa:browser` auto-discovers preview pages from docs
- **Typewriter** — blinking cursor, pause-after, per-character frames (Remotion skill pattern)

### Changed

- **Intro** composition uses `<Sequence>` timing per Remotion docs

## 0.2.0

### Added

- **Registry**: `motion-tokens`, `layout`, `use-stagger` hook
- **Primitives**: `spring-in`, `stagger-children`, `word-highlight`, `progress-bar`, `rotate-in`, `transition-fade`, `transition-slide`
- **Scenes**: `feature-list`, `stat-card`, `quote-card`, `end-card`
- **Composition**: `showcase` (TransitionSeries demo reel)
- **CLI**: `diff`, `build`, `update` commands; add preflight for Remotion version mismatch
- **Docs**: Advanced section, utilities reference, CLI guide, search API
- **CI**: GitHub Actions workflow

### Changed

- v0.1 primitives use Bézier enter/exit easing via `timing.ts` helpers
- `word-highlight` uses spring-animated highlighter wipe (Remotion skill pattern)
- `scaleFont` and safe-area helpers aligned with video-layout guidance

## 0.1.0

- Initial release: 8 primitives, 2 scenes, 1 composition
- CLI: `init`, `add`, `search`, `view`
- Fumadocs docs site with live Remotion previews
