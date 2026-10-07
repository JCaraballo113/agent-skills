#!/usr/bin/env node
// Guided review, step 3: validate the authored review against the manifest and render one HTML file.
// Usage: node render.mjs --manifest m.json --review r.json --out review.html
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    manifest: { type: "string" },
    review: { type: "string" },
    out: { type: "string", default: "guided-review.html" },
    template: { type: "string", default: join(dirname(fileURLToPath(import.meta.url)), "template.html") },
  },
});

const manifest = JSON.parse(readFileSync(args.manifest, "utf8"));
const review = JSON.parse(readFileSync(args.review, "utf8"));
const KINDS = ["core", "supporting", "tests", "docs", "generated"];

// Every changed file must land in exactly one chapter — the guide may reorder, never drop.
const errors = [];
const seen = new Map();
for (const ch of review.chapters) {
  if (!KINDS.includes(ch.kind)) errors.push(`chapter "${ch.id}": unknown kind "${ch.kind}" (use ${KINDS.join("|")})`);
  for (const f of ch.files) {
    if (seen.has(f.path)) errors.push(`${f.path}: in both "${seen.get(f.path)}" and "${ch.id}"`);
    seen.set(f.path, ch.id);
  }
}
const byPath = new Map(manifest.files.map((f) => [f.path, f]));
for (const p of seen.keys()) if (!byPath.has(p)) errors.push(`${p}: in the review but not in the diff`);
for (const p of byPath.keys()) if (!seen.has(p)) errors.push(`${p}: changed but in no chapter`);

// A pinned note must point at a line the reader will actually see: a new-side line inside one of the file's hunks.
const visibleNewLines = (patch) => {
  const lines = new Set();
  let n = 0, inHunk = false;
  for (const l of patch.split("\n")) {
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)/.exec(l);
    if (h) { n = +h[1]; inHunk = true; continue; }
    if (!inHunk || l.startsWith("\\")) continue;
    if (l.startsWith("-")) continue;
    if (l.startsWith("+") || l.startsWith(" ")) lines.add(n++);
  }
  return lines;
};
for (const ch of review.chapters) for (const f of ch.files) {
  if (!f.annotations?.length || !byPath.has(f.path)) continue;
  const visible = visibleNewLines(byPath.get(f.path).patch);
  for (const a of f.annotations) {
    if (!visible.has(a.line)) errors.push(`${f.path}: note at L${a.line} is not on a line shown in the diff`);
    if (a.to !== undefined && (a.to < a.line || !visible.has(a.to))) errors.push(`${f.path}: note range L${a.line}–${a.to} ends off the diff`);
  }
}
if (errors.length) {
  console.error(`review does not cover the diff exactly:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}

// FNV-1a over the patch: a check mark is kept only while the part's patch is unchanged.
const fnv = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
};

const data = {
  repo: manifest.repo,
  baseRef: manifest.baseRef,
  headRef: manifest.headRef,
  mergeBase: manifest.mergeBase,
  headSha: manifest.headSha,
  commits: manifest.commits,
  generatedAt: new Date().toISOString(),
  review: {
    ...review,
    chapters: review.chapters.map((ch) => ({
      ...ch,
      files: ch.files.map((f) => {
        const m = byPath.get(f.path);
        return { ...f, status: m.status, oldPath: m.oldPath, binary: m.binary, adds: m.adds, dels: m.dels, hash: fnv(m.patch), patch: m.patch, outline: m.outline };
      }),
    })),
  },
};

// `<` escaped so file contents can never close the data <script>.
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const html = readFileSync(args.template, "utf8").replace("/*__GUIDED_REVIEW_DATA__*/null", () => json);
writeFileSync(args.out, html);
console.log(`${args.out}: ${review.chapters.length} steps, ${seen.size} files, ${(html.length / 1024).toFixed(0)} KB`);
