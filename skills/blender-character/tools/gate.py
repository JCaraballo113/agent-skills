"""Mechanical deformation gate for a rigged character. Headless, deterministic.

blender -b file.blend --python gate.py -- --mesh Body [--frames 1:382:6] [--rebuild my_rebuild.py]
                                          [--hash-file gate.json] [--max-bad 400]

Checks (exit code 1 if any FAIL):
  rest      armature at REST changes nothing (max vertex displacement == 0)
  weights   every vertex has deform weight (unweighted verts freeze and spike)
  stretch   per sampled frame: edges stretched > 1.8x or squashed < 0.45x, grouped by owning bone
  repro     hash of evaluated vertex positions at the sampled frames; with --hash-file, prints
            `reproducible` when it matches the previous run (use with --rebuild to prove the
            pipeline rebuilds the same character)
"""
import bpy, sys, json, hashlib, argparse, os
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--mesh", required=True)
ap.add_argument("--frames", default=None, help="start:end:step (default: scene range, 24 samples)")
ap.add_argument("--rebuild", default=None, help="text block to exec first (the pipeline)")
ap.add_argument("--hash-file", default=None)
ap.add_argument("--max-bad", type=int, default=400, help="max bad edges allowed on any sampled frame")
a = ap.parse_args(argv)

if a.rebuild:
    exec(bpy.data.texts[a.rebuild].as_string(), {})
sc = bpy.context.scene
ob = bpy.data.objects[a.mesh]; me = ob.data
arm_mod = next((m for m in ob.modifiers if m.type == 'ARMATURE'), None)
rig = arm_mod.object if arm_mod else None
subs = [m for m in ob.modifiers if m.type in ('SUBSURF', 'MULTIRES')]
for m in subs: m.show_viewport = False          # keep topology 1:1 with the base mesh

def evaluated():
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    e = ob.evaluated_get(dg).to_mesh(); c = np.empty(len(e.vertices) * 3); e.vertices.foreach_get("co", c)
    ob.evaluated_get(dg).to_mesh_clear(); return c.reshape(-1, 3)

results = []; ok = True
# rest
if rig:
    pp = rig.data.pose_position
    rig.data.pose_position = 'REST'; with_arm = evaluated()
    arm_mod.show_viewport = False; no_arm = evaluated(); arm_mod.show_viewport = True
    rig.data.pose_position = pp
    d = float(np.linalg.norm(with_arm - no_arm, axis=1).max())
    passed = d < 1e-4; ok &= passed
    results.append(("rest", "PASS" if passed else "FAIL", f"max displacement at REST {d:.6f} m"))
# weights
deform = {b.name for b in rig.data.bones if b.use_deform} if rig else set()
names = [vg.name for vg in ob.vertex_groups]
owner = np.full(len(me.vertices), -1)
unweighted = 0
for v in me.vertices:
    gs = [g for g in v.groups if names[g.group] in deform and g.weight > 0]
    if not gs: unweighted += 1
    else: owner[v.index] = max(gs, key=lambda g: g.weight).group
if rig:
    passed = unweighted == 0; ok &= passed
    results.append(("weights", "PASS" if passed else "FAIL", f"{unweighted} vertices without deform weight"))
# stretch
if a.frames: f0, f1, st = (int(x) for x in a.frames.split(":"))
else: f0, f1 = sc.frame_start, sc.frame_end; st = max(1, (f1 - f0) // 24)
ed = np.empty(len(me.edges) * 2, dtype=np.int64); me.edges.foreach_get("vertices", ed); ed = ed.reshape(-1, 2)
sc.frame_set(f0); base = evaluated() if not rig else None
restco = np.empty(len(me.vertices) * 3); me.vertices.foreach_get("co", restco); restco = restco.reshape(-1, 3)
L0 = np.maximum(np.linalg.norm(restco[ed[:, 0]] - restco[ed[:, 1]], axis=1), 1e-9)
worst = 0; by_bone = {}; hashes = hashlib.sha256()
for f in range(f0, f1 + 1, st):
    sc.frame_set(f); cur = evaluated()
    r = np.linalg.norm(cur[ed[:, 0]] - cur[ed[:, 1]], axis=1) / L0
    bad = np.nonzero((r > 1.8) | (r < 0.45))[0]; worst = max(worst, len(bad))
    for e_ in bad:
        o = owner[ed[e_, 0]]; k = names[o] if o >= 0 else "?"; by_bone[k] = by_bone.get(k, 0) + 1
    hashes.update(np.round(cur, 5).tobytes())
passed = worst <= a.max_bad; ok &= passed
top = ", ".join(f"{k}:{v}" for k, v in sorted(by_bone.items(), key=lambda kv: -kv[1])[:5])
results.append(("stretch", "PASS" if passed else "FAIL", f"worst frame {worst} bad edges (limit {a.max_bad}); by bone: {top or 'none'}"))
# reproducibility
h = hashes.hexdigest()[:16]; note = f"hash {h}"
if a.hash_file:
    prev = json.load(open(a.hash_file)).get("hash") if os.path.exists(a.hash_file) else None
    note += "  reproducible" if prev == h else ("  NEW (no previous hash)" if prev is None else f"  CHANGED (was {prev})")
    json.dump({"hash": h, "frames": [f0, f1, st]}, open(a.hash_file, "w"))
results.append(("repro", "INFO", note))
for m in subs: m.show_viewport = True
print("\n=== gate:", a.mesh, "===")
for name, status, msg in results: print(f"{status:5} {name:8} {msg}")
print("=== RESULT:", "PASS" if ok else "FAIL", "===")
sys.exit(0 if ok else 1)
