import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rate-limit";

const OPTIONS = { limit: 3, windowMs: 60_000 };

describe("checkRateLimit", () => {
  beforeEach(resetRateLimits);

  it("allows up to the limit inside one window", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(checkRateLimit("ip", OPTIONS, 1_000).allowed).toBe(true);
    }
  });

  it("blocks the next attempt and reports when to retry", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      checkRateLimit("ip", OPTIONS, 1_000);
    }

    const blocked = checkRateLimit("ip", OPTIONS, 31_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(30);
  });

  it("keys buckets independently", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      checkRateLimit("a", OPTIONS, 1_000);
    }

    expect(checkRateLimit("b", OPTIONS, 1_000).allowed).toBe(true);
  });

  it("reopens once the window has passed", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      checkRateLimit("ip", OPTIONS, 1_000);
    }

    expect(checkRateLimit("ip", OPTIONS, 62_000).allowed).toBe(true);
  });
});
