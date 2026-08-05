"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const ENTER = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: ReactNode;
  /** Stagger position within a group. */
  index?: number;
  /** Travel distance in px. Larger reads as heavier material. */
  distance?: number;
  className?: string;
};

/**
 * Scroll-entry reveal. Motivated by hierarchy: sections announce themselves in
 * reading order instead of arriving as one flat block.
 */
export function Reveal({
  children,
  index = 0,
  distance = 24,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: ENTER }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Horizontal counterpart. Used where the composition itself is lateral (the
 * filmstrip rail) so the motion matches the axis the eye already travels.
 */
export function RevealSide({
  children,
  index = 0,
  from = "left",
  className,
}: RevealProps & { from?: "left" | "right" }) {
  const reduce = useReducedMotion();
  const x = from === "left" ? -32 : 32;

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: ENTER }}
    >
      {children}
    </motion.div>
  );
}
