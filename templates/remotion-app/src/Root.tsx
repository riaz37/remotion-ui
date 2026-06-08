import { Composition } from "remotion";
import { WelcomeComposition } from "@/compositions/welcome";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Welcome"
        component={WelcomeComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
