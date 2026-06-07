# Changelog

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
