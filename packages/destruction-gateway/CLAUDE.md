# destruction-gateway rules

- Keep this component a bridge: re-exports of destruction lib's public facades and their
  guards. Put no other logic here.
- Keep the runtime half and the type half naming the same values, and keep every value
  used by a test through the typed entry.
- Never edit the git-ignored `generated/` folder; the emit script owns it.
- Never write into destruction lib.
