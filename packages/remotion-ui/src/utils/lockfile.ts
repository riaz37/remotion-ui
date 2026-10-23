import { createHash } from "node:crypto";
import path from "node:path";
import fs from "fs-extra";
import { z } from "zod";

/**
 * Records the hash of every file as the CLI wrote it. Without it, a file that
 * differs from the registry is ambiguous: the user may have edited it, or the
 * registry may have moved on. With it, a file whose hash still matches is
 * pristine and safe to overwrite on `update`; anything else is a local edit.
 */
export const LOCKFILE_NAME = "remotion-ui-lock.json";

const lockfileSchema = z.object({
  version: z.literal(1),
  files: z.record(
    z.string(),
    z.object({
      component: z.string(),
      sha256: z.string(),
    }),
  ),
});

export type Lockfile = z.infer<typeof lockfileSchema>;

export function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

/** Lockfile keys are POSIX paths relative to the project root. */
export function toLockKey(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

export async function readLockfile(cwd: string): Promise<Lockfile> {
  const lockPath = path.join(cwd, LOCKFILE_NAME);
  if (!(await fs.pathExists(lockPath))) {
    return { version: 1, files: {} };
  }

  // A corrupt or foreign lockfile only costs pristine detection: every file
  // reads as untracked, so nothing gets overwritten without --yes. That
  // includes invalid JSON, e.g. a lockfile left with git conflict markers.
  let raw: unknown;
  try {
    raw = await fs.readJson(lockPath);
  } catch {
    return { version: 1, files: {} };
  }
  const result = lockfileSchema.safeParse(raw);
  return result.success ? result.data : { version: 1, files: {} };
}

export async function writeLockfile(
  cwd: string,
  lockfile: Lockfile,
): Promise<void> {
  const files = Object.fromEntries(
    Object.entries(lockfile.files).sort(([a], [b]) => a.localeCompare(b)),
  );
  await fs.writeFile(
    path.join(cwd, LOCKFILE_NAME),
    JSON.stringify({ version: 1, files }, null, 2) + "\n",
    "utf-8",
  );
}

/** True when the file on disk is exactly what the CLI last wrote. */
export function isPristine(
  lockfile: Lockfile,
  key: string,
  existingContent: string,
): boolean {
  const entry = lockfile.files[key];
  return entry !== undefined && entry.sha256 === hashContent(existingContent);
}
