import bpy, bmesh, math
from mathutils import Vector, Matrix
exec(bpy.data.texts["lizard_helpers.py"].as_string())
P = dict(r=0.15, push=0.075, upper_edge=14, lower_edge=-44, up_tilt=28, low_tilt=12, cam=(1.9, -3.6, 1.15))
P.update(globals().get("EYE_PARAMS", {}))
for o in list(coll().objects):
    if o.name.startswith(("Gecko_Eye", "Gecko_Lid", "Gecko_HL")): bpy.data.objects.remove(o, do_unlink=True)
em = bpy.data.materials["Gecko_Eye"]; skin = bpy.data.materials["Gecko_Skin"]
hl = principled("Gecko_Highlight", (1, 1, 1), rough=0.0, emission=(1, 1, 1))
r = P["r"]; up = Vector((0, 0, 1)); cam = Vector(P["cam"])
for s, side in ((1, "L"), (-1, "R")):
    ec = Vector((P['cx'] * s, P['cy'], P['cz']))
    gaze = (cam - ec).normalized()
    eye = ellipsoid(f"Gecko_Eye_{side}", ec, (r, r, r), mat=em, segs=64, rings=32, sub=1)
    zx = up.cross(gaze).normalized(); zy = gaze.cross(zx)
    eye.rotation_euler = Matrix((zx, zy, gaze)).transposed().to_euler()
    for lid, tilt, edge, thick, rr in (("Upper", P["up_tilt"], P["upper_edge"], 0.022, 1.05), ("Lower", P["low_tilt"], P["lower_edge"], P.get("low_thick", 0.018), 1.06)):
        t = math.radians(tilt)
        base_up = up if lid == "Upper" else -up
        axis = (base_up * math.cos(t) - gaze * math.sin(t)).normalized()          # tilted AWAY from the gaze: back edge buries in the skull
        gaze_ang = math.acos(max(-1, min(1, axis.dot(gaze))))
        h = math.cos(gaze_ang - math.radians(abs(edge)))
        name = f"Gecko_Lid{lid}_{side}"; R = r * rr
        lme = bpy.data.meshes.new(name); lb = bmesh.new()
        bmesh.ops.create_uvsphere(lb, u_segments=64, v_segments=40, radius=R)
        bmesh.ops.delete(lb, geom=[v for v in lb.verts if v.co.z / R < h], context='VERTS')
        lb.to_mesh(lme); lb.free()
        lo = bpy.data.objects.new(name, lme); link(lo); lo.location = ec
        ax = gaze.cross(axis).normalized(); ay = axis.cross(ax)
        lo.rotation_euler = Matrix((ax, ay, axis)).transposed().to_euler()
        lme.materials.append(skin)
        so = lo.modifiers.new("Solid", 'SOLIDIFY'); so.thickness = thick; so.offset = 1.0; so.use_rim = True
        smooth(lo, 2)
