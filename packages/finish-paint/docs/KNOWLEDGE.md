# finish-paint knowledge

`@level-designer/finish-paint` holds the parts of a painter that do not depend on where it
runs. A painter evaluates a finish's layers at a point of a surface; the same layer code
runs on numbers on the CPU and on shader nodes on the GPU.

The component has two units:

- `arithmetic`: the interface of fourteen operations over one scalar type, and the number
  back end, whose every operation rounds its result to a 32-bit float;
- `kinds`: the layer kinds `bands`, `cells`, `dots`, `rectangle` and `noise`, with the
  lattice hash and the footprint fade that they share.

The node back end lives in `level-view`, the one component that draws with three.js.
