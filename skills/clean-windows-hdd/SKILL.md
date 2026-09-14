---
name: clean-windows-hdd
description: Diagnose what fills a Windows PC's drive, attribute every large folder to the tool that wrote it, and reclaim the regenerable and leaked space with the user's go-ahead. Use when the user says "my PC is full", "C: drive is almost full", "what is taking up space", "free up space on Windows", or suspects a tool (WSL, Docker, node, Visual Studio) is filling the drive. For space inside a WSL distro, use `clean-wsl`.
---

# Clean Windows HDD

Find the space, name the **producer** of every large folder, then reclaim only what regenerates or leaked. The human decides on everything else.

Commands below are PowerShell. From Git Bash, run them as `powershell.exe -NoProfile -Command "..."`. Folders under `C:\Windows`, `C:\ProgramData` and the other users' profiles need an elevated shell; the profile folder does not.

## 1. Measure

```powershell
Get-Volume | Where-Object DriveLetter | Select-Object DriveLetter, FileSystemLabel,
  @{n='UsedGB';e={[math]::Round(($_.Size-$_.SizeRemaining)/1GB)}},
  @{n='FreeGB';e={[math]::Round($_.SizeRemaining/1GB)}}
```

Then size the profile one level down. A recursive walk of the profile runs for minutes: run it in the background with a long timeout and keep going.

```powershell
Get-ChildItem -Force -Directory $HOME | ForEach-Object {
  $sum = (Get-ChildItem $_.FullName -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
  [pscustomobject]@{ GB = [math]::Round($sum/1GB,1); Path = $_.FullName }
} | Sort-Object GB -Descending | Select-Object -First 25
```

Run the same walk over `C:\ProgramData`, `C:\Windows` (elevated), and `$env:LOCALAPPDATA` — three quarters of a developer's space hides under `AppData\Local`, and the first walk reports it as one line.

## 2. Attribute

Drill into each folder above 1 GB until it is **attributed**: the tool, app, or script that writes it is named, and the folder falls in one class:

- **Regenerable** — a cache the producer rebuilds on demand (package caches, build outputs, browser caches, emulator images, update downloads).
- **Leak** — output the producer should have removed and did not (a temp dir of a killed process, dumps of a runaway loop, a virtual disk that grew and never shrank). A leak has a producer to patch, not only a folder to delete.
- **Data** — the human's files and system state (documents, games, VM images, hibernation file, restore points). Report it, leave it.

Check [`OFFENDERS.md`](OFFENDERS.md) first: it holds the producers already met, their classes, their reclaim commands, and the fix that stops each leak. A folder the catalog lacks gets attributed by hand: recent file dates, `Get-Process` for a running producer, a search of the user's repos for the tool name.

Three things mislead here. A WSL or Docker `.vhdx` is a leak on the Windows side even when the Linux side is tidy: the file only grows, and shrinking it is its own step in `clean-wsl`. `C:\Windows\Installer` and `C:\ProgramData\Package Cache` look like caches and are not: hand-deleting them breaks every later uninstall and repair. And a producer that is still running keeps its temp folder live: `Get-Process <name>` before touching it, and stop or finish the producer first.

Done when every folder above 1 GB carries a producer and a class.

## 3. Report

Print one table: folder, size, producer, class, planned action. Lead with the total the regenerable and leak rows add up to. Then stop and wait for the user's go-ahead: `Remove-Item` bypasses the Recycle Bin.

## 4. Reclaim

On the go-ahead, in this order:

1. Delete the leaks and patch each producer so it stops leaking (the catalog names the flag or setting).
2. Run each regenerable cache's own clean command from the catalog; use `Remove-Item -Recurse -Force` only for a cache with no command.
3. Re-read `Get-Volume` and report before and after, plus every producer patched.

A new producer met on the way goes into `OFFENDERS.md` in the same pass, so the next run starts from it.
