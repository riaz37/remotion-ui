import {
  fetchRegistryIndex,
  fetchRegistryItem,
  filterRegistryItems,
  RemotionUiError,
} from "remotion-ui/registry";

export type ToolTextContent = {
  type: "text";
  text: string;
};

export type ToolResult = {
  content: ToolTextContent[];
  isError?: boolean;
};

type StructuredErrorJson = {
  code: string;
  message: string;
};

function toStructuredError(error: unknown): StructuredErrorJson {
  if (error instanceof RemotionUiError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { code: "UNKNOWN", message: error.message };
  }
  return { code: "UNKNOWN", message: String(error) };
}

function okResult(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error: unknown): ToolResult {
  const structured = toStructuredError(error);
  return {
    content: [{ type: "text", text: JSON.stringify(structured, null, 2) }],
    isError: true,
  };
}

export type ListComponentsInput = {
  registryUrl?: string;
};

export async function listComponentsHandler(
  input: ListComponentsInput = {},
): Promise<ToolResult> {
  try {
    const index = await fetchRegistryIndex(input.registryUrl);
    return okResult(index);
  } catch (error) {
    return errorResult(error);
  }
}

export type SearchComponentsInput = {
  query?: string;
  lane?: string;
  tier?: string;
  registryUrl?: string;
};

export async function searchComponentsHandler(
  input: SearchComponentsInput = {},
): Promise<ToolResult> {
  try {
    const index = await fetchRegistryIndex(input.registryUrl);
    const results = filterRegistryItems(index.items, {
      query: input.query,
      lane: input.lane,
      tier: input.tier,
    });
    return okResult({ count: results.length, items: results });
  } catch (error) {
    return errorResult(error);
  }
}

export type GetComponentDetailInput = {
  name: string;
  preset?: string;
  registryUrl?: string;
};

export async function getComponentDetailHandler(
  input: GetComponentDetailInput,
): Promise<ToolResult> {
  try {
    const item = await fetchRegistryItem(input.name, {
      preset: input.preset,
      registryUrl: input.registryUrl,
    });
    return okResult(item);
  } catch (error) {
    return errorResult(error);
  }
}

export type GetInstallCommandInput = {
  name: string;
};

export function getInstallCommandHandler(
  input: GetInstallCommandInput,
): ToolResult {
  const command = `npx remotion-ui@latest add ${input.name}`;
  return okResult({ command });
}
