import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_AUDIO_SRC } from "./demo-assets";
import {
  loadDemoAudioSrc,
  resetDemoAudioCacheForTests,
} from "./demo-assets-audio";

afterEach(() => {
  resetDemoAudioCacheForTests();
  vi.restoreAllMocks();
});

describe("loadDemoAudioSrc", () => {
  it("fetches the wav once for any number of callers", async () => {
    const fetcher = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
    const results = await Promise.all(
      Array.from({ length: 11 }, () =>
        loadDemoAudioSrc(fetcher as unknown as typeof fetch),
      ),
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(DEMO_AUDIO_SRC);
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toMatch(/^blob:/);
  });

  it("falls back to the static URL when the fetch fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetcher = vi.fn(async () => new Response(null, { status: 404 }));
    await expect(
      loadDemoAudioSrc(fetcher as unknown as typeof fetch),
    ).resolves.toBe(DEMO_AUDIO_SRC);
  });
});
