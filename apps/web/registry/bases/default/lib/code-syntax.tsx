/**
 * Minimal syntax tokenizer and editor palette shared by the code scenes
 * (`code-reveal`, `code-accordion`, `code-diff-wipe`).
 *
 * This is deliberately not a real parser. A video shows a handful of lines for
 * a couple of seconds, so the goal is a believable colour rhythm — strings,
 * comments, keywords, types, calls — not correctness on pathological input.
 * Everything runs per frame, so it stays regex-based and allocation-light.
 */

export type CodeTokenKind =
  | "plain"
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "type"
  | "call"
  | "prop"
  | "punct"
  | "tag";

export type CodeToken = {
  text: string;
  kind: CodeTokenKind;
};

export type CodeTheme = {
  page: string;
  window: string;
  header: string;
  border: string;
  highlight: string;
  gutter: string;
  fg: string;
  dim: string;
  faint: string;
  band: string;
  shadow: string;
  token: Record<CodeTokenKind, string>;
};

/**
 * JetBrains Mono (and every other mono face worth shipping) advances 0.6em per
 * character. Carets and wipe masks are positioned arithmetically from this
 * rather than measured, so they stay exact in a headless render.
 */
export const MONO_ADVANCE = 0.6;

export const CODE_THEMES: Record<"dark" | "light", CodeTheme> = {
  dark: {
    page: "#07070B",
    window: "#0B0C11",
    header: "rgba(255,255,255,0.035)",
    border: "rgba(255,255,255,0.09)",
    highlight: "rgba(255,255,255,0.14)",
    gutter: "rgba(255,255,255,0.02)",
    fg: "#D8DCE4",
    dim: "#7A828F",
    faint: "#4A5160",
    band: "rgba(255,255,255,0.05)",
    shadow: "rgba(0,0,0,0.55)",
    token: {
      plain: "#D8DCE4",
      comment: "#5C6472",
      string: "#9BD4A0",
      keyword: "#C99BE8",
      number: "#E8B86D",
      type: "#7DD3E8",
      call: "#8FB8F0",
      prop: "#E8B86D",
      punct: "#7A828F",
      tag: "#7DD3E8",
    },
  },
  light: {
    page: "#F4F4F2",
    window: "#FFFFFF",
    header: "rgba(0,0,0,0.025)",
    border: "rgba(0,0,0,0.10)",
    highlight: "rgba(255,255,255,0.9)",
    gutter: "rgba(0,0,0,0.018)",
    fg: "#22252B",
    dim: "#6B7280",
    faint: "#A0A6B0",
    band: "rgba(15,18,25,0.045)",
    shadow: "rgba(15,18,25,0.18)",
    token: {
      plain: "#22252B",
      comment: "#8A93A1",
      string: "#1B7F4B",
      keyword: "#8B3FBF",
      number: "#9A5B12",
      type: "#0E7490",
      call: "#2563A8",
      prop: "#9A5B12",
      punct: "#6B7280",
      tag: "#0E7490",
    },
  },
};

const KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "default",
  "const",
  "let",
  "var",
  "function",
  "return",
  "async",
  "await",
  "type",
  "interface",
  "class",
  "extends",
  "implements",
  "new",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "throw",
  "typeof",
  "instanceof",
  "in",
  "of",
  "as",
  "null",
  "undefined",
  "true",
  "false",
  "this",
  "void",
  "yield",
  "public",
  "private",
  "readonly",
  "static",
  "def",
  "fn",
  "pub",
  "use",
  "struct",
  "enum",
  "match",
  "impl",
]);

/** Ordered scanners — first match at the cursor wins. */
const SCANNERS: Array<{ kind: CodeTokenKind; re: RegExp }> = [
  { kind: "comment", re: /^(\/\/[^\n]*|#[^\n]*)/ },
  { kind: "comment", re: /^\/\*[\s\S]*?(\*\/|$)/ },
  { kind: "string", re: /^(["'`])(?:\\.|(?!\1)[^\\])*(\1|$)/ },
  { kind: "number", re: /^(0x[\da-fA-F]+|\d+(\.\d+)?(e[+-]?\d+)?)\b/ },
  { kind: "plain", re: /^[A-Za-z_$][\w$]*/ },
  { kind: "punct", re: /^[^\sA-Za-z0-9_$]/ },
  { kind: "plain", re: /^\s+/ },
];

function classifyWord(
  word: string,
  before: string,
  after: string,
): CodeTokenKind {
  if (KEYWORDS.has(word)) return "keyword";
  if (/[<\/]$/.test(before.trimEnd()) && /^[A-Z]/.test(word)) return "tag";
  if (after.startsWith("(")) return "call";
  if (after.startsWith("=") && !after.startsWith("==")) return "prop";
  if (/^[A-Z]/.test(word)) return "type";
  return "plain";
}

/**
 * Split one line into coloured tokens. Block comments opened on an earlier
 * line are handled by the caller passing `inBlockComment` forward.
 */
export function tokenizeLine(
  line: string,
  inBlockComment = false,
): { tokens: CodeToken[]; inBlockComment: boolean } {
  const tokens: CodeToken[] = [];
  let rest = line;
  let offset = 0;
  let block = inBlockComment;

  if (block) {
    const end = rest.indexOf("*/");
    if (end === -1) {
      return { tokens: [{ text: rest, kind: "comment" }], inBlockComment: true };
    }
    tokens.push({ text: rest.slice(0, end + 2), kind: "comment" });
    offset = end + 2;
    rest = rest.slice(end + 2);
    block = false;
  }

  while (rest.length > 0) {
    let matched = false;

    for (const scanner of SCANNERS) {
      const match = scanner.re.exec(rest);
      if (!match || match[0].length === 0) continue;

      const text = match[0];
      let kind = scanner.kind;

      if (kind === "comment" && text.startsWith("/*") && !text.endsWith("*/")) {
        block = true;
      }
      if (kind === "plain" && /^[A-Za-z_$]/.test(text)) {
        kind = classifyWord(
          text,
          line.slice(0, offset),
          rest.slice(text.length),
        );
      }

      tokens.push({ text, kind });
      offset += text.length;
      rest = rest.slice(text.length);
      matched = true;
      break;
    }

    // Unreachable for well-formed input, but never spin on an unmatched char.
    if (!matched) {
      tokens.push({ text: rest[0], kind: "plain" });
      offset += 1;
      rest = rest.slice(1);
    }
  }

  return { tokens, inBlockComment: block };
}

/** Tokenize a whole listing, carrying block-comment state across lines. */
export function tokenizeCode(lines: string[]): CodeToken[][] {
  let block = false;
  return lines.map((line) => {
    const result = tokenizeLine(line, block);
    block = result.inBlockComment;
    return result.tokens;
  });
}

export type CodeLineProps = {
  tokens: CodeToken[];
  theme: CodeTheme;
  /**
   * Characters of the line to show. `undefined` shows all of it — pass a count
   * to reveal the line as if it were being written.
   */
  reveal?: number;
  /** Fades the whole line toward the theme's dim colour. */
  muted?: boolean;
};

/**
 * One rendered line of code. Characters past `reveal` are kept in the DOM at
 * zero opacity so the line never reflows as it writes in.
 */
export const CodeLine: React.FC<CodeLineProps> = ({
  tokens,
  theme,
  reveal,
  muted = false,
}) => {
  let consumed = 0;

  return (
    <span style={{ whiteSpace: "pre" }}>
      {tokens.map((token, index) => {
        const start = consumed;
        consumed += token.text.length;
        const shown =
          reveal === undefined
            ? token.text.length
            : Math.max(0, Math.min(token.text.length, reveal - start));
        const color = muted ? theme.faint : theme.token[token.kind];

        if (shown === token.text.length) {
          return (
            <span key={index} style={{ color }}>
              {token.text}
            </span>
          );
        }

        return (
          <span key={index} style={{ color }}>
            {token.text.slice(0, shown)}
            <span style={{ opacity: 0 }}>{token.text.slice(shown)}</span>
          </span>
        );
      })}
    </span>
  );
};

/** Total character count of a tokenized line. */
export function lineLength(tokens: CodeToken[]): number {
  return tokens.reduce((total, token) => total + token.text.length, 0);
}
