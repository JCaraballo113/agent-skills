import bpy, bmesh, math, numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
exec(bpy.data.texts["lizard_helpers.py"].as_string())
P = dict(AZ_OPEN=50.0, AZ_GROOVE=78.0, SEAM_EL=-13.0, G0=0.022, VOX=0.0065, GROOVE_D=0.006, GROOVE_W=0.012)
P.update(globals().get("MOUTH", {}))
body = bpy.data.objects["Gecko_Body"]; skin = bpy.data.materials["Gecko_Skin"]
def bake():
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    nm = bpy.data.meshes.new_from_object(body.evaluated_get(dg)); old = body.data; body.data = nm
    bpy.data.meshes.remove(old); nm.name = "Gecko_Body"; body.modifiers.clear()
    for p in nm.polygons: p.use_smooth = True
bake()                                             # remesh #1 (from the body script's modifier stack)
body.data.materials.clear(); body.data.materials.append(skin)
# keep an untouched copy of the outer skin: the depth reference for shading and lip coordinates
oc = bpy.data.objects.get("Gecko_BodyOuter")
if oc: bpy.data.objects.remove(oc, do_unlink=True)
oc = bpy.data.objects.new("Gecko_BodyOuter", body.data.copy()); link(oc); oc.hide_set(True); oc.hide_render = True
dg = bpy.context.evaluated_depsgraph_get(); bvh = BVHTree.FromObject(body, dg)
C = Vector((0, -0.43, 1.03))
def surf(az, el):
    a, e = math.radians(az), math.radians(el)
    d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    loc, n, i, dist = bvh.ray_cast(C + d * 2.0, -d); return loc, n.normalized()
def lip_el(az): return P["SEAM_EL"] + 7.0 * (az / 78.0) ** 4
# ---- dense smile curve (full visual line, incl. the closed groove beyond the corners) ----
curve = []
for i in range(157):
    az = -P["AZ_GROOVE"] + i * (2 * P["AZ_GROOVE"] / 156)
    loc, n = surf(az, lip_el(az)); curve.append((az, loc, n))
def frame(i):
    az, p, n = curve[i]
    t = (curve[min(i + 1, len(curve) - 1)][1] - curve[max(i - 1, 0)][1]).normalized()
    v = n.cross(t).normalized()
    if v.z < 0: v = -v
    return az, p, n, v
# ---- mouth bag cutter: rest-open lips, a real volume inside, throat funnel ----
bm = bmesh.new(); K = 10; sections = []
open_idx = [i for i, c in enumerate(curve) if abs(c[0]) <= P["AZ_OPEN"] + 1e-6][::2]
for i in open_idx:
    az, p, n, v = frame(i)
    u = az / P["AZ_OPEN"]; ell = math.sqrt(max(0.0, 1 - u * u))
    g = P["G0"] * ell ** 0.7; D = 0.035 + 0.10 * ell; H = 0.004 + 0.038 * ell
    ts = [-0.015] + [D * k / (K - 1) for k in range(K)]
    def half(t):
        h = g / 2 + (H - g / 2) * (lambda x: x * x * (3 - 2 * x))(min(1.0, max(0.0, (t - 0.008) / max(1e-6, 0.45 * D - 0.008))))
        if t > 0.55 * D: h *= math.sqrt(max(0.0, 1 - ((t - 0.55 * D) / (0.45 * D)) ** 2))
        return max(h, 0.0008) if t < D else 0.0008
    top = [p - n * t + v * half(t) for t in ts]
    bot = [p - n * t - v * half(t) * 1.15 for t in ts]
    ring = [bm.verts.new(q) for q in top] + [bm.verts.new(q) for q in reversed(bot)]
    sections.append(ring)
for a, b in zip(sections, sections[1:]):
    M = len(a)
    for k in range(M): bm.faces.new((a[k], a[(k + 1) % M], b[(k + 1) % M], b[k]))
bm.faces.new(sections[0][::-1]); bm.faces.new(sections[-1])
# throat funnel from the back of the bag down/back into the neck
az0, p0, n0, v0 = frame(len(curve) // 2)
start = p0 - n0 * 0.10; dirv = (-n0 * 0.55 + Vector((0, 0.25, -0.8))).normalized()
side = dirv.cross(Vector((1, 0, 0))).normalized(); side2 = dirv.cross(side).normalized()
rings = []
for k in range(6):
    c = start + dirv * (0.022 * k); r = 0.026 * (1 - 0.12 * k)
    rings.append([bm.verts.new(c + (side * math.cos(a) + side2 * math.sin(a)) * r) for a in np.linspace(0, 2 * math.pi, 12, endpoint=False)])
for a, b in zip(rings, rings[1:]):
    for k in range(12): bm.faces.new((a[k], a[(k + 1) % 12], b[(k + 1) % 12], b[k]))
bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
cm = bpy.data.meshes.new("Gecko_MouthBagCutter"); bm.to_mesh(cm); bm.free()
for nm_ in ("Gecko_MouthBagCutter", "Gecko_MouthCutter", "Gecko_MouthSlot"):
    o = bpy.data.objects.get(nm_)
    if o: bpy.data.objects.remove(o, do_unlink=True)
cut = bpy.data.objects.new("Gecko_MouthBagCutter", cm); link(cut); cut.hide_set(True); cut.hide_render = True
b = body.modifiers.new("Bag", 'BOOLEAN'); b.operation = 'DIFFERENCE'; b.object = cut; b.solver = 'EXACT'; b.use_self = True
rm = body.modifiers.new("Remesh", 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = P["VOX"]
cs = body.modifiers.new("Soft", 'CORRECTIVE_SMOOTH'); cs.iterations = 6; cs.use_only_smooth = True; cs.smooth_type = 'LENGTH_WEIGHTED'
bake()                                             # remesh #2: rounds the lips, seals the thin corners
body.data.materials.clear(); body.data.materials.append(skin)
# ---- closed smile groove behind the corners: smooth normal-offset fold (no booleans) ----
me = body.data; n_ = len(me.vertices)
co = np.empty(n_ * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
nr = np.empty(n_ * 3); me.vertices.foreach_get("normal", nr); nr = nr.reshape(-1, 3)
samples = []
for az, p, n in curve:
    if abs(az) >= P["AZ_OPEN"] - 2:
        a = min(1.0, (abs(az) - (P["AZ_OPEN"] - 2)) / 6.0) * max(0.0, min(1.0, (P["AZ_GROOVE"] - abs(az)) / 12.0))
        samples.append((p, a))
kd = KDTree(len(samples))
for i, (p, a) in enumerate(samples): kd.insert(p, i)
kd.balance()
off = np.zeros(n_)
cand = np.nonzero((co[:, 2] > 0.8) & (co[:, 1] < -0.1))[0]
for i in cand:
    q, j, dist = kd.find(Vector(co[i]))
    if dist < 3 * P["GROOVE_W"]:
        off[i] = -P["GROOVE_D"] * samples[j][1] * math.exp(-(dist / P["GROOVE_W"]) ** 2)
co += nr * off[:, None]
me.vertices.foreach_set("co", co.ravel()); me.update()
# ---- store the lip frame for later stages ----
sc = bpy.context.scene
sc["gecko_lip_curve"] = [x for az, p, n in curve for x in (az, p.x, p.y, p.z, n.x, n.y, n.z)]
sc["gecko_mouth_params"] = [P["AZ_OPEN"], P["G0"]]
sc["gecko_seam_z"] = surf(0, lip_el(0))[0].z
MOUTH_INFO = dict(verts=n_, groove_verts=int((off < -1e-4).sum()))
