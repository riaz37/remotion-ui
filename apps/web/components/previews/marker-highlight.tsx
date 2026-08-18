"use client";

import { MarkerHighlight } from "../registry-exports";
import { DEMO_COPY, DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame, PreviewKicker } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * Beat plan against the 110-frame window. The whole demo used to be over by
 * frame 51 — under half the loop — so the audit's 50% and 90% samples were the
 * same finished card. The flagship stroke now runs to frame 56 and the three
 * variants draw one after another behind it, the last landing on frame 94
 * (85% of the window), which is the "finish late, then rest" shape rather than
 * "finish early, then freeze".
 */
const PRIMARY = { delay: 14, duration: 12, stagger: 6 } as const;
const SECONDARY_START = 50;
const SECONDARY_STEP = 11;

/** The three variants shown under the flagship marker stroke. */
const SECONDARY = [
  { variant: "knockout", label: "knockout" },
  { variant: "underline", label: "underline" },
  { variant: "box", label: "box" },
] as const;

export const MarkerHighlightPreview: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <PreviewFrame lane="atoms" padding={56}>
      <div
        style={{
          display: "grid",
          gap: 22,
          justifyItems: "center",
          width: 720,
          padding: "36px 44px",
          borderRadius: 8,
          background: tokens.panelFill,
          border: `1px solid ${tokens.panelBorder}`,
        }}
      >
        <PreviewKicker>{DEMO_COPY.quote.attribution}</PreviewKicker>
        {/* Wrapped on purpose: the phrase crosses a line break, which is where
         * a band that drifts line to line shows up. */}
        <MarkerHighlight
          text={DEMO_COPY.quote.text}
          phrase="code you can read and change"
          delayInFrames={PRIMARY.delay}
          durationInFrames={PRIMARY.duration}
          staggerInFrames={PRIMARY.stagger}
          fontSize={40}
          textAlign="center"
          color={tokens.ink}
          markerColor={DEMO_PALETTE.phosphor}
        />
        <div
          style={{
            display: "grid",
            gap: 14,
            justifyItems: "center",
            width: "100%",
          }}
        >
          {SECONDARY.map(({ variant, label }, index) => (
            <div
              key={variant}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 16,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: tokens.muted,
                  fontSize: 15,
                  width: 78,
                  textAlign: "right",
                }}
              >
                {label}
              </span>
              <MarkerHighlight
                variant={variant}
                text="Ship the whole scene"
                phrase="the whole scene"
                delayInFrames={SECONDARY_START + index * SECONDARY_STEP}
                durationInFrames={12}
                staggerInFrames={5}
                fontSize={26}
                color={tokens.ink}
                markerColor={DEMO_PALETTE.phosphor}
                style={{ width: 300 }}
              />
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
};
