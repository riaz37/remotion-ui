export type RegistryFile = {
  path: string;
  type: string;
  target?: string;
  content?: string;
};

export type RegistryItemJson = {
  name: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
};

export {
  DEFAULT_REGISTRY_URL,
  fetchRegistryItem,
} from "./fetch-item.js";
export type { FetchRegistryOptions } from "./fetch-item.js";
