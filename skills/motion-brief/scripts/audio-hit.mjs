#!/usr/bin/env node
// Finds where a sound effect becomes audible and where its strongest hit lands, and where to start it so the hit meets a frame.
// Usage: node audio-hit.mjs <audio> [--fps 30] [--at <frame>]
import { args, streamChunks } from "./media.mjs";

const SAMPLE_RATE = 48000;
const WINDOW_MS = 5;
const ONSET_BELOW_PEAK_DB = 45;
const SILENCE_DBFS = -60;

const opts = args(process.argv.slice(2), { fps: "string", at: "string" });
const [file] = opts._;
if (!file) {
  console.error("usage: node audio-hit.mjs <audio> [--fps 30] [--at <frame>]");
  process.exit(1);
}
const fps = Number(opts.fps ?? 30);
const windowSamples = (SAMPLE_RATE * WINDOW_MS) / 1000;

const levels = [];
await streamChunks(["-i", file, "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "f32le", "-"], windowSamples * 4, (chunk) => {
  let sum = 0;
  for (let i = 0; i < chunk.length; i += 4) sum += chunk.readFloatLE(i) ** 2;
  const rms = Math.sqrt(sum / windowSamples);
  levels.push(rms > 0 ? 20 * Math.log10(rms) : -Infinity);
});
if (!levels.length) throw new Error(`${file} decoded to no audio`);

const peakDb = Math.max(...levels);
const peakIndex = levels.indexOf(peakDb);
const onsetFloor = Math.max(peakDb - ONSET_BELOW_PEAK_DB, SILENCE_DBFS);
const onsetIndex = levels.findIndex((db) => db >= onsetFloor);
let hitIndex = onsetIndex;
let biggestRise = -Infinity;
for (let i = Math.max(1, onsetIndex); i <= peakIndex; i++) {
  const rise = levels[i] - (Number.isFinite(levels[i - 1]) ? levels[i - 1] : SILENCE_DBFS);
  if (rise > biggestRise) [biggestRise, hitIndex] = [rise, i];
}

const sec = (i) => (i * WINDOW_MS) / 1000;
const result = {
  file,
  durationSeconds: Number(sec(levels.length).toFixed(3)),
  peakDbfs: Number(peakDb.toFixed(1)),
  audibleFromSeconds: sec(onsetIndex),
  hitSeconds: sec(hitIndex),
  loudestSeconds: sec(peakIndex),
  hitFramesIn: Math.round(sec(hitIndex) * fps),
  fps,
};
if (opts.at !== undefined) {
  const at = Number(opts.at);
  const start = at - result.hitFramesIn;
  result.placeAt = at;
  result.startFrame = start;
  result.note =
    start >= 0
      ? `Start the clip at frame ${start} so its hit lands on frame ${at}.`
      : `The hit is ${result.hitFramesIn} frames in, earlier than frame 0 allows: start the clip at frame 0 and trim ${-start} frames off its start.`;
}
console.log(JSON.stringify(result, null, 2));
