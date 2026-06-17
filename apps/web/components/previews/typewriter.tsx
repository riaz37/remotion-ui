"use client";

import { Typewriter } from "../registry-exports";
import { DEMO_COPY } from "@/lib/demo-assets";
import { CodePanel, PreviewFrame, PreviewKicker } from "./preview-frame";

const typewriterText = `${DEMO_COPY.tutorial.calloutTitle}. ${DEMO_COPY.tutorial.calloutSubtitle}`;

export const TypewriterPreview: React.FC = () => (
  <PreviewFrame lane="atoms" padding={72}>
    <div style={{ display: "grid", gap: 36, justifyItems: "center", width: "100%" }}>
      <PreviewKicker>{DEMO_COPY.productLaunch.featureTitle}</PreviewKicker>
      <CodePanel
        lines={[
          "import { TransitionSeries } from '@remotion/transitions';",
          "// Wire scenes into a full composition",
          "<TransitionSeries.Sequence durationInFrames={90}>",
        ]}
      />
      <div style={{ display: "grid", gridTemplateAreas: '"stack"', maxWidth: 720, textAlign: "center" }}>
        <div
          style={{
            gridArea: "stack",
            width: "100%",
            maxWidth: 720,
            minHeight: 118,
            display: "grid",
            alignContent: "center",
          }}
        >
          <div
            style={{
              height: 46,
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 18,
                top: 10,
                bottom: 10,
                width: 2,
                borderRadius: 999,
                background: "rgba(232,184,109,0.55)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 26,
                right: 18,
                top: "50%",
                height: 1,
                transform: "translateY(-50%)",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 55%, rgba(255,255,255,0) 100%)",
              }}
            />
          </div>
        </div>
        <div style={{ gridArea: "stack" }}>
          <Typewriter
            text={typewriterText}
            delayInFrames={8}
            pauseAfter={`${DEMO_COPY.tutorial.calloutTitle}.`}
            charFrames={2}
            pauseSeconds={0.8}
          />
        </div>
      </div>
    </div>
  </PreviewFrame>
);
