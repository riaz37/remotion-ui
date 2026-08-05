# remotion-ui-mcp

MCP (Model Context Protocol) server that exposes the RemotionUI component registry as agent tools over stdio.

It reuses the same registry-fetching logic as the `remotion-ui` CLI, so results match `remotion-ui search`/`view`/`add` exactly.

## Tools

| Tool | Description |
|------|-------------|
| `list-components` | List every component in the RemotionUI registry. |
| `search-components` | Search by free-text `query`, atlas `lane` (atoms, signals, spatial, …), or `tier` (core, advanced). |
| `get-component-detail` | Fetch the full registry item for a component — files, dependencies, `composition` metadata, and `compat`. Accepts `name`, optional `preset`, optional `registryUrl`. |
| `get-install-command` | Return the CLI command to install a component (`npx remotion-ui@latest add <name>`). |

Errors are returned as `isError` results carrying the same `{ code, message }` envelope as the CLI's `--json` mode.

## Install & configure

The server is not published standalone yet — run it from a monorepo checkout, or point your MCP client at the built entrypoint.

```bash
pnpm --filter remotion-ui-mcp build
```

This produces `dist/index.js` (stdio server) and `dist/index.d.ts`.

### Claude Code

Add to `.mcp.json` (project) or `claude mcp add`:

```json
{
  "mcpServers": {
    "remotion-ui": {
      "command": "node",
      "args": ["/absolute/path/to/packages/remotion-ui-mcp/dist/index.js"]
    }
  }
}
```

### Claude Desktop / other MCP clients

Point the client's stdio server config at the same `node dist/index.js` command.

## Development

```bash
pnpm --filter remotion-ui-mcp dev     # tsup watch mode
pnpm --filter remotion-ui-mcp test    # vitest
pnpm --filter remotion-ui-mcp build   # tsup one-shot build
```

Turbo enforces build ordering (`dependsOn: ["^build"]`), so `remotion-ui` (the CLI) builds before this package when run from the repo root.
