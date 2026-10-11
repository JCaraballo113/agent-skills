import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkBrief, commands, parseBrief } from "./brief-check.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(here, "..", "BRIEF-TEMPLATE.md"), "utf8").split("\n---\n")[1];
const hasFfmpeg = !spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).error;
const check = (text) => checkBrief(parseBrief(text));
const film = (scenes, more = "") => `Composition: Film, 1080 by 1080, 30 fps, 300 frames.\n${scenes}\n${more}\nSTAGE all 0 299`;

test("the template's worked example is consistent", () => {
  assert.deepEqual(check(template), { errors: [], warnings: [] });
});

test("the template's boundary preview matches the article's 90-149 render", () => {
  assert.ok(commands(parseBrief(template)).includes("npx remotion render Launch out/into-PRODUCT.mp4 --frames=90-149 --codec=h264"));
});

test("a gap between scenes is an error", () => {
  const { errors } = check(film("SCENE A: FRAMES 0 THROUGH 99\nSCENE B: FRAMES 110 THROUGH 299"));
  assert.match(errors.join(), /frames 100 through 109 belong to no scene/);
});

test("an overlap needs a declared transition", () => {
  const scenes = "SCENE A: FRAMES 0 THROUGH 119\nSCENE B: FRAMES 100 THROUGH 299";
  assert.match(check(film(scenes)).errors.join(), /overlap on 100 through 119/);
  assert.deepEqual(check(film(scenes, "TRANSITION 100 119")).errors, []);
});

test("the last scene must end on the last frame", () => {
  assert.match(check(film("SCENE A: FRAMES 0 THROUGH 289")).errors.join(), /last frame is 299/);
});

test("a hold shorter than its reading time is an error", () => {
  const hold = 'HOLD 10 30 "Export every finished report in one click"';
  assert.match(check(film("SCENE A: FRAMES 0 THROUGH 299", hold)).errors.join(), /readable for 21 frames.*at least 82/);
});

test("an event past the end and a cue off every event are errors", () => {
  const { errors } = check(film("SCENE A: FRAMES 0 THROUGH 299", "EVENT 300 late Too late\nCUE 50 click"));
  assert.match(errors.join(), /event late frame 300 is outside 0 through 299/);
  assert.match(errors.join(), /cue click at 50 sits on no EVENT frame/);
});

test("prose that starts with a keyword word is left alone", () => {
  assert.deepEqual(check(film("SCENE A: FRAMES 0 THROUGH 299", "Hold the result still.\nCue the music softly.")).errors, []);
});

test("--stage limits the commands to one stage and the boundary into it", () => {
  const lines = commands(parseBrief(template), "product");
  assert.ok(lines.includes("# stage product") && lines.includes("# boundary into PRODUCT"));
  assert.ok(!lines.some((l) => /opening|CLOSING/.test(l)));
});

test("a keyword line in the wrong format is reported", () => {
  assert.match(check(film("SCENE A: FRAMES 0 THROUGH 299", "EVENT at 5 press")).errors.join(), /doesn't match its format/);
});

test("reference.mjs measures a card entrance and a cut", { skip: !hasFfmpeg && "ffmpeg not installed" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "motion-brief-"));
  const video = join(dir, "ref.mp4");
  const graph =
    "color=c=0x101318:s=640x360:r=30:d=5[bg];color=c=white:s=100x80:r=30:d=5[box];" +
    "[bg][box]overlay=x='if(lt(n\\,30)\\,-200\\,if(lt(n\\,48)\\,-200+(n-30)*470/18\\,270))':y=140[v];" +
    "[v]drawbox=enable='gte(n\\,90)':x=0:y=0:w=iw:h=ih:color=0x335577:t=fill";
  execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", graph, "-c:v", "libx264", "-pix_fmt", "yuv420p", video]);
  const firstVisible = 33;
  const landed = 47;
  execFileSync("node", [join(here, "reference.mjs"), video, "--out", join(dir, "out")], { stdio: "ignore" });
  const report = JSON.parse(readFileSync(join(dir, "out", "motion.json"), "utf8"));
  assert.deepEqual(report.cuts, [90]);
  assert.equal(report.events.length, 1);
  const [card] = report.events;
  assert.equal(card.start, firstVisible);
  assert.equal(card.settle, landed);
  [270, 140, 370, 220].forEach((v, i) => assert.ok(Math.abs(card.netChangeBox[i] - v) <= 2, `box ${card.netChangeBox} vs 270,140,370,220`));
});

test("audio-hit.mjs finds the hit after a soft lead-in", { skip: !hasFfmpeg && "ffmpeg not installed" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "motion-brief-"));
  const wav = join(dir, "click.wav");
  const expr = "if(between(t,0.30,0.38),0.02*sin(2*PI*300*t),0)+if(between(t,0.40,0.45),0.8*sin(2*PI*1000*t)*exp(-(t-0.40)*60),0)";
  execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", `aevalsrc='${expr}':s=48000:d=1`, wav]);
  const out = JSON.parse(execFileSync("node", [join(here, "audio-hit.mjs"), wav, "--fps", "30", "--at", "195"], { encoding: "utf8" }));
  assert.equal(out.audibleFromSeconds, 0.3);
  assert.equal(out.hitSeconds, 0.4);
  assert.equal(out.startFrame, 183);
});

test("--export checks the render against the brief and writes one still per STAGE frame", { skip: !hasFfmpeg && "ffmpeg not installed" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "motion-brief-"));
  const video = join(dir, "film.mp4");
  const brief = join(dir, "BRIEF.md");
  writeFileSync(brief, "Composition: Film, 64 by 64, 30 fps, 60 frames.\nSCENE A: FRAMES 0 THROUGH 59\nSTAGE all 0 30 59\n");
  execFileSync("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "testsrc=s=64x64:r=30:d=2", "-pix_fmt", "yuv420p", video]);
  execFileSync("node", [join(here, "brief-check.mjs"), brief, "--export", video], { stdio: "ignore" });
  assert.deepEqual(readdirSync(dir).filter((f) => f.endsWith(".png")).sort(), ["film-f0.png", "film-f30.png", "film-f59.png"]);
});
