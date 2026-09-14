# Known offenders

Producers met on real machines. Paths use PowerShell environment variables; `$env:LOCALAPPDATA` is `C:\Users\<you>\AppData\Local`.

| Path | Producer | Class | Reclaim | Stop the leak |
|---|---|---|---|---|
| `$env:LOCALAPPDATA\Packages\<distro>\LocalState\ext4.vhdx` | WSL 2 distro disk. Dynamically expanding: grows with every write inside Linux and never shrinks when files are deleted there. Tens of GB is normal; 100 GB+ after a year of node_modules and Docker is common. | Leak | Follow `clean-wsl`: clean inside the distro, then compact the disk from Windows. | `wsl --manage <distro> --set-sparse true` (WSL 2.0+) makes the disk return space on its own. |
| `$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx` (older: `...\Docker\wsl\data\ext4.vhdx`) | Docker Desktop's WSL backend disk. Same growth rule as a distro disk. | Leak | `docker system prune -a --volumes` for what Docker itself no longer needs, then compact the disk the same way as a WSL distro (see `clean-wsl`). Docker Desktop → Troubleshoot → Clean / Purge data drops it entirely. | Set a disk-size limit in Docker Desktop → Settings → Resources. |
| `C:\hiberfil.sys` | Hibernation and Fast Startup. Sized at 40–100% of RAM. | Data | `powercfg /h off` (elevated) deletes it and disables hibernation; `powercfg /h /type reduced` halves it and keeps Fast Startup. | — |
| `C:\pagefile.sys` | Virtual memory. | Data | Leave it; a smaller page file trades disk for crashes under memory pressure. | — |
| `C:\System Volume Information` | System Restore shadow copies. | Data | `vssadmin list shadows` to see; `vssadmin delete shadows /for=C: /oldest` (elevated) drops one at a time; System Properties → System Protection caps the reservation. | Cap the reservation at a few percent. |
| `C:\Windows.old`, `C:\$Windows.~BT` | A previous Windows version kept for rollback after an upgrade. Observed 20–40 GB. | Regenerable | `cleanmgr` (elevated) → "Previous Windows installations"; Windows deletes it by itself after 10 days. | — |
| `C:\Windows\SoftwareDistribution\Download` | Windows Update downloads. | Regenerable | `Stop-Service wuauserv; Remove-Item C:\Windows\SoftwareDistribution\Download\* -Recurse -Force; Start-Service wuauserv` (elevated). | — |
| `C:\Windows\WinSxS` | Component store: every version of every system file. Reports 10–20 GB but most is hard links; `Dism /Online /Cleanup-Image /AnalyzeComponentStore` gives the real figure. | Regenerable (superseded parts only) | `Dism /Online /Cleanup-Image /StartComponentCleanup /ResetBase` (elevated). Never delete files inside it by hand. | — |
| `C:\Windows\Installer` | MSI cache used by every uninstall and repair. | Data | Leave it. Orphaned entries only via a dedicated tool (PatchCleaner). | — |
| `C:\ProgramData\Package Cache` | Visual Studio and .NET installer payloads, used for repair and modify. | Data | Visual Studio Installer → More → "Disk cleanup" removes what is safe. | — |
| `$env:TEMP`, `C:\Windows\Temp` | Everything. Installers and crashed tools leave folders behind. Observed 5–20 GB. | Leak | `Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue`; same for `C:\Windows\Temp` elevated. Files in use are skipped and that is fine. | Storage Sense (Settings → System → Storage) empties Temp on a schedule. |
| `C:\$Recycle.Bin` | The Recycle Bin. | Regenerable | `Clear-RecycleBin -Force` | — |
| `$env:USERPROFILE\.foundry\anvil\tmp\anvil-state-*` | Foundry `anvil`. Once in-memory history fills it writes one state file per mined block; removes the dir on a clean exit only, so a killed process leaves it. Observed 120 GB on a Mac. | Leak | `Get-Process anvil` first; then `Remove-Item "$env:USERPROFILE\.foundry\anvil\tmp" -Recurse -Force` | Add `--prune-history` to the anvil launch line. |
| `$env:LOCALAPPDATA\npm-cache` | npm. | Regenerable | `npm cache clean --force` | — |
| `$env:LOCALAPPDATA\Yarn\Cache` | Yarn classic. | Regenerable | `yarn cache clean` from a folder outside any repo with a `packageManager` field, or Corepack refuses and the command does nothing. | — |
| `$env:LOCALAPPDATA\pnpm\store`, `$env:LOCALAPPDATA\pnpm-cache` | pnpm store and metadata cache. | Regenerable | `pnpm store prune` | — |
| `<repos>\*\node_modules`, `.next`, `.turbo`, `node_modules\.cache`, `dist` | Every checked-out JS repo. Often 20 GB+ across a dev's repos. | Regenerable | `Get-ChildItem <repos> -Directory -Recurse -Depth 2 -Filter node_modules` to list; delete those of repos untouched for months, `pnpm install` rebuilds. | — |
| `$env:USERPROFILE\.nuget\packages` | NuGet global packages. | Regenerable | `dotnet nuget locals all --clear` | — |
| `$env:LOCALAPPDATA\pip\cache` | pip. | Regenerable | `pip cache purge` | — |
| `$env:USERPROFILE\.cargo\registry`, `$env:USERPROFILE\go\pkg\mod`, `$env:LOCALAPPDATA\go-build` | Cargo, Go modules, Go build cache. | Regenerable | `cargo cache -a` or delete `registry\cache`; `go clean -modcache`; `go clean -cache` | — |
| `$env:USERPROFILE\.gradle\caches`, `$env:USERPROFILE\.m2\repository` | Gradle and Maven. | Regenerable | Delete the folders with no build running; the next build re-downloads. | — |
| `$env:LOCALAPPDATA\Android\Sdk\system-images`, `$env:USERPROFILE\.android\avd` | Android emulator system images and virtual devices. 5–10 GB each. | Regenerable | `sdkmanager --list_installed`, then `sdkmanager --uninstall "system-images;..."`; `avdmanager delete avd -n <name>` | — |
| `$env:USERPROFILE\.ollama\models` | Ollama model weights. | Data | `ollama list` then `ollama rm <model>` for models no longer used. | — |
| `$env:LOCALAPPDATA\AnthropicClaude` | Claude desktop app. The Squirrel installer keeps every `app-<version>` folder it ever installed. | Regenerable (old versions) | Delete every `app-*` folder except the newest, with the app closed. | — |
| `$env:USERPROFILE\.claude` | Claude Code: plugin cache, session transcripts, file history. Observed ~1 GB. | Data | Small by design. | — |
| `$env:LOCALAPPDATA\Google\Chrome\User Data\*\Cache`, same for Edge (`Microsoft\Edge`) and Brave | Browser caches. 1–5 GB each. | Regenerable | Clear browsing data inside the browser, or delete the `Cache` and `Code Cache` folders with the browser closed. | — |
| `$env:APPDATA\Slack`, `$env:APPDATA\discord`, `$env:LOCALAPPDATA\Microsoft\Teams` | Chat app caches. | Regenerable | Delete the `Cache` subfolders with the app closed. | — |
| `$env:USERPROFILE\OneDrive` | OneDrive with files kept local. | Data | Right-click a folder → "Free up space" turns it online-only. | Settings → Sync and backup → Files On-Demand. |
| `C:\Program Files (x86)\Steam\steamapps`, Epic, Xbox | Games. | Data | Uninstall from the launcher. | — |
| `$env:USERPROFILE\scoop\cache`, `C:\ProgramData\chocolatey\lib` | Package managers' downloads and old versions. | Regenerable | `scoop cache rm *; scoop cleanup *`; Chocolatey keeps `.nupkg` per package — delete old versions. | — |
