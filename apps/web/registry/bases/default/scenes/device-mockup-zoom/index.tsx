import { loadFont } from "@remotion/google-fonts/Inter";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getSafeAreaPadding, scaleFont } from "@/remotion/lib/layout";
import { DURATION, EASING, STAGGER } from "@/remotion/lib/motion-tokens";
import { springSmooth } from "@/remotion/lib/springs";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

export type DeviceMockupZoomProps = {
  src?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  device?: "phone" | "browser" | "laptop";
  backgroundColor?: string;
  accentColor?: string;
};

const COLORS = {
  bg: "#080810",
  panel: "#0d111b",
  panelSoft: "#111827",
  screen: "#f6f1e8",
  ink: "#111827",
  muted: "#6b7280",
  line: "rgba(17, 24, 39, 0.12)",
  chrome: "#171b26",
  chromeLight: "#242a3a",
  accent: "#e8b86d",
  teal: "#2dd4bf",
  rose: "#f472b6",
} as const;

const clampProgress = (
  frame: number,
  input: [number, number],
  output: [number, number],
) =>
  interpolate(frame, input, output, {
    easing: EASING.enter,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

type MockupContentProps = {
  frame: number;
  accentColor: string;
};

const BrowserDashboard: React.FC<MockupContentProps> = ({
  frame,
  accentColor,
}) => {
  const bars = [0.46, 0.72, 0.58, 0.9, 0.66, 0.82, 0.54];
  const graphProgress = clampProgress(frame, [18, 64], [0, 1]);
  const rowProgress = clampProgress(frame, [28, 70], [0, 1]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.screen,
        color: COLORS.ink,
        display: "grid",
        gridTemplateColumns: "22% 1fr",
        fontFamily,
      }}
    >
      <div
        style={{
          borderRight: `1px solid ${COLORS.line}`,
          padding: "5% 6%",
          display: "flex",
          flexDirection: "column",
          gap: "6%",
          background: "#fffaf1",
        }}
      >
        <div
          style={{
            width: "58%",
            height: "5%",
            borderRadius: 999,
            background: accentColor,
          }}
        />
        {["Overview", "Funnels", "Segments", "Exports"].map((item, index) => (
          <div
            key={item}
            style={{
              height: "7%",
              borderRadius: 12,
              padding: "0 10%",
              display: "flex",
              alignItems: "center",
              gap: "9%",
              background:
                index === 0 ? "rgba(232, 184, 109, 0.22)" : "transparent",
              color: index === 0 ? COLORS.ink : COLORS.muted,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: index === 0 ? accentColor : COLORS.line,
              }}
            />
            {item}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div
          style={{
            borderRadius: 18,
            padding: "11%",
            background: COLORS.ink,
            color: "#fffaf1",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 11, color: "#d1d5db", fontWeight: 700 }}>
            This week
          </div>
          <div style={{ fontSize: 26, lineHeight: 1, fontWeight: 800 }}>
            42%
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 99,
              background: "rgba(255,255,255,0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${72 * rowProgress}%`,
                height: "100%",
                borderRadius: 99,
                background: COLORS.teal,
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "4.5%",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: "4%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "5%",
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 700 }}>
              Launch console
            </div>
            <div style={{ fontSize: 34, lineHeight: 1.05, fontWeight: 800 }}>
              Campaign health
            </div>
          </div>
          <div
            style={{
              borderRadius: 999,
              padding: "10px 16px",
              background: COLORS.ink,
              color: "#fffaf1",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Live
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr 0.75fr",
            gap: "4%",
            minHeight: 0,
          }}
        >
          <div
            style={{
              borderRadius: 26,
              background: "#ffffff",
              border: `1px solid ${COLORS.line}`,
              padding: "5%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 22px 50px rgba(17, 24, 39, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "end",
                gap: "3%",
                height: "56%",
              }}
            >
              {bars.map((bar, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: `${Math.max(10, bar * 100 * graphProgress)}%`,
                    borderRadius: "16px 16px 6px 6px",
                    background:
                      index === 3
                        ? accentColor
                        : index === 5
                          ? COLORS.teal
                          : "#d8deea",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "3%",
              }}
            >
              {[
                ["Reach", "1.8M", COLORS.teal],
                ["CTR", "8.4%", accentColor],
                ["Trial", "+312", COLORS.rose],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  style={{
                    borderRadius: 18,
                    padding: "12%",
                    background: "#f8fafc",
                    border: `1px solid ${COLORS.line}`,
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700 }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 24,
                      lineHeight: 1,
                      fontWeight: 800,
                      color,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateRows: "1fr 1fr",
              gap: "7%",
              minHeight: 0,
            }}
          >
            {[
              ["Audience matched", "84%", COLORS.teal],
              ["Creative ready", "12", accentColor],
            ].map(([label, value, color]) => (
              <div
                key={label}
                style={{
                  borderRadius: 24,
                  padding: "10%",
                  background: "#ffffff",
                  border: `1px solid ${COLORS.line}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700 }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 34, lineHeight: 1, fontWeight: 800 }}>
                  {value}
                </div>
                <div
                  style={{
                    height: 7,
                    borderRadius: 99,
                    background: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(label === "Audience matched" ? 84 : 62) * rowProgress}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "3%",
          }}
        >
          {["North America", "Creator ads", "Paid social"].map((item, index) => (
            <div
              key={item}
              style={{
                borderRadius: 16,
                padding: "12px 14px",
                background: "#ffffff",
                border: `1px solid ${COLORS.line}`,
                color: index === 1 ? COLORS.ink : COLORS.muted,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PhoneChecklist: React.FC<MockupContentProps> = ({
  frame,
  accentColor,
}) => {
  const progress = clampProgress(frame, [18, 62], [0, 1]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff8ed",
        color: COLORS.ink,
        fontFamily,
        padding: "9% 8%",
        display: "flex",
        flexDirection: "column",
        gap: "5%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 800 }}>
            Launch app
          </div>
          <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 800 }}>
            Today
          </div>
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            background: COLORS.ink,
            color: "#fffaf1",
            display: "grid",
            placeItems: "center",
            fontSize: 15,
            fontWeight: 800,
          }}
        >
          3
        </div>
      </div>

      <div
        style={{
          borderRadius: 28,
          padding: "8%",
          background: COLORS.ink,
          color: "#fffaf1",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 12, color: "#d1d5db", fontWeight: 700 }}>
          Active campaign
        </div>
        <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 800 }}>
          91%
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 99,
            background: "rgba(255,255,255,0.16)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${91 * progress}%`,
              height: "100%",
              borderRadius: 99,
              background: accentColor,
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          ["Audience locked", COLORS.teal],
          ["Brief approved", accentColor],
          ["Exports queued", COLORS.rose],
        ].map(([label, color], index) => {
          const itemProgress = clampProgress(
            frame,
            [26 + index * STAGGER.tight, 52 + index * STAGGER.tight],
            [0, 1],
          );
          return (
            <div
              key={label}
              style={{
                borderRadius: 18,
                padding: "13px 14px",
                background: "#ffffff",
                border: `1px solid ${COLORS.line}`,
                display: "flex",
                alignItems: "center",
                gap: 11,
                opacity: itemProgress,
                translate: `${(1 - itemProgress) * 14}px 0px`,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 99,
                  background: color,
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 800 }}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type DeviceShellProps = {
  children: React.ReactNode;
  device: "phone" | "browser" | "laptop";
  accentColor: string;
  progress: number;
  width: number;
};

const DeviceShell: React.FC<DeviceShellProps> = ({
  children,
  device,
  accentColor,
  progress,
  width,
}) => {
  const isPhone = device === "phone";
  const isLaptop = device === "laptop";
  const radius = isPhone ? scaleFont(44, width) : scaleFont(24, width);
  const chromePad = isPhone ? scaleFont(14, width) : scaleFont(12, width);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: isLaptop ? "92%" : "100%",
          aspectRatio: isPhone ? "0.48" : "1.62",
          borderRadius: radius,
          background: `linear-gradient(145deg, ${COLORS.chromeLight}, ${COLORS.chrome})`,
          padding: chromePad,
          boxShadow: `0 ${scaleFont(34, width)}px ${scaleFont(90, width)}px rgba(0,0,0,0.42), 0 0 ${scaleFont(96, width) * progress}px ${accentColor}33, inset 0 0 0 1px rgba(255,255,255,0.1)`,
          display: "flex",
          flexDirection: "column",
          gap: isPhone ? scaleFont(10, width) : scaleFont(12, width),
        }}
      >
        {isPhone ? (
          <div
            style={{
              width: "28%",
              height: scaleFont(7, width),
              borderRadius: 999,
              background: "rgba(255,255,255,0.22)",
              alignSelf: "center",
            }}
          />
        ) : (
          <div
            style={{
              height: scaleFont(32, width),
              borderRadius: scaleFont(14, width),
              background: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: scaleFont(8, width),
              padding: `0 ${scaleFont(12, width)}px`,
            }}
          >
            {[COLORS.rose, COLORS.accent, COLORS.teal].map((color) => (
              <span
                key={color}
                style={{
                  width: scaleFont(10, width),
                  height: scaleFont(10, width),
                  borderRadius: 99,
                  background: color,
                }}
              />
            ))}
            <div
              style={{
                flex: 1,
                height: scaleFont(16, width),
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                marginLeft: scaleFont(8, width),
              }}
            />
          </div>
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: isPhone ? radius - chromePad * 1.25 : radius * 0.62,
            overflow: "hidden",
            background: COLORS.panel,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {children}
        </div>
      </div>

      {isLaptop ? (
        <>
          <div
            style={{
              width: "100%",
              height: scaleFont(24, width),
              marginTop: scaleFont(-2, width),
              borderRadius: `0 0 ${scaleFont(30, width)}px ${scaleFont(30, width)}px`,
              background:
                "linear-gradient(180deg, #30384b 0%, #171b26 72%, #0b0d14 100%)",
              boxShadow: `0 ${scaleFont(24, width)}px ${scaleFont(50, width)}px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.18)`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "41%",
                top: 0,
                width: "18%",
                height: "36%",
                borderRadius: `0 0 ${scaleFont(12, width)}px ${scaleFont(12, width)}px`,
                background: "rgba(255,255,255,0.14)",
              }}
            />
          </div>
          <div
            style={{
              width: "82%",
              height: scaleFont(18, width),
              borderRadius: "50%",
              background: "rgba(0,0,0,0.28)",
              filter: `blur(${scaleFont(12, width)}px)`,
              marginTop: scaleFont(10, width),
            }}
          />
        </>
      ) : null}
    </div>
  );
};

export const DeviceMockupZoom: React.FC<DeviceMockupZoomProps> = ({
  src,
  title,
  subtitle,
  eyebrow,
  children,
  device = "laptop",
  backgroundColor = COLORS.bg,
  accentColor = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const safe = getSafeAreaPadding({ width, height });
  const resolvedDevice = device;
  const portrait = height > width;
  const hasCopy = Boolean(title || subtitle || eyebrow);

  const camera = spring({
    fps,
    frame,
    config: springSmooth,
    delay: 8,
    durationInFrames: 58,
  });
  const copyProgress = clampProgress(frame, [0, DURATION.normal], [0, 1]);
  const deviceProgress = clampProgress(frame, [STAGGER.normal, 64], [0, 1]);
  const accentProgress = clampProgress(frame, [20, 72], [0, 1]);
  const cameraScale = interpolate(camera, [0, 1], [1.18, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cameraY = interpolate(camera, [0, 1], [scaleFont(20, width), 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const gridTemplateColumns = hasCopy && !portrait ? "0.66fr 1.34fr" : "1fr";
  const mainMaxWidth =
    resolvedDevice === "phone"
      ? portrait
        ? "58%"
        : hasCopy
          ? "42%"
          : "32%"
      : resolvedDevice === "laptop"
        ? portrait
          ? "96%"
          : hasCopy
            ? "100%"
            : "86%"
      : portrait
        ? "96%"
        : hasCopy
          ? "100%"
          : "82%";

  const screenContent = children ?? (
    <>
      {src ? (
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            scale: 1 + accentProgress * 0.06,
          }}
        />
      ) : resolvedDevice === "phone" ? (
        <PhoneChecklist frame={frame} accentColor={accentColor} />
      ) : (
        <BrowserDashboard frame={frame} accentColor={accentColor} />
      )}
    </>
  );

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 72% 42%, ${accentColor}30 0, transparent 32%), radial-gradient(circle at 16% 82%, ${COLORS.teal}20 0, transparent 26%), linear-gradient(135deg, #080810 0%, #10131d 54%, #07070d 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: `${scaleFont(56, width)}px ${scaleFont(56, width)}px`,
          maskImage: "radial-gradient(circle at 68% 44%, black, transparent 72%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width,
          height,
          paddingLeft: safe.paddingLeft,
          paddingRight: safe.paddingRight,
          paddingTop: safe.paddingTop,
          paddingBottom: safe.paddingBottom,
          color: "#f8fafc",
          fontFamily,
          display: "grid",
          gridTemplateColumns,
          alignItems: "center",
          gap: hasCopy
            ? portrait
              ? scaleFont(42, width)
              : scaleFont(54, width)
            : 0,
        }}
      >
        {hasCopy ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: scaleFont(18, width),
              maxWidth: portrait ? "100%" : scaleFont(430, width),
              opacity: copyProgress,
              translate: `0px ${(1 - copyProgress) * scaleFont(18, width)}px`,
            }}
          >
            {eyebrow ? (
              <div
                style={{
                  alignSelf: "flex-start",
                  borderRadius: 999,
                  padding: `${scaleFont(9, width)}px ${scaleFont(14, width)}px`,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: accentColor,
                  fontSize: scaleFont(16, width),
                  lineHeight: 1,
                  fontWeight: 800,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div
                style={{
                  fontSize: scaleFont(portrait ? 58 : 64, width),
                  lineHeight: 0.98,
                  fontWeight: 800,
                  maxWidth: "11ch",
                }}
              >
                {title}
              </div>
            ) : null}
            {subtitle ? (
              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: scaleFont(portrait ? 28 : 24, width),
                  lineHeight: 1.35,
                  fontWeight: 600,
                  maxWidth: "28ch",
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            width: "100%",
            maxWidth: mainMaxWidth,
            justifySelf: "center",
            opacity: deviceProgress,
            scale: cameraScale,
            translate: `0px ${cameraY}px`,
          }}
        >
          <DeviceShell
            device={resolvedDevice}
            accentColor={accentColor}
            progress={accentProgress}
            width={width}
          >
            {screenContent}
          </DeviceShell>
        </div>
      </div>
    </AbsoluteFill>
  );
};
