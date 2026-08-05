import { describe, expect, it } from "vitest";
import { RemotionUiError, toErrorJson } from "./errors.js";

describe("toErrorJson", () => {
  it("uses the code and message from a RemotionUiError", () => {
    const error = new RemotionUiError("CONFIG_NOT_FOUND", "no config here");
    expect(toErrorJson(error)).toEqual({
      ok: false,
      error: { code: "CONFIG_NOT_FOUND", message: "no config here" },
    });
  });

  it("falls back to UNKNOWN for a plain Error", () => {
    const error = new Error("something broke");
    expect(toErrorJson(error)).toEqual({
      ok: false,
      error: { code: "UNKNOWN", message: "something broke" },
    });
  });

  it("stringifies a non-Error thrown value with UNKNOWN code", () => {
    expect(toErrorJson("just a string")).toEqual({
      ok: false,
      error: { code: "UNKNOWN", message: "just a string" },
    });

    expect(toErrorJson({ weird: true })).toEqual({
      ok: false,
      error: { code: "UNKNOWN", message: String({ weird: true }) },
    });
  });
});
