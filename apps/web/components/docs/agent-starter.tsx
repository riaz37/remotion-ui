import { BayCodePanel } from "./bay-code-panel";
import { siteConfig } from "@/lib/site-config";

const PROMPT = `You are building a video with Remotion and RemotionUI.

RemotionUI is a copy-paste component registry for Remotion. The npm package is the CLI only — components are installed as source files into my project.

Read these first:
- ${siteConfig.url}/llms.txt — short entry point
- ${siteConfig.url}/llms-full.txt — full usage guide
- ${siteConfig.url}/ai/components.json — every component, with install command, import path, and tasks

Workflow:
1. Run \`npx remotion-ui@latest init --existing\` if there is no remotion-ui.json (or \`init my-video\` for a new project).
2. Find components with \`npx remotion-ui@latest search -q <term> --json\`.
3. Install with \`npx remotion-ui@latest add <name>\` before importing anything. This also installs dependencies and registers compositions in Root.tsx.
4. Import from local paths — @/remotion/primitives/..., @/remotion/scenes/..., @/compositions/... — never from the remotion-ui package.
5. Read props from ${siteConfig.url}/ai/components/<name>.json.
6. Edit the copied source files directly when I want design changes.

Rules:
- Drive all motion with useCurrentFrame(), interpolate(), spring(), and <Sequence />.
- Never use CSS transitions, CSS keyframes, or Tailwind animation classes — they do not render in video.
- Every command accepts --json and returns { ok: false, error: { code, message } } on failure.

Now help me build: <describe your video here>`;

/**
 * A ready-to-paste system prompt for coding agents that have no MCP server or
 * installed skill — the lowest-friction way to point any assistant at the docs.
 */
export function AgentStarter() {
  return (
    <BayCodePanel
      copyText={PROMPT}
      headerLeft={
        <div className="min-w-0">
          <span className="block text-sm font-medium text-fd-foreground">
            Starter prompt
          </span>
          <span className="block text-xs text-fd-muted-foreground">
            Paste into Claude, ChatGPT, Cursor, or any coding agent
          </span>
        </div>
      }
    >
      <code className="block whitespace-pre-wrap font-[family-name:var(--font-mono)] text-fd-foreground">
        {PROMPT}
      </code>
    </BayCodePanel>
  );
}
