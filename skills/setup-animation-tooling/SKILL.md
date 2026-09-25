---
name: setup-animation-tooling
description: Animation and illustration tooling — installs the anidoodle skill (code-drawn stills, loops, stickers, animated logos and scored films, deterministic every render) with its render deps (Node, ffmpeg, Chromium), and scaffolds a project's art workspace. Use when the user says "setup animation tooling", "install anidoodle", wants hero art, sprites, loops or a short film drawn in code, or via setup-tooling / setup-game-dev-tools on a project that needs illustration or animation assets.
---

# Setup Animation Tooling

Animation assets are made with **`anidoodle`**
([alexgreensh/anidoodle](https://github.com/alexgreensh/anidoodle),
Apache-2.0): an agent skill plus a small Node engine that draws every
frame with a pure function and renders it through headless Chromium, then
encodes with ffmpeg. It makes **assets** — PNG, MP4 with score, GIF,
WebM/APNG with alpha, one offline HTML player — for any project: a web
hero, a game's sprites and title card, a README loop. In-app UI motion
stays with the stack module's runtime library (GSAP on web, reanimated on
mobile).

Invoking this skill is the user's go-ahead to install `anidoodle` itself.
System packages (Node, ffmpeg) are heavier: show the command for the
current OS from [skill.deps.json](./skill.deps.json) and run it on the
user's yes.

## 1. Install (idempotent, user scope, once per machine)

Each step checks first and does nothing when already satisfied. Windows
native and WSL are separate machines here: each has its own home, its own
`~/.claude/skills`, and needs its own install.

1. **anidoodle.** Installed when `anidoodle` is in the available-skills
   list (any scope, possibly namespaced), or its `SKILL.md` exists at
   `~/.claude/skills/anidoodle/SKILL.md` (PowerShell:
   `Test-Path "$HOME\.claude\skills\anidoodle\SKILL.md"`). Otherwise run
   the `anidoodle` command from `skill.deps.json` — the same on macOS,
   Windows and WSL; under Codex, swap `-a claude-code` for `-a codex`.
   A fresh install shows up as a skill on the next session (or
   `/reload-plugins`). Update later with `npx skills update anidoodle -g`.
2. **Node ≥ 20.** `node --version`; else the `node` entry.
3. **ffmpeg.** `ffmpeg -version`; else the `ffmpeg` entry for the OS.
   Stills work without it; anything that moves needs it.

Done when all three checks pass.

## 2. Art workspace (per project, when the project needs assets now)

The engine is its own npm package with its own lockfile, so it lives in
an **art workspace** beside the app, never merged into it:

```bash
node ~/.claude/skills/anidoodle/engine/tools/scaffold.mjs art --still hero --film intro
cd art && npm install && npx playwright-core install chromium   # Linux/WSL: install --with-deps chromium
```

- Pick `--still` / `--film` names from the asset the user asked for;
  `anidoodle`'s own `SKILL.md` routes still vs. loop vs. film.
- Keep `art/` out of the app's pnpm workspace, lint-guardrails and
  typecheck: its code follows the engine's contract, not the app's style
  rules. Commit `art/src` and `art/package*.json`; ignore
  `art/node_modules`, `art/out`, `art/dist`, `art/.tmp`.
- Rendered files are copied from `art/out/` into the app's asset folder
  (`public/`, the game's `assets/`); the source in `art/src` is what
  regenerates them at any size.
- Note in the agent docs: assets are drawn with `anidoodle` in `art/`,
  and `node tools/gate.mjs <name>` checks one before it ships.

Done when `node tools/still.mjs hero --out out/hero.png` prints
`reproducible`.

## Gotchas

- **Native Windows:** `tools/gate.mjs` shells out to Unix `find`, and
  PowerShell resolves `find` to `C:\Windows\System32\find.exe`. Run the
  gate from Git Bash (GNU `find` first on `PATH`) or in WSL; `still`,
  `render` and `emit` run fine in PowerShell.
- The `remotion` and `hyperframes` backends are optional; `npm install`
  in the art workspace pulls Remotion as an optional dependency, and the
  default `playwright` / `html-player` backends need nothing more.
