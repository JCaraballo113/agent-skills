#!/usr/bin/env node
// Guided review, step 1: turn a branch diff into a manifest the author (the agent) and the renderer share.
// Usage: node collect.mjs [--repo .] [--base main] [--head HEAD] [--generated <regex>]... --out manifest.json
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    base: { type: "string", default: "main" },
    head: { type: "string", default: "HEAD" },
    repo: { type: "string", default: "." },
    out: { type: "string", default: "manifest.json" },
    generated: { type: "string", multiple: true, default: [] },
  },
});

const git = (...a) =>
  execFileSync("git", ["-C", args.repo, ...a], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

// Default tier per path. The author may still move a file into any step; tiers only seed the ordering
// (core first, tests and generated files last) and flag files the reader can skim.
// `--generated <regex>` adds repo-specific generated paths (artifacts, codegen, snapshots).
const TIER_RULES = [
  ...args.generated.map((src) => ["generated", new RegExp(src)]),
  ["generated", /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?|Cargo\.lock|poetry\.lock|go\.sum|Gemfile\.lock)$/],
  ["generated", /(^|\/)(dist|build|out|__generated__|generated)\//],
  ["generated", /\.(generated|gen)\.[a-z]+$/],
  ["generated", /\.(snap|min\.js|min\.css|map)$/],
  ["tests", /(^|\/)(test|tests|__tests__|spec|e2e)\//],
  ["tests", /\.(test|spec)\.[cm]?[jt]sx?$/],
  ["tests", /(_test\.go|_test\.py|test_[^/]+\.py)$/],
  ["docs", /\.(md|mdx|rst|adoc)$/],
  ["docs", /^docs?\//],
];
const tierOf = (path) => TIER_RULES.find(([, re]) => re.test(path))?.[0] ?? "code";

const mergeBase = git("merge-base", args.base, args.head).trim();
const headSha = git("rev-parse", args.head).trim();
const commits = git("log", "--format=%h%x09%s", `${mergeBase}..${headSha}`)
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    const [sha, ...rest] = l.split("\t");
    return { sha, subject: rest.join("\t") };
  });

const raw = git("diff", "-M", "--no-color", "--no-ext-diff", `${mergeBase}..${headSha}`);
const chunks = raw.split(/^(?=diff --git )/m).filter((c) => c.startsWith("diff --git "));

// Headings of a Markdown file at head, outside code fences: the page names a folded doc hunk by its section.
const outlineOf = (path) => {
  let fenced = false;
  return git("show", `${headSha}:${path}`).split("\n").flatMap((t, i) => {
    if (/^\s*(```|~~~)/.test(t)) fenced = !fenced;
    return !fenced && /^#{1,6}\s/.test(t) ? [{ line: i + 1, text: t.replace(/^#+\s*/, "") }] : [];
  });
};

const files = chunks.map((patch) => {
  const lines = patch.split("\n");
  const header = lines[0].match(/^diff --git a\/(.+) b\/(.+)$/);
  let path = header?.[2] ?? lines[0];
  let oldPath = header?.[1] ?? path;
  let status = "modified";
  let binary = false;
  let adds = 0;
  let dels = 0;
  let inHunk = false;
  for (const l of lines.slice(1)) {
    if (!inHunk) {
      if (l.startsWith("new file mode")) status = "added";
      else if (l.startsWith("deleted file mode")) status = "deleted";
      else if (l.startsWith("rename from ")) { status = "renamed"; oldPath = l.slice(12); }
      else if (l.startsWith("rename to ")) path = l.slice(10);
      else if (l.startsWith("Binary files")) binary = true;
      else if (l.startsWith("@@")) inHunk = true;
      continue;
    }
    if (l.startsWith("+")) adds++;
    else if (l.startsWith("-")) dels++;
  }
  const outline = /\.mdx?$/.test(path) && status !== "deleted" ? outlineOf(path) : undefined;
  return { path, oldPath: oldPath === path ? undefined : oldPath, status, binary, adds, dels, tier: tierOf(path), patch, outline };
});

const manifest = {
  repo: git("rev-parse", "--show-toplevel").trim().split("/").pop(),
  baseRef: args.base,
  headRef: git("rev-parse", "--abbrev-ref", args.head).trim(),
  mergeBase,
  headSha,
  commits,
  files,
};
writeFileSync(args.out, JSON.stringify(manifest, null, 2));

const pad = (s, n) => String(s).padEnd(n);
console.log(`${manifest.headRef} vs ${args.base} @ ${mergeBase.slice(0, 8)}: ${files.length} files, ${commits.length} commits`);
for (const f of files) console.log(`  ${pad(f.tier, 10)} ${pad(`+${f.adds}/-${f.dels}`, 10)} ${f.path}`);
