#!/usr/bin/env tsx
/**
 * Generates `public/media/demo-loop.wav` — the audio bed every audio preview
 * renders against.
 *
 * The previous demo source was a steady tone: `visualizeAudio()` returned an
 * essentially identical spectrum on every frame, so bars, pulses and waveforms
 * rendered as frozen shapes. This synthesises an 8-second, 4-bar loop with a
 * kick, a snare, hats, a moving bassline and an arpeggio, which gives the
 * visualizers real movement in both time and frequency.
 *
 * `useWindowedAudioData()` only accepts `.wav`, so the output stays uncompressed
 * — mono at 24 kHz keeps it under 400 kB.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(
  __dirname,
  "..",
  "public",
  "media",
  "demo-loop.wav",
);

const SAMPLE_RATE = 24_000;
const BPM = 120;
const BEAT = 60 / BPM;
const BARS = 4;
const DURATION = BEAT * 4 * BARS;
const TOTAL_SAMPLES = Math.round(DURATION * SAMPLE_RATE);

const TWO_PI = Math.PI * 2;

/** Deterministic noise so repeated builds produce a byte-identical file. */
function noise(index: number) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

const decay = (t: number, rate: number) => (t < 0 ? 0 : Math.exp(-t * rate));

/** Time since the most recent hit on a grid of `interval`, or null before `offset`. */
function sinceHit(t: number, interval: number, offset = 0) {
  if (t < offset) return null;
  return (t - offset) % interval;
}

const NOTES = {
  a1: 55,
  f1: 43.65,
  c2: 65.41,
  g1: 49,
} as const;

/** One root per bar: Am – F – C – G. */
const ROOTS = [NOTES.a1, NOTES.f1, NOTES.c2, NOTES.g1];
/** Arpeggio degrees over the bar root, in semitones. */
const ARP_STEPS = [0, 7, 12, 16, 19, 16, 12, 7];

const semitone = (root: number, steps: number) => root * 2 ** (steps / 12);

function kick(t: number) {
  // Four-on-the-floor with a pickup on the "and" of beat 4.
  const grid = sinceHit(t, BEAT);
  if (grid === null) return 0;
  const pitch = 110 * decay(grid, 26) + 46;
  return Math.sin(TWO_PI * pitch * grid) * decay(grid, 7.5) * 0.9;
}

function snare(t: number) {
  const grid = sinceHit(t, BEAT * 2, BEAT);
  if (grid === null) return 0;
  const body = Math.sin(TWO_PI * 185 * grid) * 0.35;
  const crack = noise(Math.round(t * SAMPLE_RATE)) * 0.45;
  return (body + crack) * decay(grid, 22) * 0.55;
}

function hats(t: number) {
  const grid = sinceHit(t, BEAT / 2);
  if (grid === null) return 0;
  const openBeat = Math.floor(t / (BEAT / 2)) % 4 === 3;
  const sample = Math.round(t * SAMPLE_RATE);
  // Differencing white noise is a cheap high-pass: pushes energy into the top
  // bins so the spectrum has something to show above the bass.
  const bright = noise(sample) - noise(sample - 1);
  return bright * decay(grid, openBeat ? 26 : 78) * 0.13;
}

function bass(t: number) {
  const bar = Math.floor(t / (BEAT * 4)) % BARS;
  const root = ROOTS[bar];
  const grid = sinceHit(t, BEAT / 2);
  if (grid === null) return 0;
  const envelope = decay(grid, 5.5);
  const fundamental = Math.sin(TWO_PI * root * t);
  const octave = Math.sin(TWO_PI * root * 2 * t) * 0.32;
  const growl = Math.sin(TWO_PI * root * 3 * t) * 0.12 * decay(grid, 12);
  return (fundamental + octave + growl) * envelope * 0.42;
}

function pad(t: number) {
  const bar = Math.floor(t / (BEAT * 4)) % BARS;
  const root = ROOTS[bar] * 4;
  const swell = 0.5 + 0.5 * Math.sin(TWO_PI * (t / DURATION) - Math.PI / 2);
  const voices = [0, 3, 7, 10].map((steps, index) => {
    const freq = semitone(root, steps);
    const detune = 1 + (index - 1.5) * 0.0016;
    return Math.sin(TWO_PI * freq * detune * t) / (index + 1.6);
  });
  return voices.reduce((sum, value) => sum + value, 0) * (0.1 + swell * 0.08);
}

function arp(t: number) {
  const bar = Math.floor(t / (BEAT * 4)) % BARS;
  const step = Math.floor(t / (BEAT / 2)) % ARP_STEPS.length;
  const grid = sinceHit(t, BEAT / 2);
  if (grid === null) return 0;
  const freq = semitone(ROOTS[bar] * 8, ARP_STEPS[step]);
  const envelope = decay(grid, 9) * (1 - decay(grid, 400));
  const tone =
    Math.sin(TWO_PI * freq * t) +
    Math.sin(TWO_PI * freq * 2 * t) * 0.24 * decay(grid, 16) +
    Math.sin(TWO_PI * freq * 3 * t) * 0.1 * decay(grid, 30);
  return tone * envelope * 0.2;
}

/** Soft-knee limiter — keeps peaks in range without the crunch of hard clipping. */
const saturate = (value: number) => Math.tanh(value * 1.05);

function renderSamples() {
  const samples = new Float32Array(TOTAL_SAMPLES);

  for (let index = 0; index < TOTAL_SAMPLES; index += 1) {
    const t = index / SAMPLE_RATE;
    samples[index] = saturate(
      kick(t) + snare(t) + hats(t) + bass(t) + pad(t) + arp(t),
    );
  }

  // Normalize to -1 dBFS so the visualizers see a consistent reference level.
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  const gain = peak > 0 ? 0.891 / peak : 1;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] *= gain;
  }

  // Two-millisecond edge ramps so the loop point does not click.
  const rampSamples = Math.round(SAMPLE_RATE * 0.002);
  for (let index = 0; index < rampSamples; index += 1) {
    const factor = index / rampSamples;
    samples[index] *= factor;
    samples[samples.length - 1 - index] *= factor;
  }

  return samples;
}

function encodeWav(samples: Float32Array) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + index * bytesPerSample);
  }

  return buffer;
}

const wav = encodeWav(renderSamples());
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, wav);

console.log(
  `Wrote ${path.relative(process.cwd(), outputPath)} — ${DURATION}s, ${SAMPLE_RATE}Hz mono, ${(wav.length / 1024).toFixed(0)} kB`,
);
