---
name: clean-wsl
description: Diagnose and reclaim space in a WSL 2 distro — both inside Linux and the virtual disk file it lives in on the Windows drive, which grows with every write and never shrinks by itself. Use when the user says "WSL is full", "my distro is out of space", "ext4.vhdx is huge", "Docker Desktop's disk is huge", or freed space inside WSL and the Windows drive did not get it back. For the rest of the Windows drive, use `clean-windows-hdd`.
---

# Clean WSL

A WSL 2 distro is a Linux file system inside one file on the Windows drive: `ext4.vhdx`. The file grows every time Linux writes a block and keeps that block after Linux deletes the file. Space therefore has **two layers**, and both get cleaned in order: first inside the distro, then the disk file on the host. Reclaiming inside and skipping the host step frees nothing the Windows drive can see.

Commands under "inside" run in the distro's shell; commands under "host" run in PowerShell. From inside WSL, a host command runs as `powershell.exe -NoProfile -Command "..."`, except the shutdown and compaction: those stop the shell they run from, so they go in a Windows terminal.

## 1. Measure both layers

**Host.** Locate every distro's disk and size it. The registry holds the paths:

```powershell
Get-ChildItem HKCU:\Software\Microsoft\Windows\CurrentVersion\Lxss | ForEach-Object {
  $p = Get-ItemProperty $_.PSPath
  $disk = Join-Path $p.BasePath 'ext4.vhdx'
  [pscustomobject]@{ Distro = $p.DistributionName; GB = [math]::Round((Get-Item $disk).Length/1GB,1); Path = $disk }
}
```

Docker Desktop's own disk is not in that list: `$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx` (older installs: `...\Docker\wsl\data\ext4.vhdx`).

**Inside.** `df -h /` reports the disk's *maximum* (1 TB by default), which is why the distro looks empty while the host drive is full. The figure that matters is the host one above. Size the folders instead, staying on one file system so the walk skips the Windows drive mounted at `/mnt/c`:

```bash
sudo du -shx /* 2>/dev/null | sort -rh | head
du -shx ~/* ~/.[!.]* 2>/dev/null | sort -rh | head -25
```

## 2. Attribute

Drill into each folder above 1 GB until it is **attributed**: the tool, app, or script that writes it is named, and the folder falls in one class:

- **Regenerable** — a cache the producer rebuilds on demand (apt, package caches, build outputs).
- **Leak** — output the producer should have removed and did not (a temp dir of a killed process, dumps of a runaway loop, journal logs with no cap). A leak has a producer to patch, not only a folder to delete.
- **Data** — the human's files and state (repos, databases, model weights). Report it, leave it.

Check [`OFFENDERS.md`](OFFENDERS.md) first: it holds the producers already met, their classes, their reclaim commands, and the fix that stops each leak. A folder the catalog lacks gets attributed by hand: recent file dates, `pgrep -fl <tool>` for a running producer, a grep of the user's repos for the tool name.

Done when every folder above 1 GB carries a producer and a class, and the gap between the disk file's host size and the distro's used size is known: that gap is what compaction returns without deleting anything.

## 3. Report

Print one table: folder, size, producer, class, planned action. Lead with two totals: what the regenerable and leak rows add up to, and what compaction returns. Then stop and wait for the user's go-ahead. Compaction shuts down every distro and Docker Desktop, so the user picks the moment.

## 4. Reclaim

On the go-ahead, in this order:

1. Inside: delete the leaks and patch each producer; run each regenerable cache's own clean command from the catalog.
2. Inside: `sudo fstrim -a` hands the freed blocks back, so compaction has less to do.
3. Host, in a Windows terminal: `wsl --shutdown`, then compact the disk. Pick the first method that applies:
   - WSL 2.0 or newer (`wsl --version`): `wsl --manage <distro> --set-sparse true` — a one-time switch; the file shrinks now and keeps returning space by itself.
   - Windows Pro or Enterprise: `Optimize-VHD -Path <disk> -Mode Full` (elevated; the Hyper-V PowerShell module).
   - Windows Home: elevated `diskpart`, then `select vdisk file="<disk>"`, `attach vdisk readonly`, `compact vdisk`, `detach vdisk`.
   Docker Desktop's disk compacts the same way; Docker Desktop → Troubleshoot → Clean / Purge data is the blunt alternative.
4. Re-run the host measurement and report the disk file before and after, plus every producer patched.

A new producer met on the way goes into `OFFENDERS.md` in the same pass, so the next run starts from it.
