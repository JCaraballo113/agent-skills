import bpy, math, numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
body = bpy.data.objects["Gecko_Body"]; me = body.data; outer = bpy.data.objects["Gecko_BodyOuter"]
sc = bpy.context.scene
bvh = BVHTree.FromObject(outer, bpy.context.evaluated_depsgraph_get())
LC = np.array(sc["gecko_lip_curve"]).reshape(-1, 7); AZ_OPEN = sc["gecko_mouth_params"][0]
pts = LC[:, 1:4]; nrm = LC[:, 4:7]
tan = np.gradient(pts, axis=0); tan /= np.linalg.norm(tan, axis=1, keepdims=True)
vup = np.cross(nrm, tan); vup /= np.linalg.norm(vup, axis=1, keepdims=True); vup[vup[:, 2] < 0] *= -1
kd = KDTree(len(pts))
for i, p in enumerate(pts): kd.insert(Vector(p), i)
kd.balance()
n_ = len(me.vertices); co = np.empty(n_ * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
d = np.zeros(n_, np.float32); s = np.zeros(n_, np.float32); u = np.full(n_, 9.0, np.float32)
head = np.nonzero((co[:, 2] > 0.7) & (co[:, 1] < -0.05))[0]
# lip coordinates by azimuth around the snout: u = angle / opening angle, s = height above the lip line at that angle
C0 = np.array([0.0, -0.43, 1.03])
azc = LC[:, 0]; zc = LC[:, 3]
for i in head:
    v = Vector(co[i]); loc, _, _, dist = bvh.find_nearest(v); d[i] = dist
    az = np.degrees(np.arctan2(co[i, 0], -(co[i, 1] - C0[1])))
    s[i] = float(co[i, 2] - np.interp(np.clip(az, azc[0], azc[-1]), azc, zc))
    u[i] = az / AZ_OPEN
for nm_, arr in (("lip_d", d), ("lip_s", s), ("lip_u", u)):
    a = me.attributes.get(nm_) or me.attributes.new(nm_, 'FLOAT', 'POINT'); a.data.foreach_set("value", arr)
# shader: skin on the lip roll, then pink -> red -> maroon -> near-black with depth, AO darkened, wet coat
m = bpy.data.materials["Gecko_Skin"]; N = m.node_tree.nodes; L = m.node_tree.links
bs = [n for n in N if n.type == 'BSDF_PRINCIPLED'][0]
for nm_ in ("LipD", "InMask", "InRamp", "InAO", "InAOMul", "InMix", "InRough", "InCoat", "LipU", "LipS", "InRegionUAbs", "InRegionU", "InRegionSAbs", "InRegionS", "InRegion", "InMaskFinal"):
    if nm_ in N: N.remove(N[nm_])
src = N["PadMix"].outputs["Result"]
at = N.new("ShaderNodeAttribute"); at.name = "LipD"; at.attribute_name = "lip_d"; at.attribute_type = 'GEOMETRY'
mk = N.new("ShaderNodeMapRange"); mk.name = "InMask"; mk.interpolation_type = 'SMOOTHSTEP'
mk.inputs["From Min"].default_value = 0.0025; mk.inputs["From Max"].default_value = 0.0075
L.new(at.outputs["Fac"], mk.inputs["Value"])
rp = N.new("ShaderNodeValToRGB"); rp.name = "InRamp"; L.new(at.outputs["Fac"], rp.inputs["Fac"])
cr = rp.color_ramp
cr.elements[0].position = 0.0; cr.elements[0].color = (0.58, 0.24, 0.24, 1)
cr.elements[1].position = 0.09; cr.elements[1].color = (0.018, 0.004, 0.005, 1)
for pos, c in ((0.012, (0.40, 0.08, 0.09)), (0.035, (0.13, 0.022, 0.027))):
    e = cr.elements.new(pos); e.color = (*c, 1)
ao = N.new("ShaderNodeAmbientOcclusion"); ao.name = "InAO"; ao.inputs["Distance"].default_value = 0.05; ao.only_local = True
am = N.new("ShaderNodeMix"); am.name = "InAOMul"; am.data_type = 'RGBA'; am.blend_type = 'MULTIPLY'; am.inputs["Factor"].default_value = 1.0
L.new(rp.outputs["Color"], am.inputs["A"]); L.new(ao.outputs["AO"], am.inputs["B"])
mx = N.new("ShaderNodeMix"); mx.name = "InMix"; mx.data_type = 'RGBA'
# interior colour only inside the mouth opening region (not the closed smile crease or throat folds)
au = N.new("ShaderNodeAttribute"); au.name = "LipU"; au.attribute_name = "lip_u"; au.attribute_type = 'GEOMETRY'
as_ = N.new("ShaderNodeAttribute"); as_.name = "LipS"; as_.attribute_name = "lip_s"; as_.attribute_type = 'GEOMETRY'
def absmr(sock, a, b, nm_):
    ab = N.new("ShaderNodeMath"); ab.operation = 'ABSOLUTE'; ab.name = nm_ + "Abs"; L.new(sock, ab.inputs[0])
    r_ = N.new("ShaderNodeMapRange"); r_.name = nm_; r_.interpolation_type = 'SMOOTHSTEP'
    r_.inputs["From Min"].default_value = a; r_.inputs["From Max"].default_value = b; L.new(ab.outputs[0], r_.inputs["Value"]); return r_
ru = absmr(au.outputs["Fac"], 1.12, 0.98, "InRegionU"); rs = absmr(as_.outputs["Fac"], 0.07, 0.05, "InRegionS")
m1 = N.new("ShaderNodeMath"); m1.operation = 'MULTIPLY'; m1.name = "InRegion"; L.new(ru.outputs[0], m1.inputs[0]); L.new(rs.outputs[0], m1.inputs[1])
m2 = N.new("ShaderNodeMath"); m2.operation = 'MULTIPLY'; m2.name = "InMaskFinal"; L.new(mk.outputs[0], m2.inputs[0]); L.new(m1.outputs[0], m2.inputs[1])
L.new(src, mx.inputs["A"]); L.new(am.outputs["Result"], mx.inputs["B"]); L.new(m2.outputs[0], mx.inputs["Factor"])
L.new(mx.outputs["Result"], bs.inputs["Base Color"])
rg = N.new("ShaderNodeMapRange"); rg.name = "InRough"; rg.inputs["To Min"].default_value = 0.55; rg.inputs["To Max"].default_value = 0.4
L.new(m2.outputs[0], rg.inputs["Value"]); L.new(rg.outputs[0], bs.inputs["Roughness"])
ct = N.new("ShaderNodeMapRange"); ct.name = "InCoat"; ct.inputs["To Min"].default_value = 0.0; ct.inputs["To Max"].default_value = 0.45
L.new(m2.outputs[0], ct.inputs["Value"]); L.new(ct.outputs[0], bs.inputs["Coat Weight"]); bs.inputs["Coat Roughness"].default_value = 0.15
MD = dict(interior_verts=int((d > 0.006).sum()), lip_verts=int(((np.abs(u) <= 1) & (np.abs(s) < 0.03) & (d < 0.008)).sum()))
