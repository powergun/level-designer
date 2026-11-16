# The disc rule: a candidate for `gap`, not in force

The `gap` rule in force is the lane rule of the level format document, "Clearance
rules". The owner approved it with its stated limits on 2026-11-16. This note keeps a
stronger variant that the architect proved on a scratch copy during TASK-001.03. Nobody
implements from it unless the art pass meets one of the two cases below and the owner
agrees. The scratch code is gone; the rule text here is enough to rebuild it.

## What it would change

It fixes the two limits the lane rule states, at the price of a second kind of test and
of judging every touching pair.

- A crossing is the same as in the lane rule: the shortest segment between two
  footprints, or a segment from one that meets an edge of the other at a right angle,
  0.7 m or longer and under 1.5 m.
- A crossing is free when a player fits on it. It passes through no standing footprint
  and no static obstacle between its ends, and a 0.7 m disc on its midpoint touches none
  of them. The pair's own two footprints count like every other.
- A pair 0.7 m or more apart fails when one crossing is free.
- A nearer pair, a touching pair included, fails when free crossings fill a stretch
  0.7 m wide.
- A prop gets one finding for all static obstacles: its shortest free crossing.

## The two cases it fixes

- Two 4 m walls that touch at one end and open to 1.2 m. The lane rule gives no finding;
  the candidate fails the pair at 0.7338 m.
- A crate 1.0 m from a wall tiled by two flush body boxes, facing the seam. The lane rule
  reports the gap twice; the candidate once.

## What was measured on the scratch copy

- 61 drawn cases, the 45 of the lane rule among them with the same results. The rule
  that judges every pair misses 26, the lane rule 5, the candidate none. The lane rule's
  five are the wedge, the two double findings and two more nearer pairs.
- Walls that meet at 45, 60, 70 and 80 degrees pass, as do a crate and a 6 m conveyor
  yawed 45 degrees with a corner on a wall. Walls that meet at 30 degrees fail, and so
  does a corridor 0.5 m at its neck that widens.
- Nine scenes of real `prop-kit` footprints give the lane rule's results.
- Cost on a touching 7 x 23 crate block, in a naive copy: 4.4 s, against 1.3 s for the
  lane rule in the same naive form, because touching pairs are searched too. The lane
  rule as built in `level-rules` takes 48 ms on that block.

## What it still would not catch

- A wedge blunter than about 40 degrees between two props that touch.
- A second pocket of one prop against static obstacles: one is reported per run.
- A notch 0.4 m deep beside a shorter crate and a corridor mouth 0.36 m deep still fail.

## What taking it up would cost

- `level-rules`: the `gap` check searches every pair under 1.5 m, and the plan unit gains
  the distance from a point to a convex outline and the length of a segment inside one.
- The level format document's "Clearance rules" and build-plan 3.2 change with it, and
  the two limits leave the format document.
- One more round for an engineer and a reviewer.

The scratch runs above were verified by the architect. The 40 degree figure is inferred.
So is the claim that the pairs of a third prop catch every pocket whose crossings that
prop cuts. Nothing of this candidate ran inside `level-rules`.
