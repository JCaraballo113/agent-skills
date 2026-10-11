---
name: motion-brief
description: Directs a short product film in Remotion through a frame-numbered BRIEF.md, measured reference motion, and stages reviewed as stills. Use when making a launch or product demo video in Remotion, breaking down a reference animation, or retiming a Remotion film.
---

# Motion brief

A product film is a run of **events**: moments with a frame number someone can point at, such as the card landing, the press registering or the result appearing. `BRIEF.md` holds every event, every **hold** (how long a piece of text stays readable) and every sound cue. The film gets built in **stages**, and each stage ends on rendered stills that a person approves. Every fix names its frames.

This skill owns direction: what happens, on which frame, and for how long. For Remotion APIs, defer to Remotion's own skills (start with `/remotion-best-practices`).

## Requirements

- Node 20 or later, plus `ffmpeg` and `ffprobe`. Check them with `node --version` and `ffprobe -version`.
- A Remotion project: `remotion` appears in its `package.json`.
- Remotion's Agent Skills: `remotion-best-practices` is in the available-skills list.

When one is missing, give the user its command from [skill.deps.json](./skill.deps.json) for their OS and stop. To start a new project, run `npx create-video --yes --blank <name>`, then run `npx remotion skills add` inside it.

In the steps, `scripts/` means this skill's own `scripts/` folder. Run each script with `node`, from the project root.

## Steps

### 1. Measure the reference (when the user has one)

Run `node scripts/reference.mjs <reference video> --out reference/`. It writes `reference/REFERENCE.md` with the **Measured** section filled in, and saves two sets of images whose names carry the source frame:
- `reference/overview/`: two per second, 960 px wide.
- `reference/events/`: each event's start and settle, two frames either side, plus its peak, at full resolution.

If the video has a variable frame rate, the script refuses it and prints the command that makes a constant-rate copy. Measure that copy instead.

Then look through the overview images in order, then each event's images, and fill in **Estimated**:
- what moves first, and where the eye lands
- the direction, scale change, opacity change and any overshoot of each move
- the order in which the product, headline and supporting labels appear
- how long the result holds, and the state it carries into the next shot

Every estimate cites the frames it came from. When a value is uncertain, also name the frames that would settle it.

Positions are the exception. Take them from the Measured boxes, or read them off the `events/` images only. Claude reports coordinates in the image it saw, so a position read off a 960 px overview image is off by the overview's scale. When REFERENCE.md lists a scale for the event images, divide by it.

Finish with **Proposed**: one original shot for the user's product, using their assets. Give its layout, focal point, entrance, product response and reading hold. List the missing assets and the questions that need their approval.

Done when every measured event has estimates with frame citations, and Proposed has gone to the user for approval before any code.

### 2. Write the brief

Copy the body of [BRIEF-TEMPLATE.md](./BRIEF-TEMPLATE.md) into the project's `BRIEF.md`. Replace each bracket with the user's real copy and assets. Retime the events from the approved shot plan: write each time in seconds first, then multiply by fps to get the frame (0.6 s at 30 fps is frame 18). Keep the opening line short and let the product action carry the explanation. Anything that takes several sentences to explain gets its own scene.

Run `node scripts/brief-check.mjs BRIEF.md`. It checks that the scenes cover every frame, that events and stills fall inside the film, that each hold is long enough to read its text (15 characters per second, and at least one second), and that each sound cue sits on an event.

Done when brief-check reports no errors, and every bracket is either filled or asked of the user.

### 3. Build one stage

Read [CRAFT.md](./CRAFT.md) before writing motion code. Inspect `public/` for each asset's dimensions, and confirm the font loads. Then implement the first `STAGE` in BRIEF.md that hasn't been approved yet.

Run `node scripts/brief-check.mjs BRIEF.md --commands`. Render that stage's stills, its moving preview, and the boundary preview into it, then view every still. Check each one against the brief:
- the longest copy wraps within its line limit in the real rendered font, weight and spacing
- content stays inside the margins
- elements settle on the brief's coordinates
- product labels stay readable at phone size
- nothing is cropped or overlapping

Report the changed files, stills, previews and open issues, then wait.

Done when the user approves this stage's stills. Then build the next stage the same way.

### 4. Fix by frame

Write each correction in four fields:
1. **Location:** a global frame or range.
2. **Observed problem:** what's wrong at that location.
3. **Change:** the one scoped edit.
4. **Keep:** what must stay fixed.

Work in this order: missing information and unreadable text, then timing, then visual detail. A frame inside a `<Sequence>` is local: global = the sequence's `from` + the local frame.

Keep the repair loop **local**:
1. Make the scoped edit.
2. Re-render the affected frames, plus the boundary previews on both sides.
3. Watch it at normal speed.

When an event moves, update its `EVENT` line in BRIEF.md in the same edit and rerun brief-check. For a second opinion, give a fresh subagent BRIEF.md, the stills and REFERENCE.md, and ask for at most five corrections in the four-field form.

Done when the affected stills and both boundaries have been re-rendered and viewed, and BRIEF.md matches the code.

### 5. Land the sound

For each `CUE`, run `node scripts/audio-hit.mjs <audio file> --fps <fps> --at <cue frame>`. It finds where the clip becomes audible and where its strongest hit lands, then gives the start frame, or the trim, that puts the hit on the event. Sound effects and music each get their own track, placement and volume.

Done when every cue's clip starts where audio-hit put it.

### 6. Export

1. Render the whole composition with `npx remotion render <id> out/<name>.mp4 --codec=h264`.
2. Run `node scripts/brief-check.mjs BRIEF.md --export out/<name>.mp4`. It checks the size, frame rate and frame count against the brief.
3. Pull the opening, result and closing frames out of the exported file and view them.
4. Keep the export next to BRIEF.md and its cue list.

Done when the export check passes and the user has watched the film at normal speed.
