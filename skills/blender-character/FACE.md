# Face: eyes, mouth, lip sync

Sources for every number: [research/eye-animation.md](./research/eye-animation.md)
and [research/cartoon-mouth.md](./research/cartoon-mouth.md). Values are
starting points at 24 fps; tune by render.

## Eyes

**Rig.** Eye bones carry a Damped Track to one look-target empty (world-space,
so the eyes stay fixed while the head bobs — the vestibulo-ocular reflex for
free). Rotations keyed on the same bone are overridden by the constraint;
animate the *target*. Key the target every frame from **angles** relative to
the eye→camera line (a metre offset changes size as the character walks
closer). While looking at the lens put the target ≈ 1.7× the camera distance
behind the eyes (softens cross-eye); push it far when looking away.

**Gaze model** (a dead stare = a perfect constant lock):
- **Saccades**: 2 frames (< 8°), 3 (8–20°), 4 (> 20°), front-loaded profile
  `2: 0, .75, 1 · 3: 0, .45, .88, 1 · 4: 0, .30, .70, .93, 1`, +4 % overshoot for
  one frame on shifts > 10°. Never a cosine drift.
- **Listening/walking**: long holds on the viewer (≈ 190 f), rare small glances.
- **Speaking**: glance away ≈ 1 s before a phrase (up = thinking, sideways
  otherwise), return during/at the phrase end, stay locked through the last
  ≈ 2.4 s of the final phrase.
- **Fixation**: sparse 1-frame re-targets of 1–1.8° every 15–36 frames, none
  within 4 frames of a saccade; no continuous noise.
- **Head joins** only shifts > 15°, taking 0.77 of the excess, starting a frame
  after the eyes.

**Blinks:**
- Shape: close 2 frames accelerating, hold 1, open 4–5 frames exponential
  (`0, .45, 1, 1, .55, .25, .10, .03, 0`). Linear blinks read mechanical. One
  slow blink (≈ 16 frames) for a thoughtful beat.
- Timing: on large gaze shifts, at most phrase ends/pauses, plus random fill
  at ≈ 17/min (listening/walking) and ≈ 26/min (speaking); ≥ 24 frames apart,
  none in the first/last 8 frames. Seed the RNG.
- A closed blink must fully close: drive lid-follow influence with `1 − blink`.

**Lids follow the eye** vertically: Transformation constraints on each lid bone
reading the eye bone's LOCAL X rotation (mix ADD): upper lid gain 1.0 looking
down / 0.8 up, lower lid 0.3. Check the sign on a test frame by measuring the
eye's world gaze vector — an inverted pitch makes "look up" close the lids.

**Expression reads:** heavy half-closed lids read *drunk/sleepy*, not wise.
Age comes from brows, under-eye bags (thick lower lid), wrinkles; keep the
upper lid resting just over the iris top. Brows move asymmetrically for a
knowing squint.

## Mouth

**Geometry** (MODELING.md § Cavities): a real mouth bag carved before the final
remesh — floor, roof, throat funnel — modelled **slightly open at rest**
(≈ 22 mm centre gap at 1.5 m scale); a `lips_closed` shape key (value 1 at rest)
closes it, leaving a ~1 mm dark crease line. Only the middle ±45–55° of the
smile opens; beyond the corners continue the smile as a closed sculpted groove
(opening the full line reads as a clamshell).

**Lip space** — per vertex, stored as attributes and used by weights, shape keys
and shaders:
- `u` = azimuth around the snout / opening half-angle (|u| ≤ 1 opens),
- `s` = height above the lip line **at that azimuth** (a nearest-curve-point
  frame is wrong: far vertices snap to a corner and read as "on the lip" — this
  put jaw weight on the brow between the eyes),
- `d` = distance under the pre-cut outer skin.

**Jaw:** pivot behind and above the mouth corners (the lizard quadrate
position), not at the corners. Weights (Rigify's ellipse, corners sealed at
0.5/0.5 so the opening is an oval, never a hinge):
`ell = sqrt(1-u²)`, lower lip `0.5+0.5·ell`, upper lip `0.5·(1-ell)`, blended
to rigid (below → 1, above → 0) with `smoothstep(0, 0.03, |s|)`, times a long
smooth throat falloff behind the jaw angle and a head mask; smooth by edges.

**Shading:** lip roll stays skin-coloured; interior colour starts 2–5 mm deep
and runs pink → red → maroon → near-black with `d`, multiplied by local AO,
plus a thin coat for wetness. Restrict it to the mouth region (|u| ≲ 1.1,
|s| ≲ 0.06) or closed creases and folds turn pink.

**Tongue:** broad, ≈ 70–85 % of the inner jaw width, root sunk into the floor,
top below the lower-lip line; wet SSS pink, papillae bump, darker toward the
root. Build and parent it to the jaw **at rest pose** (placing it while the rig
is posed offsets it through the lip).

## Lip sync

- **Rhubarb Lip Sync** gives timed mouth shapes A–H/X from a wav (+ optional
  dialogue text). On Apple Silicon the official build is x86_64 and segfaults
  under Rosetta; build it natively (`brew install cmake boost`;
  `cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_OSX_ARCHITECTURES=arm64`;
  `cmake --build . --target rhubarb`; ship the binary with its `res/` folder).
  Run: `rhubarb -r pocketSphinx -f json --extendedShapes GHX --dialogFile line.txt -o line.rhubarb.json line.wav`.
- **Separate jaw and lip tracks (JALI).** Per shape: jaw target × loudness band
  (`JA = clip(0.5 + 0.35·(I − mean)/sd, 0.15, 0.9)` from the cue's RMS), lip
  shape-key weights from the table; 2-frame ramps between cues; shapes lead
  the audio by 1 frame; M/B/P (A) forces lips closed and jaw 0.

  | Shape | jaw | lip keys |
  |---|---|---|
  | X rest | 0 | lips_closed 1 |
  | A M/B/P | 0 | lips_closed 1, lips_press .6 |
  | B | .12 | lips_closed .9, lips_wide .5 |
  | C | .40 | lips_closed .7, lips_wide .3 |
  | D | .85 | lips_closed .4 |
  | E | .35 | lips_closed .8, lips_round .6 |
  | F | .12 | lips_closed 1, lips_pucker 1 |
  | G F/V | .05 | lips_closed 1, lowerlip_tuck 1 |
  | H L | .45 | lips_closed .6 |

- Lip shape keys are analytic displacements in lip space (tangent along the
  mouth for wide/round/pucker, lip-up vector for closing/tuck), masked by
  `exp(-(s/0.04)²)` and depth. Shape keys go on their own action on the shape-key
  datablock.
- Placeholder voice without an account: macOS `say -v "Grandpa (English (US))" -r 138 -o line.aiff "…[[slnc 450]]…"`.
  Plan for a real TTS (e.g. ElevenLabs) later; the pipeline re-derives
  everything from whichever wav is present.

## Acting

Detect phrases from the audio envelope (voiced runs separated by ≥ 8 silent
frames) and hang gestures on them: a head tilt and raised brows opening a
phrase, a glance up for "thinking" lines, small nods on stressed words, a
knowing squint and slow blink on the closing beat.
