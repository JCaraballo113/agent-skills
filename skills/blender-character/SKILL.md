---
name: blender-character
description: Build, rig and animate stylized characters in Blender through the Blender MCP — organic modelling/sculpting, skinning, locomotion, eyes, mouth and lip sync — as a deterministic script pipeline checked by mechanical gates. Use when the user asks to model, sculpt, rig, animate, lip-sync or render a character or creature in Blender, or to fix its deformation. Style rules (e.g. Pixar/feature animation) live in styles/.
---

# Blender Character

A character is a **pipeline**, not a scene you hand-edit. Blender setup (MCP
server, add-on) is `setup-game-dev-tools`.

## The contract

1. **Scripts are the source.** Every stage is a Python text block inside the
   `.blend`; one `<name>_rebuild.py` runs them in order. The mesh, rig, weights,
   shape keys and every key are outputs. → [PIPELINE.md](./PIPELINE.md)
2. **Deterministic.** Randomness only from `random.Random(seed)`; tunables in
   one `P = dict(...)` per stage; no manual edits in the viewport. The same
   file rebuilds the same character — `tools/gate.py --rebuild` prints
   `reproducible`.
3. **Measure, then look.** Numbers find what screenshots hide: run
   `tools/gate.py` after every rig/weight/pose change, and write a region audit
   for anything the user points at. → [RIGGING.md](./RIGGING.md) § Measure
4. **Research before iterating.** A sub-problem you have not solved before
   (mouths, eyes, gait, cloth, hair) gets its reference file below, or a
   `/research` run against primary sources, before the first attempt.
5. **Rest pose = working pose.** Sculpt the character in the pose it animates
   in. → [MODELING.md](./MODELING.md)

## Workflow

1. **Style and reference.** Name the style and load its file
   (`styles/PIXAR.md` for Pixar/Disney/DreamWorks feature style); if none
   exists, ask which studio/film to match and write its rules into a new
   `styles/<STYLE>.md`. Get 1–3 reference images.
2. **Look still.** Build the body, face and materials; render the hero angle
   with `tools/still.py` and critique it in writing against the style file.
   ✋ **Approval: the look.**
3. **Rest pose and rig.** Sculpt in the working pose, rig, compute weights;
   `tools/gate.py` shows rest 0, weights 0, and a stretch count within limit.
   Show a side and a front still. ✋ **Approval: proportions and pose.**
4. **Performance.** Body, face and lip sync keyed by one performance script
   ([ANIMATION.md](./ANIMATION.md), [FACE.md](./FACE.md)); gate again; check
   the exercising frames with `tools/sheet.sh`/`still.py` (open mouth,
   blink, gaze shift, mid-stride, underside).
5. **Render and deliver.** `tools/render.sh` (background Blender, voice muxed),
   open the video, say what the gate verified and what only the user's eyes
   can judge. ✋ **Approval: the film.**

Three approval gates; everything between them is mechanical and needs nobody.

## Tools (headless, deterministic)

| Tool | Does |
|---|---|
| `tools/gate.py` | rest-pose drift, unweighted verts, per-frame edge stretch by bone, reproducibility hash (`blender -b f.blend --python gate.py -- --mesh Body [--rebuild x_rebuild.py] [--hash-file g.json]`) |
| `tools/still.py` | one frame through a named camera at a % size |
| `tools/render.sh` | full animation in a background Blender + mp4, voice track offset to its start frame |
| `tools/sheet.sh` | contact sheet / crops from a video or frame folder (cheap to read back) |
| `tools/rhubarb-build.sh`, `tools/lipsync.sh` | native Rhubarb Lip Sync build; wav (+ text) → timed mouth-shape JSON |

## Reference (read the one your task touches)

| File | Covers |
|---|---|
| [PIPELINE.md](./PIPELINE.md) | Script pipeline, MCP/bpy gotchas, Blender 5.x API changes, preview & render |
| [MODELING.md](./MODELING.md) | Metaball sculpting, sockets/cavities, folds, remesh/decimate, texture pinning |
| [RIGGING.md](./RIGGING.md) | Armature, IK, computed skin weights, deform stack, measurements |
| [ANIMATION.md](./ANIMATION.md) | Per-frame keying, quadruped walk with planted feet, stops, tails, idles, camera |
| [FACE.md](./FACE.md) | Eyes (gaze, saccades, blinks, lids), mouth bag, jaw, lip shapes, lip sync |
| [styles/PIXAR.md](./styles/PIXAR.md) | Feature-animation look: shapes, skin, eyes, light, acting reads |
| [research/](./research/) | Cited primary-source reports behind FACE.md |
| [examples/gecko/](./examples/gecko/) | A complete pipeline: a quadruped gecko that walks in and speaks |

Dependencies are in [skill.deps.json](./skill.deps.json); prompt the user with
the command for anything missing, never install silently.
