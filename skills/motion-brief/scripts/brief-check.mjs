#!/usr/bin/env node
// Checks BRIEF.md's frame plan, prints its timeline in seconds, and optionally the render commands or an export's metadata check.
// Usage: node brief-check.mjs BRIEF.md [--commands] [--export out/film.mp4] [--cps 15]
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { args, probe, seconds } from "./media.mjs";

const MIN_HOLD_SECONDS = 1;
const BOUNDARY_PREVIEW_SECONDS = 1;

export function parseBrief(text) {
  const brief = { scenes: [], transitions: [], events: [], holds: [], cues: [], stages: [], problems: [] };
  for (const [index, raw] of text.split("\n").entries()) {
    const line = raw.trim();
    const at = `line ${index + 1}`;
    let m;
    if ((m = line.match(/^Composition:\s*([\w-]+),\s*(\d+)\s*by\s*(\d+),\s*([\d.]+)\s*fps,\s*(\d+)\s*frames/i))) {
      brief.composition = { id: m[1], width: +m[2], height: +m[3], fps: +m[4], frames: +m[5] };
    } else if ((m = line.match(/^SCENE\s+([\w-]+):\s*FRAMES\s+(\d+)\s+THROUGH\s+(\d+)/i))) {
      brief.scenes.push({ name: m[1], from: +m[2], to: +m[3], at });
    } else if ((m = line.match(/^TRANSITION\s+(\d+)\s+(\d+)/i))) {
      brief.transitions.push({ from: +m[1], to: +m[2], at });
    } else if ((m = line.match(/^EVENT\s+(\d+)\s+([\w-]+)\s*(.*)$/i))) {
      brief.events.push({ frame: +m[1], name: m[2], what: m[3], at });
    } else if ((m = line.match(/^HOLD\s+(\d+)\s+(\d+)\s+"(.+)"/i))) {
      brief.holds.push({ from: +m[1], to: +m[2], text: m[3], at });
    } else if ((m = line.match(/^CUE\s+(\d+)\s+([\w-]+)\s*(.*)$/i))) {
      brief.cues.push({ frame: +m[1], name: m[2], what: m[3], at });
    } else if ((m = line.match(/^STAGE\s+([\w-]+)\s+([\d\s]+)$/i))) {
      brief.stages.push({ name: m[1], frames: m[2].trim().split(/\s+/).map(Number), at });
    } else if (/^(SCENE|EVENT|HOLD|CUE|STAGE|TRANSITION|Composition)\b/i.test(line)) {
      brief.problems.push(`${at}: "${line}" starts with a brief keyword but doesn't match its format (see BRIEF-TEMPLATE.md)`);
    }
  }
  return brief;
}

export function checkBrief(brief, { cps = 15 } = {}) {
  const errors = [...brief.problems];
  const warnings = [];
  const c = brief.composition;
  if (!c) return { errors: [...errors, 'no "Composition: <id>, <w> by <h>, <fps> fps, <frames> frames." line'], warnings };
  const last = c.frames - 1;
  const inRange = (n, what, at) => {
    if (n < 0 || n > last) errors.push(`${at}: ${what} frame ${n} is outside 0 through ${last}`);
  };

  const scenes = [...brief.scenes].sort((a, b) => a.from - b.from);
  if (!scenes.length) errors.push('no "SCENE <name>: FRAMES <a> THROUGH <b>" lines');
  scenes.forEach((s, i) => {
    if (s.to < s.from) errors.push(`${s.at}: scene ${s.name} ends before it starts`);
    inRange(s.to, `scene ${s.name} end`, s.at);
    if (i === 0 && s.from !== 0) errors.push(`${s.at}: the first scene starts at ${s.from}, not 0`);
    const next = scenes[i + 1];
    if (!next) {
      if (s.to !== last) errors.push(`${s.at}: the last scene ends at ${s.to}, but the composition's last frame is ${last}`);
      return;
    }
    if (next.from > s.to + 1) errors.push(`${next.at}: frames ${s.to + 1} through ${next.from - 1} belong to no scene`);
    if (next.from <= s.to) {
      const declared = brief.transitions.some((t) => t.from === next.from && t.to === s.to);
      if (!declared)
        errors.push(`${next.at}: scenes ${s.name} and ${next.name} overlap on ${next.from} through ${s.to}; declare it as "TRANSITION ${next.from} ${s.to}" or butt the scenes together`);
    }
  });

  const names = new Set();
  for (const e of brief.events) {
    inRange(e.frame, `event ${e.name}`, e.at);
    if (names.has(e.name)) errors.push(`${e.at}: event name ${e.name} is used twice`);
    names.add(e.name);
  }
  const sorted = brief.events.map((e) => e.frame);
  if (sorted.some((f, i) => i && f < sorted[i - 1])) warnings.push("events aren't listed in frame order");

  for (const h of brief.holds) {
    inRange(h.from, "hold start", h.at);
    inRange(h.to, "hold end", h.at);
    const frames = h.to - h.from + 1;
    const needed = Math.ceil(c.fps * Math.max(MIN_HOLD_SECONDS, h.text.length / cps));
    if (frames < needed)
      errors.push(`${h.at}: "${h.text}" is readable for ${frames} frames (${seconds(frames, c.fps)}s); ${h.text.length} characters at ${cps} per second need at least ${needed}`);
  }

  for (const q of brief.cues) {
    inRange(q.frame, `cue ${q.name}`, q.at);
    if (!brief.events.some((e) => e.frame === q.frame))
      warnings.push(`${q.at}: cue ${q.name} at ${q.frame} sits on no EVENT frame; sounds land on the visible event they belong to`);
  }

  if (!brief.stages.length) warnings.push("no STAGE lines, so there are no review stills to render between passes");
  for (const s of brief.stages) for (const f of s.frames) inRange(f, `stage ${s.name} still`, s.at);
  return { errors, warnings };
}

export function commands(brief) {
  const c = brief.composition;
  const lines = [];
  for (const s of brief.stages) {
    lines.push(`# stage ${s.name}`);
    for (const f of s.frames) lines.push(`npx remotion still ${c.id} out/${s.name}-f${f}.png --frame=${f}`);
    const scene = brief.scenes.filter((sc) => s.frames.some((f) => f >= sc.from && f <= sc.to));
    if (scene.length) {
      const from = Math.min(...scene.map((sc) => sc.from));
      const to = Math.max(...scene.map((sc) => sc.to));
      lines.push(`npx remotion render ${c.id} out/${s.name}.mp4 --frames=${from}-${to} --codec=h264`);
    }
  }
  const pad = Math.round(BOUNDARY_PREVIEW_SECONDS * c.fps);
  const sorted = [...brief.scenes].sort((a, b) => a.from - b.from);
  for (const s of sorted.slice(1)) {
    lines.push(`# boundary into ${s.name}`);
    lines.push(`npx remotion render ${c.id} out/into-${s.name}.mp4 --frames=${Math.max(0, s.from - pad)}-${Math.min(c.frames - 1, s.from + pad - 1)} --codec=h264`);
  }
  return lines;
}

export function checkExport(c, info) {
  const errors = [];
  if (info.width !== c.width || info.height !== c.height) errors.push(`export is ${info.width}×${info.height}, brief says ${c.width}×${c.height}`);
  if (Math.abs(info.fps - c.fps) > 0.01) errors.push(`export runs at ${info.avgFrameRate} fps, brief says ${c.fps}`);
  if (Math.abs(info.frames - c.frames) > 1) errors.push(`export has ${info.frames} frames, brief says ${c.frames}`);
  return errors;
}

function main() {
  const opts = args(process.argv.slice(2), { commands: "boolean", export: "string", cps: "string" });
  const [file] = opts._;
  if (!file) {
    console.error("usage: node brief-check.mjs BRIEF.md [--commands] [--export out/film.mp4] [--cps 15]");
    process.exit(1);
  }
  const brief = parseBrief(readFileSync(file, "utf8"));
  const { errors, warnings } = checkBrief(brief, { cps: Number(opts.cps ?? 15) });
  const c = brief.composition;
  if (c) {
    console.log(`${c.id}: ${c.width}×${c.height}, ${c.fps} fps, frames 0 through ${c.frames - 1} (${seconds(c.frames, c.fps)}s)\n`);
    const rows = [
      ...brief.scenes.map((s) => [s.from, `SCENE ${s.name} through ${s.to}`]),
      ...brief.events.map((e) => [e.frame, `${e.name}  ${e.what}`]),
      ...brief.holds.map((h) => [h.from, `hold "${h.text}" through ${h.to} (${seconds(h.to - h.from + 1, c.fps)}s)`]),
      ...brief.cues.map((q) => [q.frame, `cue ${q.name}  ${q.what}`]),
    ].sort((a, b) => a[0] - b[0]);
    for (const [f, what] of rows) console.log(`${String(f).padStart(5)}  ${seconds(f, c.fps).padStart(6)}s  ${what}`);
    console.log("");
  }
  if (c && opts.export) errors.push(...checkExport(c, probe(opts.export)).map((e) => `${opts.export}: ${e}`));
  for (const w of warnings) console.log(`warning: ${w}`);
  for (const e of errors) console.log(`error: ${e}`);
  if (c && opts.commands && !errors.length) console.log(`\n${commands(brief).join("\n")}`);
  if (errors.length) process.exit(1);
  console.log(errors.length || warnings.length ? "" : "brief is consistent");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
