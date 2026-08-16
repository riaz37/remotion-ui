import { Composition } from "remotion";
import { GlassHeadline } from "./glass-headline";
import { GrainDissolveDemo } from "./grain-dissolve-demo";
import { ShaderField } from "./shader-field";

export const SpikeRoot: React.FC = () => (
  <>
    <Composition
      id="ShaderField"
      component={ShaderField}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="GlassHeadline"
      component={GlassHeadline}
      durationInFrames={60}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="GrainDissolveDemo"
      component={GrainDissolveDemo}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
