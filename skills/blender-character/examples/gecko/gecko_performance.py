import bpy, math, wave, numpy as np
from mathutils import Vector, Euler
arm = bpy.data.objects["Gecko_Rig"]; PB = arm.pose.bones; sc = bpy.context.scene
AUDIO = globals().get("AUDIO", bpy.path.abspath("//audio/sage_line.wav"))
FPS = 24; sc.render.fps = FPS
P = dict(T=56, stance=0.6, stride=0.18, lift=0.06, lift_h=0.075, yaw=5.0, roll=2.5, bob=0.01, walk_end=96, gap=10, tail_amp0=2.0, tail_amp1=6.0)
P.update(globals().get("PERF", {}))
T = P["T"]; st = P["stance"]; stride = P["stride"]
# ---------- audio envelope ----------
wf = wave.open(AUDIO, "rb"); sr = wf.getframerate(); raw = wf.readframes(wf.getnframes()); wf.close()
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
spf = sr // FPS; nfr = len(x) // spf
rms = np.sqrt(np.array([np.mean(x[i * spf:(i + 1) * spf] ** 2) for i in range(nfr)]))
env = np.zeros_like(rms); a_up, a_dn = 0.6, 0.35
for i in range(nfr):
    prev = env[i - 1] if i else 0; k = a_up if rms[i] > prev else a_dn
    env[i] = prev + k * (rms[i] - prev)
ref = np.percentile(env[env > 0], 95) if (env > 0).any() else 1.0
envn = np.clip(env / ref, 0, 1)
voiced = envn > 0.08
phrases = []; i = 0
while i < nfr:
    if voiced[i]:
        j = i
        while j < nfr and (voiced[j] or (j + 8 < nfr and voiced[j:j + 8].any())): j += 1
        if j - i > 6: phrases.append((i, j))
        i = j
    else: i += 1
# ---------- walk phase with a smooth stop landing all four feet ----------
target = 0.05
phi0 = (P["walk_end"] - 1) / T
k = math.floor(phi0) + 1
n_dec = max(24, int(round(2 * T * (k + target - phi0))))
while n_dec < 24: k += 1; n_dec = int(round(2 * T * (k + target - phi0)))
f_stop = P["walk_end"] + n_dec
def phase(f):
    if f <= P["walk_end"]: return (f - 1) / T
    t = min(f - P["walk_end"], n_dec)
    return phi0 + (t - t * t / (2 * n_dec)) / T
def speed(f):
    if f <= P["walk_end"]: return 1.0
    return max(0.0, 1 - (f - P["walk_end"]) / n_dec)
phi_end = phase(f_stop)
S0 = f_stop + P["gap"]                       # speech start frame
F_END = S0 + nfr + 40
sc.frame_start = 1; sc.frame_end = F_END
# ---------- keyed scalar channels with smooth interpolation ----------
def curve(keys):
    keys = sorted(keys)
    def ev(f):
        if f <= keys[0][0]: return keys[0][1]
        for (f0, v0), (f1, v1) in zip(keys, keys[1:]):
            if f <= f1:
                u = (f - f0) / max(1e-9, f1 - f0); u = 0.5 - 0.5 * math.cos(math.pi * u); return v0 + (v1 - v0) * u
        return keys[-1][1]
    return ev
ph = [(a + S0, b + S0) for a, b in phrases] or [(S0, S0 + nfr)]
p1 = ph[0]; p2 = ph[1] if len(ph) > 1 else ph[0]; p3 = ph[-1]
head_pitch = curve([(1, 0), (f_stop, 0), (p1[0] - 4, -3), (p1[1], 2), (p2[0], -4), ((p2[0] + p2[1]) // 2, -2), (p2[1], 5), (p3[0] + 4, 1),
                    (p3[0] + (p3[1] - p3[0]) // 3, 4), (p3[0] + (p3[1] - p3[0]) // 2, 0), (p3[1] - 6, 3), (p3[1] + 6, 5), (F_END, 1)])
head_roll = curve([(1, 0), (f_stop, 0), (p1[0], 6), (p1[1] + 4, 5), (p2[0] + 4, -2), (p3[0], -3), (p3[1], 4), (F_END, 3)])
head_yaw = curve([(1, 0), (f_stop, 0), (p2[0], 0), (p2[0] + 10, 6), (p2[1], 0), (F_END, 0)])
eye_pitch = curve([(1, 0), (40, 0), (43, 4), (55, 4), (58, 0), (p2[0] - 2, 0), (p2[0] + 4, -12), ((p2[0] + p2[1]) // 2, -12), ((p2[0] + p2[1]) // 2 + 4, 0), (F_END, 0)])
eye_yaw = curve([(1, 0), (40, 0), (43, 15), (55, 15), (58, 0), (p2[0] - 2, 0), (p2[0] + 4, 10), ((p2[0] + p2[1]) // 2, 10), ((p2[0] + p2[1]) // 2 + 4, 0), (F_END, 0)])
lid_up_base = curve([(1, 0), (p1[0] - 8, -6), (p1[1], -4), (p2[1], 0), (p3[0] + 2, 18), (p3[1], 22), (F_END - 20, 22), (F_END, 10)])
lid_lo_base = curve([(1, 0), (p2[1], 0), (p3[0] + 2, -11), (p3[1], -13), (F_END - 20, -13), (F_END, -6)])
browL = curve([(1, 0), (p1[0] - 8, -0.012), (p1[1], -0.01), (p2[1], 0), (p3[0] + 2, 0.014), (F_END - 20, 0.016), (F_END, 0.008)])
browR = curve([(1, 0), (p1[0] - 8, -0.012), (p1[1], -0.01), (p2[1], 0), (p3[0] + 2, -0.012), (F_END - 20, -0.013), (F_END, -0.006)])
# ---------- lip sync: Rhubarb visemes -> separate jaw + lip tracks (JALI) ----------
import json, os, subprocess
CUES = globals().get("CUES", AUDIO.replace(".wav", ".rhubarb.json"))
if not os.path.exists(CUES):
    RH = bpy.path.abspath("//tools/rhubarb/rhubarb"); txt = AUDIO.replace(".wav", ".txt")
    cmd = [RH, "-r", "pocketSphinx", "-f", "json", "--extendedShapes", "GHX", "-o", CUES] + (["--dialogFile", txt] if os.path.exists(txt) else []) + [AUDIO]
    subprocess.run(cmd, check=True)
cues = json.load(open(CUES))["mouthCues"]
VIS = {"X": (0.0, {"lips_closed": 1.0}), "A": (0.0, {"lips_closed": 1.0, "lips_press": 0.6}),
       "B": (0.12, {"lips_closed": 0.9, "lips_wide": 0.5}), "C": (0.40, {"lips_closed": 0.7, "lips_wide": 0.3}),
       "D": (0.85, {"lips_closed": 0.4}), "E": (0.35, {"lips_closed": 0.8, "lips_round": 0.6}),
       "F": (0.12, {"lips_closed": 1.0, "lips_pucker": 1.0}), "G": (0.05, {"lips_closed": 1.0, "lowerlip_tuck": 1.0}),
       "H": (0.45, {"lips_closed": 0.6})}
LIPKEYS = ["lips_closed", "lips_press", "lips_wide", "lips_round", "lips_pucker", "lowerlip_tuck"]
MAXJ = float(P.get("max_jaw", 24.0)); LEAD = 1; RAMP = 2
spoken = [c for c in cues if c["value"] not in ("X", "A")]
def cue_int(c):
    a, b = int(c["start"] * FPS), max(int(c["start"] * FPS) + 1, int(c["end"] * FPS))
    return float(envn[a:b].mean()) if a < nfr else 0.0
ints = np.array([cue_int(c) for c in spoken]) if spoken else np.array([0.5])
mu, sd = ints.mean(), max(ints.std(), 1e-3)
chan = {k: [] for k in LIPKEYS + ["jaw"]}
for i, c in enumerate(cues):
    f0 = S0 + c["start"] * FPS - LEAD
    jt, lips = VIS.get(c["value"], VIS["X"])
    ja = float(np.clip(0.5 + 0.35 * (cue_int(c) - mu) / sd, 0.15, 0.9)) if c["value"] not in ("X", "A") else 0.0
    vals = {k: lips.get(k, 0.0) for k in LIPKEYS}; vals["jaw"] = jt * ja / 0.5 * 0.5
    nxt = S0 + cues[i + 1]["start"] * FPS - LEAD if i + 1 < len(cues) else f0 + 6
    for k, v in vals.items():
        chan[k].append((f0, v))
        if nxt - RAMP > f0: chan[k].append((nxt - RAMP, v))
for k in chan:
    base = 1.0 if k == "lips_closed" else 0.0
    chan[k] = [(1, base), (S0 - LEAD - RAMP, base)] + chan[k] + [(F_END, base)]
def track(k, f):
    xs, ys = zip(*chan[k]); return float(np.interp(f, xs, ys))
def jaw(f):
    return MAXJ * track("jaw", f)
# ---------- eye tracking rig ----------
cam = sc.camera
tgt = bpy.data.objects.get("Gecko_LookTarget")
if tgt is None:
    tgt = bpy.data.objects.new("Gecko_LookTarget", None); bpy.data.collections["WiseLizard"].objects.link(tgt)
    tgt.empty_display_type = 'SPHERE'; tgt.empty_display_size = 0.1
for S_ in ("L", "R"):
    pbe = PB["eye." + S_]
    for c in list(pbe.constraints): pbe.constraints.remove(c)
    c = pbe.constraints.new('DAMPED_TRACK'); c.target = tgt; c.track_axis = 'TRACK_Y'
cm = cam.matrix_world; cam_right = cm.to_3x3().col[0].normalized(); cam_up = cm.to_3x3().col[1].normalized()
glance_side = curve([(1, 0), (40, 0), (43, -1.6), (55, -1.6), (58, 0), (p2[0] - 2, 0), (p2[0] + 4, 1.2), ((p2[0] + p2[1]) // 2, 1.2), ((p2[0] + p2[1]) // 2 + 4, 0), (F_END, 0)])
glance_up = curve([(1, 0), (40, 0), (43, -0.4), (55, -0.4), (58, 0), (p2[0] - 2, 0), (p2[0] + 4, 3.0), ((p2[0] + p2[1]) // 2, 3.0), ((p2[0] + p2[1]) // 2 + 4, 0), (F_END, 0)])
if tgt.animation_data: tgt.animation_data_clear()
# ================= eyes: research-based gaze + blink model (research/eye-animation.md) =================
import random
rng = random.Random(1234)
NF = F_END + 2
yaw_a = np.zeros(NF); pit_a = np.zeros(NF); far_a = np.zeros(NF)       # gaze offsets (deg, camera-relative) + "looking away" 0..1
def sac_frames(A): return 2 if A < 8 else 3 if A <= 20 else 4
PROFILE = {2: [0, .75, 1.0], 3: [0, .45, .88, 1.0], 4: [0, .30, .70, .93, 1.0]}
shifts = []                                                            # (onset frame, amplitude deg, planned)
def plan_gaze(events):
    # events: sorted list of (frame, yaw, pitch); piecewise-constant targets joined by saccades
    cy, cp = 0.0, 0.0; last = 1
    for (f0, y1, p1) in events + [(NF, None, None)]:
        yaw_a[last:f0] = cy; pit_a[last:f0] = cp
        if y1 is None: break
        A = math.hypot(y1 - cy, p1 - cp); n = sac_frames(A); prof = PROFILE[n]
        for k, fr in enumerate(prof):
            if f0 + k < NF:
                yaw_a[f0 + k] = cy + (y1 - cy) * fr; pit_a[f0 + k] = cp + (p1 - cp) * fr
        if A > 10 and f0 + n < NF:                                    # tiny overshoot on big saccades
            yaw_a[f0 + n - 1] = cy + (y1 - cy) * 1.04; pit_a[f0 + n - 1] = cp + (p1 - cp) * 1.04
        shifts.append((f0, A)); cy, cp = y1, p1; last = f0 + n
ev = []
# walking / listening: long mutual holds, rare small glances
t = 30
while t < f_stop - 20:
    t += int(max(60, rng.gauss(150, 30)))
    if t >= f_stop - 20: break
    A = min(-6.9 * math.log(rng.uniform(1e-3, 15.0) / 15.7), 22.7) * 0.6
    ang = rng.choice([0, 0, 180, 180, 90, 270, 45, 135])
    hold = int(max(8, rng.gauss(14, 5)))
    ev += [(t, A * math.cos(math.radians(ang)), A * math.sin(math.radians(ang)) * 0.6), (t + hold, 0.0, 0.0)]
    t += hold
# speech: aversion ~1 s before phrase onsets, return at/within the phrase, locked at the end
(p1s, p1e), (p2s, p2e), (p3s, p3e) = ph[0], ph[1 if len(ph) > 1 else 0], ph[-1]
ev += [(p1s - 22, -11.0, -3.0), (p1s + 10, 0.0, 0.0)]                  # glance aside, then address him directly
ev += [(p2s - 12, 7.0, 16.0), ((p2s + p2e) // 2 + 4, 0.0, 0.0)]        # thinking/"the sun": up and aside
ev += [(p3s - 18, 9.0, -4.0), (p3s + 4, 0.0, 0.0)]                     # small aside before the last phrase, then locked
ev = sorted(e for e in ev if 1 < e[0] < NF - 2)
plan_gaze(ev)
# fixation micro-layer during holds: sparse 1-frame re-targets (no continuous noise)
t = 20
sac_frames_set = set()
for (f0, A) in shifts:
    for k in range(-4, 6): sac_frames_set.add(f0 + k)
micro_y = np.zeros(NF); micro_p = np.zeros(NF); cur = (0.0, 0.0)
while t < NF:
    t_next = t + int(rng.uniform(15, 36))
    if t not in sac_frames_set:
        cur = (float(np.clip(rng.gauss(0, 0.8), -1.8, 1.8)), float(np.clip(rng.gauss(0, 0.8), -1.8, 1.8)))
    micro_y[t:t_next] = cur[0]; micro_p[t:t_next] = cur[1]; t = t_next
yaw_a += micro_y; pit_a += micro_p
# blinks: event-driven + Poisson fill, refractory, never at shot edges
BL = {'normal': [0, .45, 1, 1, .55, .25, .10, .03, 0],
      'slow': [0, .3, .7, 1, 1, 1, 1, .8, .6, .45, .32, .22, .14, .08, .04, 0]}
blink_a = np.zeros(NF); blink_starts = []
def place_blink(f0, kind='normal', amp=1.0, force=False):
    f0 = int(f0)
    if f0 < 8 or f0 + len(BL[kind]) > NF - 8: return False
    if not force and any(abs(f0 - b) < 24 for b in blink_starts): return False
    for k, v in enumerate(BL[kind]): blink_a[f0 + k] = max(blink_a[f0 + k], v * amp)
    blink_starts.append(f0); return True
place_blink(p3e + 10, 'slow', force=True)                              # the wise beat
for (f0, A) in shifts:                                                  # gaze-evoked
    if A >= 30 or (A >= 15 and rng.random() < 0.4): place_blink(f0)
for (a, b) in ph:                                                       # phrase ends / pauses
    if b != p3e and rng.random() < 0.8: place_blink(b + rng.randint(0, 4))
place_blink(f_stop + 2)                                                 # settling beat
t = 8
while t < NF - 8:                                                       # Poisson fill
    rate = 26 if any(a <= t <= b for a, b in ph) else 17
    t += int(rng.expovariate(rate / 60.0) * FPS) + 1
    if rng.random() < 0.9: place_blink(t)
    else: place_blink(t, amp=0.75)
# head joins big shifts (eyes lead): only the part beyond 15 deg, 0.77 gain, +1 frame
head_yaw_add = np.zeros(NF); head_pit_add = np.zeros(NF)
def ease(u): return u * u * (3 - 2 * u)
for i in range(1, NF):
    pass
gy = np.copy(yaw_a - micro_y); gp = np.copy(pit_a - micro_p)
for arr_src, arr_dst, sgn in ((gy, head_yaw_add, 1.0), (gp, head_pit_add, -1.0)):
    tgt_h = np.sign(arr_src) * np.clip(np.abs(arr_src) - 15.0, 0, None) * 0.77
    cur_h = 0.0
    for f in range(1, NF):
        goal = tgt_h[max(1, f - 1)]                                      # +1 frame lag
        cur_h += (goal - cur_h) * 0.18                                   # ~6-8 frame head catch-up
        arr_dst[f] = sgn * cur_h
# lid follow: Transformation constraints (upper 1.0 down / 0.8 up, lower 0.3), influence = 1 - blink
def lid_follow(bone, eye_bone, rng_list):
    pb = PB[bone]
    for c in [c for c in pb.constraints if c.type == 'TRANSFORM']: pb.constraints.remove(c)
    out = []
    for nm_, fmin, fmax, tmin, tmax in rng_list:
        c = pb.constraints.new('TRANSFORM'); c.name = nm_; c.target = arm; c.subtarget = eye_bone
        c.owner_space = 'LOCAL'; c.target_space = 'LOCAL'; c.map_from = 'ROTATION'; c.map_to = 'ROTATION'
        c.from_min_x_rot, c.from_max_x_rot = math.radians(fmin), math.radians(fmax)
        c.to_min_x_rot, c.to_max_x_rot = math.radians(tmin), math.radians(tmax)
        c.mix_mode_rot = 'ADD'; out.append(c)
    return out
LIDCON = {}
for S_ in ("L", "R"):
    LIDCON["lid_up." + S_] = lid_follow("lid_up." + S_, "eye." + S_, [("follow_down", 0, 45, 0, 45), ("follow_up", -45, 0, -36, 0)])
    LIDCON["lid_lo." + S_] = lid_follow("lid_lo." + S_, "eye." + S_, [("follow", -45, 45, -13.5, 13.5)])
cam_fwd_dist = None
def eye_mid(f):
    return Vector((0.0, -0.575 + root_speed * (phi_end - phase(f)), 1.165))
def gaze_target(f):
    M = eye_mid(f); C = cam.location; fwd = (C - M).normalized()
    q = Euler((math.radians(pit_a[f]), 0, 0)).to_quaternion()
    rq_ = cam_up.rotation_difference(cam_up)                             # identity helper
    d = fwd.copy()
    from mathutils import Matrix as _M
    d = (_M.Rotation(math.radians(yaw_a[f]), 3, cam_up) @ d)
    d = (_M.Rotation(math.radians(-pit_a[f]), 3, cam_right) @ d)
    away = min(1.0, math.hypot(yaw_a[f] - micro_y[f], pit_a[f] - micro_p[f]) / 4.0)
    dist = (C - M).length * (1.7 + 3.0 * away)                           # softened vergence at the lens, near-parallel when away
    return M + d.normalized() * dist
def blink(f): return float(blink_a[f]) if 0 <= f < NF else 0.0

# ---------- rebuild the action ----------
if arm.animation_data and arm.animation_data.action:
    old = arm.animation_data.action; arm.animation_data.action = None; bpy.data.actions.remove(old)
arm.animation_data_create(); act = bpy.data.actions.new("Gecko_Performance"); arm.animation_data.action = act
for pb in PB:
    pb.rotation_mode = 'QUATERNION'; pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0)
FACE = [p + s for p in ("lid_up.", "lid_lo.", "eye.", "brow.") for s in ("L", "R")] + ["jaw"]
for nm in FACE: PB[nm].rotation_mode = 'XYZ'; PB[nm].rotation_euler = (0, 0, 0)
def rq(name): return PB[name].bone.matrix_local.to_quaternion()
def lrot(name, q): r = rq(name); return r.conjugated() @ q @ r
def lvec(name, v): return rq(name).conjugated() @ Vector(v)
def wq(yaw=0, pitch=0, roll=0): return Euler((math.radians(pitch), math.radians(roll), math.radians(yaw)), 'XYZ').to_quaternion()
def smt(u): return u * u * (3 - 2 * u)
legs = {"hand_ik.L": (0.0, P["lift"]), "foot_ik.R": (0.04, P["lift_h"]), "hand_ik.R": (0.5, P["lift"]), "foot_ik.L": (0.54, P["lift_h"])}
NT = len([b for b in PB if b.name.startswith("tail")])
def bdir(name):
    bb = PB[name].bone; d = bb.tail_local - bb.head_local; return math.degrees(math.atan2(d.x, d.y))
UNCURL = []; prev = 0.0
for i in range(1, NT + 1):
    desired = 10.0 * math.sin(math.pi * i / NT); delta = -(desired - bdir(f"tail{i}")); UNCURL.append(delta - prev); prev = delta
root_speed = stride / st
for f in range(1, F_END + 1):
    phi = phase(f); s = speed(f); w = 2 * math.pi * phi
    idle_t = max(0, f - f_stop) / FPS
    PB["root"].location = lvec("root", (0, root_speed * (phi_end - phi), 0)); PB["root"].keyframe_insert("location", frame=f)
    for name, (off, lift) in legs.items():
        q = (phi + off) % 1.0
        if q < st: u = q / st; dy = -stride / 2 + stride * u; dz = 0.0; pitch = 0.0
        else: u = (q - st) / (1 - st); dy = stride / 2 - stride * smt(u); dz = lift * math.sin(math.pi * u); pitch = 18 * math.sin(math.pi * u)
        PB[name].location = lvec(name, (0, dy, dz)); PB[name].keyframe_insert("location", frame=f)
        PB[name].rotation_quaternion = lrot(name, wq(pitch=pitch)); PB[name].keyframe_insert("rotation_quaternion", frame=f)
    s1 = math.sin(w) * s; c2 = math.cos(2 * w) * s
    breath = math.sin(2 * math.pi * idle_t / 3.2) * (1 - s)
    torso = {"hips": wq(yaw=P["yaw"] * s1, roll=P["roll"] * s1), "spine": wq(yaw=-0.5 * P["yaw"] * s1, pitch=-0.6 * breath),
             "chest": wq(yaw=-0.7 * P["yaw"] * s1, roll=-P["roll"] * s1, pitch=1.2 * breath), "neck": wq(yaw=0.3 * P["yaw"] * s1, pitch=1.5 * c2 - 0.6 * breath)}
    tot_yaw = P["yaw"] * s1 * (1 - 0.5 - 0.7 + 0.3)
    hx, hy = 0.0, -0.35 + root_speed * (phi_end - phi)
    cam_ang = math.degrees(math.atan2(cam.location.x - hx, -(cam.location.y - hy)))
    tgt.location = gaze_target(f); tgt.keyframe_insert("location", frame=f)
    torso["head"] = wq(yaw=-tot_yaw + head_yaw(f) + 0.3 * cam_ang + head_yaw_add[f], pitch=-2.0 * c2 + head_pitch(f) + head_pit_add[f], roll=1.5 * math.sin(w + 0.6) * s + head_roll(f))
    for name, q_ in torso.items():
        PB[name].rotation_quaternion = lrot(name, q_); PB[name].keyframe_insert("rotation_quaternion", frame=f)
    PB["hips"].location = lvec("hips", (0, 0, P["bob"] * c2)); PB["hips"].keyframe_insert("location", frame=f)
    tail_ph = w + 2 * math.pi * idle_t / 3.8
    amp_scale = max(s, 0.45)
    for i in range(1, NT + 1):
        tt = i / NT; amp = (P["tail_amp0"] + P["tail_amp1"] * tt) * amp_scale
        yaw = UNCURL[i - 1] - amp * math.sin(tail_ph - 0.35 - 0.5 * i)
        PB[f"tail{i}"].rotation_quaternion = lrot(f"tail{i}", wq(yaw=yaw, pitch=2.0 * tt * math.sin(2 * tail_ph - 0.6 * i)))
        PB[f"tail{i}"].keyframe_insert("rotation_quaternion", frame=f)
    bl = blink(f)
    for S_ in ("L", "R"):
        up_ = lid_up_base(f) + (64 - lid_up_base(f)) * bl; lo_ = lid_lo_base(f) + (-15 - lid_lo_base(f)) * bl
        PB["lid_up." + S_].rotation_euler = (math.radians(up_), 0, 0); PB["lid_up." + S_].keyframe_insert("rotation_euler", frame=f)
        PB["lid_lo." + S_].rotation_euler = (math.radians(lo_), 0, 0); PB["lid_lo." + S_].keyframe_insert("rotation_euler", frame=f)
        for c in LIDCON["lid_up." + S_] + LIDCON["lid_lo." + S_]:
            c.influence = 1.0 - bl; c.keyframe_insert("influence", frame=f)
        PB["eye." + S_].rotation_euler = (0, 0, 0)
    for S_, ch, tilt in (("L", browL, 6), ("R", browR, -4)):
        dz = ch(f); PB["brow." + S_].location = (0, 0, dz); PB["brow." + S_].keyframe_insert("location", frame=f)
        PB["brow." + S_].rotation_euler = (0, math.radians(tilt * min(1, abs(dz) / 0.015) * (1 if dz > 0 else 0)), 0); PB["brow." + S_].keyframe_insert("rotation_euler", frame=f)
    PB["jaw"].rotation_euler = (math.radians(jaw(f)), 0, 0); PB["jaw"].keyframe_insert("rotation_euler", frame=f)
for layer in act.layers:
    for strip in layer.strips:
        for cb in strip.channelbags:
            for fc in cb.fcurves:
                for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
# lip shape keys on their own action
body = bpy.data.objects["Gecko_Body"]; skey = body.data.shape_keys
if skey.animation_data and skey.animation_data.action:
    oa = skey.animation_data.action; skey.animation_data.action = None; bpy.data.actions.remove(oa)
skey.animation_data_create(); skey.animation_data.action = bpy.data.actions.new("Gecko_Visemes")
for f in range(1, F_END + 1):
    for k in LIPKEYS:
        kb = skey.key_blocks[k]; kb.value = track(k, f); kb.keyframe_insert("value", frame=f)
# sound strip so the .blend plays the line in sync
se = sc.sequence_editor or sc.sequence_editor_create()
strips = se.strips if hasattr(se, "strips") else se.sequences
for s_ in list(strips):
    if s_.name == "SageLine": strips.remove(s_)
snd = strips.new_sound("SageLine", AUDIO, 1, S0)
PERF_INFO = dict(f_stop=f_stop, speech_start=S0, frame_end=F_END, phrases=ph, root_travel=round(root_speed * phi_end, 3))
