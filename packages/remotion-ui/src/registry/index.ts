export type RegistryFile = {
  path: string;
  type: string;
  target?: string;
  content?: string;
};

export type CompositionMetaJson = {
  id: string;
  component: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  importPath?: string;
};

export type CompatMetaJson = {
  remotion?: string;
};

export type RegistryItemJson = {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  composition?: CompositionMetaJson;
  compat?: CompatMetaJson;
  files: RegistryFile[];
};

export {
  DEFAULT_REGISTRY_URL,
  fetchRegistryItem,
} from "./fetch-item.js";
export type { FetchRegistryOptions } from "./fetch-item.js";

export { fetchRegistryIndex } from "./fetch-index.js";
export type { RegistryIndexAtlas, RegistryIndexItem } from "./fetch-index.js";

export { filterRegistryItems } from "./search-items.js";
export type { FilterRegistryItemsOptions } from "./search-items.js";

export { RemotionUiError } from "../utils/errors.js";
export type { ErrorCode, ErrorJson } from "../utils/errors.js";
