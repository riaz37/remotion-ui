"""
synth.py: the RemotionUI launch film's score and effects, synthesised from nothing.

Adapted from showcase/supabase-demo/scripts/synth.py (same instruments and
effects); the arrangement below is new and written against this film's
timeline (src/timeline.ts).

No samples, no downloaded audio: every waveform below is computed here, so the
output is an original work dedicated to the public domain (CC0). 

The score is written against the film's beat grid: 120 BPM at 30 fps is exactly
15 frames per beat and 60 frames per bar, and the whole 34 s film is 17 bars.
Section changes land on the frames in src/timeline.ts, copied here as numbers.

    # needs numpy + scipy
    python3 showcase/remotionui-launch/scripts/synth.py   # run from apps/web

Writes WAVs to public/remotionui-launch/audio/ (the music is then encoded to MP3
by the same script through ffmpeg).
"""

import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
BPM = 120
BEAT = 60 / BPM  # 0.5 s == 15 frames at 30 fps
BAR = BEAT * 4
LENGTH = 34.0
FPS = 30

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "public" / "remotionui-launch" / "audio"

rng = np.random.default_rng(20260927)


def frames(f):
    """Frame number -> seconds."""
    return f / FPS


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def noise(n):
    return rng.uniform(-1, 1, n)


def sos_band(lo, hi, order=2):
    return signal.butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")


def sos_lp(fc, order=2):
    return signal.butter(order, fc, btype="lowpass", fs=SR, output="sos")


def sos_hp(fc, order=2):
    return signal.butter(order, fc, btype="highpass", fs=SR, output="sos")


def add(buf, sig, at, gain=1.0, pan=0.0):
    """Mix a mono signal into a stereo buffer at time `at` with equal-power pan."""
    start = int(round(at * SR))
    if start >= buf.shape[1]:
        return
    end = min(buf.shape[1], start + len(sig))
    seg = sig[: end - start] * gain
    angle = (pan + 1) * np.pi / 4
    buf[0, start:end] += seg * np.cos(angle)
    buf[1, start:end] += seg * np.sin(angle)


def additive_saw(freq, t, cutoff, max_harm=40):
    """Band-limited saw with a soft spectral rolloff standing in for a lowpass."""
    out = np.zeros_like(t)
    for k in range(1, max_harm + 1):
        f = freq * k
        if f > SR / 2.2:
            break
        roll = 1.0 / (1.0 + (f / cutoff) ** 4)
        out += np.sin(2 * np.pi * f * t) * roll / k
    return out


def sweep_filter(x, centers, q=1.2, block=256):
    """Time-varying bandpass: redesign per block, carry the filter state."""
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        c = float(np.clip(centers[min(i, len(centers) - 1)], 60, SR / 2.3))
        bw = c / q
        lo, hi = max(20.0, c - bw / 2), min(SR / 2.1, c + bw / 2)
        sos = sos_band(lo, hi)
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        out[i : i + block], zi = signal.sosfilt(sos, x[i : i + block], zi=zi)
    return out


# ---------------------------------------------------------------- instruments


def kick(vel=1.0, click=True):
    t = tvec(0.5)
    f = 46 + 120 * np.exp(-t / 0.032)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-t / 0.17)
    if click:
        body += signal.sosfilt(sos_hp(3000), noise(len(t))) * np.exp(-t / 0.004) * 0.35
    return np.tanh(body * 1.6) * vel


def hat(vel=1.0, open_=False):
    t = tvec(0.35 if open_ else 0.09)
    n = signal.sosfilt(sos_hp(7500), noise(len(t)))
    return n * np.exp(-t / (0.12 if open_ else 0.022)) * vel


def shaker(vel=1.0):
    t = tvec(0.07)
    n = signal.sosfilt(sos_band(5000, 11000), noise(len(t)))
    env = np.minimum(t / 0.008, 1) * np.exp(-t / 0.02)
    return n * env * vel


def clap(vel=1.0):
    t = tvec(0.4)
    n = signal.sosfilt(sos_band(900, 2600), noise(len(t)))
    env = np.zeros_like(t)
    for off in (0.0, 0.011, 0.023):
        env += np.where(t >= off, np.exp(-(t - off) / 0.006), 0)
    env += np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.11) * 0.6, 0)
    return n * env * vel


def bass(midi, dur, vel=1.0):
    t = tvec(dur)
    f = mtof(midi)
    cutoff = 180 + 900 * np.exp(-t / 0.06)
    # Time-varying rolloff approximated in 4 slices; cheap and smooth enough for a bass.
    sig = np.zeros_like(t)
    slices = np.array_split(np.arange(len(t)), 6)
    for idx in slices:
        if len(idx) == 0:
            continue
        sig[idx] = additive_saw(f, t[idx], float(cutoff[idx[0]]), 24)
    sub = np.sin(2 * np.pi * f * t) * 0.8
    env = np.minimum(t / 0.004, 1) * np.exp(-t / 0.18) * np.clip((dur - t) / 0.02, 0, 1)
    return np.tanh((sig * 0.6 + sub) * env * 1.3) * vel


def pluck(midi, vel=1.0, bright=2500):
    t = tvec(0.5)
    f = mtof(midi)
    sig = additive_saw(f, t, bright, 12) * 0.5 + np.sin(2 * np.pi * f * t)
    env = np.minimum(t / 0.002, 1) * np.exp(-t / 0.11)
    return sig * env * vel


def pad_note(midi, dur, attack=0.8, release=1.6, cutoff=1300):
    t = tvec(dur + release)
    voices = []
    for detune in (-0.09, 0.0, 0.08):
        f = mtof(midi + detune)
        voices.append(additive_saw(f, t + rng.uniform(0, 0.01), cutoff, 30))
    env = np.minimum(t / attack, 1)
    env *= np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    left = (voices[0] + voices[1] * 0.7) * env
    right = (voices[2] + voices[1] * 0.7) * env
    return left, right


def reverb(buf, seconds=2.6, decay=0.85, wet=0.25):
    t = tvec(seconds)
    ir = np.stack([noise(len(t)), noise(len(t))]) * np.exp(-t / decay * 3)
    ir = signal.sosfilt(sos_lp(5000), ir, axis=1)
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.sqrt(np.sum(ir**2, axis=1, keepdims=True))
    out = np.stack(
        [signal.fftconvolve(buf[c], ir[c])[: buf.shape[1]] for c in range(2)]
    )
    return buf + out * wet


def pingpong(buf, delay, feedback=0.38, taps=6):
    """Echoes alternate left/right, each quieter by `feedback`."""
    out = np.zeros_like(buf)
    mono = buf.mean(axis=0)
    d = int(delay * SR)
    n = buf.shape[1]
    for i in range(1, taps + 1):
        lag = i * d
        if lag >= n:
            break
        out[i % 2, lag:] += mono[: n - lag] * feedback**i
    return buf + signal.sosfilt(sos_lp(4200), out, axis=1)


# ---------------------------------------------------------------- arrangement

# A minor. Each chord holds two bars (4 s): Am9 | Fmaj9 | Cmaj7 | Em7/G
CHORDS = [
    (45, [57, 60, 64, 67, 71]),
    (41, [53, 57, 60, 64, 67]),
    (36, [55, 60, 64, 67, 71]),
    (43, [55, 59, 62, 64, 67]),
]

# Section boundaries, in frames, from src/timeline.ts.
PULSE_IN = frames(60)  # thesis line 1 lands: a soft heartbeat kick
GROOVE_IN = frames(128)  # push into the hero: kick + hats + bass
SHAKER_IN = frames(300)  # push into the terminal: 16th shaker
LIFT_IN = frames(470)  # the flip lands: clap + arp
BUILD_IN = frames(540)  # montage: 16th hats, brighter arp
ROLL_IN = frames(660)  # clap roll accelerating into the stop
STOP = frames(720)  # hard stop on the downbeat: everything cuts
PAD_BACK = frames(735)  # a filtered pad under the count
FINAL = frames(900)  # logo impact: final chord
FADE_END = frames(985)  # music gone; 990-1020 is silence


def chord_at(t):
    return CHORDS[int(t // (2 * BAR)) % len(CHORDS)]


def build_music():
    n = int(LENGTH * SR)
    drums = np.zeros((2, n))
    bassbus = np.zeros((2, n))
    padbus = np.zeros((2, n))
    arpbus = np.zeros((2, n))
    kicks = []

    beats = int(STOP / BEAT)
    for b in range(beats):
        t = b * BEAT
        if PULSE_IN <= t < GROOVE_IN and b % 2 == 0:
            add(drums, kick(0.35, click=False), t)
            kicks.append(t)
        if t >= GROOVE_IN:
            add(drums, kick(1.0), t)
            kicks.append(t)
            add(drums, hat(0.5), t + BEAT / 2, pan=0.25)
            if t >= LIFT_IN and b % 2 == 1:
                add(drums, clap(0.55), t, pan=-0.05)
            if t >= BUILD_IN:
                for s in (1, 3):
                    add(drums, hat(0.28), t + s * BEAT / 4, pan=-0.2)
        if t >= SHAKER_IN:
            for s in range(4):
                sw = 0.012 if s % 2 else 0
                add(drums, shaker(0.16 if s % 2 else 0.1), t + s * BEAT / 4 + sw, pan=-0.35)

    # The roll: claps accelerating from 8ths to 32nds into the stop.
    roll_t = ROLL_IN
    step = BEAT / 2
    while roll_t < STOP - 0.01:
        vel = 0.2 + 0.55 * (roll_t - ROLL_IN) / (STOP - ROLL_IN)
        add(drums, clap(vel), roll_t, pan=0.1)
        roll_t += step
        step = max(BEAT / 8, step * 0.8)

    # Bass: offbeat eighths plus a sixteenth pickup, from the groove to the stop.
    for b in range(beats):
        t = b * BEAT
        if t < GROOVE_IN:
            continue
        root, _ = chord_at(t)
        add(bassbus, bass(root, BEAT * 0.42, 0.9), t + BEAT / 2)
        if b % 4 == 3:
            add(bassbus, bass(root + 12, BEAT * 0.2, 0.5), t + BEAT * 0.75)

    # Pads: two-bar chords up to the stop.
    t = 0.0
    while t < STOP - 0.01:
        _, notes = chord_at(t)
        dur = min(2 * BAR, STOP - t)
        for i, m in enumerate(notes):
            left, right = pad_note(m, dur, attack=1.0 if t == 0 else 0.5, release=0.05, cutoff=900 if t < LIFT_IN else 1600)
            add(padbus, left, t, 0.11, pan=-0.6 + i * 0.3)
            add(padbus, right, t, 0.11, pan=0.6 - i * 0.3)
        t += 2 * BAR

    # Arp: sixteenths over the chord tones an octave up, from the lift to the stop.
    pattern = [0, 2, 4, 1, 3, 2, 4, 3]
    sixteenth = BEAT / 4
    steps = int((STOP - LIFT_IN) / sixteenth)
    for s in range(steps):
        t = LIFT_IN + s * sixteenth
        _, notes = chord_at(t)
        m = notes[pattern[s % len(pattern)]] + 12
        bright = 1800 + 3000 * min(1, (t - LIFT_IN) / (STOP - LIFT_IN))
        vel = 0.5 if s % 4 == 0 else 0.3
        add(arpbus, pluck(m, vel, bright), t, 0.5, pan=0.3 if s % 2 else -0.3)
    arpbus = pingpong(arpbus, BEAT * 0.75)

    # Sidechain: pads and bass breathe against every kick.
    duck = np.ones(n)
    for k in kicks:
        s = int(k * SR)
        e = min(n, s + int(0.3 * SR))
        tt = np.arange(e - s) / SR
        duck[s:e] = np.minimum(duck[s:e], 1 - 0.55 * np.exp(-tt / 0.09))
    padbus *= duck
    bassbus *= 0.4 + 0.6 * duck

    groove = drums * 0.9 + bassbus * 0.55 + padbus + arpbus * 0.5
    groove = reverb(groove, wet=0.2)
    # The hard stop: the groove (tails included) cuts to nothing in 6 ms.
    stop_i = int(STOP * SR)
    cut = np.ones(n)
    cut[stop_i:] = 0
    cut[stop_i - int(0.006 * SR) : stop_i] = np.linspace(1, 0, int(0.006 * SR))
    groove *= cut

    after = np.zeros((2, n))
    # A sub drop under the stop, and a filtered pad under the count and the line.
    add(after, np.sin(2 * np.pi * 41 * tvec(2.2)) * np.exp(-tvec(2.2) / 0.6), STOP, 0.45)
    t = PAD_BACK
    for chord_i, dur in ((1, FINAL - PAD_BACK - 2.0), (2, 2.0)):
        _, notes = CHORDS[chord_i]
        for i, m in enumerate(notes):
            left, right = pad_note(m, dur, attack=0.9, release=0.2, cutoff=700)
            add(after, left, t, 0.07, pan=-0.5 + i * 0.25)
            add(after, right, t, 0.07, pan=0.5 - i * 0.25)
        t += dur
    # Reversed noise swell pulling into the impact.
    swell_len = FINAL - frames(840)
    st = tvec(swell_len)
    add(after, signal.sosfilt(sos_band(400, 5000), noise(len(st))) * (st / swell_len) ** 3, frames(840), 0.2)
    # Final chord from the impact, fading out by FADE_END.
    for i, m in enumerate([45, 57, 60, 64, 67, 71, 76]):
        left, right = pad_note(m, FADE_END - FINAL, attack=0.02, release=0.3, cutoff=2400)
        add(after, left, FINAL, 0.12, pan=-0.6 + i * 0.2)
        add(after, right, FINAL, 0.12, pan=0.6 - i * 0.2)
    add(after, np.sin(2 * np.pi * 55 * tvec(2.6)) * np.exp(-tvec(2.6) / 1.0), FINAL, 0.6)
    after = reverb(after, wet=0.25)

    mix = groove + after
    tl = np.arange(n) / SR
    fade = np.clip((FADE_END - tl) / (FADE_END - FINAL - 0.4), 0, 1)
    fade = np.where(tl < FINAL + 0.4, 1, fade)
    mix *= fade
    mix = np.tanh(mix * 1.1)
    return mix / np.max(np.abs(mix)) * 0.89


# ---------------------------------------------------------------- effects


def whoosh(dur, peak_at, lo=250, hi=2600):
    t = tvec(dur)
    rise = np.clip(t / peak_at, 0, 1)
    fall = np.clip((dur - t) / (dur - peak_at), 0, 1)
    env = np.where(t < peak_at, rise**2.2, fall**1.6)
    centers = lo + (hi - lo) * env
    n = sweep_filter(noise(len(t)), centers, q=1.1)
    air = signal.sosfilt(sos_lp(180), noise(len(t))) * 2.5
    return (n + air * 0.3) * env


def click():
    t = tvec(0.07)
    body = signal.sosfilt(sos_band(1800, 5000), noise(len(t))) * np.exp(-t / 0.0045)
    tone = np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.012) * 0.35
    thud = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.018) * 0.5
    return body + tone + thud


def tick(freq):
    t = tvec(0.04)
    return (
        signal.sosfilt(sos_band(freq * 0.7, freq * 1.4), noise(len(t))) * np.exp(-t / 0.003)
        + np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.006) * 0.25
    )


def pop(f0, f1, length=0.12):
    t = tvec(length)
    f = f1 + (f0 - f1) * np.exp(-t / 0.018)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.minimum(t / 0.002, 1) * np.exp(-t / 0.035)


def blip():
    t = tvec(0.45)
    a = np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t / 0.09)
    b = np.sin(2 * np.pi * 1975.5 * t) * np.where(t > 0.06, np.exp(-(t - 0.06) / 0.12), 0)
    return (a + b * 0.8) * np.minimum(t / 0.003, 1)


def riser(dur=2.0):
    t = tvec(dur)
    p = t / dur
    centers = 350 * (18 ** p)
    n = sweep_filter(noise(len(t)), centers, q=2.0)
    f = 110 * 2 ** (2 * p)
    phase = 2 * np.pi * np.cumsum(f) / SR
    saw = signal.sosfilt(sos_lp(3000), 2 * ((phase / (2 * np.pi)) % 1) - 1)
    env = p**2.4 * np.clip((dur - t) / 0.015, 0, 1)
    return (n * 1.2 + saw * 0.25) * env


def impact(dur=3.0):
    t = tvec(dur)
    f = 32 + 60 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.0)
    crack = signal.sosfilt(sos_lp(3500), noise(len(t))) * np.exp(-t / 0.09)
    tail = signal.sosfilt(sos_band(200, 1600), noise(len(t))) * np.exp(-t / 0.7) * 0.25
    return np.tanh((sub * 1.2 + crack * 0.6 + tail) * 1.5)


def hit():
    t = tvec(0.7)
    f = 45 + 90 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    snap = signal.sosfilt(sos_band(1200, 7000), noise(len(t))) * np.exp(-t / 0.03)
    return np.tanh((body + snap * 0.5) * 1.4)


# ---------------------------------------------------------------- output


def write_wav(path, data):
    data = np.atleast_2d(data)
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(data.shape[0])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.T.tobytes())


def normalized(x, peak=0.89):
    fade = int(0.004 * SR)
    x = x.copy()
    x[-fade:] *= np.linspace(1, 0, fade)
    return x / np.max(np.abs(x)) * peak


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    effects = {
        "whoosh": whoosh(1.0, 0.5),
        "whoosh-short": whoosh(0.6, 0.22, 400, 3400),
        "whoosh-long": whoosh(2.0, 0.85, 160, 2000),
        "click": click(),
        "tick-1": tick(3200),
        "tick-2": tick(3800),
        "tick-3": tick(4400),
        "pop": pop(1100, 420),
        "pop-low": pop(620, 210, 0.16),
        "blip": blip(),
        "riser": riser(2.0),
        "impact": impact(),
        "hit": hit(),
    }
    for name, sig in effects.items():
        write_wav(OUT / f"{name}.wav", normalized(sig))

    music = build_music()
    wav = OUT / "music.wav"
    write_wav(wav, music)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "256k", str(OUT / "music.mp3")],
        check=True,
    )
    wav.unlink()
    print(f"wrote {len(effects)} effects + music.mp3 to {OUT}")


if __name__ == "__main__":
    main()
