import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getComponentDetailHandler,
  getInstallCommandHandler,
  listComponentsHandler,
  searchComponentsHandler,
} from "./tools.js";

const server = new McpServer({
  name: "remotion-ui-mcp",
  version: "0.1.0",
});

server.registerTool(
  "list-components",
  {
    title: "List RemotionUI components",
    description: "List every component in the RemotionUI registry.",
  },
  async () => listComponentsHandler(),
);

server.registerTool(
  "search-components",
  {
    title: "Search RemotionUI components",
    description:
      "Search the RemotionUI registry by free-text query, atlas lane, or tier.",
    inputSchema: {
      query: z.string().optional().describe("Free-text search query"),
      lane: z
        .string()
        .optional()
        .describe("Filter by atlas lane (atoms, signals, spatial, ...)"),
      tier: z.string().optional().describe("Filter by tier (core, advanced)"),
    },
  },
  async (args) => searchComponentsHandler(args),
);

server.registerTool(
  "get-component-detail",
  {
    title: "Get RemotionUI component detail",
    description:
      "Fetch the full registry item for a component, including files, dependencies, compat, and prop schema data.",
    inputSchema: {
      name: z.string().describe("Component name"),
      preset: z.string().optional().describe("Registry preset"),
      registryUrl: z
        .string()
        .optional()
        .describe("Registry base URL or local path"),
    },
  },
  async (args) => getComponentDetailHandler(args),
);

server.registerTool(
  "get-install-command",
  {
    title: "Get RemotionUI install command",
    description:
      "Return the CLI command to install a component into a project.",
    inputSchema: {
      name: z.string().describe("Component name"),
    },
  },
  async (args) => getInstallCommandHandler(args),
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error(
    "remotion-ui-mcp failed to start:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
