import bpy, math, numpy as np
from mathutils import Vector
exec(bpy.data.texts["lizard_helpers.py"].as_string())
body = bpy.data.objects["Gecko_Body"]
old = bpy.data.objects.get("Gecko_Rig")
if old: bpy.data.objects.remove(old, do_unlink=True)
arm_d = bpy.data.armatures.new("Gecko_Rig"); arm = bpy.data.objects.new("Gecko_Rig", arm_d); link(arm)
arm_d.display_type = 'STICK'; arm.show_in_front = True
bpy.context.view_layer.objects.active = arm
for o in bpy.context.selected_objects: o.select_set(False)
arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
EB = arm_d.edit_bones
def bone(name, h, t, parent=None, deform=True, connect=False):
    b = EB.new(name); b.head = h; b.tail = t; b.use_deform = deform
    if parent: b.parent = EB[parent]; b.use_connect = connect
    return b
bone("root", (0, 0, 0), (0, -0.25, 0), deform=False)
bone("hips", (0, 0.52, 0.46), (0, 0.12, 0.50), "root")
bone("spine", (0, 0.12, 0.50), (0, -0.12, 0.56), "hips", connect=True)
bone("chest", (0, -0.12, 0.56), (0, -0.20, 0.72), "spine", connect=True)
bone("neck", (0, -0.20, 0.72), (0, -0.25, 0.95), "chest", connect=True)
bone("head", (0, -0.25, 0.95), (0, -0.33, 1.25), "neck", connect=True)
jb = bone("jaw", (0, -0.42, 1.00), (0, -0.78, 0.93), "head"); jb.align_roll(Vector((0, 0, -1)))
ctrl = [Vector(p) for p in [(0, 0.54, 0.46), (0, 0.64, 0.43), (0.01, 0.87, 0.30), (0.04, 1.08, 0.17), (0.10, 1.28, 0.09), (0.19, 1.46, 0.06), (0.31, 1.60, 0.05), (0.44, 1.68, 0.04)]]
def cr(p0, p1, p2, p3, t):
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
dense = []
cc = [ctrl[0]] + ctrl + [ctrl[-1]]
for i in range(1, len(cc) - 2):
    for k in range(20): dense.append(cr(cc[i - 1], cc[i], cc[i + 1], cc[i + 2], k / 20))
dense.append(ctrl[-1])
L = [0.0]
for a, b in zip(dense, dense[1:]): L.append(L[-1] + (b - a).length)
NT = 12; pts = []
for j in range(NT + 1):
    target = L[-1] * j / NT
    k = next(i for i in range(len(L) - 1) if L[i + 1] >= target) if j < NT else len(L) - 2
    f = (target - L[k]) / max(1e-9, L[k + 1] - L[k]); pts.append(dense[k].lerp(dense[k + 1], min(1.0, f)))
prev = "hips"
for i, (a, b) in enumerate(zip(pts, pts[1:])):
    bone(f"tail{i+1}", tuple(a), tuple(b), prev, connect=(i > 0)); prev = f"tail{i+1}"
for s, S in ((1, "L"), (-1, "R")):
    sh = (0.17 * s, -0.15, 0.48); el = (0.31 * s, -0.10, 0.28); wr = (0.30 * s, -0.22, 0.075); hand_t = (0.32 * s, -0.37, 0.03)
    bone(f"upperarm.{S}", sh, el, "chest"); bone(f"forearm.{S}", el, wr, f"upperarm.{S}", connect=True)
    bone(f"hand_ik.{S}", wr, (wr[0], wr[1] - 0.12, wr[2]), "root", deform=False)
    bone(f"hand.{S}", wr, hand_t, f"hand_ik.{S}")
    bone(f"elbow_pole.{S}", (0.75 * s, 0.05, 0.30), (0.75 * s, 0.05, 0.38), "root", deform=False)
    hp = (0.18 * s, 0.46, 0.44); kn = (0.37 * s, 0.42, 0.30); an = (0.40 * s, 0.44, 0.07); foot_t = (0.46 * s, 0.24, 0.03)
    bone(f"thigh.{S}", hp, kn, "hips"); bone(f"shin.{S}", kn, an, f"thigh.{S}", connect=True)
    bone(f"foot_ik.{S}", an, (an[0], an[1] - 0.12, an[2]), "root", deform=False)
    bone(f"foot.{S}", an, foot_t, f"foot_ik.{S}")
    bone(f"knee_pole.{S}", (0.75 * s, 0.30, 0.70), (0.75 * s, 0.30, 0.78), "root", deform=False)
segs = {b.name: (np.array(b.head), np.array(b.tail)) for b in EB if b.use_deform}
bpy.ops.object.mode_set(mode='POSE')
PB = arm.pose.bones
for S in ("L", "R"):
    for lim, tgt, pole, ang in (("forearm", "hand_ik", "elbow_pole", 0), ("shin", "foot_ik", "knee_pole", 0)):
        c = PB[f"{lim}.{S}"].constraints.new('IK'); c.target = arm; c.subtarget = f"{tgt}.{S}"; c.chain_count = 2
        pass
bpy.ops.object.mode_set(mode='OBJECT')

# ---- skin weights: soft nearest-segment falloff, computed from the anatomy ----
me = body.data; n = len(me.vertices)
co = np.empty(n * 3, dtype=np.float64); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
names = list(segs); D = np.empty((n, len(names)))
for j, nm in enumerate(names):
    a, b = segs[nm]; ab = b - a; t = np.clip(((co - a) @ ab) / (ab @ ab), 0, 1)
    D[:, j] = np.linalg.norm(co - (a + t[:, None] * ab), axis=1)
# keep limbs from grabbing the torso: limb bones only win near their own side / height
side = np.sign(co[:, 0])
for j, nm in enumerate(names):
    if nm.endswith(".L"): D[side < 0, j] += 1.0
    if nm.endswith(".R"): D[side > 0, j] += 1.0
tau = 0.018
W = np.exp(-(D - D.min(axis=1, keepdims=True)) / tau)
W[W < 0.02] = 0; W /= W.sum(axis=1, keepdims=True)
for vg in list(body.vertex_groups): body.vertex_groups.remove(vg)
for j, nm in enumerate(names):
    vg = body.vertex_groups.new(name=nm)
    w = W[:, j]; q = np.round(w * 40) / 40
    for val in np.unique(q[q > 0]):
        vg.add(np.nonzero(q == val)[0].tolist(), float(val), 'REPLACE')
for m_ in [m_ for m_ in body.modifiers if m_.type == 'ARMATURE']: body.modifiers.remove(m_)
am = body.modifiers.new("Armature", 'ARMATURE'); am.object = arm
body.parent = arm
# eyes, lids, highlights, brows ride on the head bone
bpy.context.view_layer.update()
for o in bpy.data.collections["WiseLizard"].objects:
    if o.name.startswith(("Gecko_Eye", "Gecko_Lid", "Gecko_HL", "Gecko_Brow")):
        mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = "head"; o.matrix_world = mw
RIG = {"bones": len(arm_d.bones), "groups": len(names)}
