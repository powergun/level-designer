# sec111-gateway rules

- Keep this component a bridge: re-exports of sec-111's public facades, the base stage
  reader, `GAME_VALUES` and their guards. Put no other logic here, and never reach into
  sec-111's internals except the drift test's reads of the copied values.
- Keep the main entry browser-safe. File access belongs to the stage and testing
  entries; only tests import the testing entry and its two readers, `readCommittedLevel`
  and `readCommittedFiles`.
- Never write into sec-111.
