# Motion craft

Read this before you write or review motion code for a stage. Every section is a rule the brief's numbers depend on.

## Every move has a job

- **Entrance** introduces the main object.
- **Hold** gives the viewer time to read and understand it.
- **A cursor move** points at the next action.
- **Transition** carries the viewer into the next state.

The main object moves first. Supporting text follows after a short delay: start at 0.1 s (3 frames at 30 fps) and tune it in playback. During a hold, any background movement stays quiet enough that the text remains the thing being looked at.

## One thing owns the screen

- The cursor owns attention until the button responds. After that, the result owns the reading window.
- When two moves compete, delay one of them or reroute the cursor. A cursor crossing the headline during the card's entrance is the common case.
- A hold counts from the frame where the words are fully legible. brief-check enforces a reading floor, but the real test is reading the text aloud at normal playback speed. If the hold ends before you finish, lengthen it.
- An 8-frame hold at 30 fps gives the viewer 0.27 s.

## Copy has a size limit

Lay out the opening and closing with the longest copy you expect to use. Record the space each layout has:
- the headline's available width
- its maximum number of lines
- the space reserved for the logo
- the final positions of the text and the card

If the copy wraps past its line limit, stop work on motion. Shorten the copy, widen the box, or move the extra information into another shot. Use explicit line breaks only where they help the reading.

After any copy change, render the landing frame again before you review the entrance in playback. Do the same on the closing card, especially when a longer product name replaces a short one.

## Easing and springs

- Entrances in the brief use cubic ease-out, clamped at both ends, so each value lands exactly on its `EVENT` frame.
- `spring()` overshoots at its defaults (mass 1, damping 10, stiffness 100). For a controlled landing, set `overshootClamping: true` or raise the damping. Pass `durationInFrames` to fit the spring to the brief's frame range.
- Tune a spring one parameter at a time. Keep its destination fixed while you replay the entrance.
- For a slow push, interpolate an absolute range, such as scale 1.00 to 1.03 across the scene's frames. Multiplying by a constant factor each frame compounds.
- Keep each element's offset, destination, start, duration and easing together in one exported constant. A revision should then touch only that one object.

## Every frame renders the same way

- Drive every animated value from `useCurrentFrame()`. CSS transitions and animations flicker in renders, because Remotion renders frames out of order across several browser tabs.
- For variation, use `random(seed)` from `remotion`. Each render thread gets its own `Math.random()` values, and `random(null)` is not reproducible.

## Motion blur stays inside the move

Use blur only during a fast entrance, and make sure it is gone by the time the move settles, so the reading hold stays clear.

`HtmlInCanvasMotionBlur` is Remotion's recommended tool. `CameraMotionBlur` (shutterAngle 180 and samples 10 by default) averages time-shifted copies, which shifts colours and can smear text or leave trails. Its children must be absolutely positioned.

To check blur, render the entrance and the cut next to it. Look for a clean scene boundary and for text that is readable once the card settles.

## Scenes hand over state

- Give each scene an incoming state and an outgoing state.
- In a continuous transition, the next scene starts from the card's final position, scale and highlighted field.
- Fonts, palette, spacing and recurring elements live in shared settings. Record any deliberate exception for a scene.
- A TransitionSeries transition overlaps two scenes and shortens the film. Two scenes of 40 and 60 frames joined by a 30-frame transition last 70 frames. Declare the overlap in BRIEF.md as `TRANSITION <a> <b>`.
- `TransitionSeries.Overlay` covers a cut without changing the film's length.
- After a local edit, check both neighbouring boundaries before you watch the whole film.

## Sound

- Use `Audio` from `@remotion/media`. Remotion's docs now treat `Html5Audio` as the legacy path.
- A soft lead-in or a stretch of silence at the start of a clip moves the audible hit away from frame 0. `scripts/audio-hit.mjs` measures that offset.
- Listen to the loudest event, the quietest cue that matters, and the ending, on both headphones and a phone speaker.
