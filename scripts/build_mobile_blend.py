"""Build the 9:16 mobile blocking scene from the desktop one.

Run headless from the repo root, always against the DESKTOP file:
  /Applications/Blender.app/Contents/MacOS/Blender -b \
    docs/hero/blocking/ipstudios-hero-blocking.blend \
    --python scripts/build_mobile_blend.py

The desktop .blend is never saved. Everything here is written to
docs/hero/blocking/ipstudios-hero-blocking-mobile.blend, so the script can be
re-run from scratch whenever the framing changes.

What it changes (same timeline, markers and one continuous shot):
- 720x1280 output, Phone_* screens hidden.
- New camera rest framings, solved from the approved wireframes
  (docs/hero/mobile/wireframes.html). Moves between rests keep the desktop
  key timing and shape: every desktop key is shifted by an offset blended
  between the neighbouring rest offsets.
- delta_location keys that restage the cast for World, Team and Contact.
"""
import math
import os
import bpy
from mathutils import Vector

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DESKTOP = os.path.join(REPO, "docs/hero/blocking/ipstudios-hero-blocking.blend")
MOBILE = os.path.join(REPO, "docs/hero/blocking/ipstudios-hero-blocking-mobile.blend")

if os.path.abspath(bpy.data.filepath) != DESKTOP:
    raise SystemExit(f"Open the desktop scene, not {bpy.data.filepath}")

sc = bpy.context.scene
CAM, AIM = sc.objects["HeroCam"], sc.objects["CamAim"]

# Wireframe space: a 360x640 portrait frame, y measured from the top.
W, H = 360.0, 640.0
TAN_V = 18 / CAM.data.lens          # sensor fit AUTO puts the 36 mm side on the height
TAN_H = TAN_V * 9 / 16
AIM_DIST = 12.0


def basis(yaw, pitch):
    f = Vector((math.sin(yaw) * math.cos(pitch), math.cos(yaw) * math.cos(pitch), math.sin(pitch)))
    r = Vector((math.cos(yaw), -math.sin(yaw), 0.0))
    return f, r, r.cross(f)


def project(c, yaw, pitch, p):
    f, r, u = basis(yaw, pitch)
    v = p - c
    d = v.dot(f)
    return W / 2 * (1 + v.dot(r) / (d * TAN_H)), H / 2 * (1 - v.dot(u) / (d * TAN_V))


def pitch_for_horizon(frac):
    return math.atan((2 * frac - 1) * TAN_V)


def floor_point(c, yaw, pitch, sx, sy, z=0.0):
    f, r, u = basis(yaw, pitch)
    d = f + r * ((2 * sx / W - 1) * TAN_H) + u * ((1 - 2 * sy / H) * TAN_V)
    return c + d * ((z - c.z) / d.z)


def solve_cam(guess, yaw, pitch, targets):
    """Gauss-Newton on the camera position. targets: (world point, sx or None, sy or None)."""
    c = Vector(guess)

    def residuals(c):
        out = []
        for p, tx, ty in targets:
            sx, sy = project(c, yaw, pitch, p)
            if tx is not None:
                out.append(sx - tx)
            if ty is not None:
                out.append(sy - ty)
        return out

    for _ in range(60):
        r0 = residuals(c)
        J = []
        for i in range(3):
            dc = c.copy()
            dc[i] += 1e-4
            J.append([(a - b) / 1e-4 for a, b in zip(residuals(dc), r0)])
        # normal equations, 3x3
        A = [[sum(J[i][k] * J[j][k] for k in range(len(r0))) + (1e-6 if i == j else 0) for j in range(3)] for i in range(3)]
        g = [sum(J[i][k] * r0[k] for k in range(len(r0))) for i in range(3)]
        from mathutils import Matrix
        step = Matrix(A).inverted() @ Vector(g)
        c -= step
        if step.length < 1e-6:
            break
    return c


def at(obj, frame):
    sc.frame_set(frame)
    return obj.matrix_world.translation.copy()


CH = {n: sc.objects[f"CH_{n}"] for n in ("tung", "capp", "cheese", "gor", "ninja", "pata", "trala", "zeb")}
HEIGHT = {"tung": 2.24, "capp": 1.77, "cheese": 1.74, "gor": 2.02, "ninja": 1.63, "pata": 2.37, "trala": 1.64, "zeb": 1.6}
HORIZON = pitch_for_horizon(0.55)

# ---------------------------------------------------------------- rest cameras
rests = {}  # rest key frame -> (cam pos, yaw, pitch)

# R1 Cover: Tung centre-right, feet near the bottom, head at the horizon.
t = at(CH["tung"], 200)
c1 = solve_cam((2, -11, 2.3), 0.0, HORIZON, [
    (t, 200, 600), (t + Vector((0, 0, HEIGHT["tung"])), None, 364)])
rests[264] = (c1, 0.0, HORIZON)

# R2 World: pull back; the cast is restaged onto this camera below.
t = at(CH["tung"], 700)
c2 = solve_cam((1.2, -13.7, 2.5), 0.0, HORIZON, [
    (t, 176, 518), (t + Vector((0, 0, HEIGHT["tung"])), None, 368)])
rests[744] = (c2, 0.0, HORIZON)

# R3 Proof: Tung alone on the lifted platform, centred in the bottom third.
t = at(CH["tung"], 1120)
c3 = solve_cam((-2.5, -9.5, 4.4), 0.0, HORIZON, [
    (t, 182, 562), (t + Vector((0, 0, HEIGHT["tung"])), None, 412)])
rests[1050] = rests[1200] = (c3, 0.0, HORIZON)

# R4 Problem: keep the desktop graph-view heading, Tung at the peak under the copy.
yaw4 = math.atan2(1.5, 10.5)
t = at(CH["tung"], 1570)
c4 = solve_cam((-4, -10, 3), yaw4, HORIZON, [
    (t, 206, 484), (t + Vector((0, 0, HEIGHT["tung"])), None, 356)])
rests[1512] = rests[1640] = (c4, yaw4, HORIZON)

# R5 Vision: keep the desktop orbit end heading; disc centred between inputs and outputs.
yaw5 = math.atan2(-11.87, 9.96)
t = at(CH["tung"], 2100)
c5 = solve_cam((10, -8.4, 6.5), yaw5, HORIZON, [
    (t, 180, 455), (t + Vector((0, 0, HEIGHT["tung"])), None, 350)])
rests[2053] = rests[2173] = (c5, yaw5, HORIZON)

# R6 Team: front on, raised so two rows fit under the circles.
c6 = Vector((0.0, -12.3, 4.0))
rests[2484] = (c6, 0.0, HORIZON)

# R7 Contact: back to the cover framing.
rests[2593] = rests[2800] = (c1, 0.0, HORIZON)
rests[1] = (c1, 0.0, HORIZON)
rests[624] = rests[744]
rests[2260] = rests[2484]

# ------------------------------------------------------------ camera keys
def loc_fcurves(obj):
    a = obj.animation_data.action
    try:
        fc = list(a.fcurves)
    except AttributeError:
        fc = [f for l in a.layers for s in l.strips for cb in s.channelbags for f in cb.fcurves]
    return sorted([f for f in fc if f.data_path == "location"], key=lambda f: f.array_index)


def desk_key(fcs, frame):
    for i, k in enumerate(fcs[0].keyframe_points):
        if int(round(k.co.x)) == frame:
            return Vector([fcs[j].keyframe_points[i].co.y for j in range(3)])


cam_fc, aim_fc = loc_fcurves(CAM), loc_fcurves(AIM)
offsets = {}
for fr, (c, yaw, pitch) in rests.items():
    f, _, _ = basis(yaw, pitch)
    offsets[fr] = (c - desk_key(cam_fc, fr), c + f * AIM_DIST - desk_key(aim_fc, fr))
rest_frames = sorted(offsets)


def blended(fr, which):
    if fr in offsets:
        return offsets[fr][which]
    lo = max(x for x in rest_frames if x < fr)
    hi = min(x for x in rest_frames if x > fr)
    s = (fr - lo) / (hi - lo)
    s = s * s * (3 - 2 * s)
    return offsets[lo][which].lerp(offsets[hi][which], s)


for fcs, which in ((cam_fc, 0), (aim_fc, 1)):
    for i, k in enumerate(fcs[0].keyframe_points):
        fr = int(round(k.co.x))
        off = blended(fr, which)
        for j in range(3):
            kp = fcs[j].keyframe_points[i]
            kp.co.y += off[j]
            kp.handle_left.y += off[j]
            kp.handle_right.y += off[j]
    for f in fcs:
        f.update()

# ------------------------------------------------------------ cast restaging
def key_delta(name, frames_vals):
    o = CH[name]
    for fr, v in frames_vals:
        o.delta_location = v
        o.keyframe_insert("delta_location", frame=fr)


def place(cam, wire):
    c, yaw, pitch = cam
    return {n: floor_point(c, yaw, pitch, sx, sy) for n, (sx, sy) in wire.items()}


ZERO = Vector((0, 0, 0))

# World: two depths, Tung and Patapim behind, Cappuccina and Tralalero in front.
world = place(rests[744], {"pata": (282, 500), "tung": (180, 508), "capp": (80, 556), "trala": (232, 578)})
for n, p in world.items():
    d = p - at(CH[n], 700)
    d.z = 0
    key_delta(n, [(265, ZERO), (560, d), (745, d), (860, ZERO)])

# Team: two staggered rows of four.
team = place(rests[2484], {
    "zeb": (62, 520), "pata": (142, 522), "gor": (222, 520), "ninja": (298, 520),
    "trala": (80, 612), "capp": (148, 612), "tung": (216, 614), "cheese": (284, 612)})
# Contact: Tung a step closer, the rest idling at both edges, inside the phone-safe lines.
contact = place(rests[2800], {
    "zeb": (60, 470), "gor": (112, 486), "trala": (72, 538), "cheese": (134, 520),
    "pata": (298, 468), "capp": (256, 492), "ninja": (300, 540), "tung": (206, 626)})
for n in CH:
    d6 = team[n] - at(CH[n], 2400)
    d7 = contact[n] - at(CH[n], 2700)
    d6.z = d7.z = 0
    key_delta(n, [(2200, ZERO), (2318, d6), (2485, d6), (2600, d7)])

# Proof giants: sink them so their tops stay under the copy band.
for g in ("Giant_0", "Giant_1", "Giant_2"):
    sc.objects[g].delta_location = (0, 0, -3.5)

# ------------------------------------------------------------ output
for o in sc.objects:
    if o.name.startswith("Phone_"):
        o.hide_render = o.hide_viewport = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 720, 1280, 100
sc.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=MOBILE)
print("WROTE", MOBILE)
for fr in sorted(rests):
    c, yaw, pitch = rests[fr]
    print(f"REST {fr}: cam ({c.x:.2f}, {c.y:.2f}, {c.z:.2f}) yaw {math.degrees(yaw):.1f}")
