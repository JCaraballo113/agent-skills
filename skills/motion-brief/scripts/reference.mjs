#!/usr/bin/env node
// Measures a reference video's motion events by pixel difference and drafts REFERENCE.md.
// Usage: node reference.mjs <video> --out <dir> [--threshold 0.0003] [--gap 2] [--cut 0.4] [--overview-fps 2]
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { args, ffmpeg, probe, seconds, streamChunks } from "./media.mjs";

const ANALYSIS_WIDTH = 480;
const PIXEL_NOISE = 24;
const OVERVIEW_WIDTH = 960;
const EVENT_LONG_EDGE = 1920;
const MAX_EVENTS_WITH_IMAGES = 20;

const opts = args(process.argv.slice(2), {
  out: "string",
  threshold: "string",
  gap: "string",
  cut: "string",
  "overview-fps": "string",
});
const [file] = opts._;
if (!file || !opts.out) {
  console.error("usage: node reference.mjs <video> --out <dir> [--threshold 0.0003] [--gap 2] [--cut 0.4] [--overview-fps 2]");
  process.exit(1);
}
const threshold = Number(opts.threshold ?? 0.0003);
const gap = Number(opts.gap ?? 2);
const cutRatio = Number(opts.cut ?? 0.4);
const overviewFps = Number(opts["overview-fps"] ?? 2);

const src = probe(file);
if (!src.video && !src.width) throw new Error(`${file} has no video stream`);
if (src.variableFrameRate) {
  console.error(
    `${file} has a variable frame rate (r_frame_rate ${src.rFrameRate}, avg_frame_rate ${src.avgFrameRate}), so frame numbers drift from timestamps.\n` +
      `Make a constant-rate copy and measure that instead:\n  ffmpeg -i ${file} -fps_mode cfr -r ${Math.round(src.fps)} reference-cfr.mp4`,
  );
  process.exit(3);
}

const aw = Math.min(ANALYSIS_WIDTH, src.width);
const ah = Math.max(2, Math.round((src.height * aw) / src.width / 2) * 2);
const sx = src.width / aw;
const sy = src.height / ah;
const toSource = (b) => b && [Math.floor(b[0] * sx), Math.floor(b[1] * sy), Math.ceil((b[2] + 1) * sx), Math.ceil((b[3] + 1) * sy)];
const decode = ["-i", file, "-vf", `scale=${aw}:${ah}:flags=area,format=gray`, "-f", "rawvideo", "-"];

function diff(a, b) {
  let changed = 0;
  let x1 = aw, y1 = ah, x2 = -1, y2 = -1;
  for (let y = 0; y < ah; y++) {
    const row = y * aw;
    for (let x = 0; x < aw; x++) {
      if (Math.abs(a[row + x] - b[row + x]) > PIXEL_NOISE) {
        changed++;
        if (x < x1) x1 = x;
        if (x > x2) x2 = x;
        if (y < y1) y1 = y;
        if (y > y2) y2 = y;
      }
    }
  }
  return { ratio: changed / (aw * ah), box: x2 < 0 ? null : [x1, y1, x2, y2] };
}

const union = (a, b) => (!a ? b : !b ? a : [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);

const perFrame = [];
let prev = null;
const total = await streamChunks(decode, aw * ah, (frame, n) => {
  perFrame.push(prev ? { n, ...diff(prev, frame) } : { n, ratio: 0, box: null });
  prev = Buffer.from(frame);
});

const cuts = perFrame.filter((f) => f.ratio >= cutRatio).map((f) => f.n);
const events = [];
let open = null;
for (const f of perFrame) {
  const moving = f.ratio > threshold && !cuts.includes(f.n);
  if (moving && open && f.n - open.end <= gap + 1 && !cuts.some((c) => c > open.end && c <= f.n)) {
    open.end = f.n;
    open.extent = union(open.extent, f.box);
    if (f.ratio > open.peakRatio) Object.assign(open, { peak: f.n, peakRatio: f.ratio });
  } else if (moving) {
    open = { start: f.n, end: f.n, peak: f.n, peakRatio: f.ratio, extent: f.box, firstBox: f.box };
    events.push(open);
  }
  if (moving) open.lastBox = f.box;
}

const wanted = new Set();
for (const e of events) {
  wanted.add(e.start - 1);
  wanted.add(e.end);
}
const kept = new Map();
await streamChunks(decode, aw * ah, (frame, n) => {
  if (wanted.has(n)) kept.set(n, Buffer.from(frame));
});

const nextBoundary = (n) => Math.min(...[...events.map((e) => e.start), ...cuts, total].filter((x) => x > n));
const measured = events.map((e, i) => {
  const net = kept.has(e.start - 1) && kept.has(e.end) ? diff(kept.get(e.start - 1), kept.get(e.end)) : null;
  return {
    id: `e${String(i + 1).padStart(2, "0")}`,
    start: e.start,
    settle: e.end,
    frames: e.end - e.start + 1,
    peak: e.peak,
    peakChangedShare: Number(e.peakRatio.toFixed(4)),
    netChangeBox: toSource(net?.box),
    motionExtentBox: toSource(e.extent),
    firstChangeBox: toSource(e.firstBox),
    lastChangeBox: toSource(e.lastBox),
    stillFramesAfter: nextBoundary(e.end) - e.end - 1,
  };
});

mkdirSync(opts.out, { recursive: true });

function extract(dir, selectExpr, scaleExpr, names, ext) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const filter = `select='${selectExpr}'${scaleExpr ? `,scale=${scaleExpr}` : ""}`;
  ffmpeg(["-i", file, "-vf", filter, "-fps_mode", "passthrough", "-q:v", "3", join(dir, `tmp-%05d.${ext}`)]);
  const made = readdirSync(dir).filter((f) => f.startsWith("tmp-")).sort();
  made.forEach((f, k) => renameSync(join(dir, f), join(dir, names[k] ?? f)));
  return made.length;
}

const step = Math.max(1, Math.round(src.fps / overviewFps));
const overviewFrames = [];
for (let n = 0; n < total; n += step) overviewFrames.push(n);
const ow = Math.min(OVERVIEW_WIDTH, src.width);
extract(
  join(opts.out, "overview"),
  `not(mod(n\\,${step}))`,
  `${ow}:-2`,
  overviewFrames.map((n) => `f${String(n).padStart(5, "0")}-t${seconds(n, src.fps).padStart(6, "0")}s.jpg`),
  "jpg",
);

const around = (n) => [n - 2, n - 1, n, n + 1, n + 2].filter((x) => x >= 0 && x < total);
const eventFrames = new Map();
for (const e of measured.slice(0, MAX_EVENTS_WITH_IMAGES)) {
  for (const n of [...around(e.start), e.peak, ...around(e.settle)]) if (!eventFrames.has(n)) eventFrames.set(n, e.id);
}
const longEdge = Math.max(src.width, src.height);
const eventScale = longEdge > EVENT_LONG_EDGE ? EVENT_LONG_EDGE / longEdge : 1;
const ordered = [...eventFrames.keys()].sort((a, b) => a - b);
if (ordered.length) {
  extract(
    join(opts.out, "events"),
    ordered.map((n) => `eq(n\\,${n})`).join("+"),
    eventScale < 1 ? `${Math.round(src.width * eventScale / 2) * 2}:-2` : "",
    ordered.map((n) => `${eventFrames.get(n)}-f${String(n).padStart(5, "0")}.png`),
    "png",
  );
}

const report = {
  source: src,
  analysis: { width: aw, height: ah, pixelNoise: PIXEL_NOISE, threshold, gap, cutRatio, boxPrecisionPx: [Math.ceil(sx), Math.ceil(sy)] },
  overview: { dir: "overview", everyNthFrame: step, width: ow },
  eventImages: { dir: "events", scale: eventScale, around: "start and settle ±2 frames, plus peak" },
  cuts,
  events: measured,
};
writeFileSync(join(opts.out, "motion.json"), `${JSON.stringify(report, null, 2)}\n`);

const box = (b) => (b ? `${b[0]},${b[1]} → ${b[2]},${b[3]}` : "none");
const t = (n) => `${n} (${seconds(n, src.fps)}s)`;
const rows = measured.map(
  (e) =>
    `| ${e.id} | ${t(e.start)} | ${t(e.settle)} | ${e.frames} | ${t(e.peak)} | ${box(e.netChangeBox)} | ${box(e.motionExtentBox)} | ${e.stillFramesAfter} |`,
);
const md = `# Reference: ${file}

Source: ${src.width}×${src.height}, ${src.avgFrameRate} fps (${src.fps.toFixed(3)}), ${total} frames, ${src.duration.toFixed(2)} s, ${src.audioStreams} audio stream(s).
Frame numbers are source frames at ${src.fps.toFixed(3)} fps, counted from 0. Boxes are x1,y1 → x2,y2 in source pixels, ±${Math.ceil(sx)} px.

## Measured

Written by reference.mjs from pixel differences. An event runs from the first frame that changes to the last frame before the picture holds still.

| event | starts | settles | frames | peak motion | net change box (start−1 vs settle) | motion extent box | still frames after |
|---|---|---|---|---|---|---|---|
${rows.join("\n") || "| none found | | | | | | | |"}

Hard cuts: ${cuts.length ? cuts.map(t).join(", ") : "none"}.

Overview images: \`overview/\`, every ${step} frames, ${ow} px wide. Each name carries its source frame and time.
Event images: \`events/\`, the start and settle of each event ±2 frames plus its peak, ${eventScale === 1 ? "at source resolution" : `scaled by ${eventScale.toFixed(4)} (divide a position read off them by this to get source pixels)`}.

## Estimated

From the images. Give the frames each value came from, and the frames that would settle it when it's uncertain.

## Proposed

Creative choices for our own shot, kept apart from what the reference does.
`;
writeFileSync(join(opts.out, "REFERENCE.md"), md);
console.log(md);
