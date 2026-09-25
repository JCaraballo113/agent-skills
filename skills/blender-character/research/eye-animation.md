# Eye movement and blinking for the stylized gecko: research and procedural rules

Research date: 2026-09-25. Target: the script-keyed "wise old gecko" in `wise_lizard.blend`. Its `eye.L`/`eye.R` bones carry a Damped Track to `Gecko_LookTarget`, and its lid shells are driven by a 0–1 blink value.

**Legend**
- Every factual claim links inline to the source where I checked it.
- **JUDGEMENT** marks a number or rule I derived from the sources for this character. No source states it directly.
- **UNVERIFIED** marks a claim I could not confirm from a primary source.
- **VERIFIED LOCALLY** marks a Blender behaviour I tested myself in a throwaway `--factory-startup` Blender 5.2.2 background session. The user's scene was not touched.
- Unit conversion used throughout: at 24 fps, 1 frame = 41.7 ms.

**Scene facts measured read-only from the open file.** I read these via the Blender MCP and restored the current frame afterwards.

| Quantity | Value |
|---|---|
| fps / range | 24 fps, frames 1–382 |
| Eye centres (`eye.L` / `eye.R` heads) | 0.39 m apart |
| Eyeball | `Gecko_Eye_L` is 0.30 m in diameter |
| Eye-to-camera distance | 3.76 m at f1, 3.17 m at f120, then about 3.15 m from f180 to the end |
| Look target | `Gecko_LookTarget` sits exactly on the camera (distance 0) on every sampled frame |
| Total vergence (angle between the two eye→camera rays) | 5.9° at f1, 7.0–7.1° from f120 on |
| Camera | 55 mm lens, 36 mm sensor. Render 1600×1600 at 50 % = 800×800 px |
| Motion blur | **off** (EEVEE, `motion_blur_steps = 1`) |
| Rig | `lid_up.*`, `lid_lo.*` and `brow.*` are children of `head` with no constraints. `head` uses quaternions and the eye/lid bones use XYZ Euler. |

Derived (**JUDGEMENT**, simple geometry): the eye spans about 0.30/3.15 × 55/36 ≈ 14.6 % of frame width, which is about 117 px at 800 px output (233 px at 1600). One degree of eye rotation moves the pupil by about r·θ = 0.15 m × 0.01745 ≈ 2.6 mm, or 0.87 % of the eye's diameter. That is only **about 1 px at the current 800 px output** (about 2 px at 1600). The numbers in §2 depend on this.

---

## 0. Diagnosis: why the current eyes read as unnatural

| Current behaviour | What the sources say | Consequence |
|---|---|---|
| Both eyes lock on the lens, constant, for the whole shot | In Lee et al.'s test, faces with eyes "fixated on the camera" (Type I) were described as "cautious, demanding, sleepy-looking (not lively) and cold". "No eye movement gave the character a lifeless quality" ([Eyes Alive §6–7](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)). Speakers look at the listener only about 41 % of the time, and listeners about 75 % ([Eyes Alive §4.3](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf), citing Argyle & Cook; see also Kendon's 20–50 % while speaking vs 30–80 % while listening, quoted in [Cummins 2012](https://web.archive.org/web/20220131162353/https://cspeech.ucd.ie/Fred/docs/cumminsBlinkingGazeSub2Revised.pdf)). | "Dead stare" |
| Glances are cosine-eased drifts over 3–6 frames | Saccades are "rapid" and "stepwise … as opposed to a fluent, continuous one". Duration is D ≈ 25 ms + 2.4 ms/deg × A ([Eyes Alive §2.1, §5](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)). "Saccades of 5–10 degrees have durations of 30–40 msec, or approximately one frame at 30 Hz" ([Ruhland et al. §3.1.1](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)). At 24 fps even a 30° saccade lasts about 2.3 frames. | Glances read as floaty "swimming", not as thought |
| Glance offsets are in metres along the camera axes | **JUDGEMENT:** the same metric offset gives a larger angle as the gecko walks closer (3.76 m → 3.15 m), so glance size drifts with distance. | Inconsistent glances |
| Fixed 10-frame holds, then ease back | Inter-saccade intervals are highly variable. Talking mode: gaze-away holds of 27.8 ± 24.0 frames at 30 fps, mutual-gaze holds of 93.9 ± 94.9 frames ([Eyes Alive §4.3](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)). Fixation durations can be modelled as exponential ([Ruhland §3.1.4](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)). | Mechanical rhythm |
| Blinks are linear 2/1/6 frames (375 ms) | Linear profiles were rated **least** natural of all the profiles tested. The data-driven asymmetric profile was best, and 9 frames at 30 fps (300 ms) was the top-rated duration ([Trutoiu et al. 2011 §4.2](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)). | Blink looks "mechanical" |
| Blinks at hand-picked fixed frames, never tied to gaze or head shifts | Gaze shifts over 33° come with lid-closing EMG 97 % of the time ([Evinger et al. 1994](https://pubmed.ncbi.nlm.nih.gov/7813670/)). Speaker blinks cluster "at the end and during pauses in speech" ([Nakano & Kitazawa 2010](https://pubmed.ncbi.nlm.nih.gov/20700731/)). | Blinks feel unmotivated |
| Lids ignore vertical gaze | Lid and eye "assumed essentially equal average positions" during vertical fixation, and lid saccades are "a faithful replica" of eye saccades ([Becker & Fuchs 1988](https://pubmed.ncbi.nlm.nih.gov/3193155/)). | Looking down exposes sclera above the iris (reads as alarm). Looking up hides the iris under the lid. |
| No eye motion during blinks | Blinks are "consistently accompanied by transient downward and nasalward movements of both eyes with amplitudes 1–5 degrees" ([Collewijn et al. 1985](https://pubmed.ncbi.nlm.nih.gov/4031978/)). | Minor. Adds life at blink onset and offset. |
| Motion blur off | Motion blur raised ratings of fully closed blinks ([Trutoiu §4.1.2](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)). | 1–2-frame saccades and blinks will strobe |

What is already right:
- The blink asymmetry (fast close, slow open) matches human data ([Trutoiu §2.1](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)).
- The overall blink count, 6 in 16 s = 22.5/min, sits between the 17/min rest rate and the 26/min conversation rate ([Bentivoglio et al. 1997](https://pubmed.ncbi.nlm.nih.gov/9399231/)).
- The world-space Damped Track already gives a correct vestibulo-ocular reflex (§6).

---

## 1. Saccades

### 1.1 Main sequence (duration and velocity vs amplitude)
- Bahill, Clark & Stark coined "main sequence" for "the relationships between duration, peak velocity, and magnitude of human saccades over a thousandfold range". Duration relates to amplitude "in a nonlinear manner … from 3 minutes of arc to 50 degrees; data scatter is extremely small". Peak velocity is "quasi-linear … up to about 15 or 20 degrees, … where it reaches a soft saturation limit" ([Bahill et al. 1975, pp. 191–195](http://www.visualcognition.ca/spering/reading/Bahill.Clark.Stark.MathBiosci.1975.pdf)).
- Linear approximation for 5–50°: D = D0 + d·A, with d = 2–2.7 ms/deg and D0 = 20–30 ms. Lee et al. used d = 2.4 and D0 = 25 ms. Peak velocity for large saccades is 400–600 deg/s, and initial acceleration reaches "as much as 30,000 deg/sec²" ([Eyes Alive §2.1, §5](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)).
- "A very large saccade of 30 degrees typically has a velocity of around 500 deg/sec and a duration of less than one tenth of a second". Acceleration and deceleration exceed 10,000 deg/s² ([Ruhland §3.1.1](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).

Human saccade durations at 24 fps (from D = 25 + 2.4A ms):

| Amplitude | 2° | 5° | 10° | 15° | 20° | 30° |
|---|---|---|---|---|---|---|
| ms | 30 | 37 | 49 | 61 | 73 | 97 |
| frames @24 | 0.7 | 0.9 | 1.2 | 1.5 | 1.75 | 2.3 |

### 1.2 Amplitude and direction distributions
- In conversation, the frequency of magnitude A (deg) fits P = 15.7·e^(−A/6.9) %. "90% of the time the saccade angles are less than 15 degrees" ([Eyes Alive §4.2](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)), consistent with Bahill, Adler & Stark's "most naturally occurring human saccades have magnitudes of 15 degrees or less" (cited there).
- Talking mode: mean 15.64 ± 11.86°, with 92 % ≤ 25°, capped at 27.5° in synthesis. Listening mode: 13.83 ± 8.88°, capped at 22.7°. Magnitude is sampled by inverse transform: A = −6.9·ln(P/15.7), P uniform on (0, 15] ([Eyes Alive §4.3, §5](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)).
- Direction (0° = right, 90° = up): 0° 15.54 %, 45° 6.46 %, 90° 17.69 %, 135° 7.44 %, 180° 16.80 %, 225° 7.89 %, 270° 20.38 %, 315° 7.79 %. "Up-down and left-right movements happened more than twice as often as diagonal movements" ([Eyes Alive Table 1](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)).

### 1.3 Profile within a saccade: fast in, overshoot, settle?
- Bahill et al. classify saccades as dynamic undershoot, **dynamic overshoot** or critically damped. "Saccades with dynamic overshoot … comprised 65% of our records". Each type occurs "for any magnitude between 3 minutes of arc and 50 degrees" ([Bahill et al. 1975, pp. 193–194](http://www.visualcognition.ca/spering/reading/Bahill.Clark.Stark.MathBiosci.1975.pdf)).
- Ruhland et al., however: "slight target undershoots, slow drifts after saccade completion (glissades), slight curvature … and torsional movements … are all modest and are normally invisible to a casual observer". Yeo et al. used "simple bell-shaped velocity curves with the rationale that subtle asymmetries … were invisible to an observer" ([Ruhland §3.1.1](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
- The accelerating-to-decelerating ratio varies with duration. Van Opstal & Van Gisbergen introduced "skewness" and found "a clear relation between saccade duration (D) and skewness (S)" ([Van Opstal & Van Gisbergen 1987](https://pubmed.ncbi.nlm.nih.gov/3660635/)). The direction and size of the skew are **UNVERIFIED** (abstract only).
- Andrist et al. use a velocity-vs-progress profile: V = 2·Vmax·g for g < 0.5, and V = 4Vmax·g² − 8Vmax·g + 4Vmax for g ≥ 0.5, where g is the fraction of the shift completed ([Andrist et al. 2012 §3.2](https://graphics.cs.wisc.edu/Papers/2012/APMG12a/APMG12a.pdf)).
- Lee et al. fitted a 6th-order polynomial velocity curve over 6 normalized samples ([Eyes Alive eq. 4](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)). **UNVERIFIED:** the coefficients as extracted from the PDF give a monotonically rising velocity, so I could not reproduce a usable profile from them. Do not use it.
- **JUDGEMENT for the gecko:** at 24 fps with 2–3-frame saccades, the in-saccade shape is sampled at only 1–2 in-betweens. What matters is **front-loaded** motion: at least 45 % of the travel in the first third. A tiny terminal overshoot (≤ 5 % of amplitude, 1 frame, only for A > 10°) is defensible from Bahill's 65 % figure but optional, per Ruhland.

### 1.4 Inter-saccadic intervals
- The minimum inter-saccade interval is about 150 ms ([Ruhland §3.1.1](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)). Lee et al. give 50–100 ms ([Eyes Alive §2.1](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)). **JUDGEMENT:** use ≥ 4 frames.
- Fixation durations can be drawn from an exponential distribution ([Ruhland §3.1.4](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
- Talking mode, per Eyes Alive at 30 fps: mutual gaze 93.9 ± 94.9 frames and gaze-away 27.8 ± 24.0 frames. "The inter-saccadic interval tends to be much shorter when the eyes are not in the primary position." Listening mode: mutual 237.5 ± 47.1 frames and away 13.0 ± 7.1 frames, both near-Gaussian ([Eyes Alive §4.2–4.3](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)). At 24 fps these become: talking mutual about 75 ± 76 frames (3.1 s), talking away about 22 ± 19 frames (0.93 s), listening mutual about 190 ± 38 frames (7.9 s), listening away about 10 ± 6 frames.

### 1.5 Gaze while speaking vs listening
- Aversion signals thinking: "Gaze aversion is also more common while speaking as opposed to listening, especially at the beginning of utterances and when speech is hesitant". Kendon found "the speaker looking away from the listener at the beginning of an utterance and towards the listener at the end". Gaze level "rises at the beginning of a phrase boundary pause" and "falls at a hesitation pause" ([Eyes Alive §2.2](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)).
- Cassell et al. reported gazing away at the start of a theme 70 % of the time, and towards the partner at the theme–rheme junction 73 % of the time. Duncan: speakers look away at turn start and towards the partner at turn end (both quoted in [Cummins 2012](https://web.archive.org/web/20220131162353/https://cspeech.ucd.ie/Fred/docs/cumminsBlinkingGazeSub2Revised.pdf)).
- Timing data for aversions ([Andrist et al. 2014 §3.1](https://graphics.cs.wisc.edu/Papers/2014/ATGM14/hri14-andrist-CameraReady.pdf)):
  - **Cognitive** aversions: length 3.54 ± 1.26 s. They start 1.32 ± 0.47 s *before* the cognitive event and end 2.23 ± 0.63 s after it. They are more often directed **upward**.
  - **Floor-management** aversions: length 2.30 ± 1.10 s. They start 1.03 ± 0.39 s before the utterance and end 1.27 ± 0.51 s after its start. Mutual gaze locks in 2.41 ± 0.56 s before the end of a floor-passing utterance.
  - **Intimacy** aversions while speaking: 1.96 ± 0.32 s long, every 4.75 ± 1.39 s. While listening: 1.14 ± 0.27 s long, every 7.21 ± 1.88 s. Intimacy and floor aversions are more often **sideways**.
- Very high direct gaze "may be perceived as too intimate" ([Eyes Alive §6](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)). Performative partial gaze shifts that "retain partial alignment with the audience" improved engagement, likability and trustworthiness ([Pejsa et al. 2013 §4.3](https://graphics.cs.wisc.edu/Papers/2013/PMG13/eg13-pejsa_preprint.pdf)).
- Animator practice: "a convincing action should always be led by the eyes or the head, starting with the eyes moving a few frames before the head". The eye change marking a new thought "anticipates the dialogue" ([Ruhland §6.1–6.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf), citing Lasseter and Maestri).

### 1.6 Stylized eyes need different speeds
- "Stylised character eyes are often larger … and therefore require unrealistically fast movements to traverse the angular displacements made by real eyes". Magnified human movements "are unexpected" ([Ruhland §4.7](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
- Pejsa et al. scale peak eye velocity by F/W³, where W is eye width relative to a human's and F is "eye strength". They use F = W³/3, blended by head alignment via F′ = (1 − αH)W³ + αH·F. They add a velocity multiplier χ "between 1.2 and 1.7 for our stylized characters" to make gaze "livelier". The baseline is V0 = 150 deg/s ([Pejsa §4.1, §4.2.2](https://graphics.cs.wisc.edu/Papers/2013/PMG13/eg13-pejsa_preprint.pdf)).
- **JUDGEMENT:** net effect for eye-only shifts is roughly human speed times 1.2–1.7. For head-carried shifts it is about 1/3 to 1/2 of that. For the gecko's very large eyes, I recommend 2 frames for A < 8°, 3 frames for 8–20° and 4 frames above 20°. That is roughly 1.5–2× human, and still 2–3× faster than the current 3–6-frame cosine drifts.

---

## 2. Fixation: micro-motion without jitter
- Fixational eye movements are microsaccades, drift and tremor. Microsaccades are "small saccades produced 1–2 times per second during fixation". A "1-degree upper magnitude threshold … captures more than 90% of saccades produced during attempted fixation". Microsaccades "both introduce (on a short timescale) and correct (on a longer timescale) fixation errors" ([Martinez-Conde et al. 2013](https://smc.neuralcorrelate.com/files/publications/martinez-conde_etal_nrn13.pdf); abstract at [PubMed 23329159](https://pubmed.ncbi.nlm.nih.gov/23329159/)). They "last about 25 msec" ([Martinez-Conde, Barrow Quarterly](https://www.barrowneuro.org/for-physicians-researchers/education/grand-rounds-publications-media/barrow-quarterly/the-role-of-eye-movements-during-visual-fixation/)). Fixation is "a dynamically rich behavior" ([Rolfs 2009](https://pubmed.ncbi.nlm.nih.gov/19683016/)).
- Randomness alone fails. Type II eyes (random magnitude, direction and interval) were "unnatural, jittery and distracted … unstable" ([Eyes Alive §6](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)).
- Drift and tremor amplitudes are **UNVERIFIED**; I found no accessible primary numbers. At our scale they would be sub-pixel anyway.
- **JUDGEMENT for the gecko:**
  - A literal human microsaccade (≤ 1°) moves the pupil about 1 px at 800 px output (see Scene facts), so it cannot be seen.
  - Use sparse **stylized fixation re-targets**: 1.0–1.8° steps (2–4 px at 1600 px output), every 0.6–1.5 s (15–36 frames), each a 1-frame step then a hold.
  - Draw each new point around the *fixation centre* (mean-reverting, σ about 0.8°), not as a random walk.
  - Weight directions horizontal:vertical:diagonal at roughly 2:2:1 (Eyes Alive Table 1).
  - Do **not** add continuous noise (e.g. an F-curve Noise modifier) to eye rotation. Continuous smooth wander is drift-like "swimming", which is exactly the Type II failure.

---

## 3. Vergence
- "Normally the two eyes are yoked". Vergence is the exception: near-midline targets require opposite rotations. "Any animation system that calculates rotation angles for both eyes separately has de facto implemented vergence". Issues "are exacerbated when the character has large or stylised eyes" ([Ruhland §3.1.4](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
- On stylized characters, "cross-eyedness becomes noticeable even in more standard viewing". Pejsa et al. move the effective target *behind* the real one, T′ = E + (T−E)/‖T−E‖ · sin(θ+γMAX/2)/sin(γMAX/2) · ‖L−E‖. This is view-dependent: when the viewer is the target, allowable convergence returns to the mechanical limit (γ′MAX = 2·OMR_IN at pφ = 0), "if the viewer is the gaze target, they may notice the character is looking a bit 'past' them" ([Pejsa §4.2.1](https://graphics.cs.wisc.edu/Papers/2013/PMG13/eg13-pejsa_preprint.pdf)).
- Disney Research: the gaze direction follows the **visual** axis, which is tilted "towards the nose … on average around 6 degrees". If this is ignored, "the digital character will appear slightly cross-eyed" ([Bérard et al. 2019 §1](https://studios.disneyresearch.com/wp-content/uploads/2019/04/Practical-Person-Specific-Eye-Rigging.pdf)).
- Pixar, Inside Out 2: on large-eyed characters "the curvature of the eyeballs would often make the eye gaze appear different, especially as the eyes are angled away from camera". They explored cheats "to unify the character gaze direction, some … relative to the eye and eyelid shapes themselves, and others … computed relative to the camera" ([Pixar SIGGRAPH Talk 2024](https://research.pixar.com/docs/2024.SiggraphTalks.HNSZ.pdf)).
- **Gecko numbers (measured):** 0.39 m eye separation at about 3.15 m gives 7.0° total convergence, i.e. about 3.5° inward per eye. That is a nasal pupil shift of about 3 % of eye width.
- **JUDGEMENT:**
  - Keep convergence toward the lens so he reads as looking *at us*. Pejsa keeps full convergence exactly in this case.
  - Consider putting the look target 1.5–2× the camera distance *behind* the camera. That gives 3.5–4.7° total and softens the cross-eyed read caused by the 0.30 m spheres.
  - Judge the choice from the render camera at 100 %, not the viewport.
  - During aversions (not looking at the viewer), aim at a far point (≥ 10 m), which is nearly parallel.

---

## 4. Blinks

### 4.1 Rate and timing
- Mean rate is 17/min at rest, 26/min in conversation and 4.5/min reading. The usual pattern is "conversation > rest > reading" (67.3 % of subjects) ([Bentivoglio et al. 1997](https://pubmed.ncbi.nlm.nih.gov/9399231/)). Doughty's meta-study ranges are 10.5–32.5/min in conversation and 8.0–21.0/min in primary gaze ([Ruhland §3.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)). Individual actors in Trutoiu's data blinked 6.6, 8.2 and 27.0/min ([Trutoiu §3.2](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)).
- Blink occurrence "can be modelled as a Poisson process", but blinks "very often occur almost simultaneously with the onset of eye and eye-head gaze movements, particularly large ones over 30 degrees" ([Ruhland §3.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
- Gaze-evoked blinks: EMG occurred with "97% of saccadic gaze shifts larger than 33 degrees" and "typically began simultaneously with the initiation of head and/or eye movement". With eyes closed, EMG occurred with all head turns over 17°, starting 39.3 ms before head movement ([Evinger et al. 1994](https://pubmed.ncbi.nlm.nih.gov/7813670/)). A 2026 preprint reports blink probability "reduced before head movement initiation and then peaked during the head movement" ([Goettker & Hayhoe 2026, bioRxiv preprint, not peer reviewed](https://pubmed.ncbi.nlm.nih.gov/42427559/)).
- Speech:
  - Listeners' blinks were entrained 0.25–0.5 s after "speaker's eyeblinks occurring at the end and during pauses in speech" ([Nakano & Kitazawa 2010](https://pubmed.ncbi.nlm.nih.gov/20700731/)).
  - Blink rate "increased when speaking" in Bailly et al.'s data, but individual differences are large, "even to the point at which two subjects may display effects of comparable magnitude but opposite sign" ([Cummins 2012](https://web.archive.org/web/20220131162353/https://cspeech.ucd.ie/Fred/docs/cumminsBlinkingGazeSub2Revised.pdf)).
  - Blinks accompany gaze shifts *toward* the partner more than away, with strong individual differences ([Cummins 2012, Fig. 7](https://web.archive.org/web/20220131162353/https://cspeech.ucd.ie/Fred/docs/cumminsBlinkingGazeSub2Revised.pdf)).
- Animator guidance ([Ruhland §6.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)):
  - Blink "when the character is processing a thought or when the character reaches a decision" (Murch).
  - Avoid "repetitive eye blinks following one another close in time", which read as disbelief or confusion.
  - Avoid blinks "in the first or last 5 to 10 frames of a shot" (Osipa).

### 4.2 Duration and asymmetry
- The down phase is "short in duration and achieves a high velocity with fast accelerations. The up phase lasts longer and decelerates more slowly". The end of a blink is defined as reaching "95% of the original value" (VanderWerf) ([Trutoiu §2.1](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)). "The down-phase velocity is approximately twice as fast as that of the up-phase velocity" ([Ruhland §3.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
- Perceived best durations were tested at 7, 9, 11 and 13 frames at 30 fps. The overall best was 9 frames (300 ms), which was also "the dominant blink duration" in the tracked data. **For the cartoon character the preferred duration was 7 frames (233 ms)**, and 7 vs 9 frames did not differ significantly ([Trutoiu §4.2.2](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)). At 24 fps that is 5.6–7.2 frames. The current 9-frame blink (375 ms) is long, and the 18-frame "slow" one (750 ms) reads as drowsy: longer closure and reopening "are associated with drowsiness" ([Trutoiu §2.1](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf); [Caffier et al. 2003](https://pubmed.ncbi.nlm.nih.gov/12736840/)).
- Voluntary blinks filmed at 600 fps: closing 76 ± 2 ms, closed 58 ± 4 ms, late opening 273 ± 23 ms, total 572 ± 25 ms. Peak closing speed was 243 mm/s vs 157 mm/s opening ([Kwon et al. 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC4043155/)). The early-opening value (about 165 ms) is my subtraction and is **UNVERIFIED**. These are *voluntary* blinks, so they run longer than spontaneous ones.
- Spontaneous blinks are longer and more variable than reflex blinks. Blinks from 30° downgaze have "the longest total duration" and the lowest down-phase amplitude and velocity ([VanderWerf et al. 2003](https://pubmed.ncbi.nlm.nih.gov/12612018/)).
- Lid kinematics are characterized "by their amplitude-maximum velocity relationships". Active orbicularis oculi contraction plus passive forces close the lid in a blink, whereas downward lid saccades are passive ([Evinger et al. 1991](https://pubmed.ncbi.nlm.nih.gov/1993591/)). "The down phases of blinks were much faster than those of saccade-related lid movements" ([Guitton et al. 1991](https://pubmed.ncbi.nlm.nih.gov/1748560/)).

### 4.3 Trajectory shape
- "Simple ease-in-ease-out motions do not accurately mimic human eyelid motion". The real profile is "a fast eyelid closing and a slower, asymptotically converging eyelid opening". Ranking, best to worst: data model > asymmetric ease > symmetric ease > asymmetric linear > symmetric linear ([Trutoiu §1, Fig. 3, §4.2.2](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)).
- Textbook "alert" blinks (slow close, fast open) are "a reversal of human eye blink dynamics" ([Trutoiu Fig. 4](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)).

### 4.4 Partial blinks
- "As many as 50% of the observed eye blinks" did not fully close. Yet **fully closed blinks were rated more natural** than naturally closed ones ([Trutoiu §4.1, §5](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)).
- **JUDGEMENT:** default to full closure. Use partial lid motion only via lid saccades (§5), plus the occasional deliberate 70–85 % "soft blink" (≤ 15 % of blinks).

### 4.5 Lower lid
- High-speed video shows "non-negligible horizontal and vertical movement of the lower eyelid". However, Experiment 3 found "no significant effect of the various types of lower eyelid motion on perceived naturalness" ([Trutoiu §1, §4.3](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)). The current −15° lower-lid rise is fine.

### 4.6 Eye motion and face reactions during a blink
- The eyes dip: they move "downward and nasalward … 1–5 degrees", with "a shorter duration than the upper lid movements". Bell's phenomenon (upward roll) "does not occur during short blinks" ([Collewijn et al. 1985](https://pubmed.ncbi.nlm.nih.gov/4031978/)). Bour et al. found the amplitude depends on starting gaze, and is "minimal" with adduction and downward gaze ([Bour et al. 2000](https://pubmed.ncbi.nlm.nih.gov/10634863/)).
- Brows and cheeks reacting to blinks: **UNVERIFIED**. I found no primary or first-party studio source. The orbicularis oculi is the active lid closer ([Evinger et al. 1991](https://pubmed.ncbi.nlm.nih.gov/1993591/)), so a very slight brow and cheek pull on *slow or forced* blinks is anatomically plausible (**JUDGEMENT**).

---

## 5. Lid–eye coupling and lid pose
- During vertical fixation "the eye and lid assumed essentially equal average positions", though lids made "small idiosyncratic movements of up to 5 degrees" ([Becker & Fuchs 1988](https://pubmed.ncbi.nlm.nih.gov/3193155/)). Their lid saccades:
  - are "a faithful replica" of the concomitant saccade;
  - start "some 5 ms later" and peak at about the same time;
  - downward: "similar amplitudes and velocities";
  - upward: "often smaller and slower".
- "Lid saccades … always accompany vertical eye saccades" and are less asymmetric than blinks ([Ruhland §3.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)). Lid-saccade peak velocity saturates at about 450°/s ([Guitton et al. 1991](https://pubmed.ncbi.nlm.nih.gov/1748560/)). Normoyle et al. made "eyelid displacement … proportional to eyeball rotation except for the downward blink phase" ([Ruhland §3.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
- Expression and lid height:
  - "The position of the eyelid in relation to the eye and pupil is a powerful method for changing entire facial expressions".
  - "A half-open eye contributes to a sleepy expression, while a fully open eyelid gives the impression that the character is alert".
  - Maestri models a neutral relaxed lid "as approximately 80% open" (Osipa's lid–iris diagram, reproduced as [Ruhland Fig. 7 and §6.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
  - Pixar handled "preventing the pupils from becoming obscured under the eyelids" on off-centre neutral eyes, and found that half-open lids on big eyes could read as "smaller rather than partially shut" ([Pixar 2024](https://research.pixar.com/docs/2024.SiggraphTalks.HNSZ.pdf)).
- **JUDGEMENT for the "sage" gecko:**
  - Upper-lid gain 1.0 for downgaze and 0.8 for upgaze.
  - Lower-lid gain about 0.3 (**UNVERIFIED**; no lower-lid gain data found).
  - Lid moves on the same frames as the eye (5 ms is less than a frame).
  - Neutral upper lid resting just over the top of the iris (droopy and wise). Alert beats pull it up to the iris top.
  - The point of lid follow is to keep this lid-to-iris relationship *constant* while the eyes move, so vertical glances don't read as changes in expression.

---

## 6. Head–eye coordination and VOR
- Threshold for recruiting the head: "approximately 15–20 degrees" ([Ruhland §3.3](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)). Stahl measured an **eye-only range** of 35.8 ± 31.9° (width), and beyond it head amplitude grows with slope **0.77 ± 0.16** of the predicted eye eccentricity. Variability between people is large ([Stahl 1999](https://pubmed.ncbi.nlm.nih.gov/10333006/)).
- Latency: when reacting, "eyes normally move first … while head motion begins 20–50 msec later". For predictable targets "the head movement begins around 100 msec before the eye saccades" ([Ruhland §3.3](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)). Andrist et al. interpolate head latency between −100 ms (head-first) and +100 ms (eyes-first). Large (> 30°) shifts are 3.05× likelier to be head-first. A 24° shift gives max head velocity 50°/s in their implementation, and eye velocity "saturates at about 500°/sec" ([Andrist et al. 2012 §3.1, Tables 1–2](https://graphics.cs.wisc.edu/Papers/2012/APMG12a/APMG12a.pdf)).
- Phases ([Pejsa §4.1](https://graphics.cs.wisc.edu/Papers/2013/PMG13/eg13-pejsa_preprint.pdf)):
  1. Eyes and head start together.
  2. The eyes "quickly get ahead" and may block at the ocular motor range.
  3. The eyes reach the target.
  4. "VOR locks the eyes onto the target as the head catches up".
  - On big stylized eyes this VOR counter-rotation can look like the eye "overshot the target and [is] now suddenly retracting". Pejsa's fix is to slow the eyes and time a gaze-evoked blink so the lids are fully closed at the VOR start (blink begins at tVOR − 0.35·TB) ([Pejsa §3, §4.2.3](https://graphics.cs.wisc.edu/Papers/2013/PMG13/eg13-pejsa_preprint.pdf)).
- Head alignment is idiosyncratic ("head-movers" vs "non-head-movers"). A head-alignment parameter of 0–100 % interpolates between them ([Andrist 2012 §2–3](https://graphics.cs.wisc.edu/Papers/2012/APMG12a/APMG12a.pdf)).
- VOR latency is 7–15 ms, "effectively simultaneous with head movement". Implementation: "if the head rotates with some angle θx, θy, θz, the eyeballs should counter-roll at −θx, −θy, −θz". It "is partially suppressed during large gaze shifts involving head movement" ([Ruhland §3.1.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)).
- Walking:
  - In walking and running "the predominant frequency of pitch rotations was at least twice that of yaw", and "maximal head velocity during walking or running did not exceed 90 degrees/second", so "the VOR is not saturated" ([Grossman et al. 1988](https://pubmed.ncbi.nlm.nih.gov/3384048/)).
  - Compensation is less effective "during locomotion" than during active head rotation ([Grossman & Leigh 1990](https://pubmed.ncbi.nlm.nih.gov/2360793/)).
  - **JUDGEMENT:** a perfect world-locked gaze during the walk is fine and reads as attentive.

---

## 7. Procedural implementation for the performance script

### 7.1 Blender facts that decide the architecture
- Damped Track "makes an object or bone point towards a certain target … uses a pure swing rotation to minimize rolling around the tracking axis" ([manual](https://docs.blender.org/manual/en/latest/animation/constraints/tracking/damped_track.html)). The constraint stack "is evaluated from top to bottom", and a constraint's Influence "can be keyframed" ([Stack](https://docs.blender.org/manual/en/latest/animation/constraints/interface/stack.html), [Header](https://docs.blender.org/manual/en/latest/animation/constraints/interface/header.html)).
- **VERIFIED LOCALLY (Blender 5.2.2):**
  - With Damped Track on a bone, keyed pitch/yaw on *the same bone* are overridden completely (0.00° deviation from the target line).
  - A keyed rotation on a **child** bone of the tracked bone adds on top (22.27° deviation for a 20°/10° key).
  - So you cannot "key offsets" on `eye.L` while its Damped Track is active.
- Transformation constraint: maps a target's Location/Rotation/Scale ranges to the owner's. Min/Max clamp unless Extrapolate is set. Mix "Add" adds to the existing rotation ([manual](https://docs.blender.org/manual/en/latest/animation/constraints/transform/transformation.html)). **VERIFIED LOCALLY:**
  - A lid bone with a Transformation constraint reading the eye bone's rotation in **Local Space** sees the Damped Track *result*.
  - Mix Add keeps the lid's own keyed rotation.
  - Test: eye pitch ±11.31°, lid = eye + 10° keyed.
- Limit Rotation clamps Euler angles per axis ([manual](https://docs.blender.org/manual/en/latest/animation/constraints/transform/limit_rotation.html)). Use it to cap eye-in-head range (the ocular motor range).
- Keyframe interpolation: Constant, Linear, Bézier, Easing, and Dynamic Effects. **Back** with Ease Out "goes towards the target, overshoots it, and then returns" ([F-Curve properties](https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/properties.html)). The API fields are `Keyframe.interpolation`, `Keyframe.easing` and `Keyframe.back` ([API](https://docs.blender.org/api/current/bpy.types.Keyframe.html)). Since the script keys every frame, set **LINEAR** on all script-generated keys so Bézier handles don't add their own overshoot between frames (**JUDGEMENT**).
- Fast keying: `fcurve.keyframe_points.insert(frame, value, options={'FAST'})`, then `fcurve.update()` ([API](https://docs.blender.org/api/current/bpy.types.FCurveKeyframePoints.html)). Under 5.x layered Actions, reach F-curves via `bpy_extras.anim_utils.action_ensure_channelbag_for_slot(action, slot).fcurves` ([API](https://docs.blender.org/api/current/bpy_extras.anim_utils.html)).
- The F-curve Noise modifier adds noise with Scale/Strength/Phase/Depth ([manual](https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/modifiers.html)). Avoid it on eyes (§2). It is fine at very low strength on head micro-sway.
- EEVEE motion blur: Position, Shutter (frames) and Steps. "Each step corresponds to a full scene re-evaluation" ([manual](https://docs.blender.org/manual/en/latest/render/eevee/render_settings/motion_blur.html)).

### 7.2 Option A vs B

| | A. Keep Damped Track and drive the target from **angular** offsets (recommended) | B. Remove the constraint and key eye rotations computed per frame |
|---|---|---|
| VOR during walk / head moves | Automatic, because the target is world-space | Must compute the head world matrix each frame (`frame_set` + depsgraph for 382 frames) and invert it |
| Vergence | Automatic, from the target distance | Per-eye math needed |
| Saccade shape | Key target position each frame (LINEAR) | Key rotations each frame |
| Head-space extras (blink dip, cross-eye cheat) | Needs a child bone `eye_fx.*` (the eye mesh re-parented to it) | Can add directly |
| Risk | Must convert angles to target positions via the *current* eye-to-camera distance | More code. Gimbal/Euler care needed. |

**Recommendation:** use A. Add one child bone per eye for head-space extras (the blink dip). If you cannot re-parent the eye meshes, skip the dip: it is the lowest-value item.

### 7.3 Pseudo-code (24 fps; all random draws from a seeded RNG for reproducibility)

```python
FPS = 24
rng = random.Random(1234)

# ---------- 1. gaze "intent" timeline (seconds -> frames) -------------------
# states: MUTUAL (look at lens), AWAY (aversion/glance), with speech-aware rules
events = []           # list of (frame_start, yaw_deg, pitch_deg, n_frames)
t = start_frame
mode_at = lambda f: 'TALK' if in_speech(f) else 'LISTEN'   # walk/stop = LISTEN
while t < end_frame:
    mode = mode_at(t)
    # hold in mutual gaze (Eyes Alive §4.3, converted to 24 fps)
    hold = rng.expovariate(1/75) if mode == 'TALK' else rng.gauss(190, 38)
    hold = max(hold, 4)
    t += hold
    # forced events override the random timer:
    #   - phrase start: floor/cognitive aversion begins ~1.0 s (24 f) before voice onset
    #   - phrase end:   return to MUTUAL at or just before phrase end (Kendon)
    #   - no aversions in the last ~2.4 s (58 f) of the final phrase (Andrist 2014)
    # aversion magnitude (Eyes Alive eq.7), capped, scaled for a to-camera performer
    A = -6.9 * math.log(rng.uniform(1e-3, 15.0) / 15.7)
    A = min(A, 27.5 if mode == 'TALK' else 22.7) * AVERSION_SCALE   # JUDGEMENT 0.6-0.8
    direction = weighted_choice(DIRS_EYES_ALIVE)       # 8 bins, cardinal-heavy
    # cognitive aversions (thinking at phrase start): bias UP; floor/intimacy: SIDE
    away_hold = rng.expovariate(1/22) if mode == 'TALK' else rng.gauss(10, 6)
    events += [saccade(t, A, direction), saccade(t + away_hold, back_to_mutual)]
    t += away_hold

# ---------- 2. saccade curve (position fraction per frame) -------------------
def saccade_frames(A):          # stylized: ~1.5-2x human duration (JUDGEMENT)
    return 2 if A < 8 else 3 if A <= 20 else 4
PROFILE = {2: [0, .75, 1.0],
           3: [0, .45, .88, 1.0],
           4: [0, .30, .70, .93, 1.0]}
OVERSHOOT = 0.04                # optional, A > 10 deg only: +4 % for 1 frame, then 1.0

# ---------- 3. fixation micro-layer (only while holding) ---------------------
# every rng.uniform(15, 36) frames: 1-frame step to centre + N(0, 0.8 deg) per axis,
# clipped to 1.8 deg; no step within 4 frames of a saccade; none during blinks.

# ---------- 4. combine and write the target ----------------------------------
for f in frames:
    yaw, pitch = gaze_offset_deg(f)            # macro + micro, camera-relative
    M = eye_midpoint_world(f)                   # from rig; head bone is keyed
    C = camera_world(f)
    fwd = (C - M).normalized()
    right, up = camera_right_up(f)
    d = VERGENCE_K * (C - M).length if yaw == pitch == 0 else FAR_AWAY  # K ~1.5-2
    dirv = rotate(fwd, up, yaw) ; dirv = rotate(dirv, right, pitch)
    key(target.location, M + dirv * d, f, interp='LINEAR')
    # when |yaw| or |pitch| > 0 the target moves to a far point (near-parallel eyes);
    # blend d over the saccade frames so vergence changes with the saccade.

# ---------- 5. head-eye coordination -----------------------------------------
# for each gaze shift with total amplitude G:
E0 = 15.0                                        # eye-only half-range, deg (JUDGEMENT from 15-20 / Stahl)
H  = 0 if abs(G) <= E0 else 0.77 * (abs(G) - E0) * sign(G)
head_onset = saccade_onset + (1 if reactive else -2)   # frames: +20-50 ms or -100 ms
head_frames = round(6 + 0.5 * abs(H))           # JUDGEMENT: ~50 deg/s peak
# key head yaw/pitch with an ease-in-out over head_frames (existing 0.3x camera
# tracking stays as the base layer; add H on top). Eyes stay world-locked via
# Damped Track, so VOR during head catch-up is automatic.

# ---------- 6. blinks ---------------------------------------------------------
def blink_curve(kind):
    if kind == 'normal':  # 7-8 frames total (Trutoiu 7-9 f @30 -> 5.6-7.2 f @24)
        close = [0.0, 0.45, 1.0]                # fast, accelerating (2 frames = 83 ms)
        hold  = [1.0]                           # ~42 ms (Kwon closed ~58 ms)
        open_ = [0.55, 0.25, 0.10, 0.03, 0.0]   # exp-like, 95 % by 4th frame
    elif kind == 'snappy':                      # cartoon preference (7 f @30 = 5.6 f @24)
        close, hold, open_ = [0, .6, 1], [], [.5, .2, .06, 0]
    elif kind == 'slow':                        # thoughtful/sage beat
        close, hold = [0, .3, .7, 1], [1, 1, 1]
        open_ = [.8, .6, .45, .32, .22, .14, .08, .04, 0]
    return close + hold + open_

blinks = []
# (a) gaze-evoked: every gaze shift >= 30 deg (eye+head) -> blink, onset = shift onset
#     (Evinger 1994); 15-30 deg head-involved shifts -> p = 0.4 (JUDGEMENT);
#     if a head move follows, place blink so closed frame ~ VOR start (Pejsa)
# (b) speech: phrase end / pause -> p = 0.6, onset 0-4 frames after phrase end
#     (Nakano & Kitazawa); prefer to coincide with the return-to-camera saccade
# (c) Poisson fill: rate 17/min (walk/listen) or 26/min (speaking) (Bentivoglio)
# constraints: refractory >= 24 frames between blinks (Osipa via Ruhland);
#              none in first/last 8 frames of shot; one 'slow' blink at the
#              wise beat only; ~10 % of Poisson blinks as 0.75-amplitude soft blinks.

# ---------- 7. lids: blink + follow ------------------------------------------
# Rig approach (preferred, VERIFIED LOCALLY): on lid_up.L add two Transformation
# constraints reading eye.L rotation X in LOCAL space, Mix = ADD, no Extrapolate:
#   down range [-45, 0]  -> [-45*1.0, 0]
#   up   range [ 0, 45]  -> [0, 45*0.8]
# lid_lo.L: one constraint, gain 0.3 both ways.
# key constraint.influence = 1 - blink(f), so a closed lid always meets
# the lower lid regardless of gaze.
# keep the existing keyed blink rotation (64 deg / -15 deg) * blink(f) on the bone.
# NB: check the sign/axis on the real rig; the lid pivots share the eye centre.

# ---------- 8. blink dip (needs eye_fx child bone) ---------------------------
# eye_fx pitch = -2.5 deg * dip(f), yaw = +1.5 deg nasal * dip(f), where dip rises
# with the closing frames, peaks at closed, returns over 2 frames (Collewijn 1-5 deg)
```

### 7.4 Frame-level parameter table (24 fps)

| Parameter | Value | Basis |
|---|---|---|
| Saccade duration | 2 f (< 8°), 3 f (8–20°), 4 f (> 20°) | Human is 1–2.3 f ([Eyes Alive](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf)). Slowed for large eyes ([Pejsa](https://graphics.cs.wisc.edu/Papers/2013/PMG13/eg13-pejsa_preprint.pdf)). **JUDGEMENT** |
| Saccade profile | 2 f: 0, .75, 1. 3 f: 0, .45, .88, 1 | Front-loaded. **JUDGEMENT** |
| Min interval between saccades | 4 f | 150 ms ([Ruhland](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)) |
| Mutual-gaze hold, talking | exponential, mean 75 f | [Eyes Alive](https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf) |
| Gaze-away hold, talking | exponential, mean 22 f | same |
| Mutual hold, listening/walking | N(190, 38) f | same |
| Aversion start before a phrase | about 24 f (1.0 s) | [Andrist 2014](https://graphics.cs.wisc.edu/Papers/2014/ATGM14/hri14-andrist-CameraReady.pdf) |
| Locked mutual gaze before final phrase end | about 58 f (2.4 s) | same |
| Fixation re-target | every 15–36 f, 1.0–1.8°, 1-f step | **JUDGEMENT** (human 1–2/s, ≤ 1°: [Martinez-Conde 2013](https://smc.neuralcorrelate.com/files/publications/martinez-conde_etal_nrn13.pdf)) |
| Blink normal | close 2 f, closed 1 f, open 4–5 f, exp-like | [Trutoiu](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf), [Kwon](https://pmc.ncbi.nlm.nih.gov/articles/PMC4043155/) |
| Blink rate | 17/min walking, 26/min speaking | [Bentivoglio](https://pubmed.ncbi.nlm.nih.gov/9399231/) |
| Gaze-evoked blink | p = 0.97 for shifts ≥ 30–33° | [Evinger 1994](https://pubmed.ncbi.nlm.nih.gov/7813670/) |
| Blink refractory | ≥ 24 f | **JUDGEMENT** after Osipa ([Ruhland §6.2](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf)) |
| Upper-lid follow gain | 1.0 down, 0.8 up | [Becker & Fuchs](https://pubmed.ncbi.nlm.nih.gov/3193155/). **JUDGEMENT** on 0.8 |
| Lower-lid follow gain | 0.3 | **UNVERIFIED** |
| Eye dip in blink | 2.5° down, 1.5° nasal | [Collewijn](https://pubmed.ncbi.nlm.nih.gov/4031978/) (1–5°) |
| Head recruit threshold | 15° | [Ruhland](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf), [Stahl](https://pubmed.ncbi.nlm.nih.gov/10333006/) |
| Head gain beyond threshold | 0.77 | [Stahl](https://pubmed.ncbi.nlm.nih.gov/10333006/) |
| Head lag | +1 f (reactive) or −2 f (planned) | [Ruhland §3.3](https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf), [Andrist 2012](https://graphics.cs.wisc.edu/Papers/2012/APMG12a/APMG12a.pdf) |
| Look-target distance while looking at the lens | 1.5–2× camera distance | [Pejsa](https://graphics.cs.wisc.edu/Papers/2013/PMG13/eg13-pejsa_preprint.pdf). **JUDGEMENT** on the factor |

---

## 8. Recommended implementation for the gecko (prioritized)

1. **Replace the linear blink with the asymmetric exp-like curve** (§7.3 step 6, "normal": 2/1/4–5 frames). Shorten the slow blink (3/3/9, ease-out). This is the cheapest, highest-confidence fix ([Trutoiu](https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf)).
2. **Make glances saccadic.** Move the look target in 2–3 frames with a front-loaded profile, specified as **angles** relative to the eye→camera line (not metres). Use variable holds drawn from the Eyes Alive distributions, not fixed 10-frame holds. Key target location per frame with LINEAR interpolation.
3. **Speech-aware gaze script.** Avert (up for "thinking", sideways otherwise) about 1 s before phrase onsets. Return to the lens at phrase ends and hold mutual gaze through the last about 2.4 s. While walking, keep long mutual holds (listener-like) with rare small glances.
4. **Tie blinks to events.** Blink on every large gaze/head shift (onset = shift onset) and at most phrase ends and pauses. Fill with Poisson at 17/26 per minute, a ≥ 1 s refractory period, and none in the first or last 8 frames.
5. **Lid follow.** Two Transformation constraints per upper lid (gain 1.0 down, 0.8 up) and one per lower lid (0.3), Mix Add, influence keyed to 1 − blink. Tune the neutral upper lid to sit just over the iris top for the "sage" read.
6. **Head–eye coordination.** Eyes lead. The head starts 1 frame later (or 2 frames earlier for planned beats) and only for shifts over 15°, taking 0.77 of the excess. Leave the eyes world-locked (VOR) during the catch-up. Hide any "retraction" with a gaze-evoked blink.
7. **Turn on motion blur** (EEVEE, shutter about 0.5, Steps > 1). Check that 2-frame saccades and blinks don't strobe.
8. **Fixation micro-layer.** Sparse 1–1.8° one-frame re-targets every 0.6–1.5 s. No continuous noise.
9. **Vergence softening.** Test the target at 1.5–2× the camera distance behind the lens, and compare at 100 % render.
10. **Blink dip** (needs an `eye_fx` child bone): 2.5° down and 1.5° nasal during closure. Optional brow/cheek twitch only on the slow blink (**UNVERIFIED** convention).

---

## 9. Open questions / UNVERIFIED
- Drift and tremor amplitudes and velocities: no accessible primary numbers were retrieved. They are irrelevant at our pixel scale (§2), but unverified.
- The Eyes Alive 6th-order velocity polynomial (eq. 4) does not reproduce a sensible profile from the extracted coefficients. The coefficients may be mis-extracted. Not used.
- The direction and size of saccade velocity skew vs duration (Van Opstal & Van Gisbergen): abstract only.
- Lower-lid follow gain during vertical gaze: no data found. 0.3 is a guess.
- The upward lid-follow gain of 0.8: Becker & Fuchs say upward lid saccades are "often smaller" but the abstract gives no ratio.
- Blink durations for spontaneous (not voluntary) blinks in ms: VanderWerf 2003 and Evinger 1991 full texts were blocked (HTTP 403). The Kwon values are voluntary. The early-opening value (about 165 ms) is derived by subtraction.
- Brow and cheek reactions to blinks and saccades are an animator convention with no primary or studio source found. Osipa's and Maestri's specific lid–iris positions are known here only via the Ruhland review, not the books.
- Whether the Pejsa velocity scaling (built for W = 1–3) extrapolates sensibly to the gecko's eyes, which are 0.30 m spheres on a character at this scale. The frame counts in §1.6 are judgement and should be checked by eye on renders.
- Pixar's actual camera-relative gaze cheats on Inside Out 2 are only named in the talk abstract, not specified.
- Goettker & Hayhoe (2026) is a bioRxiv preprint and is not peer reviewed.
- The exact lid-bone rotation axis and sign in `Gecko_Rig` were not inspected. Verify before wiring the Transformation constraints.

---

## Sources (primary)
- Lee, Badler & Badler, *Eyes Alive*, SIGGRAPH 2002 / ACM TOG 21(3). Archived author PDF: <https://web.archive.org/web/2004id_/http://www.cis.upenn.edu:80/~sooha/pubs/EyesAlive.pdf>. DOI <https://doi.org/10.1145/566654.566629>
- Ruhland et al., *A Review of Eye Gaze in Virtual Agents, Social Robotics and HCI*, CGF 34(6) 2015. Preprint: <https://www.scss.tcd.ie/Rachel.McDonnell/papers/CGF2015.pdf>. DOI <https://doi.org/10.1111/cgf.12603>
- Bahill, Clark & Stark 1975, *The main sequence*: <http://www.visualcognition.ca/spering/reading/Bahill.Clark.Stark.MathBiosci.1975.pdf>
- Van Opstal & Van Gisbergen 1987: <https://pubmed.ncbi.nlm.nih.gov/3660635/>
- Trutoiu, Carter, Matthews & Hodgins 2011, *Modeling and Animating Eye Blinks* (Disney Research): <https://la.disneyresearch.com/wp-content/uploads/Modeling-and-Animating-Eye-Blinks-Paper.pdf>
- Evinger, Manning & Sibony 1991: <https://pubmed.ncbi.nlm.nih.gov/1993591/>. Evinger et al. 1994: <https://pubmed.ncbi.nlm.nih.gov/7813670/>
- Becker & Fuchs 1988: <https://pubmed.ncbi.nlm.nih.gov/3193155/>. Guitton, Simard & Codère 1991: <https://pubmed.ncbi.nlm.nih.gov/1748560/>
- VanderWerf et al. 2003: <https://pubmed.ncbi.nlm.nih.gov/12612018/>. Kwon et al. 2013: <https://pmc.ncbi.nlm.nih.gov/articles/PMC4043155/>. Caffier et al. 2003: <https://pubmed.ncbi.nlm.nih.gov/12736840/>
- Collewijn, van der Steen & Steinman 1985: <https://pubmed.ncbi.nlm.nih.gov/4031978/>. Bour, Aramideh & de Visser 2000: <https://pubmed.ncbi.nlm.nih.gov/10634863/>
- Bentivoglio et al. 1997: <https://pubmed.ncbi.nlm.nih.gov/9399231/>. Nakano & Kitazawa 2010: <https://pubmed.ncbi.nlm.nih.gov/20700731/>. Cummins 2012 (author MS): <https://web.archive.org/web/20220131162353/https://cspeech.ucd.ie/Fred/docs/cumminsBlinkingGazeSub2Revised.pdf>
- Martinez-Conde, Otero-Millan & Macknik 2013: <https://smc.neuralcorrelate.com/files/publications/martinez-conde_etal_nrn13.pdf>. Rolfs 2009: <https://pubmed.ncbi.nlm.nih.gov/19683016/>
- Pejsa, Mutlu & Gleicher 2013, *Stylized and Performative Gaze*: <https://graphics.cs.wisc.edu/Papers/2013/PMG13/eg13-pejsa_preprint.pdf>
- Andrist, Pejsa, Mutlu & Gleicher 2012, *Head-Eye Coordination Model*: <https://graphics.cs.wisc.edu/Papers/2012/APMG12a/APMG12a.pdf>. Andrist, Tan, Gleicher & Mutlu 2014, *Conversational Gaze Aversion*: <https://graphics.cs.wisc.edu/Papers/2014/ATGM14/hri14-andrist-CameraReady.pdf>
- Stahl 1999: <https://pubmed.ncbi.nlm.nih.gov/10333006/>. Grossman et al. 1988: <https://pubmed.ncbi.nlm.nih.gov/3384048/>. Grossman & Leigh 1990: <https://pubmed.ncbi.nlm.nih.gov/2360793/>. Goettker & Hayhoe 2026 (preprint): <https://pubmed.ncbi.nlm.nih.gov/42427559/>
- Pixar, *Inside Out 2: Character Rig Challenges and Techniques*, SIGGRAPH Talks 2024: <https://research.pixar.com/docs/2024.SiggraphTalks.HNSZ.pdf>
- Bérard, Bradley, Gross & Beeler 2019, *Practical Person-Specific Eye Rigging* (Disney Research): <https://studios.disneyresearch.com/wp-content/uploads/2019/04/Practical-Person-Specific-Eye-Rigging.pdf>
- Blender manual:
  - [Damped Track](https://docs.blender.org/manual/en/latest/animation/constraints/tracking/damped_track.html)
  - [Transformation](https://docs.blender.org/manual/en/latest/animation/constraints/transform/transformation.html)
  - [Limit Rotation](https://docs.blender.org/manual/en/latest/animation/constraints/transform/limit_rotation.html)
  - [Constraint stack](https://docs.blender.org/manual/en/latest/animation/constraints/interface/stack.html)
  - [Constraint header / Influence](https://docs.blender.org/manual/en/latest/animation/constraints/interface/header.html)
  - [F-Curve properties / interpolation](https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/properties.html)
  - [F-Curve modifiers](https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/modifiers.html)
  - [EEVEE motion blur](https://docs.blender.org/manual/en/latest/render/eevee/render_settings/motion_blur.html)
- Blender API:
  - [Keyframe](https://docs.blender.org/api/current/bpy.types.Keyframe.html)
  - [FCurveKeyframePoints](https://docs.blender.org/api/current/bpy.types.FCurveKeyframePoints.html)
  - [bpy_extras.anim_utils](https://docs.blender.org/api/current/bpy_extras.anim_utils.html)
