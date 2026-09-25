# Pipeline, MCP gotchas, preview and render

## Script pipeline

- One text block per stage (`<name>_body.py`, `_mouth.py`, `_rig.py`, `_weights.py`,
  `_shapekeys.py`, `_face.py`, `_performance.py`, …) plus `<name>_rebuild.py` that
  `exec`s them in order. Store them with `bpy.data.texts.new(...).write(src)` so
  they travel with the `.blend`; run with `exec(bpy.data.texts[n].as_string(), {})`.
- **Idempotent** stages: each deletes what it creates (by name) before creating
  it, so any stage can be re-run alone. Parameterise through
  `globals().get("PARAMS", {})` so the caller can pass overrides.
- A shared helpers block (`ellipsoid`, `curve_tube`, `skin_mesh`, `principled`,
  `set_parent`, `link`) keeps stages short — see `examples/gecko/lizard_helpers.py`.
- Stages communicate through scene custom properties (`scene["lip_curve"] = [...]`)
  and mesh attributes, not Python globals.
- Save (`bpy.ops.wm.save_mainfile()`) at the end of every successful call; the
  user often has the viewport open and may be orbiting it while you work.
- Before a rebuild deletes and recreates an armature, set
  `arm.data.pose_position = 'REST'`, unparent children keeping `matrix_world`,
  then delete — otherwise children snap to the posed transform.

## bpy / MCP gotchas that cost real time

- **`matrix_world` is stale** on objects created in the same call until
  `bpy.context.view_layer.update()`. Update before any "keep world transform"
  parenting (`mw = o.matrix_world.copy(); o.parent = p; o.matrix_world = mw`),
  or parts collapse to the origin.
- **Object names are global.** A helper that deletes-by-name before creating can
  silently delete an object you made a moment ago (two helpers generating the
  same derived name). Derive child names from the full parent name.
- **Re-run safety in node trees:** fetch sockets by node name
  (`N["PadMix"].outputs["Result"]`), never via "whatever is currently linked" —
  a previous run's removal leaves the link gone.
- The Blender MCP `execute_blender_code` result must be a dict assigned to
  `result`.
- `render_viewport_to_path` writes to a temp dir and returns that path; copy the
  file where you want it.
- Viewport screenshots are expensive context: always pass
  `size_limit_in_bytes` (150–300 KB). Prefer small renders, crops and ffmpeg
  contact sheets (below).
- Build helpers that raycast (`BVHTree.FromObject(obj, depsgraph)`) return
  object-space hits; convert with `matrix_world`.
- Exact booleans: set `solver='EXACT'`; `use_self=True` for cutters made of
  several overlapping shells; `material_mode='TRANSFER'` only survives if no
  remesh runs afterwards.

## Blender 5.x API changes

- `Action.fcurves` is gone (layered actions). Walk
  `act.layers[*].strips[*].channelbags[*].fcurves` to set interpolation or add
  modifiers; `keyframe_insert` still works for creating keys.
- Constraint influence keys: `constraint.keyframe_insert("influence", frame=f)`.
- Sound strips: `scene.sequence_editor.strips.new_sound(name, path, channel, frame_start)`.
- EEVEE engine id is `BLENDER_EEVEE`; motion blur is
  `scene.render.use_motion_blur` + `motion_blur_shutter`.

## Preview workflow

- Test renders at 35–50 % resolution through a dedicated close-up camera
  (face cam, under-jaw cam); switch `scene.camera` back after.
- Pick frames that exercise the change: widest-open mouth (search the jaw
  channel for its max), mid-blink, mid-stride, the gaze-shift frame.
- Contact sheets and crops with ffmpeg:
  `ffmpeg -i frame_%04d.png -vf "select='not(mod(n\,5))',scale=400:-1,tile=4x2" -frames:v 1 sheet.png`;
  side-by-side comparisons with `hstack`; downscale single images with `sips -Z`.
- Numbers before pictures: see RIGGING.md § Measure for the scripts.

## Full render

- Render in a separate background process so the user's Blender stays free:
  `Blender -b file.blend -a` (set `render.filepath` to `…/frame_` and PNG first,
  save, then launch) with Bash `run_in_background`.
- zsh aborts a `&&` chain on an unmatched glob: clean output folders with
  `find dir -name '*.png' -delete`, not `rm dir/*.png`.
- Mux audio offset to its start frame:
  `ffmpeg -framerate 24 -i frame_%04d.png -i voice.wav -filter_complex "[1:a]adelay=MS|MS,apad[a]" -map 0:v -map "[a]" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest out.mp4`
  with `MS = (start_frame - 1) / fps * 1000`.
- Glossy eyes + EEVEE ray tracing produce streaky noise; turn ray tracing off
  for stylized work. Turn motion blur on (shutter 0.5) once saccades and blinks
  are 2-frame fast, or they strobe.
- `open out.mp4` for the user when done.
