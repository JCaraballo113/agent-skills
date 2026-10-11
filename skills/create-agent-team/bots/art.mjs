// The Claude bots: one per role on the agent team (SKILL.md, Roles), drawn
// from shared parts: a rounded-square head in the bot's colour, a cream face
// plate with ink eyes, side bolts, and a head-top piece; a prop top-right says
// the job. Every drawing is a 24×24 viewBox (the ask mood is framed wider for
// its question mark).
export const CREAM = "#F1EBE1", INK = "#161412";
export const BOTS = {
  cue: { name: "Cue", color: "#D97757", job: "Runs the team", role: "the coordinator", when: "always on, in the project chat" },
  tag: { name: "Tag", color: "#FD9F00", job: "Sorts new issues", role: "triage, the front door", when: "each new issue, and daily" },
  bolt: { name: "Bolt", color: "#569FFF", job: "Ships an issue", role: "the shipper", when: "each `claude` label" },
  stamp: { name: "Stamp", color: "#00CD53", job: "Merges or holds PRs", role: "the merge gate", when: "each PR, and hourly" },
  mend: { name: "Mend", color: "#00C5B1", job: "Untangles conflicts", role: "keeps PRs mergeable", when: "each merged PR" },
  pulse: { name: "Pulse", color: "#FF53A5", job: "Checks main is green", role: "main health", when: "nightly" },
  doodle: { name: "Doodle", color: "#B17EFF", job: "Draws the boards", role: "the design pass", when: "nightly" },
  dawn: { name: "Dawn", color: "#F4CF00", job: "Brings the morning board", role: "the morning board", when: "daily" },
  page: { name: "Page", color: "#00BDE8", job: "Reviews the playbook", role: "the playbook review", when: "weekly" },
};
export const MOODS = ["idle", "work", "done", "stumped", "nap", "ask"];

const HEAD = '<rect x="3" y="8.6" width="14.6" height="12.6" rx="4.4"/>';
const BOLTS = '<rect x="1.3" y="12.4" width="2.4" height="5" rx="1"/><rect x="16.9" y="12.4" width="2.4" height="5" rx="1"/>';
const FACE = `<rect x="5" y="11.3" width="10.6" height="7.6" rx="3.3" fill="${CREAM}"/>`;
const TOP = [10.3, 8.8]; // where a head-top piece meets the head
const eye = (cx, cy, rx = 1.1, ry = 1.45) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${INK}"/>`;
const stroke = (d, w = 0.9, c = INK, extra = "") => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const EYES = {
  idle: eye(8.3, 15) + eye(12.3, 15),
  work: eye(8.9, 14.5, 1.05, 1.35) + eye(12.9, 14.5, 1.05, 1.35),
  done: stroke("M7.2 15.4q1.1-1.5 2.2 0") + stroke("M11.2 15.4q1.1-1.5 2.2 0") + stroke("M9.4 17.1q.9.6 1.8 0", 0.7),
  stumped: eye(8.1, 15.8, 0.95, 1.1) + eye(12.1, 15.8, 0.95, 1.1) + stroke("M6.9 14l2.1-.7", 0.65) + stroke("M13.7 14l-2.1-.7", 0.65),
  nap: stroke("M7.2 15.3h2.2") + stroke("M11.2 15.3h2.2"),
  ask: eye(8.5, 14.3) + eye(12.5, 14.3),
};
export function spark(cx, cy, s = 1) {
  return `<path class="bb-spark" transform="translate(${cx} ${cy}) scale(${s})" d="M0 -2.3c.35 1.55.75 1.95 2.3 2.3-1.55.35-1.95.75-2.3 2.3-.35-1.55-.75-1.95-2.3-2.3 1.55-.35 1.95-.75 2.3-2.3z"/>`;
}
const zzz = (c) => `<g class="bb-z">${stroke("M19.3 3.4h2.6l-2.6 2.8h2.6", 0.8, c, ' opacity="0.85"')}</g>`;
// The ask mood's question mark, cream with an ink mark.
const Q = [7.8, -7.6, 4.4], FRAME = "-6.5 -13 37 37";
const MARK = "M-0.8 -0.55C-0.8 -1.1 -0.4 -1.4 0.05 -1.4C0.5 -1.4 0.82 -1.08 0.82 -0.68C0.82 -0.28 0.52 -0.1 0.25 0.08C0.04 0.22 0 0.33 0 0.55";
function question() {
  const [x, y, r] = Q, s = r / 3.1;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${CREAM}"/><path transform="translate(${x} ${y}) scale(${s.toFixed(3)})" d="${MARK}" stroke="${INK}" stroke-width=".7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x}" cy="${(y + 1.2 * s).toFixed(2)}" r="${(0.42 * s).toFixed(2)}" fill="${INK}"/>`;
}
const antenna = (tip) => stroke(`M${TOP[0]} ${TOP[1]}V4.9`, 1.1, "currentColor") + tip;
const ball = '<circle cx="10.3" cy="3.9" r="1.45"/>';

// Each bot: its head-top piece (by mood), its prop (by mood), and holes cut
// out of the prop (black in the mask).
const PARTS = {
  cue: {
    // A headset: band over the head, ear cups for bolts, a mic boom.
    top: () => stroke("M2.2 13C2.2 3.6 18.4 3.6 18.4 13", 1.3, "currentColor"),
    bolts: '<rect x=".6" y="11.6" width="3.2" height="6.2" rx="1.4"/><rect x="16.8" y="11.6" width="3.2" height="6.2" rx="1.4"/>' + stroke("M19.6 17.4q.9 3.4-1.6 4.4", 0.9, "currentColor") + '<circle cx="17.4" cy="21.9" r="1.1"/>',
    prop: (m) => ({
      idle: waves(2), work: waves(3), done: waves(2) + spark(22.4, 2.6, 0.5), stumped: `<g opacity=".45">${waves(1)}</g>`, nap: "", ask: waves(2),
    }[m]),
  },
  tag: {
    top: () => antenna(ball),
    prop: (m) => {
      const t = (inner, tf = "") => `<g transform="${tf}"><path d="M16.6 2.4h5.7a.9.9 0 0 1 .9.9v4a.9.9 0 0 1-.9.9h-5.7l-1.9-2.9z"/>${inner}</g>`;
      const hole = '<circle cx="16.7" cy="5.3" r=".75" fill="#000"/>';
      const string = (d = "M11.6 3.6Q14 5.6 16 5.3") => stroke(d, 0.6, "currentColor");
      return {
        idle: string() + t(""),
        work: string("M11.6 3.6Q14 6.4 16 6") + t("", "rotate(10 16.7 5.3) translate(0 .7)"),
        done: string() + t("") + spark(21.6, 10.4, 0.5),
        stumped: string("M11.6 3.6q1.4 2.4 .8 4.8") + t("", "translate(20.4 20.8) rotate(-75) translate(-16.7 -5.3)"),
        nap: "", ask: string() + t(""),
      }[m];
    },
    holes: (m) => ({
      idle: '<circle cx="16.7" cy="5.3" r=".75"/>',
      work: '<g transform="rotate(10 16.7 5.3) translate(0 .7)"><circle cx="16.7" cy="5.3" r=".75"/><rect x="18.3" y="4.1" width="3.6" height=".7" rx=".35"/><rect x="18.3" y="5.7" width="2.4" height=".7" rx=".35"/></g>',
      done: '<circle cx="16.7" cy="5.3" r=".75"/>' + stroke("M18.4 5.4l1.1 1.1 2.2-2.4", 0.8, "#000"),
      stumped: '<g transform="translate(20.4 20.8) rotate(-75) translate(-16.7 -5.3)"><circle cx="16.7" cy="5.3" r=".75"/></g>',
      nap: "", ask: '<circle cx="16.7" cy="5.3" r=".75"/>',
    }[m]),
  },
  bolt: {
    // Two short antennae in a V.
    top: () => stroke("M8.8 8.8L7 4.9", 1.1, "currentColor") + stroke("M11.8 8.8l1.8-3.9", 1.1, "currentColor") + '<circle cx="6.6" cy="4.1" r="1.25"/><circle cx="14" cy="4.1" r="1.25"/>',
    prop: (m) => ({
      idle: wrench(20.2, 5.2, 40), work: wrench(20.2, 5.2, 75) + stroke("M16.4 2.2q-1.2 2 .1 4", 0.7, "currentColor", ' opacity=".7"'),
      done: wrench(20.2, 5.2, 40) + spark(16.4, 2.6, 0.5), stumped: wrench(21.4, 20.6, 100), nap: "", ask: wrench(20.2, 5.2, 40),
    }[m]),
    holes: (m) => ({ idle: jaw(20.2, 5.2, 40), work: jaw(20.2, 5.2, 75), done: jaw(20.2, 5.2, 40), stumped: jaw(21.4, 20.6, 100), nap: "", ask: jaw(20.2, 5.2, 40) }[m]),
  },
  stamp: {
    // A guard's cap with a badge, the brim cut from the head by a gap.
    top: () => '<path d="M4.2 9.2V7.2c0-1.6 2.6-2.8 6.1-2.8s6.1 1.2 6.1 2.8v2z"/><rect x="2.4" y="8.4" width="15.8" height="1.6" rx=".8"/>',
    topHoles: '<rect x="2" y="10" width="17" height=".55"/><circle cx="10.3" cy="6.6" r=".9"/>',
    prop: (m) => ({
      idle: stampTool(0, 0), work: stampTool(-0.6, -0.7, -14), done: stampTool(0, 0.6) + spark(16.4, 2.4, 0.45),
      stumped: stampTool(0, -0.6, 18), nap: "", ask: stampTool(0, 0),
    }[m]),
    holes: () => "",
    extra: (m) => ({
      done: stroke("M19.2 10.2l1.2 1.2 2.4-2.6", 0.9, "currentColor"),
      stumped: stroke("M19.6 9l2.6 2.6M22.2 9l-2.6 2.6", 0.9, "currentColor"),
    }[m] ?? ""),
  },
  mend: {
    // A coiled antenna.
    top: () => stroke("M10.3 8.8l1.3-.7-2.6-.8 2.6-.8-2.6-.8 1.3-.6", 0.9, "currentColor") + '<circle cx="10.3" cy="4" r="1.3"/>',
    prop: (m) => {
      const needle = (tf = "") => `<g transform="${tf}"><path d="M17.2 8.4L22.6 1.7" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/></g>`;
      return {
        idle: needle() + stroke("M22.2 2.4q2 2.4-.4 4.4t-1.4 3.2", 0.6, "currentColor"),
        work: needle("rotate(-18 19.9 5)") + stroke("M21.6 1.8q2.2 3 -1 4.8", 0.6, "currentColor") + stroke("M14.6 6.4h6", 0.8, "currentColor", ' stroke-dasharray="1.1 1"'),
        done: needle() + stroke("M22.2 2.4q2 2.4-.4 4.4", 0.6, "currentColor") + spark(16, 3, 0.5),
        stumped: stroke("M17.4 21.9L22.4 20.6", 1.05, "currentColor") + stroke("M17.6 3.4c2-1.8 4.4.4 2.4 1.8s-3-1.6-.6-2.4 3.4 1.4 1.2 2.6-2.4-.6-.4-1.6", 0.6, "currentColor"),
        nap: "", ask: needle() + stroke("M22.2 2.4q2 2.4-.4 4.4t-1.4 3.2", 0.6, "currentColor"),
      }[m];
    },
    holes: () => "",
  },
  pulse: {
    // The antenna ends in a heart.
    top: (m) => stroke(`M${TOP[0]} ${TOP[1]}V5.4`, 1.1, "currentColor") + '<path d="M10.3 6.1C8.4 4.7 8 3.9 8 3.2c0-.8.6-1.4 1.3-1.4.5 0 .8.2 1 .6.2-.4.5-.6 1-.6.7 0 1.3.6 1.3 1.4 0 .7-.4 1.5-2.3 2.9z"/>',
    topHoles: (m) => (m === "stumped" ? stroke("M10.4 1.9l-.6 1.4.9.8-.6 1.6", 0.45, "#000") : ""),
    prop: (m) => ({
      idle: ecg("M15.4 5.6h2l1-2.6 1.4 5 1.2-3.8.8 1.4h1.8"),
      work: ecg("M14.2 5.6h1.4l.8-2 1.1 4 1-3 .7 1.2h1.2l.8-2 1.1 4 .8-2.2h.8"),
      done: ecg("M15.4 5.6h2l1-2.6 1.4 5 1.2-3.8.8 1.4h1.8") + spark(22.6, 1.6, 0.45),
      stumped: ecg("M15 5.6h3.4l.6 1.4.6-1.4h3.6"), nap: "", ask: ecg("M15.4 5.6h2l1-2.6 1.4 5 1.2-3.8.8 1.4h1.8"),
    }[m]),
    holes: () => "",
  },
  doodle: {
    // A beret, its edge cut from the head.
    top: () => '<ellipse cx="9.8" cy="8.3" rx="6.8" ry="2.6" transform="rotate(-7 9.8 8.3)"/><rect x="9.6" y="4.5" width="1.3" height="1.6" rx=".5"/>',
    topHoles: '<path d="M3.4 10q6.8 1.2 13-1.6" stroke="#000" stroke-width=".6" fill="none"/>',
    prop: (m) => ({
      idle: brush(0), work: brush(-16) + stroke("M14.6 4.4c1-1.6 2.2-.2 3.2-1.6", 0.9, "currentColor"),
      done: '<rect x="16.6" y="1.4" width="6.2" height="4.8" rx=".7" fill="none" stroke="currentColor" stroke-width=".9"/>' + stroke("M17.9 4.6l1.3-1.2 1.1.9 1.3-1.3", 0.7, "currentColor") + spark(22.6, 8.6, 0.45),
      stumped: `<g transform="translate(19.2 20.2) rotate(45) scale(.7)">${brush(0, 0, 0)}</g>` + '<path d="M18 4.2c.9-1 2.6-.4 2.6.8.9.2 1 1.6 0 1.8-.3 1-1.8 1-2.2.2-1 .2-1.6-1-.8-1.6-.6-.6-.2-1.4.4-1.2z"/><circle cx="19.6" cy="9.2" r=".55"/>',
      nap: "", ask: brush(0),
    }[m]),
    holes: () => "",
  },
  dawn: {
    // The antenna ends in a sun (it sets for a nap).
    top: (m) => antenna(m === "nap" ? '<path d="M8.6 4.5a1.7 1.7 0 0 1 3.4 0z"/>' : '<circle cx="10.3" cy="3.9" r="1.25"/>' + sunRays(m === "stumped" ? 0.5 : 1)),
    prop: (m) => ({
      idle: clip(), work: clip(), done: clip() + spark(15.6, 2.6, 0.5), stumped: clip("rotate(-14 19.9 4.6)"), nap: "", ask: clip(),
    }[m]),
    holes: (m) => ({
      idle: clipLines(3), work: clipLines(2), done: '<rect x="19" y="1.15" width="1.8" height=".5"/>' + stroke("M18.1 5.1l1.2 1.2 2.3-2.5", 0.85, "#000"),
      stumped: `<g transform="rotate(-14 19.9 4.6)">${clipLines(0)}</g>`, nap: "", ask: clipLines(3),
    }[m]),
  },
  page: {
    // The antenna is a pole with a bookmark ribbon.
    top: () => stroke(`M${TOP[0]} ${TOP[1]}V2.2`, 1.1, "currentColor") + '<path d="M10.6 2h3.9l-1.1 1.4 1.1 1.4h-3.9z"/>',
    prop: (m) => ({
      idle: book(), work: book() + '<path d="M19.6 4.1c1-1.7 2.4-2.4 3.6-2.1v.9c-1.1-.1-2.4.4-3.3 1.6z"/>',
      done: book() + spark(22.8, 10.6, 0.45), stumped: '<g transform="translate(18.8 20.4) rotate(-8)"><rect x="-2.6" y="-1.3" width="5.4" height="2.6" rx=".5"/></g>',
      nap: "", ask: book(),
    }[m]),
    holes: (m) => (m === "stumped" ? '<g transform="translate(18.8 20.4) rotate(-8)"><rect x="-2.2" y=".4" width="4.6" height=".4"/></g>' : ""),
  },
};
function waves(n) {
  const r = [2.4, 4.2, 6].slice(0, n);
  return r.map((rr, i) => stroke(`M${17.2 + rr * 0.0} ${7.6 - rr}a${rr} ${rr} 0 0 1 ${rr} ${rr}`, 0.95, "currentColor", i === 2 ? ' opacity=".6"' : "")).join("");
}
function wrench(x, y, a) {
  return `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-.7" y="-.2" width="1.4" height="5" rx=".7"/><circle cx="0" cy="-.6" r="1.9"/></g>`;
}
function jaw(x, y, a) {
  return `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-.55" y="-2.8" width="1.1" height="2.1" rx=".2"/></g>`;
}
function stampTool(dx, dy, a = 0) {
  return `<g transform="translate(${dx} ${dy}) rotate(${a} 20.3 4)"><circle cx="20.3" cy="1.8" r="1.25"/><rect x="19.7" y="2.6" width="1.2" height="1.9" rx=".3"/><rect x="17.5" y="4.3" width="5.6" height="1.9" rx=".55"/><rect x="17.1" y="6.3" width="6.4" height="1" rx=".3"/></g>`;
}
function ecg(d) {
  return stroke(d, 1, "currentColor");
}
function brush(a, x = 19.4, y = 5.2) {
  return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-2.8 3.6L.2 -.1" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><rect x="-.15" y="-1.35" width="1.5" height="1.6" rx=".3" transform="rotate(38 .6 -.6)"/><path d="M1 -1.6c.8-.9 2.2-2 3-2.2-.1.8-1.1 2.3-2 3.1z"/></g>`;
}
function sunRays(o) {
  const pts = [[0, -1], [0.87, -0.5], [0.87, 0.5], [-0.87, 0.5], [-0.87, -0.5], [0, 1]];
  return `<g stroke="currentColor" stroke-width=".7" stroke-linecap="round" opacity="${o}">` + pts.filter(([, y]) => y <= 0.5).map(([dx, dy]) => `<path d="M${(10.3 + 2 * dx).toFixed(2)} ${(3.9 + 2 * dy).toFixed(2)}L${(10.3 + 2.9 * dx).toFixed(2)} ${(3.9 + 2.9 * dy).toFixed(2)}"/>`).join("") + "</g>";
}
function clip(tf = "") {
  return `<g transform="${tf}"><rect x="16.9" y=".9" width="6" height="7.6" rx=".9"/><rect x="18.7" y=".2" width="2.4" height="1.5" rx=".5"/></g>`;
}
function clipLines(n) {
  return '<rect x="19" y="1.15" width="1.8" height=".5"/>' + [3.3, 4.9, 6.5].slice(0, n).map((y, i) => `<rect x="18.1" y="${y}" width="${i === 2 ? 2.4 : 3.6}" height=".7" rx=".35"/>`).join("");
}
function book() {
  return '<g transform="translate(-.6 0)"><path d="M19.4 3.4c-1.2-.8-2.6-1-3.9-.7v5.2c1.3-.3 2.7-.1 3.9.7z"/><path d="M20.1 3.4c1.2-.8 2.6-1 3.9-.7v5.2c-1.3-.3-2.7-.1-3.9.7z"/></g>';
}

// A bot in one mood. The head-top piece droops when stumped; the head tilts to ask.
// How far each head-top piece droops when stumped (Cue's headset stays on).
const DROOP = { cue: 0, stamp: -12 };
export function botSvg(id, mood, uid = "") {
  const b = BOTS[id], p = PARTS[id], m = `m-${id}-${mood}${uid}`;
  const topTf = mood === "stumped" ? `rotate(${DROOP[id] ?? -24} ${TOP[0]} ${TOP[1] + 1})` : "";
  const topHoles = typeof p.topHoles === "function" ? p.topHoles(mood) : p.topHoles ?? "";
  const holes = p.holes ? p.holes(mood) : "";
  const prop = mood === "nap" ? zzz(b.color) : p.prop(mood) + (p.extra ? p.extra(mood) : "");
  // Classed wrappers (bb-*) carry no transform of their own, so BOT_CSS can
  // animate them; a prop's holes sit in a bb-prop wrapper too and move with it.
  const head = `<g class="bb-top"><g transform="${topTf}">${p.top(mood)}</g></g>${p.bolts ?? BOLTS}${HEAD}`;
  const headTf = mood === "ask" ? "rotate(8 10.3 21.2)" : "";
  const mask = `<mask id="${m}"><rect x="-8" y="-14" width="40" height="40" fill="#fff"/><g transform="${headTf}"><g class="bb-top"><g transform="${topTf}">${topHoles}</g></g></g><g class="bb-prop">${holes}</g></mask>`;
  const body = `<g mask="url(#${m})" fill="${b.color}" color="${b.color}"><g transform="${headTf}">${head}</g><g class="bb-prop">${prop}</g></g><g transform="${headTf}">${FACE}<g class="bb-eyes">${EYES[mood]}</g></g>`;
  const vb = mood === "ask" ? FRAME : "0 0 24 24";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="bb bb-${id} bb-${mood}">${mask}<g class="bb-all">${body}${mood === "ask" ? `<g class="bb-q">${question()}</g>` : ""}</g></svg>`;
}

// Each mood acted out, for pages that animate the bots (the morning board):
// idle bobs and blinks, work runs the prop, done hops and its sparks twinkle,
// stumped sighs with its head-top swaying, nap breathes under rising Zs, ask
// rocks toward the reader under a bouncing question mark. Still for reduced motion.
export const BOT_CSS = `
.bb .bb-all,.bb .bb-prop,.bb .bb-eyes,.bb .bb-top,.bb .bb-spark,.bb .bb-z,.bb .bb-q{transform-box:fill-box;transform-origin:center}
.bb .bb-all{transform-origin:50% 100%}
.bb-idle .bb-all{animation:bb-bob 3.2s ease-in-out infinite}
.bb-idle .bb-eyes,.bb-work .bb-eyes,.bb-done .bb-eyes,.bb-ask .bb-eyes{animation:bb-blink 4.6s infinite}
.bb-work .bb-prop{animation:bb-wiggle .9s ease-in-out infinite alternate}
.bb-stamp.bb-work .bb-prop{animation:bb-press .8s ease-in-out infinite}
.bb-pulse.bb-work .bb-prop path{stroke-dasharray:22;animation:bb-trace 1.4s linear infinite}
.bb-cue.bb-work .bb-prop{animation:bb-fade 1.2s ease-in-out infinite}
.bb-done .bb-all{animation:bb-hop 2.4s ease-out infinite}
.bb-done .bb-spark{animation:bb-twinkle 1.2s ease-in-out infinite}
.bb-stumped .bb-top{animation:bb-sway 3s ease-in-out infinite}
.bb-stumped .bb-all{animation:bb-sigh 3s ease-in-out infinite}
.bb-nap .bb-all{animation:bb-breathe 3.6s ease-in-out infinite}
.bb-nap .bb-z{animation:bb-rise 2.8s ease-out infinite}
.bb-ask .bb-all{animation:bb-rock 2.2s ease-in-out infinite}
.bb-ask .bb-q{animation:bb-bounce 1.1s ease-in-out infinite}
@keyframes bb-bob{50%{transform:translateY(-4%)}}
@keyframes bb-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes bb-wiggle{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
@keyframes bb-press{0%,100%{transform:translateY(-14%)}45%{transform:translateY(10%)}55%{transform:translateY(10%)}}
@keyframes bb-trace{from{stroke-dashoffset:44}to{stroke-dashoffset:0}}
@keyframes bb-fade{50%{opacity:.35}}
@keyframes bb-hop{0%,30%,100%{transform:translateY(0)}12%{transform:translateY(-12%)}20%{transform:translateY(0) scaleY(.95)}}
@keyframes bb-twinkle{50%{transform:scale(.4);opacity:.5}}
@keyframes bb-sway{50%{transform:rotate(-7deg)}}
@keyframes bb-sigh{50%{transform:translateY(3%) scaleY(.97)}}
@keyframes bb-breathe{50%{transform:scaleY(1.04)}}
@keyframes bb-rise{0%{transform:translate(0,30%);opacity:0}30%{opacity:1}100%{transform:translate(20%,-60%);opacity:0}}
@keyframes bb-rock{50%{transform:rotate(-5deg)}}
@keyframes bb-bounce{50%{transform:translateY(-12%)}}
@media (prefers-reduced-motion:reduce){.bb *{animation:none!important}}
`;
