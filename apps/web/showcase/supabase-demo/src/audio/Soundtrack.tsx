import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { AUDIO_DIR, CUES, MUSIC_FILE, SOUNDS, musicGain } from "./cues";

/**
 * Soundtrack — the score plus every cue, each in its own Sequence so it
 * starts on its exact frame. `Audio` comes from @remotion/media, the audio
 * package this repo's Remotion (4.0.52x) uses.
 */
export const Soundtrack: React.FC = () => (
  <>
    <Audio src={staticFile(`${AUDIO_DIR}/${MUSIC_FILE}`)} volume={(f) => musicGain(f)} />
    {CUES.map((cue, i) => (
      <Sequence
        key={`${cue.frame}-${cue.sound}-${i}`}
        from={cue.frame}
        durationInFrames={SOUNDS[cue.sound].frames + 2}
        layout="none"
        name={`sfx ${cue.sound} @${cue.frame}`}
      >
        <Audio src={staticFile(`${AUDIO_DIR}/${SOUNDS[cue.sound].file}`)} volume={cue.volume} />
      </Sequence>
    ))}
  </>
);
