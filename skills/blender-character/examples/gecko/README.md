# Worked example: the wise gecko

A quadruped cartoon gecko that walks toward the camera, stops and delivers a
line with lip sync, eye acting and a flowing tail. Every stage below is a text
block inside the .blend; `gecko_rebuild.py` runs them in this order:

| Stage | Script | Produces |
|---|---|---|
| helpers | `lizard_helpers.py` | `ellipsoid`, `curve_tube`, `principled`, `set_parent`, … |
| body | `gecko_body.py` | metaball sculpt (standing pose, sockets, digits) → voxel mesh |
| mouth | `gecko_mouth.py` | lip curve, mouth-bag cutter carved before remesh #2, closed smile groove, pre-cut skin copy |
| folds | `gecko_wrinkles.py` | throat folds as smooth normal offsets |
| (rebuild) | `gecko_rebuild.py` | decimate with the head protected, `rest_co` attribute |
| lip space | `gecko_mouthdepth.py` | `lip_u/s/d` attributes, depth-shaded mouth interior |
| rig | `gecko_rig.py` | armature, IK legs, 12-bone tail, jaw at the quadrate position |
| weights | `gecko_weights.py` | computed weights, side masks, foot islands, analytic jaw field |
| shapes | `gecko_shapekeys.py` | `lips_closed` + viseme lip keys, Corrective Smooth mask, Subsurf |
| eyes | `gecko_eyes.py` | eyeballs + lid shells (called at build time) |
| face | `gecko_face.py` | eye/lid/brow/jaw bones, bone-parenting |
| tongue | `gecko_tongue.py` | sculpted tongue on the jaw (built at rest pose) |
| performance | `gecko_performance.py` | walk-in with root motion and landing stop, idle, Rhubarb lip sync, gaze/blink model, acting |

Numbers are tuned for a ~1.5 m-long creature at 24 fps. Treat them as starting
values; the structure is the reusable part.
