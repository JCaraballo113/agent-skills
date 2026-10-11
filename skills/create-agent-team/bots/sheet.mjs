// The cast sheet: every bot in every mood, animated, with its job and role, as
// one HTML page to show the creator their team (SKILL.md, step 3).
//   node sheet.mjs > cast.html
import { BOTS, MOODS, BOT_CSS, botSvg } from "./art.mjs";

const cell = (id, mood) => {
  const size = mood === "ask" ? 74 : 48, pull = (size - 48) / 2;
  const svg = botSvg(id, mood, `-sheet`).replace("<svg ", `<svg width="${size}" height="${size}" style="display: block; overflow: visible; margin: ${-pull}px" `);
  return `<td>${svg}</td>`;
};
const row = (id) => `<tr><th><b>${BOTS[id].name}</b><span>${BOTS[id].job}</span><span>${BOTS[id].role}, ${BOTS[id].when.replace(/`/g, "")}</span></th>${MOODS.map((m) => cell(id, m)).join("")}</tr>`;
process.stdout.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>The Claude bots</title><style>
:root{--bg:#F7F4EE;--fg:#161412;--muted:#6B655C;--line:#E4DED3}
@media (prefers-color-scheme:dark){:root{--bg:#1A1816;--fg:#F1EBE1;--muted:#A39C92;--line:#34302B}}
body{margin:0;padding:32px 16px;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
main{max-width:820px;margin:0 auto;overflow-x:auto}
h1{font-size:24px;margin:0 0 4px}p{color:var(--muted);margin:0 0 24px}
table{border-collapse:collapse;width:100%}
td,th{padding:18px 12px;border-top:1px solid var(--line);vertical-align:middle}
thead th{border-top:0;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:center;padding-top:0}
tbody th{text-align:left;min-width:180px}tbody th span{display:block;color:var(--muted);font-weight:400;font-size:13px}
td svg{margin:0 auto!important}
${BOT_CSS}</style></head><body><main><h1>The Claude bots</h1><p>One per role on the agent team, in each mood the morning board shows.</p>
<table><thead><tr><th></th>${MOODS.map((m) => `<th>${m}</th>`).join("")}</tr></thead><tbody>${Object.keys(BOTS).map(row).join("")}</tbody></table></main></body></html>
`);
