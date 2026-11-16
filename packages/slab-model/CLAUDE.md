# slab-model rules

- Keep the one shared builder the only code in the workspace that constructs a destruction
  lib model of a slab.
- Reach destruction lib only through `@level-designer/destruction-gateway`.
- Read a slab's box and corners through `@level-designer/level-format`; never compute them
  here.
- Never let a page import this component: it reaches destruction lib, whose Rapier copy
  must not meet sec-111's in a page bundle.
- Keep the mesh intact: apply no damage and judge no rule here.
- Store the mesher's vertex colours unchanged; they are already linear.
