# render-gateway rules

- Keep this component a bridge: re-exports of the rendering library's public entries
  and their guards. Put no other logic here.
- Keep the library a `file:` dependency and the root `three` override equal to the
  `three` the library declares. Install only through `just setup`, which detaches the
  copy from the sibling files.
- Never write into rendering-poc.
