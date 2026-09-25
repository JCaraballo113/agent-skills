import bpy, math, numpy as np
from mathutils import Euler, Vector
body = bpy.data.objects["Gecko_Body"]; arm = bpy.data.objects["Gecko_Rig"]
me = body.data; n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
segs = {b.name: (np.array(b.head_local), np.array(b.tail_local)) for b in arm.data.bones if b.use_deform and b.name != "jaw"}
names = list(segs); D = np.empty((n, len(names)))
for j, nm in enumerate(names):
    a, b = segs[nm]; ab = b - a; t = np.clip(((co - a) @ ab) / (ab @ ab), 0, 1)
    D[:, j] = np.linalg.norm(co - (a + t[:, None] * ab), axis=1)
# torso membership: normalized distance to the torso/neck ellipsoids (1 = on that surface)
torso = [((0, 0.44, 0.46), (0.22, 0.25, 0.19), 0), ((0, 0.12, 0.47), (0.25, 0.38, 0.22), -4), ((0, -0.15, 0.57), (0.21, 0.21, 0.22), -20),
         ((0, -0.20, 0.76), (0.19, 0.19, 0.16), 0)]
e = np.full(n, 9.0)
for c, ax, rx in torso:
    R = np.array(Euler((math.radians(rx), 0, 0)).to_matrix())
    local = (co - np.array(c)) @ R          # rotate into the ellipsoid frame
    e = np.minimum(e, np.linalg.norm(local / np.array(ax), axis=1))
limb = [j for j, nm in enumerate(names) if nm.split(".")[0] in ("upperarm", "forearm", "hand", "thigh", "shin", "foot")]
x = co[:, 0]
for j in limb:
    s = 1.0 if names[j].endswith(".L") else -1.0
    side_pen = np.clip((0.03 - x * s) / 0.06, 0, 1) * 1.0            # smooth across the midline
    torso_pen = np.clip((1.2 - e) / 0.2, 0, 1) * 0.2                  # torso skin belongs to the spine
    D[:, j] += side_pen + torso_pen
tau = float(globals().get('TAU', 0.03))
W = np.exp(-(D - D.min(axis=1, keepdims=True)) / tau); W[W < 0.02] = 0; W /= W.sum(axis=1, keepdims=True)
nonlimb = [j for j in range(len(names)) if j not in limb]
best_torso = np.array(nonlimb)[np.argmin(D[:, nonlimb], axis=1)]
rows = np.arange(n)
def side_mask(W):
    for j in limb:
        sgn = 1.0 if names[j].endswith(".L") else -1.0
        keep = np.clip((x * sgn - 0.03) / 0.05, 0, 1)
        moved = W[:, j] * (1 - keep); W[:, j] -= moved
        np.add.at(W, (rows, best_torso), moved)          # hand stripped weight to the nearest torso bone (no renormalizing)
    return W
W = side_mask(W)
ed = np.empty(len(me.edges) * 2, dtype=np.int64); me.edges.foreach_get("vertices", ed); ed = ed.reshape(-1, 2)
deg = np.bincount(ed.ravel(), minlength=n).astype(float)[:, None]
for _ in range(int(globals().get("SMOOTH_IT", 10))):
    acc = np.zeros_like(W); np.add.at(acc, ed[:, 0], W[ed[:, 1]]); np.add.at(acc, ed[:, 1], W[ed[:, 0]])
    W = 0.5 * W + 0.5 * acc / np.maximum(deg, 1)
W = side_mask(W)
W[W < 0.005] = 0
orphan = W.sum(axis=1) < 1e-6
W[np.nonzero(orphan)[0], best_torso[orphan]] = 1.0
ORPHANS = int(orphan.sum())
W /= W.sum(axis=1, keepdims=True)
# hands/feet: each ground-level island of mesh belongs wholly to its own hand/foot bone
low = co[:, 2] < 0.085
parent = np.arange(n)
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
for a, b in ed:
    if low[a] and low[b]:
        ra, rb = find(a), find(b)
        if ra != rb: parent[ra] = rb
roots = np.array([find(i) for i in range(n)])
centers = {"hand.L": (0.31, -0.27, 0.03), "hand.R": (-0.31, -0.27, 0.03), "foot.L": (0.42, 0.37, 0.03), "foot.R": (-0.42, 0.37, 0.03)}
FOOT_ISLANDS = {}
for r in np.unique(roots[low]):
    idx = np.nonzero((roots == r) & low)[0]
    if len(idx) < 50: continue
    cen = co[idx].mean(axis=0)
    bn = min(centers, key=lambda k: np.linalg.norm(cen - np.array(centers[k])))
    if np.linalg.norm(cen - np.array(centers[bn])) > 0.2: continue      # not a foot (e.g. tail on the ground)
    j = names.index(bn)
    hard = idx[co[idx, 2] < 0.06]
    W[hard] = 0; W[hard, j] = 1.0
    FOOT_ISLANDS[bn] = len(idx)

# ---- jaw: Rigify-style lip ellipse, smooth falloffs, long throat fade ----
def attr(nm_):
    a = me.attributes[nm_]; out = np.empty(n, np.float32); a.data.foreach_get("value", out); return out.astype(np.float64)
LU, LS = attr("lip_u"), attr("lip_s")
def sstep(e0, e1, xx): t_ = np.clip((xx - e0) / (e1 - e0), 0, 1); return t_ * t_ * (3 - 2 * t_)
ell = np.sqrt(np.clip(1 - LU * LU, 0, 1)); inside = np.abs(LU) <= 1.0
w_edge = np.where(inside, np.where(LS < 0, 0.5 + 0.5 * ell, 0.5 * (1 - ell)), 0.5)
rigid = (LS < 0).astype(float)
wj = w_edge + (rigid - w_edge) * sstep(0.0, 0.03, np.abs(LS))
wj *= 1 - sstep(-0.45, -0.28, co[:, 1])          # long throat falloff behind the jaw angle
wj *= sstep(0.74, 0.86, co[:, 2])                # nothing below the throat
wj *= (LU < 8.9)                                 # head verts only
for _ in range(10):
    acc = np.zeros(n); np.add.at(acc, ed[:, 0], wj[ed[:, 1]]); np.add.at(acc, ed[:, 1], wj[ed[:, 0]])
    wj = 0.5 * wj + 0.5 * acc / np.maximum(deg[:, 0], 1)
wj[wj < 0.01] = 0
W *= (1 - wj)[:, None]
W = np.concatenate([W, wj[:, None]], axis=1); names = names + ["jaw"]
JAW_VERTS = int((wj > 0.5).sum())
for vg in list(body.vertex_groups): body.vertex_groups.remove(vg)
for j, nm in enumerate(names):
    vg = body.vertex_groups.new(name=nm); q = np.round(W[:, j] * 50) / 50
    for val in np.unique(q[q > 0]): vg.add(np.nonzero(q == val)[0].tolist(), float(val), 'REPLACE')
WSTAT = {"torso_verts": int((e < 1.1).sum()), "groups": len(names), "feet": FOOT_ISLANDS, "orphans_fixed": ORPHANS, "jaw_verts": JAW_VERTS}
