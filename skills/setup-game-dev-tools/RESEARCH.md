# Research: `/setup-game-dev-tools` (Blender + Blender MCP, Unity + Unity's Claude plugin)

Research date: **2026-09-24**. Scope: macOS, Windows (native), Windows with Claude Code in WSL 2.
Every claim below has a source. "Verified locally" means observed on the author's Mac on 2026-09-24
(macOS 26 / Darwin 25.5, Apple silicon, Blender 5.2.2 LTS, Unity Hub 3.21.3, unity CLI 1.0.0-beta.8).
Anything not confirmed from a primary source is marked **UNVERIFIED**.

> **Scope note (2026-09-24):** the skill targets macOS and **native** Windows only. The WSL material below (§1.4, §2.8, §5) is kept as the reason for that decision, not as supported setup. Verified locally since this was written: headless Online Access + `repo-add`/`install -s -e lab_blender_org.mcp` (isolated Blender config), and the full Unity path (project create → `unity pipeline install` → `unity open` → `status` ready → `unity command editor_status`) plus `claude plugin install unity@unity-agent-plugin`.

## 0. What was read (versions/dates)

| Source | Version / date read |
|---|---|
| `projects.blender.org/lab/blender_mcp` (git clone, `main` @ `ff54e4d`, 2026-09-11; tag `v1.0.3` @ `2cea8d5`, 2026-09-11) | readme.md, mcp/README.md, mcp/pyproject.toml, mcp/manifest.json, addon/blender_mcp_addon/{blender_manifest.toml, \_\_init\_\_.py, cli.py, mcp_to_blender_server.py, weak_sandbox.py}, mcp/blmcp/{\_\_init\_\_.py, tools_helpers/connection.py, tools_helpers/blender_cli.py, tools/execute_blender_code.py}, Makefile, readme_tools.rst |
| `projects.blender.org/lab/blender_mcp.wiki` (git clone @ `0a83cb2`, 2026-07-23) | Home.md, Setup.md, Llama.cpp.md |
| Gitea API `https://projects.blender.org/api/v1/repos/lab/blender_mcp/releases` | releases v1.0.0 (2026-04-27), v1.0.2 (2026-09-08), v1.0.3 (2026-09-11) |
| https://www.blender.org/lab/mcp-server/ | fetched 2026-09-24 (no page date) |
| Blender Manual (5.2 LTS) + Python API (current) | docs.blender.org, fetched 2026-09-24 |
| `github.com/Unity-Technologies/unity-agent-plugin` (git clone @ `ef73639`, 2026-09-24) | plugin.json version `0.1.6-beta`, 32 skills |
| `github.com/Unity-Technologies/skills` (git clone @ `62db54f`, 2026-09-24) | same 32 skills |
| `com.unity.pipeline` 0.7.0-exp.1 (tarball from packages.unity.com, published 2026-09-11) | Documentation~/connectivity.md, Runtime/Common/BasePipelineServer.cs, Runtime/Models/InstanceDescriptor.cs |
| docs.unity.com AI plugin pages, Unity CLI pages, Hub pages; docs.unity3d.com com.unity.ai.assistant@2.18 | fetched 2026-09-24 ("last updated a month ago") |
| unity.com blog: "Unity Plugin for Claude Code" (2026-09-09), "Meet the Unity CLI" (2026-07-20), "Unity MCP: how to get started" (2026-05-11) | fetched 2026-09-24 |
| code.claude.com docs: setup, mcp, discover-plugins | fetched 2026-09-24 |
| learn.microsoft.com WSL networking (updated 2026-06-02), MicrosoftDocs/WSL `wsl-config.md`, `filesystems.md` | fetched 2026-09-24 |
| Homebrew API (formulae.brew.sh), `microsoft/winget-pkgs` manifests | fetched 2026-09-24 |
| astral-sh/uv docs (installation.md, reference/storage.md) | `main`, fetched 2026-09-24 |

---

## 1. Blender

### 1.1 Install Blender non-interactively

Minimum: the MCP add-on declares `blender_version_min = "5.1.0"` (addon/blender_mcp_addon/blender_manifest.toml at tag v1.0.3), and the Lab page says "Blender 5.1 or newer" (https://www.blender.org/lab/mcp-server/). Current release is **5.2.2 LTS** (Homebrew cask `blender` 5.2.2 → `https://download.blender.org/release/Blender5.2/blender-5.2.2-macos-arm64.dmg`, https://formulae.brew.sh/api/cask/blender.json; manual header "Blender 5.2 LTS Manual").

**macOS**
- `brew install --cask blender` — installs `/Applications/Blender.app` and a `blender` wrapper at `$HOMEBREW_PREFIX/bin/blender` that execs `Blender.app/Contents/MacOS/Blender` (cask `artifacts`: `app` + `command_wrapper`, https://formulae.brew.sh/api/cask/blender.json).
- Official alternative: `.dmg`, drag `Blender.app` to Applications (https://docs.blender.org/manual/en/latest/getting_started/installing/macos.html). Blender 5.0+ is Apple-silicon only (same page).
- Executable: `/Applications/Blender.app/Contents/MacOS/Blender` (https://docs.blender.org/manual/en/latest/advanced/command_line/launch/macos.html). A `.dmg` install does **not** put `blender` on PATH (verified locally: `which blender` → not found; Blender.app present).

**Windows**
- `winget install --id BlenderFoundation.Blender -e` — WiX MSI, `Scope: machine`, `ElevationRequirement: elevatesSelf`, x64 + arm64 installers, latest manifest 5.2.1 (2026-08-25) (https://github.com/microsoft/winget-pkgs/tree/master/manifests/b/BlenderFoundation/Blender). Separate per-series LTS ids exist only for 4.x (`manifests/b/BlenderFoundation/Blender/LTS/4/{2,5}`); no 5.x LTS id at time of reading.
- Official alternatives: MSI (needs admin) or portable `.zip` (no admin, no Start menu entry, no file association) (https://docs.blender.org/manual/en/latest/getting_started/installing/windows.html).
- Executable: the manual says `C:\Program Files\Blender Foundation\Blender\blender.exe` (https://docs.blender.org/manual/en/latest/advanced/command_line/launch/windows.html). The MSI default folder is commonly version-suffixed, e.g. `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` — **UNVERIFIED**; the skill should glob `C:\Program Files\Blender Foundation\Blender*\blender.exe` instead of hard-coding.

**From WSL**: WSL can run Windows executables by full name with extension (`blender.exe`), with pipes/redirects working, as the active Windows user; arguments are passed unmodified, so file arguments must be Windows paths (https://learn.microsoft.com/en-us/windows/wsl/filesystems#run-windows-tools-from-linux, source `WSL/filesystems.md`). Use `wslpath -w` to convert. Interop is on by default (`[interop] enabled=true`, `appendWindowsPath=true`, `WSL/wsl-config.md`).

### 1.2 The official Blender Lab MCP server

**What it is.** Two components talking over TCP: a Blender add-on (extension id `mcp`) that runs a socket server inside Blender, and a Python MCP server (`blender-mcp`, stdio by default) launched by the MCP client: `MCP Client ⇐ MCP/stdio ⇒ blender-mcp ⇐ TCP socket ⇒ Blender Add-on` (readme.md). Docs home: https://www.blender.org/lab/mcp-server/. License GPL-3.0-or-later (mcp/manifest.json).

**Versions.** Latest release **v1.0.3** (2026-09-11) with assets `mcp-1.0.3.zip` (add-on) and `blender-1.0.3.mcpb` (MCP bundle) (Gitea releases API). Note: the `v1.0.3` tag commit is **not** an ancestor of `main` (verified locally: `git merge-base --is-ancestor v1.0.3 main` → false); on `main` the add-on manifest still says `version = "1.0.0"` and `mcp/pyproject.toml` says `1.0.2`, so building the add-on from `main` produces `mcp-1.0.0.zip` (verified locally). Prefer the release zip / Lab repository for the add-on.

**Requirements**
- Blender ≥ 5.1.0 (blender_manifest.toml).
- Python ≥ 3.10 for the server; deps `docutils`, `mcp[cli]>=1.2.0,<2`, `pyyaml`; entry point `blender-mcp = "blmcp:main"` (mcp/pyproject.toml). `uv` is the documented runner (wiki Setup.md; manifest.json `"command": "uv", "args": ["run","blender-mcp"]`).
- **Blender "Allow Online Access" must be on.** The add-on refuses to start its server unless `bpy.app.online_access` is true, recording the error "Online access must be enabled in the system preferences" and, in background mode, printing "Use --online-mode to enable online access from the command line" (addon `__init__.py`, `_State.startup_online_ok_or_error`). The preference `PreferencesSystem.use_online_access` defaults to **False** (https://docs.blender.org/api/current/bpy.types.PreferencesSystem.html; UI: Preferences ▸ System ▸ Network ▸ Allow Online Access, https://docs.blender.org/manual/en/latest/editors/preferences/system.html). `--online-mode` overrides the preference for one run (https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html). Verified locally that this machine has it on (`bpy.app.online_access True`). Setting it non-interactively via `blender -b --python-expr "import bpy; bpy.context.preferences.system.use_online_access=True; bpy.ops.wm.save_userpref()"` — **UNVERIFIED**.

**Add-on install options** (all official)
1. Lab page drag-and-drop link (adds the Lab repository, then installs; gives update notifications): `https://projects.blender.org/lab/blender_mcp/releases/download/v1.0.3/mcp-1.0.3.zip?repository=https%3A%2F%2Flab.blender.org%2F&blender_version_min=5.1.0` (https://www.blender.org/lab/mcp-server/). Interactive only.
2. Remote repository `https://lab.blender.org/` (mcp/README.md: "Install the Blender Lab Extensions repository: `https://lab.blender.org/`"). The URL serves a JSON index (redirects to `https://lab.blender.org/lab/extensions/v1/index.json`) listing `id: "mcp"`, `version: "1.0.3"` (verified locally with `curl -H 'Accept: application/json'`). Scriptable via the extension CLI (syntax from https://docs.blender.org/manual/en/latest/advanced/command_line/extension_arguments.html; package names are `repo_id.pkg_id` per `bl_pkg/bl_extension_cli.py` bundled in Blender 5.2):
   ```sh
   blender --command extension repo-add --name "lab.blender.org" --url https://lab.blender.org/ lab_blender_org
   blender --online-mode --command extension install -s -e lab_blender_org.mcp
   ```
   The repo id `lab_blender_org` / URL `https://lab.blender.org/` match what the drag-and-drop created on this machine (verified locally via `extension repo-list`). The two-command sequence end-to-end is **UNVERIFIED** (not run, to avoid modifying prefs).
3. Install from file (verified locally): `blender --command extension install-file -r user_default -e mcp-1.0.3.zip` (download the zip with `curl -L` from the release URL — `projects.blender.org` release downloads return 200 to curl even though HTML pages are behind a bot check, verified locally). Building from source also works: `blender --command extension build --source-dir addon/blender_mcp_addon --output-dir <out>` (verified locally).
- Pick **one** source. On this machine `mcp` is installed in both `user_default` and `lab_blender_org`, with only `bl_ext.lab_blender_org.mcp` enabled (verified locally, `extension list` / `preferences.addons`). Two enabled copies would both try to bind the same port. Remove a duplicate with `blender --command extension remove user_default.mcp`.
- The add-on declares `[permissions] network = "Runs a local TCP socket server for MCP client communication"` (blender_manifest.toml).

**Add-on runtime behaviour** (addon `__init__.py`, `mcp_to_blender_server.py`)
- Preferences: `host` default `"localhost"`, `port` default `9876` (range 1024–65535), `use_autostart` default **True**, `autostart_delay` 1.0 s, polling intervals, `use_log`.
- Binds `socket.AF_INET` (IPv4 only) to `(host, port)`; with the default host it listens on `127.0.0.1:9876` (verified locally: `lsof` shows `Blender … TCP 127.0.0.1:9876 (LISTEN)`). Not reachable from other hosts unless the Host preference is changed.
- Headless/background mode: timers don't run in background, so use the CLI command `blender --background file.blend --command blender_mcp [--host H] [--port P]` (cli.py). Put `--online-mode` before `--command` if the preference is off (`--command` consumes all remaining args, arguments.html).

**MCP server** (mcp/blmcp)
- Transport: `--transport stdio` (default) or `http` (`--host` default `127.0.0.1`, `--port` default `8000`) (`blmcp/__init__.py`).
- Env vars: `BLENDER_MCP_HOST` (default `localhost`), `BLENDER_MCP_PORT` (default `9876`) — `tools_helpers/connection.py`; socket timeout 300 s. `BLENDER_PATH` (default `blender`) is the Blender binary used by the `*_for_cli` tools that spawn `blender --background <file> --python-expr …` (`tools_helpers/blender_cli.py`). On macOS with a `.dmg` install, `blender` is not on PATH, so set `BLENDER_PATH=/Applications/Blender.app/Contents/MacOS/Blender` for those tools.
- Tools (readme_tools.rst): `execute_blender_code`, `execute_blender_code_for_cli`, `get_blendfile_summary_*` (+ `_for_cli` variants), `get_object_detail_summary`, `get_objects_summary`, `get_python_api_docs`, `search_api_docs`, `search_manual_docs`, screenshots (`get_screenshot_of_area_as_image`, `get_screenshot_of_window_as_image`, `get_screenshot_of_window_as_json`), navigation (`jump_to_*`), `render_thumbnail_to_path`, `render_viewport_to_path`. Bundled Blender manual + API RST (updated to 5.2 on `main`, commit `ff54e4d`).
- Install (official): clone + uv (wiki Setup.md: `cd $HOME && git clone https://projects.blender.org/lab/blender_mcp.git` on macOS/Linux; `cd c:\ && git clone …` on Windows), or `pip install git+https://projects.blender.org/lab/blender_mcp.git#subdirectory=mcp` (mcp/README.md), or the `.mcpb` bundle "for newer clients supporting .mcpb" (Lab page). Claude Code's docs don't document `.mcpb`; use the clone + uv route.
- Client config (wiki Setup.md): command `uv`, args `["--directory", "$HOME/blender_mcp/mcp", "run", "blender-mcp"]` (Windows: `"C:\\blender_mcp\\mcp"`). For Claude Code:
  ```sh
  claude mcp add --scope user blender -- uv --directory "$HOME/blender_mcp/mcp" run blender-mcp
  ```
  Verified locally (with `/Users/john/blender_mcp/mcp`, after `uv sync`) → `claude mcp list` shows Connected. `claude mcp add` syntax, `--scope user` storing in `~/.claude.json`, `-e KEY=value`, and the `--` separator: https://code.claude.com/docs/en/mcp.
- "Connected" only proves the stdio server started; the server contacts Blender only when a tool runs (`connection.py` opens a socket per `send_code`). Real end-to-end check: Blender open + a tool call (e.g. ask Claude to run `get_blendfile_summary_path_info`), or `nc -z 127.0.0.1 9876` (macOS) / `Test-NetConnection 127.0.0.1 -Port 9876` (Windows).

**Security.** "The MCP server will execute LLM generated code in Blender without any guards in place to protect your data from removal or being sent to a remote location"; the Lab page recommends a VM or isolated system (https://www.blender.org/lab/mcp-server/). `weak_sandbox.py` says of itself "this isn't really a sandbox" — it only blocks things like `sys.exit`, `wm.quit_blender`, `wm.read_factory_settings`.

### 1.3 uv

From https://github.com/astral-sh/uv/blob/main/docs/getting-started/installation.md (https://docs.astral.sh/uv/getting-started/installation/):
- macOS: `brew install uv` (verified locally), or `curl -LsSf https://astral.sh/uv/install.sh | sh`.
- Windows: `winget install --id=astral-sh.uv -e`, or `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`.
- Linux/WSL: `curl -LsSf https://astral.sh/uv/install.sh | sh`.
- Standalone installer puts `uv` in the executable directory: Unix `$HOME/.local/bin`, Windows `%USERPROFILE%\.local\bin` (unless `XDG_BIN_HOME`/`UV_INSTALL_DIR`) (docs/reference/storage.md). winget's `uv.exe` location — **UNVERIFIED**; resolve with `where.exe uv`.

### 1.4 Windows and WSL

**Windows native Claude Code**: same as macOS with Windows paths: clone to `C:\blender_mcp`, `uv sync` in `C:\blender_mcp\mcp`, then `claude mcp add --scope user blender -- uv --directory C:\blender_mcp\mcp run blender-mcp`. The docs' `cmd /c` wrapper note applies to `npx` (a `.cmd` shim); `uv.exe` is a real executable, so no wrapper should be needed — **UNVERIFIED** on Windows. Claude Code runs natively on Windows 10 1809+, with Git for Windows optional (Bash tool via Git Bash) (https://code.claude.com/docs/en/setup#set-up-on-windows).

**Claude Code in WSL, Blender on Windows.** The add-on listens on Windows `127.0.0.1:9876` only (AF_INET, `localhost`). Two workable designs:

- **A. Run the MCP server on the Windows side through interop (recommended).**
  ```sh
  # inside WSL; uv.exe path depends on how uv was installed on Windows
  claude mcp add --scope user blender -- /mnt/c/Users/<you>/.local/bin/uv.exe --directory 'C:\blender_mcp\mcp' run blender-mcp
  ```
  Why: nothing changes in WSL networking; the server and Blender share one host, so it connects to 127.0.0.1 as on native Windows; the `*_for_cli` tools spawn Windows `blender.exe` with Windows paths and `synced_blend_for_cli` compares paths on the same OS. WSL documents that Windows `.exe`s launched from Linux support piping and redirection (filesystems.md), which is what stdio MCP needs. Long-lived stdio MCP over interop — **UNVERIFIED** in practice. Caveat: file paths passed to tools must be Windows paths (`C:\…`), not `/mnt/c/…`.
- **B. Run the MCP server inside WSL and turn on mirrored networking.** In NAT mode (the default), WSL reaches Windows services only via the host IP and the app must accept LAN connections (bind `0.0.0.0`), which the add-on does not do by default (https://learn.microsoft.com/en-us/windows/wsl/networking). With mirrored mode (Windows 11 22H2+): `%UserProfile%\.wslconfig` →
  ```ini
  [wsl2]
  networkingMode=mirrored
  ```
  then `wsl --shutdown`; "Connect to Windows servers from within Linux using the localhost address 127.0.0.1. IPv6 localhost address ::1 is not supported" (networking page; `wsl-config.md`). The MCP server uses AF_INET, so `localhost` → 127.0.0.1 works; setting `-e BLENDER_MCP_HOST=127.0.0.1` makes it explicit. Drawbacks: machine-wide WSL networking change; `*_for_cli` tools are degraded (need `BLENDER_PATH` set to the Windows `blender.exe` via `/mnt/c/...`, but they pass Linux paths that Windows Blender can't open, and the dirty-file path comparison is across OSes) — inferred from `blender_cli.py`, **UNVERIFIED**.
- **Not recommended:** changing the add-on Host to `0.0.0.0` for NAT mode. That exposes an arbitrary-code-execution socket to the LAN.

---

## 2. Unity

### 2.1 What "Unity's official Claude plugin" is

**It is a Claude Code plugin made only of skills, with no MCP server.** Live Editor control comes from the separate `unity` CLI, which the plugin's `unity-cli` skill tells Claude to run through Bash.

- Announced **2026-09-09** by Rachel Zhao (Director of AI Products): "a first-party plugin which installs Unity's engineering skills, including the unity-cli skill for driving the Unity CLI"; 29 skills at launch (https://unity.com/blog/unity-plugin-for-claude-code).
- Official docs: https://docs.unity.com/en-us/ai/unity-plugin (index), https://docs.unity.com/en-us/ai/unity-plugin/about-unity-plugin, https://docs.unity.com/en-us/ai/unity-plugin/claude-code (siblings: `/codex`, `/grok`). "Unity's plugin for Claude Code, Codex, and Grok adds a set of Unity skills to your AI agent … This isn't a Unity Asset Store plugin or package and you can't install it through the Package Manager. Prerequisites: Unity's plugin works with Unity 6.0 or later." (about page). The pages don't mention MCP, OS support, accounts or pricing.
- Repo/marketplace: https://github.com/Unity-Technologies/unity-agent-plugin — `.claude-plugin/marketplace.json` (marketplace `unity-agent-plugin`, plugin `unity`, `source: "./"`), `.claude-plugin/plugin.json` (`version: "0.1.6-beta"`, license `LicenseRef-Unity-Companion-License`). There are no `mcpServers`, no `.mcp.json`, no hooks and no agents: only `skills/` (32 skills at `ef73639`) (verified locally by clone + grep). README: "Works with Unity 6+."
- The same skills are published for any agent at https://github.com/Unity-Technologies/skills (`npx skills add Unity-Technologies/skills`; README). The skill lists match. The only difference in `unity-cli/SKILL.md` is that the plugin copy adds `--caller plugin --skill <name>` labels to `unity command` calls (verified locally with `diff`). The CLI's own `unity skill install claude-code` writes an embedded copy to `~/.claude/skills/unity-cli` (verified locally with `unity skill install --list`). **Install only one of these three**, preferably the plugin, or Claude Code gets duplicate `unity-cli` skills.
- Also listed in Anthropic's official marketplace as `unity` (source `https://github.com/Unity-Technologies/unity-agent-plugin.git` pinned by `sha`) (`anthropics/claude-plugins-official` `.claude-plugin/marketplace.json`, read 2026-09-24).

**How the plugin relates to the CLI and MCP:**
```
Claude Code ── plugin "unity" (skills only) ──> unity-cli skill ──Bash──> `unity` CLI ──HTTP 127.0.0.1:7800-7849 + bearer token──> Editor with com.unity.pipeline
Claude Code ── (optional, separate) MCP server "unity-editor-mcp" = `unity mcp` (stdio) ──────────────────^
```
- `unity mcp` is an MCP stdio server built into the `unity` binary that exposes a connected Editor's commands as MCP tools; it starts even with no Editor and advertises `tools/list_changed` (plugin `skills/unity-cli/references/integration-advanced.md` § MCP). `unity mcp configure claude-code --dry-run` prints `claude mcp add --scope user --transport stdio unity-editor-mcp unity mcp` (verified locally; a bare `unity`, so the CLI must be on PATH for Claude Code). The plugin does **not** register this server. Optional; the skill-driven CLI is Unity's documented agent path.

### 2.2 Install the plugin (scriptable)

Unity docs (https://docs.unity.com/en-us/ai/unity-plugin/claude-code) and repo README:
```sh
claude plugin marketplace add Unity-Technologies/unity-agent-plugin
claude plugin install unity@unity-agent-plugin            # user scope by default; --scope project|local
```
In-session equivalents: `/plugin marketplace add Unity-Technologies/unity-agent-plugin`, `/plugin install unity@unity-agent-plugin`. Shell installs load next session or after `/reload-plugins` (README). Verify: type `/unity:` (skills listed), `/plugin` shows `unity` enabled; `claude plugin list` prints Version/Scope/Status (https://code.claude.com/docs/en/discover-plugins). Update: `/plugin marketplace update unity-agent-plugin`. Auto-update is off by default for third-party marketplaces and on for official Anthropic ones (Unity page + https://code.claude.com/docs/en/discover-plugins#keep-plugins-updated). So `unity@claude-plugins-official` auto-updates, though it is pinned to a sha that may lag the repo. The Unity-documented id is `unity@unity-agent-plugin`. On a machine where no interactive session has run, `claude plugin marketplace add anthropics/claude-plugins-official` must come first if installing from the official marketplace (discover-plugins § Install from your shell).

Unity's troubleshooting: `rm -rf ~/.claude/plugins/cache` then reinstall; `claude --version` / update Claude Code if `/plugin` is unknown (Unity claude-code page). Limitation noted there: "On Sonnet 5, the plugin mainly supplies correctness."

### 2.3 The Unity CLI (`unity`), which the plugin needs for anything that touches the Editor

- Docs: https://docs.unity.com/en-us/unity-cli (+ `/use-unity-cli`, `/unity-cli-reference`, `/replace-mcp-server-unity-cli`, `/unity-pipeline/unity-pipeline-package`, `/release-notes`). "The Unity command-line interface (CLI) is experimental." "The Unity Hub now automatically installs the Unity CLI. Since it's distributed as its own binary, you can install, update, and also use it independently of the Unity Hub desktop application." Announcement: "Meet the Unity CLI", 2026-07-20 (https://unity.com/blog/meet-the-unity-cli).
- Versions: Homebrew cask `unity-cli` **1.0.0-beta.11**; winget `Unity.CLI` 1.0.0.20011 = `1.0.0-beta.11` (MSIX; "MSIX package versions encode the prerelease channel in the fourth (revision) field"); the plugin skill is aligned to beta.10 (2026-09-14, `skills/unity-cli/CHANGELOG.md`); Hub 3.21.3 bundles **beta.8** (verified locally).
- Supported OS: Windows 10 21H1+ x64; macOS 14+ (Apple silicon, Intel); Ubuntu 22.04+ / RHEL 9+ x64/arm64, glibc ≥ 2.34 (https://docs.unity.com/en-us/unity-cli/use-unity-cli).
- **Install channels** (use-unity-cli page):
  - macOS: `brew install --cask unity-cli` → `$HOMEBREW_PREFIX/bin/unity` (cask artifact, https://formulae.brew.sh/api/cask/unity-cli.json).
  - Windows: `winget install Unity.CLI` (MSIX, x64 + arm64; https://github.com/microsoft/winget-pkgs/tree/master/manifests/u/Unity/CLI).
  - Script: `curl -fsSL https://unity.com/install.sh | bash` (docs). The plugin skill and blog use `curl -fsSL https://public-cdn.cloud.unity3d.com/hub/prod/cli/install.sh | UNITY_CLI_CHANNEL=beta bash` and, on Windows, `$env:UNITY_CLI_CHANNEL='beta'; irm https://public-cdn.cloud.unity3d.com/hub/prod/cli/install.ps1 | iex` (`skills/unity-cli/SKILL.md`; blog). The docs' Windows one-liner came through the fetch mangled — **UNVERIFIED**; prefer winget. Script default target on macOS/Linux: `~/.local/bin/unity`; `UNITY_CLI_HOME` overrides (docs).
  - apt/dnf repos for Linux (docs; relevant to WSL).
  - Don't mix a self-installed copy and a Homebrew copy; `unity self-uninstall -y` removes the self-installed one (docs; `references/diagnostics-maintenance.md`).
- **Hub-bundled copy and how it reaches PATH** (Hub 3.21.3 source in `app.asar`, read locally, plus local state):
  - Bundled binary: `<Hub resources>/cli/unity[.exe]` → macOS `/Applications/Unity Hub.app/Contents/Resources/cli/unity` (verified locally, Mach-O, `--version` 1.0.0-beta.8). The Windows equivalent is `<Hub install dir>\resources\cli\unity.exe`; the Hub install dir (commonly `C:\Program Files\Unity Hub`) is **UNVERIFIED**.
  - On first launch, if no `unity` is found (PATH → Windows `HKCU\Environment\Path` → receipt → well-known paths), Hub runs the bundled `unity self-install --if-newer --format json` **once** (`cliAutoInstallAttempted` user setting) and logs `First-launch CLI seed: installed=… pathConfigured=…`. Self-install targets: **macOS `~/.unity/bin/unity`**, **Windows `%LOCALAPPDATA%\Unity\bin\unity.exe`**, Linux `~/.local/bin/unity`, or `$UNITY_CLI_HOME/bin/unity` (`bundledRefreshTargetPath` / `wellKnownCLIPaths` in Hub source).
  - Verified locally: log line `First-launch CLI seed: installed=true pathConfigured=configured` at 2026-09-25T03:16:12Z; `~/Library/Application Support/UnityHub/cli-install.json` = `{"path":"/Users/john/.unity/bin/unity","version":"1.0.0-beta.8","layout":"home",…}`; `~/.unity/env` prepends `~/.unity/bin` to PATH; `~/.zshrc` got `. "/Users/john/.unity/env"`. So the Hub copy **is** put on PATH, but only for **new interactive zsh shells**. A shell (or a Claude Code session) started before that, or one that doesn't source `.zshrc`, sees `which unity` → nothing. The skill should resolve `unity` via PATH, then `~/.unity/bin/unity` / `%LOCALAPPDATA%\Unity\bin\unity.exe`, then the Hub-bundled path, and preferably install a managed copy (`brew`/`winget`) so `unity` is on PATH everywhere, including for the `unity-editor-mcp` entry.
- Key commands (plugin `skills/unity-cli/SKILL.md` + references; docs `unity-cli-reference`):
  - `unity install [version|lts|latest] [-m <module>…] [--cm] [-a arm64|x86_64] --yes --accept-eula [--dry-run]`; `unity install-modules -e <ver> -m … --accept-eula`; `unity editors --installed --format json` (`location` = install dir); `unity editors running`; `unity editors --watch`; `unity releases --stream lts --limit 5 --format json`.
  - `unity auth login` (browser OAuth) / `unity auth status --format json`; `unity license activate --personal --accept-eula` (free Personal license); `unity license status` exits 4 when no license is active (`references/auth-license-cloud.md`).
  - `unity pipeline install [--project-path P]`; `unity pipeline list`; `unity status --format json`; `unity command [name] [--project-path P]`; `unity list`; `unity open <project>`; `unity projects create "Name" --path <dir> --editor-version lts --template com.unity.template.urp-blank`.
  - Global: `--format json`/`--json`, `--non-interactive` (`UNITY_NON_INTERACTIVE`), `--yes`, `--no-banner`; `UNITY_NO_CONSENT_PROMPT` suppresses the first-run analytics prompt; exit codes 0/1/2/3 (auth)/4 (precondition, e.g. no license)/6/8/130/143.
  - Unity Hub's old CLI (`"Unity Hub" -- --headless install -v …`) "is deprecated from version 3.18.0 of the Unity Hub. For new scripts and automation, use the Unity CLI" (https://docs.unity.com/en-us/hub/hub-cli-reference); the migration table is in https://docs.unity.com/en-us/unity-cli/unity-cli-reference#migrate-from-the-hub-cli.

### 2.4 Unity Hub + Editor install

- Hub: `brew install --cask unity-hub` (3.21.3, macOS ≥ 12, `/Applications/Unity Hub.app`) (https://formulae.brew.sh/api/cask/unity-hub.json); `winget install Unity.UnityHub` (3.21.3.65535; NSIS x64/arm64 machine-scope, plus MSIX) (https://github.com/microsoft/winget-pkgs/tree/master/manifests/u/Unity/UnityHub). Or `unity hub install [--headless]` (`--headless` = silent installer, Windows only; verifies the installer's code signature) (`references/config-hub.md`). Hub requirements: Windows 10 21H1+/11, macOS 12+; sign in with a Unity ID to use the Hub (https://docs.unity.com/en-us/hub/install-hub-win-mac).
- **The Hub isn't needed for the agent path.** The CLI installs Editors, signs in and activates licenses by itself (`unity-cli-reference` migration table: "Standalone binary; no Hub installation required").
- **Hub's first run installs an Editor on its own** (verified locally, not documented on the Hub install pages): right after the first sign-in (`IdentityProvider … firstTimeUser: true`, no editors, no projects), Hub 3.21.3 queued **6000.6.3f1** (the `SUPPORTED` stream, **not LTS**; `unity releases` lists 6000.3.25f1 as the current LTS) with Web Build Support, Documentation and the "Get Started With Unity (4.0.1)" template, ~16 s after launch (`~/Library/Application Support/UnityHub/logs/info-log.json` "Download Manager"/"Installation Manager" lines; `firstTimeSettings.json` has `"showEditorRecommendation":true`). While it downloads, `unity editors -i --json` returns `"data": []` and `/Applications/Unity/Hub/Editor` doesn't exist (verified locally). No documented API reports Hub-side in-progress installs. Observable (undocumented, **UNVERIFIED as stable**): `~/Library/Application Support/UnityHub/downloads/*.pkg` growing, `paused-downloads.json` entries with `"status":"queued"`, `install-state/install-state.db`, and the log lines above. Documented way to wait: `unity editors --installed --watch` ("live-updates as editors are installed or removed", `references/editors-install.md`). Recommended skill behaviour: skip installing Hub; if Hub is present, check for an in-flight Hub download before `unity install`, and tell the user the Hub is installing a non-LTS version they can cancel in the Hub Downloads panel. Whether `unity install lts` running at the same time conflicts with a Hub install is **UNVERIFIED**.
- Editor version: Unity **6.0+** is required by the plugin (docs about page; README "Unity 6+") and by `com.unity.pipeline` (`"unity": "6000.0"` in package.json; docs: "Unity Editor version 6.0 or later"). Recommend the latest LTS: `unity install lts --yes --accept-eula` (plugin skill: "Default to the latest LTS").
- Editor locations: macOS `/Applications/Unity/Hub/Editor/<ver>/Unity.app/Contents/MacOS/Unity` (`references/integration-advanced.md`; `unity env` reports `/Applications/Unity/Hub/Editor`, per the coordinator's local run). Windows default `C:\Program Files\Unity\Hub\Editor\<ver>\Editor\Unity.exe` — **UNVERIFIED**; always read `location` from `unity editors --installed --format json`.

### 2.5 Steps that cannot be fully automated

- **Unity sign-in**: `unity auth login` opens a browser OAuth flow. Only service accounts (`UNITY_SERVICE_ACCOUNT_ID`/`_SECRET`, `unity auth login --client-id … --secret-from-stdin`) skip it (`references/auth-license-cloud.md`; https://docs.unity.com/en-us/unity-cli/use-unity-cli). The Hub also requires sign-in.
- **License**: `unity license activate --personal --accept-eula` for Personal. Hub logged "Personal EULA agreement status: Pending" on first sign-in (verified locally). Personal-plan eligibility terms — **UNVERIFIED** (not researched).
- **Claude Code plugin trust prompt**: none for skills-only plugins from `claude plugin install`. `--yes` is only needed for `command`-source plugins (discover-plugins).
- **macOS/Windows OS prompts** (Gatekeeper, UAC for machine-scope MSI/NSIS), and **first Blender launch** (Online Access consent; whether the 5.x splash asks is **UNVERIFIED**).
- Pricing: the Unity CLI + Pipeline route is "Free and separate from Unity AI" / "No Unity AI subscription required" (https://docs.unity.com/en-us/unity-cli/replace-mcp-server-unity-cli). The plugin pages list no price. The older AI Assistant MCP required "active trial or subscription to Unity's AI tools beta" (https://unity.com/blog/unity-ai-mcp-how-to-get-started).

### 2.6 The Editor bridge: `com.unity.pipeline`

- Package **`com.unity.pipeline`** ("Unity Pipeline"), latest **0.7.0-exp.1** (experimental), `"unity": "6000.0"`; deps include `com.unity.test-framework`, `com.unity.nuget.newtonsoft-json`, `com.unity.nuget.mono-cecil` (https://packages.unity.com/com.unity.pipeline). Resolved from the Unity UPM registry; `unity pipeline install` writes it into `Packages/manifest.json` (`references/integration-advanced.md`; https://docs.unity.com/en-us/unity-cli/unity-pipeline/unity-pipeline-package: `unity auth login` then `unity pipeline install`, verify `unity pipeline list` → "Pipeline: Installed"). No manual scoped registry is needed. Blog: "com.unity.pipeline package: Available today, currently experimental … Unity 6.0 LTS and newer".
- Transport (`Documentation~/connectivity.md`; `Runtime/Common/BasePipelineServer.cs`): a local **HTTP** server in the Editor on the first free port in **7800–7849** (Players 7900–7949). Code binds `http://+:{port}/` and then **rejects any non-loopback remote address with 403** ("Only loopback connections are allowed"). Every request needs `Authorization: Bearer <evalToken>`. Discovery is **only** the per-project file **`<project>/Library/Pipeline/.unity-pipeline-port`** (JSON: `pid`, `port`, `projectPath`, `unityVersion`, `mode`, `lastHeartbeat`, `evalToken`, …), created owner-only ("there is no broadcast or registry"). Clients should dial `127.0.0.1`, not `localhost`.
- Readiness: `unity status --format json` → instance `state: "ready"` for GUI Editors. Batch-mode Editors serve commands but aren't listed by `status`; use `unity command --project-path P`. If a project has compile errors the Editor boots in **Safe Mode** and Pipeline doesn't load (`unity pipeline list` shows it) (`skills/unity-cli/SKILL.md`, `references/integration-advanced.md`).
- Sandboxes: "A restrictive sandbox can hide an Editor that is genuinely running". On macOS some sandboxes block the outbound loopback connection; on Windows some run commands under a separate account that can't read the owner-only descriptor (`references/integration-advanced.md` § Sandboxed agent tooling). This matters if Claude Code's Bash sandbox is on.
- Optional per-project skill: `unity skill install claude-code --local` mirrors the package-shipped `unity-pipeline` skill into `.claude/skills/unity-pipeline/` (`references/integration-advanced.md` § Skill).

### 2.7 Other Unity MCPs

- **Unity AI Assistant MCP** (`com.unity.ai.assistant`, relay binary `~/.unity/relay/relay_mac_arm64.app/...`, `%USERPROFILE%\.unity\relay\relay_win.exe`, `~/.unity/relay/relay_linux`, run with `--mcp`; IPC over named pipes on Windows or Unix sockets on macOS/Linux; connections approved in Edit ▸ Project Settings ▸ AI ▸ Unity MCP Server) (https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.18/manual/integration/unity-mcp-get-started.html). **Deprecated**: "Unity MCP is deprecated. Use the Unity command-line interface (CLI) instead." (https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.18/manual/integration/unity-mcp-overview.html). Migration: install CLI → `unity pipeline install` → `unity mcp configure <client>` → `unity skill install <agent>`; AI Assistant ≥ 2.13 fixes conflicts with the CLI (https://docs.unity.com/en-us/unity-cli/replace-mcp-server-unity-cli).
- Community servers (e.g. `CoplayDev/unity-mcp` on GitHub) exist; they are not Unity's and not the recommended path.

### 2.8 WSL verdict for Unity

- **Unity doesn't document or support it.** No Unity page mentions WSL (plugin, CLI, Pipeline docs all checked). The Unity Editor, the Pipeline server and its descriptor all live on Windows.
- **Linux `unity` inside WSL talking to a Windows Editor: expect it to fail.** The server accepts loopback only. In NAT mode WSL can't reach Windows `127.0.0.1` (networking page). In mirrored mode WSL→`127.0.0.1` reaches Windows, but whether the Windows `HttpListener` then sees a loopback remote address is **UNVERIFIED**. The CLI also finds Editors partly through the process table and PIDs (`editors running`: "process table plus each project's Pipeline lockfile"), and a Linux process can't see Windows PIDs. Descriptor paths would be Windows paths while the CLI works in `/mnt/c/...`. Not recommended.
- **Windows `unity.exe` through interop: plausible, UNVERIFIED.** A Windows process can read the owner-only descriptor as the same Windows user and dial Windows loopback. Needs a shim because the skills call bare `unity` (e.g. `~/.local/bin/unity`: `#!/bin/sh` / `exec "/mnt/c/Users/<you>/AppData/Local/Unity/bin/unity.exe" "$@"`), and every `--project-path` must be a Windows path (`wslpath -w`). MCP variant: `claude mcp add --scope user --transport stdio unity-editor-mcp -- /mnt/c/Users/<you>/AppData/Local/Unity/bin/unity.exe mcp --project-path 'C:\path\to\Project'`. The winget/MSIX copy lives under WindowsApps, and running MSIX app-execution aliases from WSL is **UNVERIFIED**; the Hub self-install path is a plain `.exe`.
- **Recommendation: for Unity, run Claude Code natively on Windows** (PowerShell/Git Bash; https://code.claude.com/docs/en/setup#set-up-on-windows). The plugin (skills) installs fine in WSL, but the CLI calls it depends on are the fragile part. WSL-side Claude Code stays fine for Blender (option A in §1.4) and for non-Editor Unity work (C# editing, reading skills).

---

## 3. Claude Code mechanics the skill will script

- MCP: `claude mcp add [--scope local|project|user] [-e K=V] [--transport stdio] <name> -- <cmd> [args…]`; `claude mcp get <name>`, `claude mcp list` (✔ Connected / ✘ Failed), `claude mcp remove <name> [--scope …]`, `claude mcp add-json <name> '<json>'`. User scope → `~/.claude.json` (https://code.claude.com/docs/en/mcp).
- Plugins: `claude plugin marketplace add <owner/repo|git URL|path|marketplace.json URL>`, `claude plugin install <plugin>@<marketplace> [--scope user|project|local]` (prints `Successfully installed plugin: …`), `claude plugin list`, `claude plugin enable|disable|uninstall`, `claude plugin marketplace update|list|remove <name>`, `claude plugin update <p>@<m>`; `claude -p` can't run `/plugin` (https://code.claude.com/docs/en/discover-plugins).
- Install Claude Code: macOS/Linux/WSL `curl -fsSL https://claude.ai/install.sh | bash`; Windows `irm https://claude.ai/install.ps1 | iex` or `winget install Anthropic.ClaudeCode`; `brew install --cask claude-code`. Native Windows: no sandboxing; WSL 2: sandboxing supported (https://code.claude.com/docs/en/setup).

---

## 4. Conventions for the skill in this repo

From `/Users/john/Documents/Repos/agent-skills/README.md` (repo @ `9f070f4`) and existing skills:
- `skills/<name>/SKILL.md` with YAML frontmatter `name` + `description`. The description says what the skill does, then "Use when the user says …" triggers, and names sibling skills for adjacent cases (e.g. `clean-wsl` ↔ `clean-windows-hdd`).
- External dependencies go in `skills/<name>/skill.deps.json`: dep → install command, or an object keyed `darwin`/`linux`/`win32` for OS-specific installs (examples: `lint-guardrails`, `pr-review-status`; `setup-evm-stack` uses a prose value for Windows→WSL). The SKILL.md tells Claude to **prompt the user with the command, never install silently** (`design-tooling/SKILL.md`: "Prompt the user to install anything missing with its command from skill.deps.json; never install these silently").
- Per-tool or per-OS detail goes in sibling `.md` files linked from SKILL.md (`design-tooling/PENCIL.md` + `FIGMA.md`; `clean-*/OFFENDERS.md`). Suggested layout: `SKILL.md` (flow + detection + verification), `BLENDER.md`, `UNITY.md`, `WINDOWS-WSL.md`, `skill.deps.json`.
- Windows skills write commands as PowerShell and note how to call them from other shells (`clean-windows-hdd`: `powershell.exe -NoProfile -Command "..."`; `clean-wsl`: separates "inside" vs "host" commands, and notes that shutdown and compaction have to run from a Windows terminal).
- Validate with `claude plugin validate . --strict`; add a row to the README skills table.
- Naming: existing modules are `setup-*`, so `setup-game-dev-tools` fits.

Suggested `skill.deps.json` values (from the sources above): `uv` (`darwin: brew install uv`, `win32: winget install --id=astral-sh.uv -e`, `linux: curl -LsSf https://astral.sh/uv/install.sh | sh`); `blender` (`darwin: brew install --cask blender`, `win32: winget install --id BlenderFoundation.Blender -e`); `unity-cli` (`darwin: brew install --cask unity-cli`, `win32: winget install Unity.CLI`, `linux: apt/dnf per docs`); `git`; optional `unity-hub` (`brew install --cask unity-hub` / `winget install Unity.UnityHub`).

---

## 5. Recommended setup sequences

### macOS
1. `brew install uv git` · `brew install --cask blender` (or detect `/Applications/Blender.app`).
2. Blender MCP server: `git clone https://projects.blender.org/lab/blender_mcp.git ~/blender_mcp` → `uv sync --directory ~/blender_mcp/mcp` → `claude mcp add --scope user -e BLENDER_PATH=/Applications/Blender.app/Contents/MacOS/Blender --transport stdio blender -- uv --directory "$HOME/blender_mcp/mcp" run blender-mcp`.
3. Add-on (one source only): `B=/Applications/Blender.app/Contents/MacOS/Blender`; `curl -L -o /tmp/mcp-1.0.3.zip https://projects.blender.org/lab/blender_mcp/releases/download/v1.0.3/mcp-1.0.3.zip`; `"$B" --command extension install-file -r user_default -e /tmp/mcp-1.0.3.zip`, or the `repo-add lab_blender_org` + `install -s -e lab_blender_org.mcp` pair (§1.2).
4. Turn on Allow Online Access (Preferences ▸ System ▸ Network), then relaunch Blender. Auto-start is on by default.
5. `brew install --cask unity-cli` (or rely on the Hub seed `~/.unity/bin/unity` in a fresh shell). Skip Unity Hub unless the user wants the GUI; if present, check for a first-run auto-install (§2.4).
6. `unity auth login` (browser) → `unity license activate --personal --accept-eula` → `unity install lts --yes --accept-eula` → create or open a project → `unity pipeline install --project-path <P>` → `unity open <P>`.
7. `claude plugin marketplace add Unity-Technologies/unity-agent-plugin && claude plugin install unity@unity-agent-plugin`. Optional: `claude mcp add --scope user --transport stdio unity-editor-mcp -- unity mcp` (or `unity mcp configure claude-code`).
- **Verify:** `claude mcp get blender` (Connected); `lsof -nP -iTCP:9876 -sTCP:LISTEN` shows Blender on 127.0.0.1; `"$B" -b --command extension list | grep mcp`; `claude plugin list` shows `unity@unity-agent-plugin` enabled; in a session `/unity:` lists skills; `unity --version`; `unity auth status --json`; `unity license status` (exit 0); `unity pipeline list` → Installed; `unity status --json` → state `ready`; `unity command editor_status --project-path <P>`.

### Windows (Claude Code native, recommended when Unity is in scope)
1. PowerShell: `winget install Anthropic.ClaudeCode` (or `irm https://claude.ai/install.ps1 | iex`), `winget install Git.Git` (Bash tool), `winget install --id=astral-sh.uv -e`, `winget install --id BlenderFoundation.Blender -e`, `winget install Unity.CLI` (optional `Unity.UnityHub`).
2. `git clone https://projects.blender.org/lab/blender_mcp.git C:\blender_mcp`; `uv sync --directory C:\blender_mcp\mcp`; `claude mcp add --scope user -e BLENDER_PATH="<glob-resolved blender.exe>" --transport stdio blender -- uv --directory C:\blender_mcp\mcp run blender-mcp`.
3. Add-on: `& "<blender.exe>" --command extension install-file -r user_default -e "$env:TEMP\mcp-1.0.3.zip"`; turn on Online Access; relaunch.
4. Unity: same as macOS steps 6–7.
- **Verify:** as macOS, with `Test-NetConnection 127.0.0.1 -Port 9876` / `Get-NetTCPConnection -LocalPort 9876 -State Listen`, and `where.exe unity`.

### Windows + Claude Code in WSL 2
- **Blender, works:** install Blender, uv and the clone on **Windows** (steps 1–3 above, from PowerShell). In WSL, register the Windows-side server through interop: `claude mcp add --scope user blender -- /mnt/c/Users/<you>/.local/bin/uv.exe --directory 'C:\blender_mcp\mcp' run blender-mcp` (the uv path depends on the install method; find it with `cmd.exe /c where uv`). Fallback: MCP server in WSL + `networkingMode=mirrored` + `wsl --shutdown` (§1.4 B). Verify: `claude mcp get blender` in WSL, then a live tool call with Blender open; `powershell.exe -NoProfile -Command "Test-NetConnection 127.0.0.1 -Port 9876"`.
- **Unity, not workable as documented:** the plugin installs fine in WSL (`claude plugin install unity@unity-agent-plugin`), but Editor control needs the Windows `unity.exe`. Recommend a native Windows Claude Code session for Unity work. Experimental: a `unity` → `unity.exe` shim plus Windows `--project-path` (§2.8), **UNVERIFIED**.

---

## 6. Open questions / UNVERIFIED

1. Windows default Blender MSI path (versioned `Blender 5.2` folder?) and winget `uv.exe` location.
2. `blender --command extension repo-add … && install -s -e lab_blender_org.mcp` end-to-end (not executed); whether `sync`/`install` need `--online-mode` when the preference is off.
3. Setting `use_online_access` headlessly with `--python-expr` + `wm.save_userpref()`; whether Blender 5.x first-run asks about Online Access.
4. Stdio MCP over WSL interop (`uv.exe` / `unity.exe` from Linux) staying stable for long sessions; MSIX aliases (winget `Unity.CLI`) callable from WSL.
5. Mirrored-mode WSL→Windows connections appearing as loopback to Unity's `HttpListener` (loopback-only check) and to Blender's socket.
6. Windows paths: Unity Hub install dir / bundled `resources\cli\unity.exe`; Unity Editor default `C:\Program Files\Unity\Hub\Editor\<ver>\Editor\Unity.exe`; Hub user-data dir on Windows (`%APPDATA%\UnityHub`?).
7. Hub first-run auto-install: which version rule it follows (observed 6000.6.3f1 = SUPPORTED stream, not LTS); whether it happens on Windows too; how to suppress it (`firstTimeSettings.json` `showEditorRecommendation`?); what happens if `unity install` runs at the same time.
8. The `unity.com/install.sh` Windows one-liner as shown in the docs (fetch looked mangled); the channel (`UNITY_CLI_CHANNEL=beta`) the docs script defaults to.
9. Whether `unity mcp configure claude-code` (bare `unity`) is safe when the CLI is only at `~/.unity/bin` and Claude Code is launched from a GUI app whose PATH doesn't include it. An absolute path in `claude mcp add` avoids the problem.
10. Unity Personal license eligibility and whether `unity license activate --personal` needs the EULA accepted in the Hub first (Hub logged "Personal EULA … Pending").
11. Whether Claude Code's Bash sandbox (WSL2/macOS) blocks `unity` loopback calls or Windows interop (Unity's skill warns sandboxes can hide Editors).
