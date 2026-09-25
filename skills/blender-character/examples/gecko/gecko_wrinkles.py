import bpy, math, numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
body = bpy.data.objects["Gecko_Body"]; me = body.data
bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); bvh = BVHTree.FromObject(body, dg)
n_ = len(me.vertices)
co = np.empty(n_ * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
nr = np.empty(n_ * 3); me.vertices.foreach_get("normal", nr); nr = nr.reshape(-1, 3)
C = Vector((0, -0.25, 0.80)); samples = []
for zc, span, bend, depth in ((0.845, 50, 0.025, 0.0045), (0.78, 44, 0.02, 0.0035)):
    for i in range(61):
        az = -span + i * (2 * span / 60); a = math.radians(az)
        d = Vector((math.sin(a), -math.cos(a), 0)); o = Vector((C.x, C.y, zc - bend * (1 - (az / span) ** 2)))
        loc, nrm, _, _ = bvh.ray_cast(o + d * 1.5, -d)
        if loc: samples.append((loc, depth * (1 - (az / span) ** 2) ** 0.7))
kd = KDTree(len(samples))
for i, (p, a) in enumerate(samples): kd.insert(p, i)
kd.balance()
W_ = 0.014; off = np.zeros(n_)
for i in np.nonzero((co[:, 2] > 0.65) & (co[:, 2] < 1.0) & (co[:, 1] < 0.0))[0]:
    q, j, dist = kd.find(Vector(co[i]))
    if dist < 3 * W_: off[i] = -samples[j][1] * math.exp(-(dist / W_) ** 2)
co += nr * off[:, None]; me.vertices.foreach_set("co", co.ravel()); me.update()
