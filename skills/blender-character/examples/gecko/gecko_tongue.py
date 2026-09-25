import bpy, bmesh, math, numpy as np
from mathutils import Vector, Matrix
exec(bpy.data.texts["lizard_helpers.py"].as_string())
arm = bpy.data.objects["Gecko_Rig"]
_pp = arm.data.pose_position; arm.data.pose_position = 'REST'; bpy.context.view_layer.update()
old = bpy.data.objects.get("Gecko_Tongue")
if old: bpy.data.objects.remove(old, do_unlink=True)
LC = np.array(bpy.context.scene["gecko_lip_curve"]).reshape(-1, 7)
c = LC[np.argmin(np.abs(LC[:, 0]))]
p = Vector(c[1:4]); nrm0 = Vector(c[4:7]).normalized()
v = nrm0.cross(Vector((1, 0, 0))).normalized()
if v.z < 0: v = -v
out = nrm0
# ---- sculpted tongue in local space: x width, y length (tip at -y), z up ----
L_, W_, H_ = 0.055, 0.095, 0.022
me = bpy.data.meshes.new("Gecko_Tongue"); bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1.0)
for vt in bm.verts:
    x, y, z = vt.co
    t_tip = max(0.0, -y)                                   # 0 at middle -> 1 at tip
    t_back = max(0.0, y)
    x *= W_ * (1 - 0.28 * t_tip ** 1.5) * (1 + 0.12 * t_back)
    zz = z * H_ * (1 - 0.35 * t_tip)
    if z > 0: zz -= 0.0075 * math.exp(-(x / 0.016) ** 2) * (1 - 0.6 * t_tip)   # median groove
    zz += 0.016 * t_tip ** 2.2                             # tip curls up
    zz -= 0.022 * t_back ** 1.5                            # root dips into the throat
    y *= L_
    vt.co = (x, y, zz)
bm.to_mesh(me); bm.free()
tg = bpy.data.objects.new("Gecko_Tongue", me); link(tg)
for pl in me.polygons: pl.use_smooth = True
xax = Vector((1, 0, 0)); yax = -out; zax = xax.cross(yax).normalized()
if zax.dot(v) < 0: zax = -zax
yax = zax.cross(xax)
centre = p - out * 0.085 - v * 0.038
tg.matrix_world = Matrix.Translation(centre) @ Matrix((xax, yax, zax)).transposed().to_4x4()
m = bpy.data.materials.get("Gecko_Tongue")
nt = m.node_tree; N = nt.nodes; Lk = nt.links
for n_ in list(N):
    if n_.type not in ('OUTPUT_MATERIAL', 'BSDF_PRINCIPLED'): N.remove(n_)
bs = N["Principled BSDF"]
bs.inputs["Roughness"].default_value = 0.32; bs.inputs["Subsurface Weight"].default_value = 0.6
bs.inputs["Subsurface Radius"].default_value = (1.0, 0.3, 0.25); bs.inputs["Subsurface Scale"].default_value = 0.02
bs.inputs["Specular IOR Level"].default_value = 0.45
tc = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); Lk.new(tc.outputs["Generated"], sep.inputs[0])
mix = N.new("ShaderNodeMix"); mix.data_type = 'RGBA'; mix.inputs["A"].default_value = (0.78, 0.33, 0.34, 1); mix.inputs["B"].default_value = (0.38, 0.08, 0.10, 1)
mr = N.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.45; mr.inputs["From Max"].default_value = 1.0
Lk.new(sep.outputs["Y"], mr.inputs["Value"]); Lk.new(mr.outputs[0], mix.inputs["Factor"]); Lk.new(mix.outputs["Result"], bs.inputs["Base Color"])
nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 180; nz.inputs["Detail"].default_value = 2
Lk.new(tc.outputs["Object"], nz.inputs["Vector"])
bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.12; bp.inputs["Distance"].default_value = 0.001
Lk.new(nz.outputs["Fac"], bp.inputs["Height"]); Lk.new(bp.outputs["Normal"], bs.inputs["Normal"])
me.materials.append(m)
bpy.context.view_layer.update()
mw = tg.matrix_world.copy(); tg.parent = arm; tg.parent_type = 'BONE'; tg.parent_bone = "jaw"; tg.matrix_world = mw

arm.data.pose_position = _pp; bpy.context.view_layer.update()
