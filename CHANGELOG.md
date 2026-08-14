# Changelog

## Unreleased

### Added

- **`remotion-ui-mcp@0.1.1`** — README corrected; the npm package page no longer claims the server is unpublished. No code changes from 0.1.0.
- **`remotion-ui-mcp@0.1.0` is on npm** — `npx remotion-ui-mcp` runs the MCP server directly; no monorepo checkout needed. Four tools over stdio: `list-components`, `search-components`, `get-component-detail`, `get-install-command`. The docs now carry the `npx` config for Claude Code and other stdio clients.

## 0.8.0

### Added

- **Structured JSON output on every command** — `--json` on `init`, `add`, `doctor`, `list`, `search`, `view`, `update`, `diff`, and `build`. Failures print `{ ok: false, error: { code, message } }` and exit non-zero, so agents and CI can branch on a code instead of scraping stdout. Eleven codes: `CONFIG_NOT_FOUND`, `CONFIG_INVALID`, `REGISTRY_ITEM_NOT_FOUND`, `REGISTRY_FETCH_FAILED`, `REGISTRY_ITEM_INVALID`, `REGISTRY_INDEX_INVALID`, `TEMPLATE_NOT_FOUND`, `TARGET_EXISTS`, `INVALID_ARGS`, `DEPENDENCY_SPEC_INVALID`, `UNKNOWN`.
- **Agent skill installation** — `init --existing` writes a Claude Code skill to `.claude/skills/remotionui-agent/SKILL.md` covering the install-before-import workflow and the frame-API-only animation rules. `--agent-skill` opts a new project in; `--no-agent-skill` opts out.
- **`remotion-ui-mcp`** — an MCP server exposing the registry as four agent tools (`list-components`, `search-components`, `get-component-detail`, `get-install-command`) over stdio, sharing the CLI's registry client. Published separately as `remotion-ui-mcp` — see below.
- **Remotion version compatibility metadata** — registry items may declare `compat.remotion` as a semver range. `add` compares it against the Remotion version in your `package.json` and warns on a mismatch. The check is advisory and runs at install time only.
- **Registry search filters** — `search --lane <lane>` and `search --tier <tier>` alongside `-q`.
- **Docs pages as Markdown** — every docs page is served at `/llms.mdx/docs/<path>`, and each page carries a "Copy page for AI" button plus Open in Claude / ChatGPT links.

### Changed

- **Errors are typed end to end** — commands and preflights throw `RemotionUiError` with a code instead of bare `Error`, which is what makes the `--json` envelope possible. Human-readable output is unchanged.
- **Docs rewritten for the real flow** — the existing-project path is now `init --existing` rather than hand-writing `remotion-ui.json`; the CLI reference documents every flag, the error codes, compat checking, and automatic composition registration; a new MCP page covers install and config; a copy-paste starter prompt for agents sits on the Introduction and AI Usage pages.

### Notes for maintainers

- Deploy the docs site (`pnpm registry:build && pnpm --filter web build`) **before** publishing the CLI so `https://remotionui.com/r` serves the new registry JSON.

## 0.7.0

### Removed

- **Recipes are gone** — `remotion-ui add --recipe <slug>`, `remotion-ui init --starter social|podcast`, the `/ai/recipes.json` manifest, and the `/docs/recipes/*` pages have all been removed. Recipes were a second, thinner catalog on top of the registry: they duplicated component lists that drifted from the real dependency graph and gave agents two answers to the same question. Install the components or the composition directly instead — `npx remotion-ui add social-clip` does what `--recipe captioned-social-video` did, and `registryDependencies` now pull the rest.

### Added

- **`motion-primitive`** — one enter/exit contract behind every entrance primitive. Opacity finishes at ~55% of the entrance so the tail of the move happens on an opaque element, and an exit is not the entrance reversed: shorter, shorter-travelled, and accelerating away. Inside a `<Sequence>`, `exit` alone lands the element out at the end of its slot.
- **`text-emphasis`** — shared word/phrase emphasis resolution for caption and typography components.
- **`code-syntax`** — the tokenizer and theme behind the code scenes, extracted so `code-reveal`, `code-diff-wipe`, `code-accordion`, and the terminal scenes highlight identically.

### Changed

- **Every entrance primitive rebuilt on the shared contract** — the 13 atoms (`fade-in`, `slide-up`, `scale-in`, `blur-in`, `rotate-in`, `spring-in`, and friends) now derive from `motion-primitive` instead of hand-rolling their own curves, so they enter and exit as one system.
- **Scenes rebuilt across the catalog** — transitions, code and terminal scenes, creator scenes, UI-flow scenes, caption and audio components were re-authored on the current Remotion idiom and re-verified by rendering and sampling real frames, not by inspecting the browser preview.
- **Docs previews rebuilt on a shared `preview-stage`** — every component page frames its preview the same way, at the composition's real aspect and duration.
- **Landing page is now a program monitor** — the hero plays the `hero-loop` composition in a real Remotion Player with a scrub bar, poster frame, and keyboard transport, and the component grid became a contact sheet. Registry facts on the page are generated at build time, so the component count can't drift from the registry.
- **Registry at 126 items** across 112 documented components.

### Notes for maintainers

- Deploy the docs site (`pnpm registry:build && pnpm --filter web build`) **before** publishing the CLI so `https://remotionui.com/r` serves the new registry JSON.

## 0.6.2

### Fixed

- **`add` now pulls every file a component needs** — 57 registry items declared their components but not the internal libs they import (`motion-tokens`, `transition-timing`, `ai-composer-utils`, and friends), so installs landed with broken imports. All 123 items now declare their full `registryDependencies`.
- **App-replica scenes no longer overlap their own content** — `v0`, `chat-gpt`, `claude-chat`, and `claude-code` stack their composer, thread, and panel content in flow instead of pinning blocks to fixed offsets, so long prompts and long replies push layout instead of colliding with it.
- **Transitions render from the CLI slugs** — `blur-reveal`, `grid-pixelate-wipe`, and `frosted-glass-wipe` export helper functions rather than components; the render pipeline now resolves them through their preview wrappers instead of failing to find a composition.

### Changed

- **Remotion 4.0.505** across the app template and test fixtures, with the bundled agent skills re-synced to match.
- **Caption and audio components rebuilt on current Remotion idiom** — `caption-scene`, `caption-highlight`, `karaoke-captions`, `audiogram-*`, and `waveform-line` follow the 4.0.505 patterns.
- **Motion tokens applied consistently** — primitives use transform shorthands, and the shared app-replica `fadeUp` helper eases on the `EASING.enter` curve instead of a hand-rolled linear ramp.

### Notes for maintainers

- All 108 renderable registry components were smoke-rendered end to end before this release.
- Deploy the docs site (`pnpm registry:build && pnpm --filter web build`) **before** publishing the CLI so `https://remotionui.com/r` serves the new registry JSON.

## 0.6.0

### Added

- **Motion catalog expansion** — 46+ net-new registry components: typography primitives, transitions, UI blocks, compositions, and AI composer scenes (`claude-chat`, `chat-gpt`, `v0`, `claude-code`, `opencode`).
- **12 new composition templates** — `hero-device-assemble`, `ecosystem-orbit`, `bento-pan`, `browser-flow`, `ai-generation-canvas`, `live-code-split`, `deploy-reveal`, `dashboard-populate`, `pricing-focus`, `landing-code-showcase`, `tool-menu-slide`, `image-expand`.
- **Developer-friendly categorization** — unified Atlas lane labels, tag sub-sections in the docs sidebar, and tag filters on the component browse page.
- **`transition-timing` and `ai-composer-utils` libs** — shared helpers for polished transitions and AI composer scenes.

### Changed

- **Registry scale** — 124 installable items (up from 78); docs catalog at 113 component pages.
- **CLI version** — reads semver from `package.json` so `remotion-ui --version` stays in sync with npm.
- **Docs IA** — recipe wizard removed from AI Usage nav; AI Usage sidebar no longer duplicates its index page.

### Notes for maintainers

- Deploy the docs site (`pnpm registry:build && pnpm --filter web build`) **before** publishing the CLI so `https://remotionui.com/r` serves the new registry JSON.

## 0.5.2

### Added

- **Star prompts** at first-value touchpoints — README, CLI `add`/`init` success output, and installation docs.

### Changed

- **`update` no longer shows the star prompt** — avoids nagging on repeat maintenance runs.

## 0.5.1

### Added

- **`init --starter`** — `npx remotion-ui init my-reel --starter social|podcast` scaffolds a project and installs the matching recipe, then prints the render command.
- **Registry composition metadata** for `creator-reel`, `podcast-clip`, and `data-story` so `add --recipe` auto-registers compositions in `Root.tsx`.
- **`creator-reel` AI recipe** with install command, render command, and docs page.
- **CaptionScene `mode` prop** — `highlight`, `karaoke-scale`, and `karaoke-underline`; flagships default to karaoke-scale.
- **Composition playground** for `podcast-clip` and `data-story`; expanded `creator-reel` editable props.
- **Recipe render pipeline** — `flagshipComposition`, `compositionId`, and `renderCommand` in recipes manifest; `<RenderCommand>` blocks on recipe docs.
- **Showcase render script** — `pnpm render:showcases` renders flagship MP4s into `public/showcases/`.

### Changed

- **Docs SEO** — stronger catalog/homepage metadata, sitemap coverage, FAQ JSON-LD on intro and captions pages; auto-generated `llms.txt`.
- **Flagship polish** — `podcast-clip` hook uses `AutoFitTitle`; `creator-reel` exposes talking-head copy as props; homepage features `data-story`.
- **Docs IA** — removed redundant guides section; shadcn comparison on intro; captions guide merged into advanced docs.
- **Recipe wizard** — deep-links to composition playground when available.

### Fixed

- `ShowcaseVideo` no longer breaks static docs builds when showcase MP4s are missing.

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
