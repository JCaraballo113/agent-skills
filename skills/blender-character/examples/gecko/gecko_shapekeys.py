import bpy, math, numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree
body = bpy.data.objects["Gecko_Body"]; me = body.data; sc = bpy.context.scene
AZ_OPEN, G0 = sc["gecko_mouth_params"]
n_ = len(me.vertices)
def attr(nm_):
    out = np.empty(n_, np.float32); me.attributes[nm_].data.foreach_get("value", out); return out.astype(np.float64)
LU, LS, LD = attr("lip_u"), attr("lip_s"), attr("lip_d")
LC = np.array(sc["gecko_lip_curve"]).reshape(-1, 7); pts = LC[:, 1:4]; nrm = LC[:, 4:7]
tan = np.gradient(pts, axis=0); tan /= np.linalg.norm(tan, axis=1, keepdims=True)
vup = np.cross(nrm, tan); vup /= np.linalg.norm(vup, axis=1, keepdims=True); vup[vup[:, 2] < 0] *= -1
kd = KDTree(len(pts))
for i, p in enumerate(pts): kd.insert(Vector(p), i)
kd.balance()
co = np.empty(n_ * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
V = np.zeros((n_, 3))
for i in np.nonzero(LU < 8.9)[0]: V[i] = vup[kd.find(Vector(co[i]))[1]]
def sstep(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)
ell = np.sqrt(np.clip(1 - LU * LU, 0, 1)); g = G0 * ell ** 0.7
f_u = 1 - sstep(0.95, 1.08, np.abs(LU))
f_s = 1 - sstep(g / 2 + 0.004, g / 2 + 0.035, np.abs(LS))
f_d = np.exp(-(np.clip(LD - 0.004, 0, None) / 0.015) ** 2)
delta_s = -np.sign(LS) * np.minimum(np.abs(LS), np.maximum(g / 2 - 0.0009, 0)) * f_u * f_s * f_d   # leave a hairline crease
if me.shape_keys:
    body.shape_key_clear()
body.shape_key_add(name="Basis", from_mix=False)
k = body.shape_key_add(name="lips_closed", from_mix=False)
k.points.foreach_set("co", (co + V * delta_s[:, None]).ravel()); k.value = 1.0
# ---- viseme lip shapes, analytic in lip space (u along the mouth, s across the lips, d depth) ----
TN = np.zeros((n_, 3)); NN = np.zeros((n_, 3))
for i in np.nonzero(LU < 8.9)[0]:
    j = kd.find(Vector(co[i]))[1]; TN[i] = tan[j]; NN[i] = nrm[j]
m_lip = (1 - sstep(1.0, 1.25, np.abs(LU))) * np.exp(-(LS / 0.04) ** 2) * np.exp(-(np.clip(LD - 0.004, 0, None) / 0.02) ** 2)
sg = np.sign(LU); au = np.clip(np.abs(LU), 0, 1.25)
def add_key(name, dvec):
    kk = body.shape_key_add(name=name, from_mix=False); kk.points.foreach_set("co", (co + dvec).ravel()); kk.value = 0.0
lower = (LS < 0).astype(float)
add_key("lips_press", (-NN * 0.004 - V * np.sign(LS)[:, None] * 0.003) * m_lip[:, None])
add_key("lips_wide", (TN * (sg * 0.022 * au ** 1.5)[:, None] - NN * 0.004) * m_lip[:, None])
add_key("lips_round", (-TN * (sg * 0.02 * au ** 1.2)[:, None] + NN * (0.010 * np.clip(1 - au ** 2, 0, 1))[:, None]) * m_lip[:, None])
add_key("lips_pucker", (-TN * (sg * 0.034 * au)[:, None] + NN * (0.022 * np.clip(1 - au ** 2, 0, 1))[:, None]) * m_lip[:, None])
add_key("lowerlip_tuck", ((V * 0.012 - NN * 0.012) * (lower * m_lip)[:, None]))
# corrective smooth must not undo the lip shapes: mask it off the lips
mask = 1 - np.clip(1.3 * np.exp(-(LS / 0.03) ** 2) * (np.abs(LU) < 1.2) * (LD < 0.05), 0, 1)
vg = body.vertex_groups.get("cs_mask") or body.vertex_groups.new(name="cs_mask")
q = np.round(mask * 20) / 20
for val in np.unique(q[q > 0]): vg.add(np.nonzero(q == val)[0].tolist(), float(val), 'REPLACE')
cs = body.modifiers.get("DeformSmooth")
if cs: cs.vertex_group = "cs_mask"
ss = body.modifiers.get("Subsurf") or body.modifiers.new("Subsurf", 'SUBSURF'); ss.levels = 0; ss.render_levels = 1
SK = dict(moved=int((np.abs(delta_s) > 1e-4).sum()), max_move=round(float(np.abs(delta_s).max()), 4))
