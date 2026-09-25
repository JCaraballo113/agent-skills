import bpy, math
from mathutils import Vector, Matrix
arm = bpy.data.objects["Gecko_Rig"]; col = bpy.data.collections["WiseLizard"]
up = Vector((0, 0, 1))
info = {}
for S in ("L", "R"):
    eye = bpy.data.objects[f"Gecko_Eye_{S}"]
    ec = eye.matrix_world.translation.copy()
    gaze = (eye.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized()
    brows = [o for o in col.objects if o.name.startswith((f"Gecko_Brow_{S}", f"Gecko_BrowB_{S}"))]
    bc = sum((o.data.splines[0].points[0].co.to_3d() for o in brows), Vector()) / max(1, len(brows))
    info[S] = (ec, gaze, bc, brows)
arm.data.pose_position = 'POSE'
bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
EB = arm.data.edit_bones
for nm in [b.name for b in EB if b.name.startswith(("eye.", "lid_", "brow."))]: EB.remove(EB[nm])
for S, (ec, gaze, bc, brows) in info.items():
    for nm, h, t in ((f"eye.{S}", ec, ec + gaze * 0.12), (f"lid_up.{S}", ec, ec + gaze * 0.10), (f"lid_lo.{S}", ec, ec + gaze * 0.08),
                     (f"brow.{S}", bc, bc + gaze * 0.08)):
        b = EB.new(nm); b.head = h; b.tail = t; b.parent = EB["head"]; b.use_deform = False
        b.align_roll(-up)          # local X = up x gaze (the lid hinge axis), local Z = down
bpy.ops.object.mode_set(mode='OBJECT')
def bone_parent(o, bone):
    mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bone; o.matrix_world = mw
bpy.context.view_layer.update()
for S, (ec, gaze, bc, brows) in info.items():
    bone_parent(bpy.data.objects[f"Gecko_Eye_{S}"], f"eye.{S}")
    bone_parent(bpy.data.objects[f"Gecko_LidUpper_{S}"], f"lid_up.{S}")
    bone_parent(bpy.data.objects[f"Gecko_LidLower_{S}"], f"lid_lo.{S}")
    for o in brows: bone_parent(o, f"brow.{S}")
FACE_BONES = len(info) * 4

tg = bpy.data.objects.get("Gecko_Tongue")
if tg: bone_parent(tg, "jaw")
