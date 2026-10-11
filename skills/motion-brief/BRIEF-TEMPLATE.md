# BRIEF.md template

Copy everything below the line into the project's `BRIEF.md` and replace each bracketed field. The numbers are the worked example from the source article: a 20-second square film that shows one export action. Treat them as a first preview's starting values and retime them in playback.

Lines that start with `Composition:`, `SCENE`, `TRANSITION`, `EVENT`, `HOLD`, `CUE` or `STAGE` are read by `scripts/brief-check.mjs`. Keep their format exactly; write everything else as plain prose.

| Line | Format | Meaning |
|---|---|---|
| `Composition:` | `Composition: <id>, <w> by <h>, <fps> fps, <frames> frames.` | `<id>` is the Remotion composition's `id`; the render commands use it. Its last frame is `frames - 1`. |
| `SCENE` | `SCENE <name>: FRAMES <a> THROUGH <b>` | Scenes tile the film from 0 to the last frame with no gaps. |
| `TRANSITION` | `TRANSITION <a> <b>` | Declares frames where two scenes overlap (a TransitionSeries transition). |
| `EVENT` | `EVENT <frame> <name> <what the viewer sees>` | One moment someone could point at. Names are unique. |
| `HOLD` | `HOLD <from> <to> "<exact on-screen text>"` | From the frame the text is fully legible to the last frame it stays put. |
| `CUE` | `CUE <frame> <name> <sound>` | A sound's strongest hit. It sits on an `EVENT` frame. |
| `STAGE` | `STAGE <name> <frame> <frame> …` | The stills to render and review before the next stage is built. |

---

GOAL
Show how [product] [does the one action].
Viewer: [who uses this feature].
Opening copy: [the outcome, at most eight words].
Closing copy: [one next action and where to take it].

DELIVERY AND ASSETS
Composition: Launch, 1080 by 1080, 30 fps, 600 frames.
Every frame number in this brief is global and inclusive, counted from 0.
Assets under public/: [logo], [screen before the action], [screen after the action], [font], [audio].
Inspect each asset's dimensions and confirm the font loads before building. Ask for any missing screen, or any crop too small to read, before going on.

LAYOUT
Coordinates are canvas pixels from the top-left corner.
Background #101318, primary text #F5F7FA, accent #8AD8B0.
Essential content stays inside a 64-pixel outer margin.
Headline box: x96, y112, width 888; 64-pixel font, 1.1 line height, two lines at most, checked with the longest headline you expect to use.
Product card: x120, y350, width 840, height 480, corner radius 24.
Fit the supplied screen inside the card with the action's control still readable. Record the button anchor and result anchor from the fitted screen, in canvas pixels.
Layer order, back to front: background, card, product content, cursor, headline.

SCENE OPENING: FRAMES 0 THROUGH 119
EVENT 0 headline-enters Headline rises 24 px and fades in, through frame 18
EVENT 18 card-enters Card rises 60 px and fades in, through frame 42
EVENT 42 card-settled Opening layout at rest
HOLD 18 119 "[opening copy]"
Both entrances use cubic ease-out with clamped endpoints. The settled layout holds still through 119.

SCENE PRODUCT: FRAMES 120 THROUGH 419
The card enters frame 120 at exactly its settled position and scale.
EVENT 150 cursor-moves The cursor heads for the button, along a path clear of text, through 180
EVENT 180 cursor-arrives The cursor reaches the button anchor
EVENT 195 press Press registers: cursor scale 1 at 192, 0.92 at 195, 1 at 201; button shows its pressed state
EVENT 204 cursor-leaves The cursor moves to a clear resting point inside the card, through 222
EVENT 210 result Finished file appears; its reveal completes by 234
HOLD 234 419 "[result label]"
Record the cursor path's waypoints. The result stays readable and stationary through 419.

SCENE CLOSING: FRAMES 420 THROUGH 599
EVENT 420 closing-cut Cut to the logo and closing copy
HOLD 438 599 "[closing copy]"
The closing copy fades in from 420 through 438 and holds through 599.

SOUND
CUE 195 click click transient on the press
CUE 210 reveal reveal accent on the result
Music settles under the closing hold. Sound effects and music sit on separate tracks with their own placement and volume.

IMPLEMENTATION
Every animated value comes from useCurrentFrame(). Timing and layout live in exported constants, one object per element (offset, destination, start, duration, easing), so a revision touches one place.
Any variation uses a fixed seed. The camera stays still in this pass.

REVIEW
STAGE opening 0 18 42 60 119
STAGE product 120 195 210 234 419
STAGE closing 420 540 599
Build one stage, render its stills and its moving preview, report, and wait for approval before the next.
