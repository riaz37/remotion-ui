import { BayCodePanel } from "./bay-code-panel";

export function CodeSnippet({
  label = "Code",
  code,
}: {
  label?: string;
  code: string;
}) {
  const trimmed = code.trim();

  return (
    <BayCodePanel
      copyText={trimmed}
      headerLeft={
        <span className="text-sm font-medium text-fd-foreground">{label}</span>
      }
    >
      <code className="block min-w-max whitespace-pre font-[family-name:var(--font-mono)] text-fd-foreground">
        {trimmed}
      </code>
    </BayCodePanel>
  );
}
