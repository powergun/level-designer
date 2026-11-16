# sec111-gateway

`@level-designer/sec111-gateway` is the only bridge to sec-111, the game. No other
component imports sec-111 or reads its files.

## Entries

The main entry, `@level-designer/sec111-gateway`, is browser-safe. It offers:

- from sec-111's level data: `decodePreparedLevel`, `floorHeightAt`, `PLAYER_BODY`,
  `BODY_BOX_LIMIT` and the type `PreparedLevel`;
- from sec-111's physics: `createPhysicsWorld` and the types `PhysicsWorld`,
  `CapsuleBody` and `BlockerSet`;
- `GAME_VALUES`: the game-owned values a QA page must match: the lens, the post look at
  scale 1, the player's speeds, eye ratio and pitch limit, the tick rate, and the page
  constants (pixel-ratio cap, signature slots, frame clamp, warm-up frames).

The stage entry, `@level-designer/sec111-gateway/stage`, runs under Bun. It offers
`prepareLevel` from sec-111's level preparation and `readBaseStage()`, the bytes of
sec-111's base stage GLB. level-glb's tests read the base stage through it.

The testing entry, `@level-designer/sec111-gateway/testing`, runs under Bun and serves
tests only. It offers sec-111's own `readCommittedLevel()`, the committed prepared level
of the base stage, as real hall data without a preparation. No build reads it.

Every name except `readBaseStage` and `GAME_VALUES` is sec-111's own, unchanged.

Read the [component knowledge](docs/KNOWLEDGE.md) next.
