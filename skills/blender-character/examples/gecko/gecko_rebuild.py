import bpy, numpy as np
T = bpy.data.texts
arm = bpy.data.objects.get("Gecko_Rig")
if arm:
    arm.data.pose_position = 'REST'; bpy.context.view_layer.update()
    for o in list(arm.children):
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    bpy.data.objects.remove(arm, do_unlink=True)
old = bpy.data.actions.get("Gecko_Walk")
if old: old.use_fake_user = False; bpy.data.actions.remove(old)
exec(T["gecko_body.py"].as_string(), {"EYE_C": (0.195, -0.575, 1.165), "EYE_R": 0.155})
exec(T["gecko_mouth.py"].as_string(), {"SEAM_EL": -13})
exec(T["gecko_wrinkles.py"].as_string(), {})
body = bpy.data.objects["Gecko_Body"]
cov = np.empty(len(body.data.vertices) * 3); body.data.vertices.foreach_get("co", cov); cov = cov.reshape(-1, 3)
kg = body.vertex_groups.new(name="keep_mouth")
head_n = int(((cov[:, 2] > 0.72) & (cov[:, 1] < -0.05)).sum())
kg.add(np.nonzero((cov[:, 2] > 0.72) & (cov[:, 1] < -0.05))[0].tolist(), 1.0, 'REPLACE')
DEC_RATIO = (head_n + 0.3 * (len(cov) - head_n)) / len(cov)
d = body.modifiers.new("Decimate", 'DECIMATE'); d.ratio = DEC_RATIO
d.vertex_group = "keep_mouth"; d.invert_vertex_group = True; d.vertex_group_factor = 10.0
bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
nm = bpy.data.meshes.new_from_object(body.evaluated_get(dg)); o_ = body.data; body.data = nm; bpy.data.meshes.remove(o_)
nm.name = "Gecko_Body"; body.modifiers.clear()
if body.vertex_groups.get('keep_mouth'): body.vertex_groups.remove(body.vertex_groups['keep_mouth'])
for p in nm.polygons: p.use_smooth = True
pass
co = np.empty(len(nm.vertices) * 3, dtype=np.float32); nm.vertices.foreach_get("co", co)
a = nm.attributes.new("rest_co", 'FLOAT_VECTOR', 'POINT'); a.data.foreach_set("vector", co)
exec(T["gecko_mouthdepth.py"].as_string(), {})
exec(T["gecko_rig.py"].as_string(), {})
WS = {}; exec(T["gecko_weights.py"].as_string(), dict(WS, TAU=0.03, SMOOTH_IT=18)) 
am = [m for m in body.modifiers if m.type == 'ARMATURE'][0]; am.use_deform_preserve_volume = True
cs = body.modifiers.new("DeformSmooth", 'CORRECTIVE_SMOOTH'); cs.iterations = 6; cs.smooth_type = 'LENGTH_WEIGHTED'; cs.rest_source = 'ORCO'; cs.factor = 0.5
exec(T["gecko_shapekeys.py"].as_string(), {})
exec(T["gecko_walk.py"].as_string(), {})
act = bpy.data.objects["Gecko_Rig"].animation_data.action
for layer in act.layers:
    for strip in layer.strips:
        for cb in strip.channelbags:
            for fc in cb.fcurves:
                for k in fc.keyframe_points: k.interpolation = 'LINEAR'
                if not any(m.type == 'CYCLES' for m in fc.modifiers): fc.modifiers.new('CYCLES')

exec(T["gecko_face.py"].as_string(), {})
exec(T["gecko_tongue.py"].as_string(), {})
exec(T["gecko_performance.py"].as_string(), {})
