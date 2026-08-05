> If RemotionUI saves you time, please ⭐ star the repo — it helps a lot!

# remotion-ui

Production-ready motion for Remotion. Source you own.

CLI for adding Remotion video components to your project, not a runtime dependency.

> Same registry workflow as [shadcn/ui](https://ui.shadcn.com): `npx add`, JSON manifest, files in your repo.

## Quick start

```bash
npx remotion-ui@latest init my-video
cd my-video
npx remotion-ui@latest add fade-in
npx remotion-ui@latest add intro
```

Components are installed into your project as source files. You own the code.

## Commands

| Command | Description |
|---------|-------------|
| `remotion-ui init [name]` | Scaffold a new Remotion project |
| `remotion-ui init --existing` | Bootstrap `remotion-ui.json` in an existing Remotion project |
| `remotion-ui add <name...>` | Add component(s) from the registry |
| `remotion-ui doctor` | Diagnose `remotion-ui.json`, aliases, and Remotion setup |
| `remotion-ui search -q <query>` | Search the registry (filter with `--lane`, `--tier`) |
| `remotion-ui view <name>` | View registry item metadata |
| `remotion-ui list` | List registry components and installed status |
| `remotion-ui diff <name>` | Diff installed vs registry |
| `remotion-ui update <name...>` | Re-install from registry (overwrites files) |
| `remotion-ui build [registry.json]` | Build a custom registry |

Every command accepts `--json` for machine-readable output. On failure it prints `{"ok": false, "error": {"code", "message"}}` and exits non-zero instead of a human-readable error message — codes include `CONFIG_NOT_FOUND`, `CONFIG_INVALID`, `REGISTRY_ITEM_NOT_FOUND`, `REGISTRY_FETCH_FAILED`, `TEMPLATE_NOT_FOUND`, `TARGET_EXISTS`, `INVALID_ARGS`, and `DEPENDENCY_SPEC_INVALID`.

## Agent integration

- `remotion-ui init --agent-skill` installs a bundled Claude Code skill to `.claude/skills/remotionui-agent/SKILL.md` in the target project (on by default with `--existing`; opt-in with `--agent-skill` on a fresh scaffold, opt-out with `--no-agent-skill`).
- [`remotion-ui-mcp`](../remotion-ui-mcp/README.md) exposes the registry as MCP tools (`list-components`, `search-components`, `get-component-detail`, `get-install-command`) for MCP-capable agents.
- Registry items carry a `compat.remotion` semver range; `add`/`update` warn (not block) when the installed `remotion` version in the target project's `package.json` doesn't satisfy it.
- Flagship components carry a JSON Schema fragment per prop (`PropDefinition.schema`) alongside the human-readable `type` string, for agents that validate props before writing code.

## Configuration

Create `remotion-ui.json` in your project root (included by `init`):

```json
{
  "preset": "default",
  "aliases": {
    "primitives": "@/remotion/primitives",
    "scenes": "@/remotion/scenes",
    "compositions": "@/compositions",
    "lib": "@/remotion/lib",
    "hooks": "@/remotion/hooks"
  }
}
```

## Programmatic API

```ts
import { fetchRegistryItem } from "remotion-ui/registry";
import { remotionUiConfigSchema } from "remotion-ui/schema";
```

## Publishing (maintainers)

Run the full preflight before tagging or publishing:

```bash
pnpm prepare:publish
```

Then deploy [remotionui.com](https://remotionui.com) so the hosted registry is live, tag `v0.x.x`, and publish:

```bash
pnpm publish:cli
```

Requires npm auth (`NPM_TOKEN` in `.env` or GitHub Actions `npm-publish` environment).
