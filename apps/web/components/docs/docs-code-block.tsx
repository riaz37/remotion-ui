"use client";

import {
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from "react";
import { BayCodePanel } from "./bay-code-panel";

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return extractText(props.children);
  }
  return "";
}

function languageLabel(props: ComponentProps<"pre">): string | undefined {
  const dataLanguage = (props as Record<string, unknown>)["data-language"];
  if (typeof dataLanguage === "string" && dataLanguage.length > 0) {
    return dataLanguage;
  }

  const className = props.className ?? "";
  const match = className.match(/language-([\w-]+)/);
  return match?.[1];
}

export function DocsCodeBlock(props: ComponentProps<"pre">) {
  const { children, className, ...rest } = props;
  const copyText = extractText(children).trim();
  const label = languageLabel(props);

  return (
    <BayCodePanel
      copyText={copyText}
      headerLeft={
        label ? (
          <span className="text-sm font-medium text-fd-foreground">{label}</span>
        ) : null
      }
    >
      <pre
        {...rest}
        className={`m-0 min-w-full bg-transparent p-0 font-[family-name:var(--font-mono)] text-fd-foreground ${className ?? ""}`}
      >
        {children}
      </pre>
    </BayCodePanel>
  );
}
