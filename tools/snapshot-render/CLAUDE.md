# snapshot-render rules

- Shade every surface with the one fixed light from the upper left; add no other lighting
  model. The finish sheet shows albedo only.
- Read the level's geometry only through `@level-designer/level-glb`.
- Draw a finish only through `finish-paint`'s swatch, and take a face's class, low corner
  and size only from its slab frame rule; add no drawing rule here.
- Take the lens, the eye height and the markers as inputs; import no game value.
- Return sheets as bytes; read and write no file.
- Keep every sheet deterministic: the same GLB and input, or the same swatch, give the same
  bytes.
- Compute a test's expected pixels by hand from the stated scale and layout.
- Never assert a render time in a test.
