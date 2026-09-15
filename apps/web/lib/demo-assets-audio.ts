"use client";

import { useSyncExternalStore } from "react";
import { DEMO_AUDIO_SRC } from "./demo-assets";

/**
 * One in-memory copy of `demo-loop.wav` for every audio preview on a page.
 *
 * Both consumers — `@remotion/media` `<Audio>` and `useWindowedAudioData()` —
 * read through a mediabunny `UrlSource`, which issues `Range: bytes=0-` fetches
 * that abort after the header and re-read. Ranged, cancelled responses never
 * land in the HTTP cache (and `public/` is served `max-age=0` in dev and on
 * Vercel), so the catalog pulled the same 375KB file dozens of times. Fetching
 * it once and handing out a `blob:` URL keeps every later read in memory.
 */

type Listener = () => void;

let resolvedSrc: string | null = null;
let pending: Promise<string> | null = null;
const listeners = new Set<Listener>();

const settle = (src: string): string => {
  resolvedSrc = src;
  for (const listener of listeners) listener();
  return src;
};

/** Resolves to a shared `blob:` URL, or the static URL if the fetch fails. */
export function loadDemoAudioSrc(
  fetcher: typeof fetch = fetch,
): Promise<string> {
  if (pending) return pending;
  pending = fetcher(DEMO_AUDIO_SRC)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`demo audio fetch failed: ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => settle(URL.createObjectURL(blob)))
    .catch((error: unknown) => {
      console.warn("[demo-assets] falling back to static audio URL", error);
      return settle(DEMO_AUDIO_SRC);
    });
  return pending;
}

const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  if (!resolvedSrc) void loadDemoAudioSrc();
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): string | null => resolvedSrc;
const getServerSnapshot = (): string | null => null;

/**
 * The shared demo audio URL, or `null` until it has loaded. Gate audio
 * consumers on it so they never start a fetch against the network URL.
 */
export function useDemoAudioSrc(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Test-only: forget the cached copy. */
export function resetDemoAudioCacheForTests(): void {
  resolvedSrc = null;
  pending = null;
}
