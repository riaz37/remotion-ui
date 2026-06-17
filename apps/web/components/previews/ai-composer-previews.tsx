"use client";

import { PreviewFrame } from "./preview-frame";
import {
  ChatGpt,
  ClaudeChat,
  ClaudeCode,
  Opencode,
  V0Composer,
} from "../registry-exports";

export const ClaudeChatPreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <ClaudeChat />
  </PreviewFrame>
);

export const ChatGptPreview = () => (
  <PreviewFrame lane="blocks" padding={0}>
    <ChatGpt />
  </PreviewFrame>
);

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
