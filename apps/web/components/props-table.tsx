import type { PropDefinition } from "@/lib/component-reference";

export function PropsTable({ props }: { props: PropDefinition[] }) {
  if (props.length === 0) return null;

  return (
    <div className="not-prose my-8 overflow-hidden rounded-md border border-[var(--bay-border)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-[var(--bay-border)] bg-[var(--bay-surface-raised)]">
            <tr>
              <th className="px-4 py-3 font-medium text-fd-foreground">Prop</th>
              <th className="px-4 py-3 font-medium text-fd-foreground">Type</th>
              <th className="hidden px-4 py-3 font-medium text-fd-foreground sm:table-cell">
                Default
              </th>
              <th className="px-4 py-3 font-medium text-fd-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop, index) => (
              <tr
                key={prop.name}
                className={`border-b border-[var(--bay-border)] last:border-0 ${
                  index % 2 === 1 ? "bg-[var(--bay-surface)]" : ""
                }`}
              >
                <td className="px-4 py-3 align-top font-[family-name:var(--font-mono)] text-[0.8125rem] text-fd-primary">
                  {prop.name}
                  {prop.required ? (
                    <span className="ml-1 text-fd-muted-foreground">*</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top font-[family-name:var(--font-mono)] text-[0.8125rem] text-fd-muted-foreground">
                  {prop.type}
                </td>
                <td className="hidden px-4 py-3 align-top font-[family-name:var(--font-mono)] text-[0.8125rem] text-fd-muted-foreground sm:table-cell">
                  {prop.default ?? "-"}
                </td>
                <td className="px-4 py-3 align-top text-fd-muted-foreground">
                  {prop.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
