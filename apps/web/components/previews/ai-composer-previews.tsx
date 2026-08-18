"use client";

import { PreviewFrame } from "./preview-frame";
import {
  ChatGpt,
  ClaudeChat,
  ClaudeCode,
  Opencode,
  V0Composer,
} from "../registry-exports";

/**
 * Dark theme: both products ship one, and a light plate was one of the last two
 * holes in a contact sheet of 100+ dark tiles (D5).
 * See docs-internal/preview-audit-rubric.md.
 */
export const ClaudeChatPreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <ClaudeChat theme="dark" />
  </PreviewFrame>
);

export const ChatGptPreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <ChatGpt theme="dark" />
  </PreviewFrame>
);

/**
 * The audit samples at 15% / 50% / 90% of the window — frames 18, 60 and 108 on
 * the 120-frame default.
 *
 * - **18** — the empty composer under the greeting, placeholder still showing.
 * - **60** — mid-prompt. The default prompt is 27 characters at
 *   `AI_TYPING_CPS = 22`, so typing runs frames 42→79.
 * - **108** — sent. `sendBeatAt` presses the button at frame ~89 and the prompt
 *   rises into the thread with the reply dots pulsing under it.
 *
 * The 55-character prompt this shipped with typed frames 42→117 and the loop
 * restarted three frames later, so every sample was the same shot at a
 * different sentence length and the clip cut mid-word. Check the prompt length
 * against the window, not just the start frame.
 */
export const V0ComposerPreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <V0Composer />
  </PreviewFrame>
);

export const ClaudeCodePreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <ClaudeCode />
  </PreviewFrame>
);

export const OpencodePreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <Opencode />
  </PreviewFrame>
);
