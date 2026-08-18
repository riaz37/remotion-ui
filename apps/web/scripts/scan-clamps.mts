/**
 * Finds `interpolate()` calls that will extrapolate outside their input range.
 *
 * Remotion's default extrapolation is `"extend"`, so an unclamped call keeps
 * running the line past both ends of its input range. Whether that is a bug
 * depends entirely on what drives it:
 *
 *   - **Driven by `frame` directly, over a bounded window.** Always a bug. The
 *     frame counter runs from 0 to the end of the composition, so a window like
 *     `[delay, delay + duration]` produces negative values before it opens and
 *     unbounded ones after it closes — opacities above 1, scales that keep
 *     growing, offsets that walk off the frame. This is the class the scan
 *     fails on.
 *   - **Driven by an already-clamped progress.** A no-op. Most of the catalog
 *     routes through a local `ease()` helper that clamps, so re-clamping
 *     downstream changes nothing.
 *   - **Driven by a spring.** Usually deliberate. An underdamped spring settles
 *     slightly past 1, and mapping that through `[0, 1] -> [0.965, 1]` is how
 *     the overshoot reaches the property. Clamping these would flatten motion
 *     the components are designed around.
 *   - **Driven by `Math.sin`, a modulo, or another bounded expression.** Safe by
 *     construction.
 *
 * So the scan deliberately does not demand a clamp everywhere. It reports the
 * whole picture and fails only on the raw-`frame` class, which has no
 * legitimate use.
 *
 * Run: `pnpm --filter web scan:clamps` (add `--json` for machine-readable output).
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_DIRS = ["registry/bases/default", "components", "lib"];

export type UnclampedCall = {
  file: string;
  line: number;
  driver: string;
  input: string;
  output: string;
  /** `true` when the first argument is the bare `frame` counter. */
  frameDriven: boolean;
};

export type ClampScan = {
  total: number;
  clamped: number;
  /** Calls whose options argument is a reference rather than a literal. */
  opaqueOptions: number;
  unclamped: UnclampedCall[];
};

const oneLine = (node: ts.Node | undefined) =>
  node ? node.getText().replace(/\s+/g, " ") : "";

export function scanClamps(root = appRoot): ClampScan {
  const files = execSync(
    `grep -rl 'interpolate(' ${SCAN_DIRS.join(" ")} 2>/dev/null || true`,
    { cwd: root },
  )
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);

  const scan: ClampScan = {
    total: 0,
    clamped: 0,
    opaqueOptions: 0,
    unclamped: [],
  };

  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      readFileSync(path.join(root, file), "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

    const walk = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "interpolate"
      ) {
        scan.total += 1;
        const options = node.arguments[3];

        let hasLeft = false;
        let hasRight = false;
        let spread = false;

        if (options && ts.isObjectLiteralExpression(options)) {
          for (const property of options.properties) {
            if (ts.isSpreadAssignment(property)) spread = true;
            const name =
              property.name && ts.isIdentifier(property.name)
                ? property.name.text
                : null;
            if (name === "extrapolateLeft") hasLeft = true;
            if (name === "extrapolateRight") hasRight = true;
          }
        }

        // A non-literal options argument is a shared config such as the
        // catalog's `clamp` const. The AST cannot see through it, so it counts
        // as clamped rather than as a false positive.
        const opaque = Boolean(options) && !ts.isObjectLiteralExpression(options);
        if (opaque) scan.opaqueOptions += 1;

        if ((hasLeft && hasRight) || spread || opaque) {
          scan.clamped += 1;
        } else {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart());
          const driver = oneLine(node.arguments[0]);
          scan.unclamped.push({
            file,
            line: line + 1,
            driver,
            input: oneLine(node.arguments[1]),
            output: oneLine(node.arguments[2]),
            frameDriven: driver === "frame",
          });
        }
      }
      ts.forEachChild(node, walk);
    };

    walk(source);
  }

  return scan;
}

const isEntrypoint =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isEntrypoint) {
  const scan = scanClamps();
  const offenders = scan.unclamped.filter((call) => call.frameDriven);

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(scan, null, 2));
  } else {
    console.log(`interpolate() calls        ${scan.total}`);
    console.log(
      `clamped                    ${scan.clamped} (${scan.opaqueOptions} via a shared options ref)`,
    );
    console.log(`unclamped                  ${scan.unclamped.length}`);
    console.log(`unclamped and frame-driven ${offenders.length}\n`);

    for (const call of scan.unclamped) {
      console.log(
        `${call.file}:${call.line}  driver=${call.driver}  in=${call.input}  out=${call.output}`,
      );
    }
  }

  if (offenders.length > 0) {
    console.error(
      `\n${offenders.length} interpolate() call(s) run straight off the frame counter with no clamp:`,
    );
    for (const call of offenders) {
      console.error(`  ${call.file}:${call.line}  in=${call.input}`);
    }
    process.exit(1);
  }
}
