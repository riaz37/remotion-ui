import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generate } from "./codegen.js";
import { parseLottie } from "./parse.js";
import { Call, stringLiteral } from "./printer.js";

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../test/fixtures/lottie");
const readFixture = (name: string) => fs.readFileSync(path.join(fixtures, name), "utf8");

const prop = (k: unknown) => ({ a: 0, k });
const shapeLayer = (overrides: Record<string, unknown> = {}) => ({
  ty: 4,
  nm: "Box",
  ind: 1,
  ip: 0,
  op: 60,
  st: 0,
  ks: { a: prop([0, 0, 0]), p: prop([50, 50, 0]), s: prop([100, 100, 100]), r: prop(0), o: prop(100) },
  shapes: [
    {
      ty: "gr",
      nm: "Group",
      it: [
        { ty: "rc", d: 1, p: prop([0, 0]), s: prop([20, 20]), r: prop(0) },
        { ty: "fl", c: prop([1, 0, 0, 1]), o: prop(100), r: 1 },
        { ty: "tr", a: prop([0, 0]), p: prop([0, 0]), s: prop([100, 100]), r: prop(0), o: prop(100) },
      ],
    },
  ],
  ...overrides,
});
const lottie = (layers: unknown[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ v: "5.7.0", fr: 30, ip: 0, op: 60, w: 100, h: 100, nm: "Test", layers, ...extra });

describe("parseLottie", () => {
  it("reads composition metadata; duration is floor(op − ip) like lottie-web", () => {
    const parsed = parseLottie(lottie([shapeLayer()], { ip: 10, op: 70.9 }));
    expect(parsed).toMatchObject({ width: 100, height: 100, fps: 30, inPoint: 10, durationInFrames: 60 });
    expect(parsed.issues).toEqual([]);
  });

  it("converts units: scale to factors, opacity to 0–1, colours to hex", () => {
    const layer = shapeLayer({ ks: { s: prop([50, 200, 100]), o: prop(40), p: prop([1, 2, 0]) } });
    const [box] = parseLottie(lottie([layer])).main.layers;
    expect(box.spec.transform).toEqual({ position: [1, 2], scale: [0.5, 2], opacity: 0.4 });
    const group = (box.spec.contents as Call[])[0];
    const fill = (group.args[1] as Call[])[1];
    expect(fill).toEqual(new Call("fill", [{ color: "#ff0000" }]));
  });

  it("turns keyframes into ae-motion tracks with speed/influence eases", () => {
    const layer = shapeLayer({
      ks: {
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], o: { x: [0.333], y: [0] }, i: { x: [0.667], y: [1] } },
            { t: 30, s: [90], h: 1 },
            { t: 45, s: [180] },
          ],
        },
      },
    });
    const [box] = parseLottie(lottie([layer])).main.layers;
    const rotation = (box.spec.transform as { rotation: unknown[] }).rotation;
    expect(rotation[0]).toMatchObject({ frame: 0, value: 0, easeOut: { speed: 0, influence: 0.333 } });
    expect(rotation[1]).toMatchObject({ frame: 30, value: 90, interpolation: "hold" });
    expect((rotation[1] as { easeIn: { speed: number } }).easeIn.speed).toBeCloseTo(0);
    expect(rotation[2]).toMatchObject({ frame: 45, value: 180 });
  });

  it("reads old-format end values (`e`) for the final key", () => {
    const layer = shapeLayer({
      ks: { o: { a: 1, k: [{ t: 0, s: [0], e: [100], o: { x: [0.5], y: [0.5] }, i: { x: [0.5], y: [0.5] } }, { t: 10 }] } },
    });
    const [box] = parseLottie(lottie([layer])).main.layers;
    expect((box.spec.transform as { opacity: unknown }).opacity).toEqual([
      { frame: 0, value: 0, interpolation: "linear" },
      { frame: 10, value: 1 },
    ]);
  });

  it("splits per-dimension curves into separate tracks", () => {
    const layer = shapeLayer({
      ks: {
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100], o: { x: [0.2, 0.2, 0.2], y: [0, 0.8, 0] }, i: { x: [0.8, 0.8, 0.8], y: [1, 1, 1] } },
            { t: 20, s: [200, 50, 100] },
          ],
        },
      },
    });
    const [box] = parseLottie(lottie([layer])).main.layers;
    const scale = (box.spec.transform as { scale: Call }).scale;
    expect(scale).toBeInstanceOf(Call);
    expect(scale.fn).toBe("separate");
    expect(scale.args).toHaveLength(2);
  });

  it("keeps spatial tangents on position keys", () => {
    const layer = shapeLayer({
      ks: {
        p: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 0], to: [10, 0, 0], ti: [0, 10, 0], o: { x: 0.3, y: 0 }, i: { x: 0.7, y: 1 } },
            { t: 30, s: [100, 100, 0] },
          ],
        },
      },
    });
    const [box] = parseLottie(lottie([layer])).main.layers;
    const position = (box.spec.transform as { position: Call }).position;
    expect(position.fn).toBe("spatial");
    const keys = position.args[0] as Record<string, unknown>[];
    expect(keys[0].spatialOut).toEqual([10, 0]);
    expect(keys[1].spatialIn).toEqual([0, 10]);
  });

  it("resolves parenting and keeps precomp time offsets only on precomps", () => {
    const parsed = parseLottie(
      lottie(
        [
          { ty: 3, nm: "Rig", ind: 1, ip: 0, op: 60, st: 5, ks: {} },
          shapeLayer({ ind: 2, parent: 1, st: 7 }),
          { ty: 0, nm: "Inner", ind: 3, refId: "comp_0", ip: 0, op: 60, st: 12, sr: 2, w: 100, h: 100, ks: {} },
        ],
        { assets: [{ id: "comp_0", layers: [shapeLayer()] }] },
      ),
    );
    const [rig, box, inner] = parsed.main.layers;
    expect(rig.spec.startTime).toBeUndefined();
    expect(box.parent).toBe(1);
    expect(box.spec.startTime).toBeUndefined();
    expect(inner.spec).toMatchObject({ startTime: 12, timeStretch: 2 });
    expect(parsed.precomps.map((p) => p.id)).toEqual(["comp_0"]);
  });

  it("reports every unsupported feature with its location instead of dropping it", () => {
    const parsed = parseLottie(
      lottie([
        { ty: 5, nm: "Title", ind: 1, ip: 0, op: 60, ks: {}, t: {} },
        shapeLayer({
          ind: 2,
          hasMask: true,
          masksProperties: [{ mode: "a", pt: prop({}) }],
          ef: [{ ty: 29, nm: "Gaussian Blur" }],
          shapes: [{ ty: "mm", nm: "Merge Paths 1", mm: 1 }],
          ks: { r: { a: 0, k: 0, x: "wiggle(2, 30)" } },
        }),
      ]),
    );
    const features = parsed.issues.filter((i) => i.level === "unsupported").map((i) => i.feature);
    expect(features).toEqual(expect.arrayContaining(["text layer", "mask", "layer effect", "Merge Paths", "expression"]));
    const merge = parsed.issues.find((i) => i.feature === "Merge Paths")!;
    expect(merge.where).toContain('layer "Box"');
    expect(merge.path).toBe("$.layers[1].shapes[0]");
    // The text layer survives as a null so parented layers still follow it.
    expect(parsed.main.layers[0].kind).toBe("null");
  });

  it("rejects malformed input at the boundary with a JSON path", () => {
    expect(() => parseLottie("{ not json")).toThrow(/not valid JSON/);
    expect(() => parseLottie(JSON.stringify({ fr: 30, ip: 0, op: 10, w: 10, h: 10 }))).toThrow(/\$\.layers/);
    expect(() => parseLottie(lottie([{ ty: 4, ip: 0 }]))).toThrow(/\$\.layers\[0\]\.op/);
    expect(() => parseLottie(lottie([shapeLayer({ ks: { p: prop(["x", 1]) } })]))).toThrow(/\$\.layers\[0\]\.ks\.p\.k/);
    expect(() => parseLottie(lottie([], { op: 0 }))).toThrow(/out point/);
  });

  it("rejects parenting cycles and self-containing precomps", () => {
    expect(() => parseLottie(lottie([shapeLayer({ ind: 1, parent: 2 }), shapeLayer({ ind: 2, parent: 1 })]))).toThrow(/cycle/);
    const loop = { ty: 0, nm: "Loop", ind: 1, refId: "a", ip: 0, op: 60, w: 10, h: 10, ks: {} };
    expect(() => parseLottie(lottie([loop], { assets: [{ id: "a", layers: [loop] }] }))).toThrow(/contains itself/);
  });

  it("parses a real Bodymovin export without issues", () => {
    const parsed = parseLottie(readFixture("hamburger-arrow.json"));
    expect(parsed.issues.filter((i) => i.level === "unsupported")).toEqual([]);
    expect(parsed.main.layers.length).toBeGreaterThan(1);
  });
});

describe("generate", () => {
  it("writes readable TSX for a real export (snapshot)", async () => {
    const parsed = parseLottie(readFixture("bouncy-ball.json"));
    const { files, composition } = generate(parsed, {
      name: "BouncyBall",
      sourceLabel: "bouncy-ball.json",
      runtimeImport: "@/remotion/lib/ae-import",
    });
    expect(composition).toEqual({ id: "BouncyBall", component: "BouncyBall", durationInFrames: 120, fps: 60, width: 512, height: 512 });
    expect(files.map((f) => f.path)).toEqual(["index.tsx"]);
    await expect(files[0].content).toMatchFileSnapshot("__snapshots__/bouncy-ball.tsx.snap");
  });

  it("never lets a layer name escape into code", () => {
    const evil = '*/ import("x"); /* `${alert(1)}`  ';
    const parsed = parseLottie(lottie([shapeLayer({ nm: evil })]));
    const { files } = generate(parsed, { name: "Evil", sourceLabel: "evil.json", runtimeImport: "@/remotion/lib/ae-import" });
    const code = files[0].content;
    expect(code).toContain(`name: ${stringLiteral(evil)}`);
    expect(stringLiteral(evil)).toContain("\\u2028");
    expect(code).not.toMatch(/\/\*\*[^\n]*\*\/ import/);
    expect(code).toContain("const importXAlert1Layer");
    expect(code).not.toContain(" ");
  });

  it("lists skipped features in the header when generating past them", () => {
    const parsed = parseLottie(lottie([shapeLayer({ shapes: [{ ty: "rd", nm: "Round Corners 1", r: prop(4) }] })]));
    const { files } = generate(parsed, {
      name: "Rounded",
      sourceLabel: "r.json",
      runtimeImport: "@/remotion/lib/ae-import",
      issues: parsed.issues,
    });
    expect(files[0].content).toContain("Not imported (generated with --skip-unsupported):");
    expect(files[0].content).toContain("Round Corners");
  });

  it("puts each precomp in its own file and imports it", () => {
    const parsed = parseLottie(
      lottie([{ ty: 0, nm: "Burst", ind: 1, refId: "stars", ip: 0, op: 60, w: 100, h: 100, ks: {} }], {
        assets: [{ id: "stars", nm: "Stars", layers: [shapeLayer()] }],
      }),
    );
    const { files } = generate(parsed, { name: "Main", sourceLabel: "m.json", runtimeImport: "@/remotion/lib/ae-import" });
    expect(files.map((f) => f.path)).toEqual(["index.tsx", "stars.tsx"]);
    expect(files[0].content).toContain('import { StarsPrecomp } from "./stars";');
    expect(files[0].content).toContain("<StarsPrecomp />");
    expect(files[1].content).toContain("export const StarsPrecomp = () => (");
  });
});
