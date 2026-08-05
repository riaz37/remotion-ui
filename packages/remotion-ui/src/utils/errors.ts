export type ErrorCode =
  | "CONFIG_NOT_FOUND"
  | "CONFIG_INVALID"
  | "REGISTRY_ITEM_NOT_FOUND"
  | "REGISTRY_FETCH_FAILED"
  | "REGISTRY_ITEM_INVALID"
  | "REGISTRY_INDEX_INVALID"
  | "TEMPLATE_NOT_FOUND"
  | "TARGET_EXISTS"
  | "INVALID_ARGS"
  | "DEPENDENCY_SPEC_INVALID"
  | "UNKNOWN";

export class RemotionUiError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "RemotionUiError";
  }
}

export type ErrorJson = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export function toErrorJson(error: unknown): ErrorJson {
  if (error instanceof RemotionUiError) {
    return { ok: false, error: { code: error.code, message: error.message } };
  }

  if (error instanceof Error) {
    return { ok: false, error: { code: "UNKNOWN", message: error.message } };
  }

  return { ok: false, error: { code: "UNKNOWN", message: String(error) } };
}
