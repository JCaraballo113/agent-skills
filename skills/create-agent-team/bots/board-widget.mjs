// The morning board as a post_widget (visualize) fragment: each line led by
// the Claude bot whose work it reports, animated in its mood (BOT_CSS).
//   node board-widget.mjs <board.json> > <board.widget.html>
// board.json: {"date": "2026-10-12", "lead": "2 cards wait for you. Main is green.",
//   "lines": [{"section": "you", "bot": "stamp", "mood": "ask", "text": "Holds [#152](https://github.com/<owner/repo>/pull/152): card below."}]}
// section: you (waits on the creator), overnight (what happened), now (in progress).
// bot: cue tag bolt stamp mend pulse doodle dawn page; mood: idle work done stumped nap ask.
import { readFileSync } from "node:fs";
import { BOTS, MOODS, BOT_CSS, botSvg } from "./art.mjs";

const SECTIONS = { you: "Needs you", overnight: "Overnight", now: "In progress" };
if (!process.argv[2]) {
  console.error("Usage: node board-widget.mjs <board.json> > <board.widget.html>");
  process.exit(2);
}
const board = JSON.parse(readFileSync(process.argv[2], "utf8"));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const links = (s) => esc(s).replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" style="color: var(--text-accent); text-decoration: none">${t}</a>`);
let n = 0;
// The ask mood is framed wider (for its question mark), so it's drawn bigger
// and pulled in by margins to sit in the same box as the others.
const bot = (id, mood, px) => {
  if (!BOTS[id]) throw new Error(`no bot ${id}`);
  if (!MOODS.includes(mood)) throw new Error(`no mood ${mood}`);
  const size = mood === "ask" ? Math.round((px * 37) / 24) : px, pull = (size - px) / 2;
  return botSvg(id, mood, `-${board.date}-${n++}`).replace("<svg ", `<svg width="${size}" height="${size}" aria-hidden="true" style="flex-shrink: 0; display: block; overflow: visible; margin: ${-pull}px" `);
};
const row = (l) => `<div style="display: flex; align-items: center; gap: 14px; padding: 9px 0">${bot(l.bot, l.mood ?? "idle", 26)}<span style="font-size: 14px; color: var(--text-primary); line-height: 1.5"><b style="font-weight: 600">${BOTS[l.bot].name}</b> · ${links(l.text)}</span></div>`;
const section = (key) => {
  const lines = board.lines.filter((l) => (l.section ?? "overnight") === key);
  if (!lines.length) return "";
  return `<div style="display: flex; flex-direction: column; padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--border)"><div style="font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); padding-bottom: 4px">${SECTIONS[key]}</div>${lines.map(row).join("")}</div>`;
};
for (const l of board.lines) if (l.section && !SECTIONS[l.section]) throw new Error(`no section ${l.section}`);
const head = `<div style="display: flex; align-items: center; gap: 14px">${bot("dawn", "done", 40)}<div style="display: flex; flex-direction: column; gap: 3px"><div style="font-size: 16px; font-weight: 600; color: var(--text-primary)">Morning board · ${esc(board.date)}</div><div style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.45">${links(board.lead)}</div></div></div>`;
process.stdout.write(`<style>${BOT_CSS}</style><div style="display: flex; flex-direction: column; padding: 8px 4px">${head}${Object.keys(SECTIONS).map(section).join("")}</div>`);
