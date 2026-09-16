"use client";

import { TextRevealShader } from "../../registry/bases/default/primitives/text-reveal-shader";
import { PREVIEW_UI_FONT, PreviewFrame } from "./preview-frame";

/**
 * No card over this one: the component *is* the type, so anything stacked on
 * top would be competing with the thing being demonstrated.
 *
 * The face is pinned to the stage font rather than left to the component
 * default. The glyphs are rasterised to a texture here, so an unpinned stack
 * would resolve differently on a dev box and a render worker and the audit
 * would be comparing two typefaces.
 */
export const TextRevealShaderPreview: React.FC = () => (
  <PreviewFrame lane="shaders" padding={0}>
    <TextRevealShader fontFamily={PREVIEW_UI_FONT} />
  </PreviewFrame>
);
