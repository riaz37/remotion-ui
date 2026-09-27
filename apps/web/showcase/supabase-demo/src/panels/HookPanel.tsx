import { interpolate, interpolateColors } from "remotion";
import { HOOK } from "../timeline";
import { COLORS, MONO } from "../theme";
import { CLAMP, caretOn, ramp, riseIn, settle } from "../lib/anim";
import { DatabaseIcon } from "../lib/icons";
import { Dot, Panel, Pill } from "../world/Panel";
import { PANELS, PANEL_HEADER } from "../world/layout";
import { HOOK_TEXT, hookCaretX, wordProgress, type HookMetrics } from "../camera/hook-metrics";

/**
 * HookPanel — "Start with a database." typed into an empty project.
 *
 * The camera opens on the caret alone, so frame 0 is a composed image: a lit
 * green caret on near-black. Each word rises in on its eighth note and the
 * last one turns green once the line is complete.
 */

type Props = { frame: number; metrics: HookMetrics; dim: number; visible: boolean };

const LINE_HEIGHT = HOOK_TEXT.fontSize * 1.2;

export const HookPanel: React.FC<Props> = ({ frame, metrics, dim, visible }) => {
  const rect = PANELS.hook;
  const top = HOOK_TEXT.centerY - rect.y - PANEL_HEADER - LINE_HEIGHT / 2;
  const lastWordAt = HOOK.wordFrames[HOOK.wordFrames.length - 1];
  const glow = ramp(frame, HOOK.highlight, HOOK.highlight + 12);
  const healthy = settle(frame, 88);

  return (
    <Panel
      id="hook"
      title="acme-prod"
      crumb="/ new project"
      icon={<DatabaseIcon size={30} color={COLORS.green} />}
      right={
        <Pill tone="green" style={{ opacity: healthy, transform: `scale(${0.9 + healthy * 0.1})` }}>
          <Dot size={10} />
          Healthy
        </Pill>
      }
      dim={dim}
      visible={visible}
      bodyStyle={{
        background: `radial-gradient(ellipse 60% 55% at 50% 40%, rgba(62,207,142,0.07), rgba(0,0,0,0) 70%), #0F0F0F`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: metrics.left - rect.x,
          top,
          height: LINE_HEIGHT,
          lineHeight: `${LINE_HEIGHT}px`,
          fontSize: HOOK_TEXT.fontSize,
          fontWeight: Number(HOOK_TEXT.fontWeight),
          letterSpacing: HOOK_TEXT.letterSpacing,
          whiteSpace: "pre",
        }}
      >
        {HOOK.words.map((word, i) => {
          const p = wordProgress(frame, i);
          const isLast = i === HOOK.words.length - 1;
          const color = isLast
            ? interpolateColors(glow, [0, 1], [COLORS.text, COLORS.green])
            : COLORS.text;
          return (
            <span
              key={word}
              style={{
                display: "inline-block",
                color,
                textShadow: isLast ? `0 0 ${40 * glow}px rgba(62,207,142,${0.45 * glow})` : undefined,
                ...riseIn(p, 36),
              }}
            >
              {word}
              {isLast ? "" : " "}
            </span>
          );
        })}
      </div>

      {caretOn(frame, lastWordAt + 8) ? (
        <div
          style={{
            position: "absolute",
            left: hookCaretX(metrics, frame) - rect.x,
            top: top + LINE_HEIGHT * 0.1,
            width: 9,
            height: LINE_HEIGHT * 0.8,
            borderRadius: 2,
            background: COLORS.green,
            boxShadow: "0 0 28px rgba(62,207,142,0.75), 0 0 6px rgba(62,207,142,0.9)",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: top + LINE_HEIGHT + 34,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 27,
          color: COLORS.muted,
          ...riseIn(settle(frame, HOOK.subline, 16), 18),
        }}
      >
        Every project is a full Postgres database.
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 44,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          opacity: interpolate(frame, [HOOK.subline + 8, HOOK.subline + 24], [0, 1], CLAMP),
        }}
      >
        {["Postgres 17", "Row Level Security", "Backups", "Extensions"].map((label) => (
          <Pill key={label}>{label}</Pill>
        ))}
      </div>
    </Panel>
  );
};
