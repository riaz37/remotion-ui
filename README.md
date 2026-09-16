<div align="center">

<img src="https://raw.githubusercontent.com/riaz37/remotion-ui/main/apps/web/public/logo.svg" alt="RemotionUI" width="56" height="56" />

# RemotionUI

**206 copy-paste components for [Remotion](https://www.remotion.dev). Source you own, frame by frame.**

<a href="https://remotionui.com"><img src="https://img.shields.io/badge/docs-remotionui.com-e8b563?style=flat-square" alt="Docs" /></a>
<a href="https://www.npmjs.com/package/remotion-ui"><img src="https://img.shields.io/npm/v/remotion-ui?style=flat-square&color=e8b563" alt="npm version" /></a>
<a href="https://github.com/riaz37/remotion-ui/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/riaz37/remotion-ui/ci.yml?branch=main&style=flat-square&label=ci" alt="CI" /></a>
<a href="https://www.npmjs.com/package/remotion-ui"><img src="https://img.shields.io/npm/dm/remotion-ui?style=flat-square&color=e8b563" alt="npm downloads" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT License" /></a>

<img src="https://raw.githubusercontent.com/riaz37/remotion-ui/main/.github/assets/readme-hero.webp" alt="The RemotionUI mark and install command beside a grid of component tiles flipping between layouts" width="700" />

[Browse components](https://remotionui.com/docs/components/browse) · [Quick start](https://remotionui.com/docs/installation) · [CLI](https://remotionui.com/docs/cli) · [MCP server](https://remotionui.com/docs/mcp)

</div>

## Install

```bash
npx remotion-ui@latest init my-video
cd my-video
npx remotion-ui@latest add social-clip
```

Already have a Remotion project? `npx remotion-ui@latest init --existing`.

Or install straight from the shadcn CLI — every component is published under the `@remotionui` namespace:

```bash
npx shadcn@latest add @remotionui/social-clip
```

## What you get

`add social-clip` writes a 9:16 clip — hook, audiogram, captions, end card — into your repo as plain `.tsx`. Register it and render:

```tsx
import { Composition } from "remotion";
import { SocialClip } from "@/compositions/social-clip/index";

export const RemotionRoot = () => (
  <Composition
    id="SocialClip"
    component={SocialClip}
    durationInFrames={228}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      hookTitle: "This line stops the scroll",
      podcastTitle: "Weekly Brief",
      ctaTitle: "Hear the full episode",
    }}
  />
);
```

Every prop is yours to change, and so is every frame behind it — the scenes, the easing, the transition timing.

## Set it up with your agent

Paste this into Claude Code, Cursor, or any agent with shell access:

```text
Set up RemotionUI in this project. Run `npx remotion-ui@latest init --existing --agent-skill`
to install the CLI config and the RemotionUI agent skill, then use
`npx remotion-ui@latest search -q <what I need> --json` to find components
and `npx remotion-ui@latest add <name>` to install them.
```

Every command speaks `--json`. There's also an [agent index](https://remotionui.com/ai/components.json), [llms.txt](https://remotionui.com/llms.txt), and an [MCP server](packages/remotion-ui-mcp/README.md) for search-and-install over the registry.

## What's inside

206 components, grouped by how they behave on the timeline:

| Lane | Count | What it covers |
|------|------:|----------------|
| **Scenes** | 53 | Composed layouts, cards, UI blocks |
| **Primitives** | 51 | Motion, text effects, backgrounds |
| **Data & media** | 38 | Captions, audio, charts, live metrics |
| **Compositions** | 21 | Full video templates, ready to render |
| **Transitions** | 18 | `TransitionSeries` scene cuts |
| **Paths & shapes** | 11 | SVG draw-on, logos, cursors |
| **Maps & device** | 8 | Map scenes and device mockups |
| **Shaders** | 5 | Full-frame GPU fields, evaluated per pixel |
| **3D** | 1 | WebGL scenes via `@remotion/three` |

Six of them, actually moving:

<table>
<tr>
<td align="center" width="33%"><img src="https://raw.githubusercontent.com/riaz37/remotion-ui/main/.github/assets/tiles/aurora-bg.webp" width="260" alt="Aurora ribbons folding across two overlapping timing beats" /><br /><sub><b>aurora-bg</b> · Primitives</sub></td>
<td align="center" width="33%"><img src="https://raw.githubusercontent.com/riaz37/remotion-ui/main/.github/assets/tiles/bar-chart-race.webp" width="260" alt="Ranked bars racing and reordering" /><br /><sub><b>bar-chart-race</b> · Data &amp; media</sub></td>
<td align="center" width="33%"><img src="https://raw.githubusercontent.com/riaz37/remotion-ui/main/.github/assets/tiles/kanban-move.webp" width="260" alt="A card moving between kanban columns" /><br /><sub><b>kanban-move</b> · Scenes</sub></td>
</tr>
<tr>
<td align="center" width="33%"><img src="https://raw.githubusercontent.com/riaz37/remotion-ui/main/.github/assets/tiles/device-mockup-3d.webp" width="260" alt="A laptop mockup rotating in 3D" /><br /><sub><b>device-mockup-3d</b> · 3D</sub></td>
<td align="center" width="33%"><img src="https://raw.githubusercontent.com/riaz37/remotion-ui/main/.github/assets/tiles/split-text-chars.webp" width="260" alt="A headline resolving character by character" /><br /><sub><b>split-text-chars</b> · Primitives</sub></td>
<td align="center" width="33%"><img src="https://raw.githubusercontent.com/riaz37/remotion-ui/main/.github/assets/tiles/commit-graph.webp" width="260" alt="A git commit graph drawing itself" /><br /><sub><b>commit-graph</b> · Scenes</sub></td>
</tr>
</table>

[Browse the full catalog →](https://remotionui.com/docs/components/browse)

## Why it holds up under render

A component that looks right in the browser can still render wrong. Every component here is checked by rendering it and inspecting the actual output frames — not by screenshotting a preview — which is how the silent ones get caught: frozen tails, dead frames, `delayRender` gaps on map tiles, `Math.random()` that breaks determinism across a distributed render.

## CLI

```bash
npx remotion-ui@latest search -q caption   # find components
npx remotion-ui@latest add caption-scene   # install with dependencies
npx remotion-ui@latest diff caption-scene  # see your edits vs registry
npx remotion-ui@latest doctor              # diagnose config and aliases
```

Full reference: [remotionui.com/docs/cli](https://remotionui.com/docs/cli)

## Guides

**Build** — [Authoring scenes](https://remotionui.com/docs/guides/authoring-scenes) · [Motion tokens](https://remotionui.com/docs/guides/motion-tokens) · [Transitions](https://remotionui.com/docs/guides/transitions)

**Media** — [Captions](https://remotionui.com/docs/guides/captions) · [Audio visualization](https://remotionui.com/docs/guides/audio-viz) · [Maps](https://remotionui.com/docs/guides/maps)

## Contributing

Component ideas, bug reports, and PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the monorepo layout, dev setup, and how to author a registry component.

Built by [@riaz37](https://github.com/riaz37). If RemotionUI saved you a render, a ⭐ is how other people find it.

## License

MIT
