---
name: setup-game-dev-tools
description: Game-dev tooling for Claude Code on macOS and native Windows — Blender with the official Blender Lab MCP (add-on + stdio server), and Unity with its CLI, an Editor (6.0+), Unity's official Claude Code plugin and the per-project Pipeline bridge — each step detected before it is installed, then verified end to end. Use when the user says "setup game dev tools", "set up Blender MCP", "set up Unity for Claude", or starts a game project. For code-drawn illustration and animation assets, compose setup-animation-tooling; for building and animating characters once Blender is set up, use blender-character.
---

# Game-Dev Tools

Sets up a machine so Claude Code can drive **Blender** (through the
Blender Lab MCP) and **Unity** (through Unity's plugin and CLI). Mechanics:
[BLENDER.md](./BLENDER.md), [UNITY.md](./UNITY.md). Sources for every
command: [RESEARCH.md](./RESEARCH.md).

**Platforms:** macOS (`darwin`) and native Windows (`win32`: PowerShell,
Claude Code installed on Windows). WSL is out of scope. Unity's Editor
bridge accepts loopback connections only and finds Editors by Windows PID,
so a Claude Code running in WSL cannot drive it. If the platform is `linux`
under WSL, say so and stop.

## Flow

1. **Scope.** Ask which to set up: Blender, Unity, or both (default both).
   Ask whether the project also needs code-drawn art or animation. If so,
   run `setup-animation-tooling` after this skill.
2. **Detect first, install second.** Every step in BLENDER.md and UNITY.md
   begins with a check. Skip what is already in place and report it as
   found, not installed.
3. **Dependencies.** Prompt the user with the install command from
   [skill.deps.json](./skill.deps.json) for the current OS for anything
   missing. Never install silently. `brew`/`winget` installs of Blender
   and the Unity CLI are the user's call. Suggest them; do not run them
   unasked.
4. **Blender**: [BLENDER.md](./BLENDER.md). Online Access, then the add-on
   from the Lab repository, then the cloned server registered at user scope.
5. **Unity**: [UNITY.md](./UNITY.md). CLI, then the user's sign-in, then an
   Editor, then the plugin. If the user named a project, also its Pipeline
   bridge.
6. **Verify** with each file's checks. "Connected" in `claude mcp list`
   is not proof: Blender needs the port listening, and Unity needs
   `unity status` to show `ready`.
7. **Report** a table: component | found / installed / needs user | how
   it was verified. Then list what only the user can do (browser sign-in,
   restarting Blender or Claude Code, `/reload-plugins`), plus Blender Lab's
   warning that the MCP runs LLM-written code in Blender unsandboxed.

## Steps only the user can do

- `unity auth login` (browser OAuth). Suggest `! unity auth login`.
- Restart Blender after the add-on install, and restart Claude Code (or
  `/reload-plugins`) after MCP or plugin changes. The current session does
  not load new tools.
- OS prompts: UAC for machine-wide Windows installers, Gatekeeper on first
  launch on macOS, keychain prompts when the CLI stores its session.
