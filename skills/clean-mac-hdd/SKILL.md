---
name: clean-mac-hdd
description: Diagnose what fills a Mac's disk, attribute every large folder to the tool that wrote it, and reclaim the regenerable and leaked space with the user's go-ahead. Use when the user says "my Mac is full", "disk is almost full", "what is taking up space", "free up space", or suspects a tool (Claude, Docker, node) is filling the drive.
---

# Clean Mac HDD

Find the space, name the **producer** of every large folder, then reclaim only what regenerates or leaked. The human decides on everything else.

## 1. Measure

Read the Data volume, never `/` — on macOS `/` is the sealed system snapshot and reports a few GB used:

```bash
df -h /System/Volumes/Data
```

Then size the home folder one level down. A full `du` over home runs for minutes: run it in the background with a long timeout and keep going.

```bash
du -sh ~/* ~/.[!.]* 2>/dev/null | sort -rh | head -25
```

## 2. Attribute

Drill into each folder above 1 GB until it is **attributed**: the tool, app, or script that writes it is named, and the folder falls in one class:

- **Regenerable** — a cache the producer rebuilds on demand (package caches, build caches, browser caches, simulator runtimes).
- **Leak** — output the producer should have removed and did not (a temp dir of a killed process, dumps of a runaway loop). A leak has a producer to patch, not only a folder to delete.
- **Data** — the human's files and app state (messages, media, VM images, models). Report it, leave it.

Check [`OFFENDERS.md`](OFFENDERS.md) first: it holds the producers already met, their classes, their reclaim commands, and the fix that stops each leak. A folder the catalog lacks gets attributed by hand: recent file dates, `pgrep` for a running producer, a grep of the user's repos for the tool name.

Two tools mislead here. `du` reports the allocated size of a sparse file (a Docker disk image, a VM bundle); `ls -lh` reports the reserved size, and only the allocated one is on disk. And a leak with a live producer is still growing: `pgrep -fl <tool>` before touching it, and stop or finish the producer first.

Done when every folder above 1 GB carries a producer and a class.

## 3. Report

Print one table: folder, size, producer, class, planned action. Lead with the total the regenerable and leak rows add up to. Then stop and wait for the user's go-ahead: deletion is irreversible and `rm` bypasses the Trash.

## 4. Reclaim

On the go-ahead, in this order:

1. Delete the leaks and patch each producer so it stops leaking (the catalog names the flag or setting).
2. Run each regenerable cache's own clean command from the catalog; use `rm -rf` only for a cache with no command.
3. Re-read `df -h /System/Volumes/Data` and report before and after, plus every producer patched.

A new producer met on the way goes into `OFFENDERS.md` in the same pass, so the next run starts from it.
