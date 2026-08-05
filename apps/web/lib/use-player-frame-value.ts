"use client";

import type { CallbackListener, PlayerRef } from "@remotion/player";
import { useMotionValue, type MotionValue } from "motion/react";
import { useEffect, type RefObject } from "react";

/**
 * Player position as a MotionValue.
 *
 * `useCurrentPlayerFrame` keeps the frame in React state, which is fine for a
 * docs panel but not for the hero: the playhead moves thirty times a second and
 * the Player is mounted in the same tree, so a state write per frame would
 * re-render the composition's host on every frame. A MotionValue lets the scrub
 * bar write straight to the DOM and never re-render anything.
 *
 * @see https://www.remotion.dev/docs/player/current-time
 */
export function usePlayerFrameValue(
  ref: RefObject<PlayerRef | null>,
): MotionValue<number> {
  const frame = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    let detach: (() => void) | undefined;

    const attach = (): boolean => {
      const player = ref.current;
      if (!player) return false;

      const handler: CallbackListener<"frameupdate"> = ({ detail }) => {
        frame.set(detail.frame);
      };

      player.addEventListener("frameupdate", handler);
      frame.set(player.getCurrentFrame());
      detach = () => player.removeEventListener("frameupdate", handler);
      return true;
    };

    // The Player mounts its imperative handle a tick after the element exists.
    if (!attach()) {
      raf = window.requestAnimationFrame(() => {
        attach();
      });
    }

    return () => {
      window.cancelAnimationFrame(raf);
      detach?.();
    };
  }, [ref, frame]);

  return frame;
}
