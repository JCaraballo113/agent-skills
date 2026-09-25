# Unity + Unity's Claude Code plugin

Unity's official agent path (https://docs.unity.com/en-us/ai/unity-plugin)
has three pieces:

```
plugin "unity" (skills only) ─▶ unity-cli skill ─Bash─▶ `unity` CLI ─HTTP 127.0.0.1:7800-7849─▶ Editor running com.unity.pipeline
```

- **The plugin** (`unity@unity-agent-plugin`) is skills only. It has no MCP
  server and no hooks.
- **The `unity` CLI** is a standalone binary (experimental, beta). It
  installs Editors, signs in, activates licenses, and drives a running Editor.
- **`com.unity.pipeline`** is a per-project package that runs a
  loopback-only HTTP server in the Editor so the CLI can reach it.

Everything needs Unity **6.0+**. It does not need a Unity AI subscription.
Evidence for every step is in [RESEARCH.md](./RESEARCH.md) §2.

## 1. The `unity` CLI

Resolve before installing. Unity Hub drops a copy on first launch, and two
copies installed through different channels conflict:

| OS | Look in order | Install if none |
|---|---|---|
| darwin | `command -v unity`, `~/.unity/bin/unity` (Hub's copy), `$(brew --prefix)/bin/unity` | `brew install --cask unity-cli` |
| win32 | `Get-Command unity`, `$env:LOCALAPPDATA\Unity\bin\unity.exe` (Hub's copy) | `winget install --id Unity.CLI -e` |

Hub's copy is only on PATH in shells started after Hub first ran (it adds
`. ~/.unity/env` to `~/.zshrc`). Claude Code inherits PATH from the
terminal it was launched from, so a restart from an older tab still
cannot find `unity`, and Unity's skills call it by that bare name. On darwin,
fix it for good with one symlink into the directory that holds Claude
Code's own binary, which is always on its PATH:
`ln -s ~/.unity/bin/unity ~/.local/bin/unity` (skip it if
`~/.local/bin/unity` exists or the brew copy is used). On win32, Hub adds
the directory to the user `Path`, so launch Claude Code from a new
terminal. Within the current session, call the CLI by absolute path.
Keep a found copy up to date with `unity self-update`, not a second
install. For every call below, set
`UNITY_NO_BANNER=1 UNITY_NO_CONSENT_PROMPT=1` and pass `--format json`
where you parse the output.

## 2. Sign-in and license (the user does this)

```sh
unity auth status --format json       # data.loggedIn
unity license status                  # exit 0 = active; exit 4 = none
```

The CLI shares Unity Hub's session through the OS keychain/credential
store (`credentialSource: "keyring"`). A user who has signed in to Hub is
usually already signed in here. If not, the user runs `! unity auth login`
(it opens a browser). You cannot complete it for them. A locked or
out-of-sync macOS login keychain shows up as `loggedIn: false` even after
a Hub sign-in. The fix is unlocking or repairing the keychain (Keychain
Access ▸ Edit ▸ Change Password for Keychain "login"), not signing in
again. If no license is active:
`unity license activate --personal --accept-eula`.

## 3. An Editor (6.0+)

```sh
unity editors --installed --format json   # data[].version, data[].location
```

If a 6000.x Editor is installed, use it. Otherwise
`unity install lts --yes --accept-eula`, which installs the latest LTS (add
`-m <module…>` for build targets).

**Unity Hub's first launch installs an Editor by itself**: the recommended
stream, which is not necessarily LTS. That download is invisible to
`unity editors --installed` until it finishes. If Hub is installed and
`--installed` is empty, ask whether Hub is still downloading before
starting a second install, and wait with `unity editors --installed --watch`.

## 4. The plugin

Check `claude plugin list` for `unity@unity-agent-plugin`. If it's missing:

```sh
claude plugin marketplace add Unity-Technologies/unity-agent-plugin
claude plugin install unity@unity-agent-plugin
```

Install the skills **once**. Do not also run `unity skill install claude-code`
or `npx skills add Unity-Technologies/skills`, because each one ships the
same `unity-cli` skill and Claude gets duplicates. If `~/.claude/skills/unity-cli`
exists from one of those, offer to remove it. Third-party marketplaces do
not auto-update; tell the user
`/plugin marketplace update unity-agent-plugin`. Shell installs load in the
next session or after `/reload-plugins`.

Optional, and off by default: `unity mcp` is a separate stdio MCP server
that exposes the Editor's commands as MCP tools. The plugin does not need it.
If the user wants it, register it with the **absolute** CLI path, because
`unity mcp configure claude-code` writes a bare `unity`, which fails
whenever Claude Code's PATH lacks it:
`claude mcp add --scope user --transport stdio unity-editor-mcp -- <abs unity> mcp`.

## 5. Per project: the Pipeline bridge

Machine setup ends at step 4. For each Unity project Claude should drive:

```sh
unity pipeline install --project-path <P>    # adds com.unity.pipeline to Packages/manifest.json
unity open <P>                               # opens it with the right Editor
```

For a new project, pass both `--editor-version` and `--template`. Without a
default Editor (`unity editors default <ver>`), the CLI fails with "Could not
resolve default template". Pick a template whose status is `ready` in
`unity templates list -e <ver> -i`. Those are the ones installed with the
Editor, e.g. `com.unity.template.urp-blank` (3D URP) and
`com.unity.template.universal-2d`:

```sh
unity projects create <Name> --path <dir> --editor-version <ver> --template com.unity.template.urp-blank --no-cloud
```

Creation takes about a minute. After `unity open`, poll `unity status --format json`
until the instance shows `"state": "ready"`, which takes about a minute on a
fresh project.

If the project has compile errors, the Editor boots in Safe Mode and
Pipeline does not load. `unity pipeline list` shows this.

## Verify

1. `unity --version`, `unity auth status --format json` (`loggedIn: true`),
   `unity license status` (exit 0).
2. `claude plugin list` shows `unity@unity-agent-plugin` enabled. In a new
   session, typing `/unity:` lists the skills.
3. With a project open: `unity pipeline list` shows `Pipeline true` and
   `Server Reachable true`, and `unity status --format json` shows the
   instance with `state: "ready"` and its port (7800 for the first Editor).
4. End to end: `unity command editor_status --project-path <P>` returns
   `Success true` with `"status":"ready"`. `unity list --project-path <P>`
   lists the Editor's tools.

If Claude Code's Bash sandbox is on, it can hide a running Editor (blocked
loopback, or an unreadable `Library/Pipeline/.unity-pipeline-port`). Run
the check outside the sandbox before debugging anything else.
