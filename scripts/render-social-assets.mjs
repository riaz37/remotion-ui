/**
 * Renders the X/Twitter profile assets from the Edit Bay brand mark.
 *
 *   node scripts/render-social-assets.mjs
 *
 * Outputs to apps/web/public/social/. The `*-preview` files are QA proofs, not
 * upload artifacts: X crops avatars to a circle and renders them at ~48px in a
 * timeline, so both failure modes get rendered rather than assumed.
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "apps/web/public/social");

/** Mirrors BRAND_COLORS in apps/web/lib/brand-mark-svg.ts. */
const C = {
  surfaceRaised: "#2a2928",
  stage: "#050505",
  ink: "#ececec",
  phosphor: "#e8b86d",
  bg: "#1f1e1d",
  muted: "#949494",
};

/** The brand mark drawn in a 32x32 unit box. `plate` toggles the rounded backing. */
const mark = ({ plate = true }) => `
  ${plate ? `<rect width="32" height="32" rx="6" fill="${C.surfaceRaised}"/>` : ""}
  <g transform="translate(-1.5 -1)">
    <rect x="5" y="6" width="18" height="13" rx="3" stroke="${C.ink}" stroke-width="1.25" fill="none" opacity="0.35"/>
    <rect x="9" y="10" width="18" height="13" rx="3" fill="${C.stage}" stroke="${C.ink}" stroke-width="1.5" opacity="0.95"/>
    <path d="M15.5 14.5v5l4.5-2.5-4.5-2.5z" fill="${C.phosphor}"/>
  </g>`;

/* ---------------- Avatar 400x400 ----------------
   No rounded plate — X crops to a disc, so the crop is the plate. The mark's
   inked bounds are x 2.75-26.25 / y 4.25-22.75 in unit space, so it centers on
   (14.5, 13.5) rather than (16, 16). Sized to 260px wide, whose corners land at
   r=165 — inside the 200px inscribed circle. */
const A_SCALE = 260 / 23.5;
const AVATAR = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none">
  <rect width="400" height="400" fill="${C.surfaceRaised}"/>
  <g transform="translate(${200 - 14.5 * A_SCALE} ${200 - 13.5 * A_SCALE}) scale(${A_SCALE})">
    ${mark({ plate: false })}
  </g>
</svg>`;

/* ---------------- Cover 1500x500 ----------------
   Centered lockup, nothing in the corners: the avatar overlaps the bottom-left
   and X crops the banner vertically on mobile. Deliberately no background
   pattern — outlined frames read as broken/missing images, and fine detail is
   the first thing X's JPEG re-encode destroys. */
const COVER = `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" fill="none">
  <rect width="1500" height="500" fill="${C.bg}"/>
  <g transform="translate(306 188) scale(4)">
    ${mark({ plate: true })}
  </g>
  <text x="462" y="218" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="500" fill="${C.ink}">RemotionUI</text>
  <text x="466" y="278" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#b4b4b4">Copy-paste animated components for Remotion.</text>
  <text x="466" y="336" font-family="ui-monospace, Menlo, monospace" font-size="27" fill="${C.phosphor}">npx remotion-ui add fade-in</text>
  <rect x="0" y="496" width="1500" height="4" fill="${C.phosphor}"/>
</svg>`;

mkdirSync(OUT, { recursive: true });

// Rendered at 2x the nominal upload size. X displays the header near 600 CSS px
// and re-encodes it as JPEG, so a 1x source lands soft on HiDPI screens; giving
// it 2x pixels leaves headroom for both the downscale and the compression.
// density oversamples the vector for clean edges; resize brings it back to the
// exact pixel size (without it the raster lands at density/72 scale).
const AVATAR_PX = 800;
const targets = [
  [`avatar-${AVATAR_PX}.png`, AVATAR, AVATAR_PX, AVATAR_PX],
  ["cover-3000x1000.png", COVER, 3000, 1000],
];

for (const [name, svg, width, height] of targets) {
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(width, height)
    .png()
    .toFile(resolve(OUT, name));
  console.log(`wrote ${name} (${width}x${height})`);
}

const r = AVATAR_PX / 2;
const circleMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_PX}" height="${AVATAR_PX}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`,
);

await sharp(resolve(OUT, `avatar-${AVATAR_PX}.png`))
  .composite([{ input: circleMask, blend: "dest-in" }])
  .png()
  .toFile(resolve(OUT, "avatar-circle-preview.png"));

await sharp(resolve(OUT, "avatar-circle-preview.png"))
  .resize(48, 48)
  .png()
  .toFile(resolve(OUT, "avatar-48-preview.png"));

console.log("wrote avatar-circle-preview.png, avatar-48-preview.png");

// Approximates X's own pipeline — downscale into the ~600px display box, then
// re-encode as JPEG — so legibility is checked rather than assumed.
await sharp(resolve(OUT, "cover-3000x1000.png"))
  .resize(600, 200)
  .jpeg({ quality: 60 })
  .toFile(resolve(OUT, "cover-compressed-preview.jpg"));
console.log("wrote cover-compressed-preview.jpg");

writeFileSync(resolve(OUT, "avatar.svg"), AVATAR);
writeFileSync(resolve(OUT, "cover.svg"), COVER);
console.log("wrote avatar.svg, cover.svg");
