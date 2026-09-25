import bpy, math
from mathutils import Vector, Quaternion, Euler
exec(bpy.data.texts["lizard_helpers.py"].as_string())
K = 0.575
def kfor(st):
    pts = [(2.0, 0.571), (4.0, 0.681), (8.0, 0.758), (16.0, 0.8)]
    if st <= pts[0][0]: return pts[0][1]
    for (a, ka), (b, kb) in zip(pts, pts[1:]):
        if st <= b: return ka + (kb - ka) * (st - a) / (b - a)
    return pts[-1][1]
for n in ("Gecko_Meta", "Gecko_Body"):
    o = bpy.data.objects.get(n)
    if o: bpy.data.objects.remove(o, do_unlink=True)
mb = bpy.data.metaballs.new("Gecko_Meta"); mb.resolution = 0.011; mb.render_resolution = 0.011; mb.threshold = 0.6
meta = bpy.data.objects.new("Gecko_Meta", mb); link(meta)

def ell(c, semi, rot=(0, 0, 0), stiff=2.0):
    e = mb.elements.new(); e.type = 'ELLIPSOID'; e.co = c; e.radius = 1.0; e.stiffness = stiff
    e.size_x, e.size_y, e.size_z = (s_ / kfor(stiff) for s_ in semi)
    e.rotation = Euler(tuple(math.radians(a) for a in rot)).to_quaternion()
    return e
def cap(p1, p2, r, stiff=2.0):
    p1, p2 = Vector(p1), Vector(p2); d = p2 - p1
    e = mb.elements.new(); e.type = 'CAPSULE'; e.co = (p1 + p2) / 2; e.radius = r / K; e.stiffness = stiff
    e.size_x = d.length / 2
    e.rotation = Vector((1, 0, 0)).rotation_difference(d.normalized())
    return e
def ball(c, r, stiff=2.0):
    e = mb.elements.new(); e.type = 'BALL'; e.co = c; e.radius = r / kfor(stiff); e.stiffness = stiff; return e

# torso: haunches low at the back, belly, chest rising at the front
ell((0, 0.44, 0.46), (0.22, 0.25, 0.19))
ell((0, 0.12, 0.47), (0.25, 0.38, 0.22), rot=(-4, 0, 0))
ell((0, -0.15, 0.57), (0.21, 0.21, 0.22), rot=(-20, 0, 0))
# S-curved neck
cap((0, -0.20, 0.64), (0, -0.19, 0.86), 0.19)
cap((0, -0.19, 0.86), (0, -0.27, 0.98), 0.18)
ell((0, -0.34, 0.93), (0.22, 0.22, 0.12), rot=(-20, 0, 0))
# head: wide flat cranium, upper snout, slightly smaller lower jaw, raised eye mounds
ell((0, -0.35, 1.09), (0.34, 0.35, 0.19), rot=(-6, 0, 0))
ell((0, -0.56, 1.06), (0.29, 0.23, 0.13), rot=(-8, 0, 0))
ell((0, -0.47, 0.985), (0.28, 0.28, 0.10), rot=(-4, 0, 0))
for s in (1, -1):
    ell((0.19 * s, -0.50, 1.275), (0.15, 0.11, 0.065), rot=(14, -14 * s, 0))
# ---- legs: lizard sprawl, muscled upper segments, joint knobs, 5 splayed digits with round gecko toe pads ----
def chain(pts, stiff=2.0, step=0.02):
    for (p1, r1), (p2, r2) in zip(pts, pts[1:]):
        n = max(2, int((Vector(p2) - Vector(p1)).length / step))
        for k in range(n + 1):
            t_ = k / n
            ball(Vector(p1).lerp(Vector(p2), t_), r1 + (r2 - r1) * t_, stiff=stiff)
def digits(base, fwd, s, angles, lengths, r_base, pad):
    fwd = Vector(fwd).normalized()
    for a, ln in zip(angles, lengths):
        ang = math.radians(a)
        d = Vector((fwd.x * math.cos(ang) - fwd.y * math.sin(ang), fwd.x * math.sin(ang) + fwd.y * math.cos(ang), 0)).normalized()
        root = base + d * ln * 0.18
        knuckle = base + d * ln * 0.5 + Vector((0, 0, 0.014))
        tip = base + d * ln; tip.z = pad * 0.55
        chain([(base, r_base * 1.05), (root, r_base)], stiff=2.0, step=0.012)                  # soft: blends into the palm (slight webbing)
        chain([(root, r_base * 0.95), (knuckle, r_base * 0.85), (tip, r_base * 0.68)], stiff=8.0, step=0.008)  # stiff: fingers stay separate
        ell(tuple(tip + d * pad * 0.3), (pad, pad, pad * 0.5), stiff=8.0)
for s in (1, -1):
    # front leg: shoulder bulge -> elbow out/back -> slim wrist -> palm
    sh = Vector((0.17 * s, -0.15, 0.48)); el = Vector((0.31 * s, -0.10, 0.28)); wr = Vector((0.30 * s, -0.22, 0.075))
    ell(tuple(sh.lerp(el, 0.3)), (0.085, 0.075, 0.075), rot=(0, -40 * s, 0))
    chain([(sh, 0.095), (sh.lerp(el, 0.5), 0.08), (el, 0.066)])
    ball(el + Vector((0.012 * s, 0.02, 0.0)), 0.068, stiff=2.4)
    chain([(el, 0.066), (el.lerp(wr, 0.5), 0.058), (wr, 0.05)])
    palm = Vector((0.31 * s, -0.27, 0.03))
    ell(tuple(palm), (0.07, 0.075, 0.034))
    chain([(wr, 0.05), (palm, 0.055)])
    digits(palm + Vector((0, -0.02, 0)), (0.28 * s, -1, 0), s, [a * -s for a in (-84, -42, 0, 40, 78)], (0.09, 0.125, 0.14, 0.125, 0.09), 0.029, 0.037)
    # hind leg: big thigh -> knee raised and out -> shin -> ankle -> long-toed foot
    hp = Vector((0.18 * s, 0.46, 0.44)); kn = Vector((0.37 * s, 0.42, 0.30)); an = Vector((0.40 * s, 0.44, 0.07))
    ell(tuple(hp.lerp(kn, 0.4)), (0.12, 0.13, 0.11), rot=(0, -25 * s, 0))
    chain([(hp, 0.11), (kn, 0.07)])
    ball(kn + Vector((0.015 * s, 0.0, 0.015)), 0.07, stiff=2.4)
    chain([(kn, 0.075), (kn.lerp(an, 0.5), 0.064), (an, 0.052)])
    foot = Vector((0.42 * s, 0.37, 0.03))
    ell(tuple(foot), (0.075, 0.09, 0.036), rot=(0, 0, -20 * s))
    chain([(an, 0.052), (foot, 0.058)])
    digits(foot + Vector((0.01 * s, -0.03, 0)), (0.45 * s, -1, 0), s, [a * -s for a in (-76, -38, 0, 34, 68)], (0.10, 0.14, 0.165, 0.17, 0.125), 0.03, 0.039)
# tail: out the back, curling around the right side on the ground
tail = [((0, 0.64, 0.43), 0.12), ((0.01, 0.87, 0.30), 0.10), ((0.04, 1.08, 0.17), 0.08), ((0.10, 1.28, 0.09), 0.065),
        ((0.19, 1.46, 0.06), 0.05), ((0.31, 1.60, 0.05), 0.04), ((0.44, 1.68, 0.04), 0.03)]
def cr(p0, p1, p2, p3, t):
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
P = [Vector(p) for p, r in tail]; Rr = [r for p, r in tail]
P = [P[0]] + P + [P[-1]]; Rr = [Rr[0]] + Rr + [Rr[-1]]
for i in range(1, len(P) - 2):
    for k in range(6):
        t = k / 6
        ball(cr(P[i - 1], P[i], P[i + 1], P[i + 2], t), Rr[i] + (Rr[i + 1] - Rr[i]) * t, stiff=1.6)
EYE = globals().get("EYE_C", (0.19, -0.62, 1.15)); ER = globals().get("EYE_R", 0.16)
for s_ in (1, -1):
    ng = ball((EYE[0] * s_, EYE[1], EYE[2]), ER * 1.02, stiff=2.0); ng.use_negative = True
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
me = bpy.data.meshes.new_from_object(meta.evaluated_get(dg))
me.name = "Gecko_Body"
body = bpy.data.objects.new("Gecko_Body", me); link(body)
meta.hide_set(True); meta.hide_render = True
rm = body.modifiers.new("Remesh", 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.0065
sm = body.modifiers.new("Smooth", 'CORRECTIVE_SMOOTH'); sm.iterations = 8; sm.smooth_type = 'LENGTH_WEIGHTED'; sm.use_only_smooth = True
for p in me.polygons: p.use_smooth = True
GECKO_VERTS = len(me.vertices)
