# qa-client knowledge

`@level-designer/qa-client` is the QA page. It owns the boot, the input, walk and fly, the
marks, the heads-up display, the page side of the run log and the JSON protocol it shares with
`qa-server`. It depends on [level-view](../../level-view/docs/KNOWLEDGE.md),
[level-format](../../level-format/docs/KNOWLEDGE.md) and
[sec111-gateway](../../sec111-gateway/docs/KNOWLEDGE.md).

## Entries and units

Like sec111-gateway, the package has several entries on purpose. The facade serves the page
scripts and the page tests. It reaches sec-111 through `bootPage`, so importing it loads
sec-111's physics and Rapier. The protocol entry is the protocol unit alone and depends on
nothing, so `qa-server` opens its run log before any sibling loads. The page files are a
document, a style and two scripts that `qa-server` serves. The server bundles the two scripts
apart, so the boot watch runs when the program fails to load. `page/watch.ts` imports the watch
unit's facade directly, and the watch unit reaches only the protocol, the surroundings and the
transport units. Its bundle therefore holds no module from outside this package, so no module
of the program's graph can take the watch down while it loads. The testing entry serves the
tests of this package and of `qa-server`.

The units under `src/`, from the bottom up:

- `protocol`: the routes, file names, limits and shapes, with the server's admissions and the
  page's readers;
- `surroundings`: the ports of the outside world and the region read;
- `transport`: one request with the 15 s timeout on the injected timers;
- `log`, `display`: the page log and the alarm banner; the visible text;
- `motion`, `marks`: walk and fly; the comment box flow;
- `boot`, `run`: the boot steps; the input and the frame loop after the boot;
- `watch`: the boot watch;
- `testing`: the hand-built and scripted parts of the testing entry.

## The protocol

Every API answer is one JSON object with `logFailure`: null when the server wrote the run log
lines of the request, else the reason. A refusal carries a `reason`, which the page branches on,
and a `message`, which it shows. The session facts hold the run, the run log and marks file
paths and the build: built with name, description hash and verdict, or blocked with its errors
alone. A log batch and a mark name the run; the server refuses another run's with `other-run`,
and the page then says `reload the page`.

The admissions read the run first, so an old page's body of an older shape still reads as
another run. Then come the exact keys, the pose and the comment, and the comment cap of 2,000
characters last. A log batch holds 1 to 200 lines of 1 to 8,000 characters. A line's time is a
date instant, at most 8.64e15 ms from the epoch either way, so the server can always format it.

`LINE_TERMINATORS` is the one set of line terminators: every character a Unicode line splitter,
such as Python's `splitlines`, breaks on (LF, VT, FF, CR, FS, GS, RS, NEL, LS and PS).
`foldLines` turns each run of them into a space. The page folds a comment with it, the admission
refuses a comment that holds one, and the server folds run log text, so no text forges a line.

## Surroundings

`bootPage` takes everything outside the page as one value: the document, the window, the clock,
the timers, `fetch`, the browser's WebGPU entry, the view starter, the physics starter and the
console. The boot watch takes the first five of them. The real document and window fit these
ports, and the browser-safe type check of both page scripts proves it. The page reads its
regions once, by id and tag; a missing region throws before the start, and the boot watch
reports it. The canvas region is the one `level-view` draws on, so the view starter takes
`level-view`'s own input and the program passes `startLevelView` as it is. The page fills that
input from the level files: the GLB, the decoded level's finish table and lighting, and the
prepared level's interior.

The physics starter is a port because Rapier's asynchronous start in the browser is the living
producer of a physics failure. The view port holds `frame` and `frameRate`, so the scripted view
stands in for `level-view`'s class.

## Boot

The boot runs in a fixed order: session facts, WebGPU probe, level files, level view, walk
world, input, frame loop. Each step logs its start, names itself in the status strip, flushes
the log batch, then logs its outcome. A failed step shows its message and ends the boot. A
blocked build lists each error with its rule and path. A failed walk world turns walk off and
keeps fly. Lines written before the session facts wait for the run, because the server takes a
batch only under its run. A failed session step therefore also says that the page's lines are
not in the run log. A WebGPU adapter that gives no `info` counts as available, without a
description.

The boot watch waits 10 s for `bootPage` to mark the status strip. A failed load of the program
script, an uncaught error or rejection before the start, or the timeout writes the reason into
the status strip, or into the body without one, and posts it under the run of its own session
request.

## Walk, fly and marks

Walk moves sec-111's capsule at the game's 60 Hz tick, at most the ticks of the 1/15 s frame
clamp per frame. The world holds the prepared body world and one blocker box per slab, from the
slab's oriented box, and steps once before the capsule stands at the player spawn. Fly moves at
8 m/s, 24 m/s with `Shift`, and the look turns 0.0022 rad per mouse pixel; these three values are
the page's own.

The page starts in the game's start look, so its first frame is what the player sees first:
toward -Z, the back wall, with the sealed end behind. `GAME_VALUES.player.startForward` holds
that look as a direction in world axes. The page keeps its own yaw convention, in which yaw 0
looks along +Z, and the `motion` unit is the one place that converts the direction into it: the
start yaw is pi and the start pitch 0. A mark records its yaw folded into (-180, 180], so a mark
taken at the start reads 180, as the heads-up display does. The walk tests steer in the start
frame, so they hold whatever way the page starts.

Fly to walk makes a new capsule, because the capsule has no teleport. Its feet start at the
camera's eye less the eye height, never below the marked floor, and gravity drops it onto
whatever the body world holds below, a stage obstacle's top included. The physics world itself
decides whether the point is sound: probe capsules walk ten ticks in each plan direction, and
a point where fewer than two directions cover half their distance is stuck. A camera inside an
obstacle or within the capsule's radius of a side face is such a point. There the page stays in
fly and says why, so no state reads walk with a capsule that cannot move. An interior corner
about 0.4 m from both side faces is sound, because two directions stay free. A camera inside a
slab is sound too: the capsule walks out of a blocker box freely. The rule refuses one kind of
point where a player could stand: within about 0.65 m of the closed end of a narrow corridor,
only the way back is free. There the page stays in fly and says why; flying back out of the
dead end and switching again gives walk. Outside the interior the page stays in fly too.

The heads-up display names the loud clear colour when `?leak=1` selected it, so a mistyped flag
shows at once.

A mark freezes movement and releases the mouse. Its pose is rounded to 1 mm and 0.1 degree. The
box stays open with its text on a block or a failure, and a second `Enter` while saving does
nothing. The box's hint states the 2,000 character cap, and says so when the text reaches it,
because the browser cuts a longer paste without a word.

## Layout

The regions stack in one column over the view, in document order: the heads-up display, the
verdict banner, the alarm banner, the build error list, a gap, the comment box and the status
strip. No region covers another. The display and the status strip carry an inline minimum
height, so they never collapse and grow with their text; text wraps, and no script sets a
height or an overflow that clips. The status strip, the alarm banner and the error list each
have a maximum height in the stylesheet and scroll past it, so a message taller than the window
stays in reach. The alarm banner shows the newest alarm first, each as one line: the first line
of its text, cut at 240 characters. Four such lines wrap to about eight in a window 1,280 px
wide, so the first line of every kind stays in view at once; a stack and the rest of a long
text are in the run log. Tests under Bun prove the
document order, the inline styles and those stylesheet rules. Only the human's QA shows the
layout itself at the owner's window size and scaling.

## Run log and failures

The page flushes its batch before each boot step, on every error line, after each mark outcome
(saved, blocked, cancelled or failed) and every 5 s from the moment it joins the run, whatever
the boot does afterwards. A batch that is not logged raises the banner; its lines are not sent
again. An `other-run` refusal ends the posting for good with one banner line, because every
later batch would be refused the same way.

The banner holds one alarm of each kind, newest first: the drawing (a lost GPU device, a GPU
error, a frame that throws), the run log (a failed or refused batch, a `logFailure`), the page
(an uncaught error or rejection) and the console (a `console.error` call). A new alarm
replaces the one of its own kind only, so a dead run log never pushes a lost device out of view. A text already in view is not raised
again, and its line is not written again, so a dead log falls quiet. A stopped drawing replaces
`ready` in the status strip with `drawing stopped`. A drawing alarm's text begins with
`drawing stopped`, then the failure's kind and its message, so the banner's cut never removes
the consequence of a multi-line GPU error. A rejected level keeps its verdict banner
in view.

The page copies the calls to `console.error` and `console.warn` into the log. A painter
program whose pipeline fails to build reaches the page only this way: three.js reports it as a
console error, skips the program's draws and lets the compile resolve, so props go missing.
Every console error therefore also raises the console alarm, in every run and at every boot
step: one banner line that says programs may have failed and props may be missing, and names
the run log's path from the session facts. Before the session facts it names the run log
without a path, and the join adds the path to the line in view. After a failed session step
it says that the page's lines are not in the run log, as the status strip does, and after an
`other-run` refusal too. Its line is
logged once: a later console error writes its own line only, and a changed path changes the
banner alone. The page cannot tell a failed program from another console error without
reading the error's text, so a texture that three.js cannot decode raises the alarm too. A
console warning raises nothing. The browser's own console messages, such as WebGPU validation
warnings or failed resource loads, call neither function and never reach the run log.

A shader that fails to compile reaches the view's failure callback as a GPU error and stops the
drawing like any other.

The view's failure callback is live from the renderer's admission on, so a lost device can fire
while the view still starts. The banner shows it at once, whatever the start does next:

- a start that then resolves started draws no frame;
- a start that then resolves failed also shows its own failure in the status strip;
- a start that never settles leaves the status strip on `boot: level view`.

## Tests

The tests boot the real `bootPage` on the hand-built document of the real `page/index.html`
against a scripted fake of the protocol, with the scripted view and the manual timers. The fake
reads every posted batch and mark through the server's admissions. Walk runs sec-111's real
physics on its committed prepared level, with a level whose last slab stands across the path.

Only a browser and the human show the real look, the pointer lock, the browser's own use of `F3`
and the WebGPU adapter's behaviour.
