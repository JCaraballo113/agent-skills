import bpy, bmesh, math
from mathutils import Vector, Euler, Matrix

COLL_NAME = "WiseLizard"

def coll():
    c = bpy.data.collections.get(COLL_NAME)
    if c is None:
        c = bpy.data.collections.new(COLL_NAME)
        bpy.context.scene.collection.children.link(c)
    return c

def link(ob):
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    coll().objects.link(ob)
    return ob

def remove(name):
    ob = bpy.data.objects.get(name)
    if ob:
        bpy.data.objects.remove(ob, do_unlink=True)

def smooth(ob, levels=2, render_levels=None):
    for p in ob.data.polygons:
        p.use_smooth = True
    m = ob.modifiers.new("Subsurf", 'SUBSURF')
    m.levels = levels
    m.render_levels = render_levels or levels + 1
    return m

def ellipsoid(name, loc, scale, rot=(0,0,0), mat=None, segs=32, rings=16, sub=1, parent=None):
    remove(name)
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    link(ob)
    ob.location = loc; ob.scale = scale; ob.rotation_euler = rot
    if mat: me.materials.append(mat)
    if sub: smooth(ob, sub)
    else:
        for p in me.polygons: p.use_smooth = True
    if parent: set_parent(ob, parent)
    return ob

def set_parent(ob, parent):
    bpy.context.view_layer.update()
    mw = ob.matrix_world.copy()
    ob.parent = parent
    ob.matrix_world = mw

def get_mat(name):
    return bpy.data.materials.get(name)

def principled(name, color, rough=0.5, sss=0.0, metallic=0.0, spec=0.5, emission=None, coat=0.0, transmission=0.0, ior=1.45, alpha=1.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    if "Subsurface Weight" in b.inputs:
        b.inputs["Subsurface Weight"].default_value = sss
    if "Coat Weight" in b.inputs:
        b.inputs["Coat Weight"].default_value = coat
    if "Transmission Weight" in b.inputs:
        b.inputs["Transmission Weight"].default_value = transmission
    b.inputs["IOR"].default_value = ior
    b.inputs["Alpha"].default_value = alpha
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1)
        b.inputs["Emission Strength"].default_value = 1.0
    m.diffuse_color = (*color, 1)
    return m

def skin_mesh(name, verts, edges, radii, mat=None, root=0, sub=2):
    remove(name)
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, edges, [])
    ob = bpy.data.objects.new(name, me)
    link(ob)
    sk = ob.modifiers.new("Skin", 'SKIN')
    sk.use_smooth_shade = True
    sk.branch_smoothing = 0.6
    for i, r in enumerate(radii):
        d = me.skin_vertices[0].data[i]
        d.radius = (r, r) if not isinstance(r, tuple) else r
        d.use_root = (i == root)
    m = ob.modifiers.new("Subsurf", 'SUBSURF'); m.levels = sub; m.render_levels = sub + 1
    if mat: me.materials.append(mat)
    return ob

def curve_tube(name, pts, bevel, mat=None, taper=None, res=24):
    remove(name)
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = bevel
    cu.bevel_resolution = 6
    cu.resolution_u = res
    cu.use_fill_caps = True
    sp = cu.splines.new('NURBS')
    sp.points.add(len(pts) - 1)
    for p, co in zip(sp.points, pts):
        w = co[3] if len(co) > 3 else 1.0
        p.co = (co[0], co[1], co[2], 1.0)
        p.radius = w
    sp.order_u = min(4, len(pts))
    sp.use_endpoint_u = True
    ob = bpy.data.objects.new(name, cu)
    link(ob)
    if mat: cu.materials.append(mat)
    return ob
