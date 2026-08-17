"use client";

import { StrikethroughReplace } from "../registry-exports";
import { DEMO_PALETTE } from "@/lib/demo-assets";
import { PreviewFrame, PreviewKicker } from "./preview-frame";
import { usePreviewStage } from "./preview-stage";

/**
 * Three corrections on one revision sheet, started 30 frames apart.
 *
 * The stagger is what makes the component legible in a still: on any sampled
 * frame one row is being struck, one is mid-handoff and one has already
 * resolved, so a reader lands on the whole gesture instead of a single beat.
 * A lone line on the stage showed only whichever beat the sample happened to
 * catch, and never the replacement it is named for.
 */
const ROWS = [
  { label: "subhead", from: "Rendered somewhere else", to: "Rendered in your repo", delay: 40 },
  { label: "body", from: "Hand-tuned keyframes", to: "One timing token", delay: 70 },
] as const;

export const StrikethroughReplacePreview: React.FC = () => {
  const tokens = usePreviewStage();

  return (
    <PreviewFrame lane="atoms" padding={56}>
      <div
        style={{
          display: "grid",
          gap: 30,
          width: 800,
          padding: "42px 52px",
          borderRadius: 8,
          background: tokens.panelFill,
          border: `1px solid ${tokens.panelBorder}`,
        }}
      >
        <PreviewKicker>Copy revision · v3</PreviewKicker>
        <StrikethroughReplace
          from="Motion you rent"
          to="Motion you own"
          delayInFrames={10}
          strikeDurationInFrames={18}
          holdInFrames={5}
          departDurationInFrames={14}
          replaceDelayInFrames={12}
          replaceDurationInFrames={22}
          fontSize={62}
          textAlign="left"
          color={tokens.ink}
          strikeColor={DEMO_PALETTE.phosphor}
        />
        <div style={{ display: "grid", gap: 20 }}>
          {ROWS.map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 20,
              }}
            >
              <span
                style={{
                  color: tokens.muted,
                  fontSize: 16,
                  width: 72,
                  textAlign: "right",
                }}
              >
                {row.label}
              </span>
              <StrikethroughReplace
                from={row.from}
                to={row.to}
                delayInFrames={row.delay}
                strikeDurationInFrames={18}
                holdInFrames={5}
                departDurationInFrames={14}
                replaceDelayInFrames={12}
                replaceDurationInFrames={22}
                fontSize={32}
                textAlign="left"
                color={tokens.ink}
                strikeColor={DEMO_PALETTE.phosphor}
              />
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
};
