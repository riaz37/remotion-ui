import type { ImportIssue } from "./properties.js";

/** Group identical findings so a file with 40 masked layers prints 40 lines, not 400. */
export function formatIssues(issues: readonly ImportIssue[], level: ImportIssue["level"]): string[] {
  return issues
    .filter((issue) => issue.level === level)
    .map((issue) => `  - ${issue.feature} at ${issue.where || "top level"} (${issue.path}): ${issue.detail}`);
}

export function summarizeUnsupported(issues: readonly ImportIssue[]): string {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    if (issue.level === "unsupported") counts.set(issue.feature, (counts.get(issue.feature) ?? 0) + 1);
  }
  return [...counts.entries()].map(([feature, count]) => `${feature} ×${count}`).join(", ");
}
