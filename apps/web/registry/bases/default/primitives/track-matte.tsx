import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  OffthreadVideo,
  useCurrentFrame,
  useDelayRender,
  useRemotionEnvironment,
} from "remotion";

export type MatteMode = "alpha" | "alpha-inverted" | "luma" | "luma-inverted";

export type TrackMatteProps = {
  /** How the matte decides visibility — AE's four track-matte modes. */
  mode?: MatteMode;
  /**
   * The matte, as SVG content in a `width` × `height` space: shapes, `<text>`,
   * `<image>`, a whole nested `<svg>` (a `ShapeLayer` works as-is), or
   * `<MatteVideo>` for footage.
   */
  matte: ReactNode;
  /** What is revealed. Any HTML: footage, images, scenes, other components. */
  children: ReactNode;
  width?: number;
  height?: number;
  style?: CSSProperties;
  className?: string;
};

/**
 * Every mode is a luminance mask: a background plus the matte recoloured by
 * one colour matrix. Alpha modes flatten the matte to a white (or black)
 * silhouette so only its alpha counts; luma modes keep its luminance, and the
 * inverted ones start from white and subtract.
 */
const MODES: Record<MatteMode, { background: string; matrix: string | null }> = {
  alpha: { background: "black", matrix: "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" },
  "alpha-inverted": { background: "white", matrix: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" },
  luma: { background: "black", matrix: null },
  "luma-inverted": { background: "white", matrix: "-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" },
};

type MatteContextValue = { host: HTMLDivElement | null; mode: MatteMode; width: number; height: number };
const MatteContext = createContext<MatteContextValue | null>(null);

/**
 * After Effects track mattes. The content shows through the matte by its
 * alpha, inverted alpha, luminance or inverted luminance — footage through
 * type, shapes through footage, one scene through another.
 *
 * The matte is SVG content applied as an SVG luminance `<mask>`, which is
 * frame-exact and works in the Player and in renders alike. Arbitrary HTML
 * cannot be a matte: browsers do not paint `<foreignObject>` inside a mask
 * (verified in Chrome), so HTML mattes would need the flag-gated
 * HTML-in-Canvas API. Footage mattes go through `<MatteVideo>` instead.
 */
export const TrackMatte: React.FC<TrackMatteProps> = ({
  mode = "alpha",
  matte,
  children,
  width = 960,
  height = 540,
  style,
  className,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `track-matte-${id}`;
  const filterId = `track-matte-filter-${id}`;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const { background, matrix } = MODES[mode];
  if (!MODES[mode]) throw new Error(`TrackMatte: unknown mode "${mode as string}".`);

  return (
    <MatteContext.Provider value={{ host, mode, width, height }}>
      <div className={className} style={{ position: "relative", width, height, ...style }}>
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            {matrix ? (
              <filter id={filterId} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
                <feColorMatrix type="matrix" values={matrix} />
              </filter>
            ) : null}
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={width}
              height={height}
              style={{ maskType: "luminance" }}
            >
              <rect width={width} height={height} fill={background} />
              <g filter={matrix ? `url(#${filterId})` : undefined}>{matte}</g>
            </mask>
          </defs>
        </svg>
        <div style={{ width, height, mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})` }}>{children}</div>
        {/* Hidden home for footage sources that feed <MatteVideo>. */}
        <div ref={setHost} aria-hidden style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0 }} />
      </div>
    </MatteContext.Provider>
  );
};

export type MatteVideoProps = {
  src: string;
  x?: number;
  y?: number;
  /** Defaults to the matte's width / height. */
  width?: number;
  height?: number;
  /** Frames into the footage to start at. */
  startFrom?: number;
  playbackRate?: number;
  /** How the footage fills its box. */
  fit?: "cover" | "contain";
};

/**
 * Footage as a matte. A hidden `<OffthreadVideo>` hands each frame over
 * through `onVideoFrame`; it is drawn to a canvas and placed in the mask as
 * an `<image>`. During a render the frame is held until *that* frame's matte
 * is in place, so matte and content never drift apart.
 *
 * Cost: one canvas encode per frame (JPEG for luma modes, PNG for alpha
 * modes, which keep transparency) — a few ms at 960×540, more at 4K.
 */
export const MatteVideo: React.FC<MatteVideoProps> = ({
  src,
  x = 0,
  y = 0,
  width: widthProp,
  height: heightProp,
  startFrom,
  playbackRate,
  fit = "cover",
}) => {
  const context = useContext(MatteContext);
  if (!context) throw new Error("MatteVideo must be used inside a TrackMatte's `matte`.");
  const width = widthProp ?? context.width;
  const height = heightProp ?? context.height;
  const frame = useCurrentFrame();
  const { isRendering } = useRemotionEnvironment();
  const { delayRender, continueRender } = useDelayRender();
  const [image, setImage] = useState<{ url: string; stamp: number } | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const pending = useRef<number | null>(null);
  const stamp = useRef(0);

  // Hold each rendered frame until its matte has been drawn and committed.
  useLayoutEffect(() => {
    if (!isRendering) return undefined;
    const handle = delayRender(`MatteVideo: frame ${frame} of ${src}`);
    pending.current = handle;
    return () => {
      if (pending.current === handle) {
        pending.current = null;
        continueRender(handle);
      }
    };
  }, [frame, src, isRendering, delayRender, continueRender]);

  useEffect(() => {
    const handle = pending.current;
    if (image && handle !== null) {
      pending.current = null;
      continueRender(handle);
    }
  }, [image, continueRender]);

  const onVideoFrame = useCallback(
    (source: CanvasImageSource) => {
      const target = canvas.current ?? document.createElement("canvas");
      canvas.current = target;
      target.width = Math.max(1, Math.round(width));
      target.height = Math.max(1, Math.round(height));
      const ctx = target.getContext("2d");
      if (!ctx) return;
      const sw =
        (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || target.width;
      const sh =
        (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || target.height;
      const scale = fit === "cover" ? Math.max(width / sw, height / sh) : Math.min(width / sw, height / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.drawImage(source, (width - dw) / 2, (height - dh) / 2, dw, dh);
      const alpha = context.mode === "alpha" || context.mode === "alpha-inverted";
      stamp.current += 1;
      setImage({ url: target.toDataURL(alpha ? "image/png" : "image/jpeg", 0.92), stamp: stamp.current });
    },
    [width, height, fit, context.mode],
  );

  return (
    <>
      {context.host
        ? createPortal(
            <OffthreadVideo
              src={src}
              muted
              startFrom={startFrom}
              playbackRate={playbackRate}
              onVideoFrame={onVideoFrame}
              style={{ width, height }}
            />,
            context.host,
          )
        : null}
      {image ? (
        <image href={image.url} x={x} y={y} width={width} height={height} preserveAspectRatio="none" />
      ) : null}
    </>
  );
};
