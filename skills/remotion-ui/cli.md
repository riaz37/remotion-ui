# RemotionUI CLI Reference

## Commands

| Command | Description |
|---------|-------------|
| `remotion-ui init [name]` | Scaffold a new Remotion project |
| `remotion-ui init --existing` | Bootstrap `remotion-ui.json` in an existing Remotion project |
| `remotion-ui init [--agent-skill\|--no-agent-skill]` | Install/skip the RemotionUI agent skill at `.claude/skills/remotionui-agent/SKILL.md` — defaults to **on** with `--existing`, **off** for a fresh scaffold |
| `remotion-ui add <name...>` | Add component(s) from registry |
| `remotion-ui doctor` | Diagnose `remotion-ui.json`, aliases, and Remotion setup |
| `remotion-ui update <name...>` | Re-install from registry (overwrites files) |
| `remotion-ui diff <name>` | Diff installed vs registry version |
| `remotion-ui search -q <query> [--lane] [--tier]` | Search the registry |
| `remotion-ui list` | List registry components and installed status |
| `remotion-ui build [registry.json]` | Build a custom registry |
| `remotion-ui view <name>` | View registry item details |

Every command accepts `--json` for machine-readable output; on failure it prints `{"ok": false, "error": {"code", "message"}}` (see `ErrorCode` in `packages/remotion-ui/src/utils/errors.ts`) and exits non-zero instead of a human-readable message.

## Version compatibility

Registry items may carry `compat.remotion` (a semver range). `add`/`update` read the target project's installed `remotion` version from `package.json` and print a warning (not a hard failure) when it doesn't satisfy the range.

## Prop schemas

Flagship components (`fade-in`, `caption-highlight`, `intro`, `social-clip`, `creator-reel`) expose a JSON Schema fragment per prop (`schema` field) alongside the human-readable `type` string in `apps/web/lib/component-reference.ts`, for agents that want to validate props programmatically.

## MCP server

`packages/remotion-ui-mcp` exposes the registry as MCP tools (`list-components`, `search-components`, `get-component-detail`, `get-install-command`) over stdio for MCP-capable agents — see `packages/remotion-ui-mcp/README.md`.

## User config: remotion-ui.json

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

## Published npm package

Only `remotion-ui` (the CLI) is published. Subpath exports:

- `remotion-ui/schema`
- `remotion-ui/registry`
