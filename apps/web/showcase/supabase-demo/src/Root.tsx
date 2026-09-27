import { Composition } from "remotion";
import { SupabaseDemo, supabaseDemoSchema } from "./SupabaseDemo";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./timeline";

/**
 * An unofficial Supabase product tour. A showcase, not a registry component:
 * it lives beside launch-film/ so it never reaches registry.json.
 */
export const SupabaseDemoRoot: React.FC = () => (
  <Composition
    id="SupabaseDemo"
    component={SupabaseDemo}
    schema={supabaseDemoSchema}
    defaultProps={{ motionBlur: true }}
    durationInFrames={DURATION_IN_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
