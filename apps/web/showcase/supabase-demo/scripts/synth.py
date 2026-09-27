"""
synth.py — the film's score and sound effects, synthesized from nothing.

No samples, no downloaded audio: every waveform below is computed here, so the
output is an original work dedicated to the public domain (CC0). See
src/audio/CREDITS.md.

The score is written against the film's beat grid: 120 BPM at 30 fps is exactly
15 frames per beat and 60 frames per bar, and the whole 48 s film is 24 bars.
Section changes land on the frames the camera moves on (see src/timeline.ts).

    # needs numpy + scipy
    python3 showcase/supabase-demo/scripts/synth.py   # run from apps/web

Writes WAVs to public/supabase-demo/audio/ (the music is then encoded to MP3
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
LENGTH = 48.0
FPS = 30

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "public" / "supabase-demo" / "audio"

rng = np.random.default_rng(20260926)


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

# Section boundaries, in frames, taken from the film's timeline.
GROOVE_IN = frames(120)  # Database beat: kick + bass enter
LIFT_IN = frames(600)  # mid-film: clap, arp, shaker
FILL_START = frames(1080)  # drums drop for the riser
PEAK_IN = frames(1110)  # pull-back: everything
BREAK_IN = frames(1215)  # push to the end card: drums out
FINAL = frames(1260)  # logo impact: final chord


def chord_at(t):
    return CHORDS[int(t // (2 * BAR)) % len(CHORDS)]


def build_music():
    n = int(LENGTH * SR)
    drums = np.zeros((2, n))
    bassbus = np.zeros((2, n))
    padbus = np.zeros((2, n))
    arpbus = np.zeros((2, n))
    kicks = []

    beats = int(LENGTH / BEAT)
    for b in range(beats):
        t = b * BEAT
        in_groove = GROOVE_IN <= t < BREAK_IN and not (FILL_START <= t < PEAK_IN)
        if 2.0 <= t < GROOVE_IN:
            add(drums, kick(0.32, click=False), t, 1.0)
            kicks.append(t)
        if in_groove:
            add(drums, kick(1.0), t)
            kicks.append(t)
            open_ = t >= PEAK_IN
            add(drums, hat(0.55 if not open_ else 0.4, open_), t + BEAT / 2, pan=0.25)
            if t >= LIFT_IN and b % 2 == 1:
                add(drums, clap(0.55), t, pan=-0.05)
        if t >= frames(390) and in_groove:
            for s in range(4):
                sw = 0.012 if s % 2 else 0
                add(drums, shaker(0.16 if s % 2 else 0.1), t + s * BEAT / 4 + sw, pan=-0.35)

    # The fill: a snare-ish roll of claps accelerating into the pull-back.
    roll_t = FILL_START
    step = BEAT / 2
    while roll_t < PEAK_IN - 0.01:
        vel = 0.2 + 0.5 * (roll_t - FILL_START) / (PEAK_IN - FILL_START)
        add(drums, clap(vel), roll_t, pan=0.1)
        roll_t += step
        step = max(BEAT / 8, step * 0.72)

    # Bass: offbeat eighths plus a sixteenth pickup, ducked by the kick below.
    for b in range(beats):
        t = b * BEAT
        if not (GROOVE_IN <= t < BREAK_IN) or FILL_START <= t < PEAK_IN:
            continue
        root, _ = chord_at(t)
        add(bassbus, bass(root, BEAT * 0.42, 0.9), t + BEAT / 2)
        if b % 4 == 3:
            add(bassbus, bass(root + 12, BEAT * 0.2, 0.5), t + BEAT * 0.75)

    # Pads: two-bar chords, then the final Am9 rings from the logo impact.
    t = 0.0
    while t < FINAL - 0.01:
        _, notes = chord_at(t)
        dur = min(2 * BAR, FINAL - t)
        for i, m in enumerate(notes):
            left, right = pad_note(m, dur, attack=1.2 if t == 0 else 0.5, cutoff=900 if t < LIFT_IN else 1500)
            add(padbus, left, t, 0.11, pan=-0.6 + i * 0.3)
            add(padbus, right, t, 0.11, pan=0.6 - i * 0.3)
        t += 2 * BAR
    for i, m in enumerate([45, 57, 60, 64, 67, 71, 76]):
        left, right = pad_note(m, LENGTH - FINAL - 2.2, attack=0.02, release=2.0, cutoff=2200)
        add(padbus, left, FINAL, 0.12, pan=-0.6 + i * 0.2)
        add(padbus, right, FINAL, 0.12, pan=0.6 - i * 0.2)
    add(bassbus, np.sin(2 * np.pi * 55 * tvec(4.0)) * np.exp(-tvec(4.0) / 1.2), FINAL, 0.7)

    # Arp: sixteenths over the chord tones an octave up, from the lift.
    pattern = [0, 2, 4, 1, 3, 2, 4, 3]
    sixteenth = BEAT / 4
    steps = int((BREAK_IN - LIFT_IN) / sixteenth)
    for s in range(steps):
        t = LIFT_IN + s * sixteenth
        if FILL_START <= t < PEAK_IN:
            continue
        _, notes = chord_at(t)
        m = notes[pattern[s % len(pattern)]] + 12
        bright = 1800 + 2600 * min(1, (t - LIFT_IN) / (BREAK_IN - LIFT_IN))
        vel = 0.5 if s % 4 == 0 else 0.3
        add(arpbus, pluck(m, vel, bright), t, 0.5, pan=0.3 if s % 2 else -0.3)
    arpbus = pingpong(arpbus, BEAT * 0.75)

    # Breakdown: a reversed swell pulls into the final chord.
    swell_len = FINAL - BREAK_IN
    st = tvec(swell_len)
    swell = signal.sosfilt(sos_band(400, 5000), noise(len(st))) * (st / swell_len) ** 3
    add(padbus, swell, BREAK_IN, 0.25)

    # Sidechain: pads and bass breathe against every kick.
    duck = np.ones(n)
    for k in kicks:
        s = int(k * SR)
        length = int(0.3 * SR)
        e = min(n, s + length)
        tt = np.arange(e - s) / SR
        duck[s:e] = np.minimum(duck[s:e], 1 - 0.55 * np.exp(-tt / 0.09))
    padbus *= duck
    bassbus *= 0.4 + 0.6 * duck

    mix = drums * 0.9 + bassbus * 0.55 + padbus + arpbus * 0.5
    mix = reverb(mix, wet=0.22)
    # Final fade over the last 1.5 s, so the file ends in silence rather than a click.
    fade = np.clip((LENGTH - np.arange(n) / SR) / 1.5, 0, 1)
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
