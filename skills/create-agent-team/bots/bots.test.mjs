import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOTS, MOODS, botSvg } from "./art.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const widget = path.join(here, "board-widget.mjs");
const dir = mkdtempSync(path.join(tmpdir(), "bots-"));
const board = (lines) => {
  const file = path.join(dir, `${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(file, JSON.stringify({ date: "2026-10-12", lead: "1 card waits for you.", lines }));
  return file;
};
const render = (file) => spawnSync(process.execPath, [widget, file], { encoding: "utf8" });

test("every bot draws in every mood, with masks unique per drawing", () => {
  for (const id of Object.keys(BOTS))
    for (const mood of MOODS) {
      const svg = botSvg(id, mood, "-a");
      assert.match(svg, new RegExp(`class="bb bb-${id} bb-${mood}"`));
      assert.ok(svg.includes(`mask id="m-${id}-${mood}-a"`) && svg.includes(`url(#m-${id}-${mood}-a)`));
    }
});

test("the sample board renders its sections in order, with links and the animation", () => {
  const html = execFileSync(process.execPath, [widget, path.join(here, "sample.json")], { encoding: "utf8" });
  assert.ok(html.startsWith("<style>") && html.includes("@keyframes bb-hop"));
  const at = ["Needs you", "Overnight", "In progress"].map((s) => html.indexOf(s));
  assert.ok(at.every((i, k) => i > 0 && (k === 0 || i > at[k - 1])), `sections out of order: ${at}`);
  assert.ok(html.includes('<a href="https://github.com/owner/repo/pull/152"'));
  const text = html.replace(/<style>[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, "");
  assert.doesNotMatch(text, /#[0-9A-Fa-f]{6}\b/, "text and backgrounds take the chat's colour variables");
});

test("twelve lines, the routine's cap, fit the coordinator's 50 KB", () => {
  const lines = Array.from({ length: 12 }, (_, i) => ({ section: ["you", "overnight", "now"][i % 3], bot: Object.keys(BOTS)[i % 9], mood: MOODS[i % 6], text: `Line ${i} about [#${100 + i}](https://github.com/owner/repo/pull/${100 + i}).` }));
  const out = render(board(lines));
  assert.equal(out.status, 0, out.stderr);
  assert.ok(Buffer.byteLength(out.stdout) < 50_000, `${Buffer.byteLength(out.stdout)} bytes`);
});

test("text is escaped, so a PR title can't inject markup", () => {
  const out = render(board([{ section: "now", bot: "bolt", mood: "work", text: 'Shipping <img src=x onerror="alert(1)">' }]));
  assert.equal(out.status, 0, out.stderr);
  assert.ok(out.stdout.includes("&lt;img") && !out.stdout.includes("<img"));
});

for (const [field, line] of [
  ["bot", { section: "now", bot: "robo", mood: "work", text: "x" }],
  ["mood", { section: "now", bot: "bolt", mood: "angry", text: "x" }],
  ["section", { section: "later", bot: "bolt", mood: "work", text: "x" }],
])
  test(`an unknown ${field} exits 1`, () => {
    assert.equal(render(board([line])).status, 1);
  });
