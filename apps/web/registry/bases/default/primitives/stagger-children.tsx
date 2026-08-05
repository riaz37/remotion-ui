import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Sequence, useVideoConfig } from "remotion";
import {
  defaultExitFrames,
  DEFAULT_ENTER_FRAMES,
  type EnterExitOptions,
} from "@/remotion/lib/motion-primitive";
import { staggerDelay } from "@/remotion/lib/timing";

export type StaggerOrder = "forward" | "reverse" | "center" | "edges";

export type StaggerChildrenProps = {
  children: ReactNode;
  /** Frames between one child starting and the next. */
  staggerInFrames?: number;
  /** Frames before the first child starts. */
  baseDelayInFrames?: number;
  /**
   * Which child goes first. `center` runs outwards from the middle, `edges`
   * runs inwards — both read as one gesture across a row rather than a queue.
   */
  order?: StaggerOrder;
  /**
   * Frames between one child leaving and the next, in the order they arrived.
   * Only affects children that animate out; 0 lands the group together.
   */
  exitStaggerInFrames?: number;
};

/** Position in the run order, 0 = first to start. */
function rankOf(index: number, count: number, order: StaggerOrder): number {
  const mid = (count - 1) / 2;

  switch (order) {
    case "reverse":
      return count - 1 - index;
    case "center":
      return Math.round(Math.abs(index - mid));
    case "edges":
      return Math.round(mid - Math.abs(index - mid));
    default:
      return index;
  }
}

/** Host elements would render an unknown attribute; only components take props. */
function acceptsMotionProps(child: ReactElement): boolean {
  return typeof child.type !== "string";
}

/**
 * Offsets each child onto its own slot with `<Sequence layout="none">`, so
 * every child animates from its local frame 0 and needs no delay of its own.
 *
 * Inside a bounded window each slot is given an end as well, which is what
 * lets children with `exit` land out on time. `exitStaggerInFrames` moves each
 * child's exit earlier instead of shortening its slot — cutting slots short
 * would unmount children one by one and collapse the layout under them.
 *
 * @see skills/remotion/remotion-markup/sequencing.md
 */
export const StaggerChildren: React.FC<StaggerChildrenProps> = ({
  children,
  staggerInFrames = 8,
  baseDelayInFrames = 0,
  order = "forward",
  exitStaggerInFrames = 0,
}) => {
  const { durationInFrames: windowFrames } = useVideoConfig();
  const items = Children.toArray(children);
  const bounded = Number.isFinite(windowFrames);

  return (
    <>
      {items.map((child, index) => {
        if (!isValidElement(child)) {
          return child;
        }

        const rank = rankOf(index, items.length, order);
        const from = staggerDelay(rank, staggerInFrames, baseDelayInFrames);
        const slot = bounded ? Math.max(1, windowFrames - from) : undefined;

        /* First in, first out: the wave leaves in the order it arrived. */
        const lag = (items.length - 1 - rank) * exitStaggerInFrames;
        const element =
          lag > 0 && slot !== undefined && acceptsMotionProps(child)
            ? cloneElement(child, staggeredExit(child, slot, lag))
            : child;

        return (
          <Sequence
            key={child.key ?? `stagger-${index}`}
            from={from}
            durationInFrames={slot}
            layout="none"
          >
            {element}
          </Sequence>
        );
      })}
    </>
  );
};

/** Exit start that lands this child `lag` frames before the end of its slot. */
function staggeredExit(
  child: ReactElement,
  slot: number,
  lag: number,
): EnterExitOptions {
  const props = child.props as EnterExitOptions;
  if (props.exitAtInFrames !== undefined) return {};

  const exitFrames =
    props.exitInFrames ??
    defaultExitFrames(props.durationInFrames ?? DEFAULT_ENTER_FRAMES);

  return { exitAtInFrames: Math.max(0, slot - exitFrames - lag) };
}
