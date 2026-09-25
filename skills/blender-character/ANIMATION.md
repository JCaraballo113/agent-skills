# Body animation

## Keying model

Generate the whole shot in one performance script: compute every channel as a
function of the frame and key every frame with LINEAR interpolation (no Bézier
overshoot between generated keys). Author timing as a few keyed scalar curves
(`curve([(frame, value), …])` with cosine ease) and combine them per frame.
Pose bones in world terms: `local = rest_q⁻¹ · world_q · rest_q` with
`rest_q = bone.matrix_local.to_quaternion()`; the same for location vectors.
In-place loops for game export get a CYCLES F-curve modifier; a shot with a
stop is keyed straight through.

## Quadruped walk with planted feet

- Gait: diagonal pairs (front-left with hind-right) half a cycle apart; stance
  ≈ 60 % of the cycle. Same stride length on front and hind feet.
- Stance: the IK target slides backward linearly by the stride. Swing: it
  returns with smoothstep forward motion, a sine lift (front ≈ 6 cm, hind
  ≈ 7.5 cm at 1.5 m scale) and a small toe-up pitch.
- **Root motion** moves the root forward by `stride / stance` per unit of phase,
  which exactly cancels the stance slide: feet plant in world space.
- Pace: an old or heavy character ≈ 2.3 s per cycle at 24 fps; 1.7 s reads
  hurried.
- **Stopping**: decelerate the phase linearly to rest, choosing the deceleration
  length so the final phase lands where every foot is in stance (≈ 0.05 into
  the cycle for a diagonal gait) — no foot is left hanging mid-swing. Scale body
  sway by the current speed.
- Body: hips/chest yaw in an S (hips +, spine −½, chest −0.7), small counter
  roll, a twice-per-cycle bob; the head counter-rotates the summed yaw to stay
  on target.

## Tail

Many bones (≈12). First straighten the resting curl into a gentle S by adding,
per bone, the difference between its rest direction and the desired direction
(incremental yaw). Then a travelling wave: amplitude growing toward the tip,
phase lagging ≈ 0.5 rad per bone and lagging the hip sway, plus a small
second-harmonic lift. Keep ≈ 45 % amplitude when idle so it never freezes.

## Idle

After a stop: slow breathing (chest/spine pitch ±1°, ≈ 3.2 s period), tail
still waving at reduced amplitude, head gestures from the dialogue
(FACE.md § Acting).

## Camera

For a character who addresses the viewer, put the camera on his walking line
at head height, slightly off-axis, and have him walk toward it. Eye tracking
and head-turn code read the camera position, so re-run the performance after
moving the camera.
