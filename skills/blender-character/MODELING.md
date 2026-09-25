# Modeling organic characters procedurally

## Sculpt with metaballs, then remesh

One continuous organic surface reads as a sculpt; a kit of primitives reads as
a toy (seams, clipping, fingers inside fingers). Build the body from metaball
elements, convert, voxel-remesh:

- Visible radius is a fraction **K** of `radius × size`, and K depends on
  stiffness (threshold 0.6): stiffness 2 → 0.571, 4 → 0.681, 8 → 0.758, 16 → ~0.8.
  Divide the size you want by `K(stiffness)`. Measure it yourself if the
  threshold changes (convert a single ball and read its bounding box).
- `ELLIPSOID` elements for masses (size_x/y/z = semi-axes / K, rotated via
  quaternion), `CAPSULE` for limbs (size_x = half length), and dense `BALL`
  chains for tails and digits (resample the control points with Catmull-Rom so
  the chain does not look beaded).
- **Digits that must stay separate** (fingers, toes): soft stiffness-2 balls
  only at the base (gives natural webbing), stiffness-8 balls from the knuckle
  out — a stiff field ends near its surface, so neighbours cannot bridge. Fan
  them wide enough (≈160° on a hand).
- **Sockets**: negative metaballs (`use_negative = True`) carve eye sockets;
  put ridge ellipsoids above them for brows that belong to the skull.
- Convert: `bpy.data.meshes.new_from_object(meta.evaluated_get(depsgraph))`,
  then Remesh (VOXEL, ~0.0065 m for a ~1.5 m creature) + Corrective Smooth
  (use_only_smooth) and bake.

## Sculpt the pose the animation lives in

The rest pose must be the working pose. A creature sculpted sitting and posed
standing for a walk tears at the hips no matter how it is weighted. Model it
standing: hips raised, belly off the ground, legs under the body, tail
trailing. Give a quadruped enough body length that same-side front and hind
feet never share ground (measure closest approach; aim ≥ 15 cm at 1.5 m scale).

## Cavities and folds

- **Carve cavities before the final remesh** (mouth bag, nostrils): a boolean
  DIFFERENCE of a lofted cutter, then remesh again. The remesher rounds the
  edges into lips for free and fuses anything thinner than ~2 voxels — use
  that to seal corners. Keep openings ≥ 3 voxels where they must stay open.
- Keep an untouched copy of the pre-cut outer skin (hidden object); distance to
  it is the "depth under the skin" used for shading and lip coordinates.
- **Folds and creases are normal-offset displacements, not booleans.**
  `offset = -depth * exp(-(dist_to_fold_curve / width)^2)` along the vertex
  normal, `width ≥ 3–4` edge lengths. Booleans leave sawtooth slivers.

## Density

- Stop decimating regions that deform or get close-ups (head, mouth). Protect
  them with a Decimate vertex group (invert, high factor) and **compensate the
  ratio**: `ratio = (protected + r × rest) / total`. A global ratio with a large
  protected region collapses the unprotected body to nothing.
- Add Subdivision Surface at render time (viewport 0, render 1), last in the
  modifier stack.

## Separate parts

- Eyeballs: spheres centered in the sockets; iris/pupil/glint painted in the
  shader around the eye's local +Z (see FACE.md), not as extra geometry —
  highlight spheres read as moles.
- Lids: sphere-cap shells around the eye centre, radius ≈1.05× eye, Solidify
  with rim. Tilt the cap axis **away** from the gaze so its back edge buries in
  the skull; a cap tilted toward the gaze floats like a hat.
- Hair tufts (brows, whiskers): tapered `curve_tube`s (bevel + per-point radius)
  rooted by raycasting onto the surface. Keep them clearly hair-like; short
  white pointed shapes near a mouth read as fangs.

## Textures that stick to deforming skin

Object/Generated coordinates swim when an armature deforms the mesh. Store the
rest positions as a `FLOAT_VECTOR` point attribute (`rest_co`) after the final
mesh is baked and drive every procedural texture from an Attribute node reading
it. Separate parts sharing the material (lids) get their own `rest_co` in the
body's space.
