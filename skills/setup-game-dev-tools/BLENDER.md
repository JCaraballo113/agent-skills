# Blender + the Blender Lab MCP

The official MCP from Blender Lab (https://www.blender.org/lab/mcp-server/)
is two parts that talk over TCP:

```
Claude Code ⇐ stdio ⇒ blender-mcp (uv, a git clone) ⇐ 127.0.0.1:9876 ⇒ "MCP" add-on inside Blender
```

Needs Blender **5.1+**. Evidence for every step is in
[RESEARCH.md](./RESEARCH.md) §1.

## 1. Blender

Resolve the executable, and install only if none is found:

| OS | Executable | Install |
|---|---|---|
| darwin | `/Applications/Blender.app/Contents/MacOS/Blender` (a `.dmg` install does not put `blender` on PATH) | `brew install --cask blender` |
| win32 | glob `C:\Program Files\Blender Foundation\Blender*\blender.exe`, pick the highest version | `winget install --id BlenderFoundation.Blender -e` |

Check the version with `"$B" --version`. If it is below 5.1, offer to upgrade it.
Below, `$B` stands for the resolved executable. On Windows, call it as
`& $B` in PowerShell.

## 2. Allow Online Access

The add-on refuses to start its socket unless Blender's **Allow Online
Access** preference is on, and it is **off by default**. Nothing reports
this except a line in the add-on's preferences panel. Turn it on without
the GUI:

```sh
"$B" -b --python-expr "import bpy; p=bpy.context.preferences; p.system.use_online_access=True; p.is_dirty=True; bpy.ops.wm.save_userpref()"
```

Check it: `"$B" -b --python-expr "import bpy; print('OA', bpy.app.online_access)"`
should print `OA True`. Do this before step 3, because installing from the
remote repository needs online access too.

## 3. The add-on (one source only)

Install from the Lab extensions repository. That gives the latest release
plus update notifications in Blender:

```sh
"$B" --command extension repo-add --name "lab.blender.org" --url https://lab.blender.org/ lab_blender_org
"$B" --command extension install -s -e lab_blender_org.mcp
```

Skip this if `"$B" --command extension list` already shows `mcp [installed]`
under the `lab.blender.org` repository. **Never install a second copy.**
Two enabled copies both try to bind port 9876. If `user_default` also
holds `mcp`, remove it: `"$B" --command extension remove user_default.mcp`.
Do not build the add-on from the repo's `main` branch. Its manifest
lags the releases, so the build is an older version.

The add-on starts its socket automatically when Blender launches (Host
`localhost`, Port `9876` in its preferences). A Blender that was already
running during the install has to be restarted.

## 4. The MCP server

Clone the server and install its dependencies. If the clone already
exists, `git -C <dir> pull --ff-only` instead:

| OS | Clone dir |
|---|---|
| darwin | `$HOME/blender_mcp` |
| win32 | `C:\blender_mcp` (the wiki's location) |

```sh
git clone https://projects.blender.org/lab/blender_mcp.git <clone dir>
uv sync --directory <clone dir>/mcp
```

The project's web pages are behind a bot check, but `git clone` and release
downloads work. Register the server at user scope. Use **absolute paths**
(Claude Code does not expand `$HOME` inside the entry). Set `BLENDER_PATH`
so the `*_for_cli` tools can start a background Blender, because `blender` is
not on PATH:

```sh
# darwin
claude mcp add --scope user -e BLENDER_PATH=/Applications/Blender.app/Contents/MacOS/Blender blender -- uv --directory /Users/<you>/blender_mcp/mcp run blender-mcp
```

```powershell
# win32
claude mcp add --scope user -e BLENDER_PATH="<resolved blender.exe>" blender -- uv --directory C:\blender_mcp\mcp run blender-mcp
```

If `claude mcp get blender` already shows an entry with different
arguments, `claude mcp remove blender -s user` and add it again.

## Verify

1. `claude mcp get blender` shows `Connected`. This only proves the server
   process starts.
2. With Blender open, the socket is listening:
   - darwin: `lsof -nP -iTCP:9876 -sTCP:LISTEN` shows `Blender … 127.0.0.1:9876`
   - win32: `Test-NetConnection 127.0.0.1 -Port 9876` shows `TcpTestSucceeded : True`
3. End to end: in a new Claude Code session, ask for a summary of the open
   scene. The `blender` tools must answer from the live file.

If the port is not listening, open Blender ▸ Preferences ▸ Add-ons ▸ MCP.
The panel shows any autostart error (usually Online Access) and has a
**Start MCP Bridge Server** button.

## Safety

Blender Lab's warning: the server executes LLM-generated Python in
Blender with no real sandbox, and Lab recommends a VM or an isolated
system. Tell the user this once, when setup finishes.
