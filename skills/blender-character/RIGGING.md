# Rigging and skinning

## Armature

- Build bones in edit mode from the same coordinates the body script used
  (keep them in one place, or read them from scene properties). `root`
  (non-deform) → hips → spine → chest → neck → head; tail as a resampled chain
  (≈12 bones for a long tail); per leg two IK-chain bones plus a hand/foot bone
  parented to a non-deform `*_ik` control under `root`.
- **IK without pole targets** reproduces the rest pose exactly when the target
  sits at the chain end, and bends joints the way they were sculpted. Poles
  guessed by hand twist limbs.
- Verify the rest pose immediately: evaluated mesh vs. base mesh, max vertex
  displacement must be 0 before any animation exists.
- Face bones ride on the head: `eye.*`, `lid_up.*`, `lid_lo.*`, `brow.*`, `jaw`,
  created with `align_roll(-up)` so local X is the lid/jaw hinge. Bone-parent
  eyeballs, lids, brows and tongue to them (update the view layer first, keep
  `matrix_world`).

## Computed skin weights (automatic weights fail on dense remeshed meshes)

In order, all numpy over the vertex array:

1. **Distance to each deform bone segment**; weights = softmax of
   `-(d - d_min)/τ`, τ ≈ 0.02–0.03 m. Truncate tiny values.
2. **Side mask** for left/right limb bones (zero on the far side of the
   midline, soft ramp over a few cm). Move the stripped weight to the vertex's
   nearest *torso* bone — renormalizing instead turns small partial weights
   into all-or-nothing and tears skin at elbows.
3. **Laplacian smoothing** over mesh edges (8–18 iterations of
   `W = 0.5W + 0.5·mean(neighbours)`). It respects connectivity, so it will not
   bleed across open gaps (open lips).
4. Re-apply the side mask (smoothing leaks a few % across the chest midline;
   opposing arms then pinch a crease down the centre).
5. **Orphans**: any vertex whose weights all got masked gets its nearest torso
   bone at 1.0. Unweighted vertices stay frozen and spike.
6. **Hands/feet by connectivity**: union-find over edges restricted to
   ground-level vertices gives one island per foot; hard-assign each island to
   its own hand/foot bone. Nearest-bone distance lets a front finger belong to
   a hind foot.
7. Special regions (jaw) are computed as smooth analytic fields (FACE.md), then
   `W *= (1 - w_special)` and the special group appended.

Every falloff is a smoothstep. A hard cutoff (`y < k`) always shows as a fold.

## Deform stack

Armature (Preserve Volume on) → Corrective Smooth (`rest_source='ORCO'`,
length-weighted, **vertex-group-masked off regions driven by shape keys** —
it otherwise smooths the shape keys away) → Subdivision Surface (render).

## Measure deformation

Do this after every weight or pose change, before rendering. `tools/gate.py`
runs the first three headless; the rest are short ad-hoc scripts.

- **Rest drift**: armature at REST must move nothing.
- **Unweighted vertices**: must be 0.
- **Edge stretch** per sampled frame: ratio of evaluated to rest edge length;
  count edges > 1.8 or < 0.45 and group them by owning bone (argmax weight) to
  locate the problem. Healthy: a few hundred at worst on a ~150k-edge body.
  The jaw legitimately tops the list while the mouth is open (the bag walls
  stretch by design) — judge that region by render, everything else by number.
- **Region audit**: average weights and shape-key displacement for a box of
  vertices where the user saw a problem. A patch that should be skull-only but
  carries jaw weight is the bug.
- **Clipping**: KD-tree closest approach between vertex sets of limbs that
  swing past each other, across the cycle.
- **Direction checks**: world-space vector of a tracked bone (eye) per frame to
  confirm up/down/left/right signs.
