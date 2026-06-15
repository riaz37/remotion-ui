"use client";

import type { CallbackListener, PlayerRef } from "@remotion/player";
import { useEffect, useState, type RefObject } from "react";

/**
 * Subscribe to Remotion Player frame updates for timecode UI.
 * @see https://www.remotion.dev/docs/player/current-time
 */
export function useCurrentPlayerFrame(
  ref: RefObject<PlayerRef | null>,
): number {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let raf = 0;

    const attach = () => {
      const player = ref.current;
      if (!player) return false;

      const handler: CallbackListener<"frameupdate"> = ({ detail }) => {
        setFrame(detail.frame);
      };

      player.addEventListener("frameupdate", handler);
      setFrame(player.getCurrentFrame());

      cleanup = () => {
        player.removeEventListener("frameupdate", handler);
      };
      return true;
    };

    if (!attach()) {
      raf = window.requestAnimationFrame(() => {
        attach();
      });
    }

    return () => {
      window.cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [ref]);

  return frame;
}
