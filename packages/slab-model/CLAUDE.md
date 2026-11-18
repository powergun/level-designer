# slab-model rules

- Keep the one shared builder the only code in the workspace that constructs a destruction
  lib model of a slab.
- Reach destruction lib only through `@level-designer/destruction-gateway`.
- Read a slab's box and corners through `@level-designer/level-format`; never compute them
  here.
- Never let a page import this component: it reaches destruction lib, whose Rapier copy
  must not meet sec-111's in a page bundle.
- Keep the mesh intact: apply no damage and judge no rule here.
- Keep the mesher's vertices: share no corner and change no triangle count.
- Give every vertex the slab's own colour, the model's linear base colour, the inside face
  included; decode no sRGB here.
- Take a face's frame only from `@level-designer/finish-paint`'s `slabFrame`; never
  compute it here.
