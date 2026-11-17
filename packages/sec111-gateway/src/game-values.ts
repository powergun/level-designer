/**
 * The game-owned values the QA app copies, so it walks and looks the way sec-111 does. The test
 * @packages/sec111-gateway/tests/game-values.test.ts compares every value with sec-111's live
 * source: exported values by import, the private `page` constants by a match in their source
 * text.
 */
export const GAME_VALUES = {
  /** The first-person lens: vertical field of view in degrees, clip planes in metres. */
  lens: { fovDeg: 92, near: 0.05, far: 160 },
  /** The game's post configuration at scale 1 (`arenaLook(1)`). */
  look: {
    fisheye: 0.36,
    chromaticAberration: 0.0035,
    vignette: 0.48,
    grain: 0.035,
    lensHousing: 1,
    lensSoftness: 0.22,
    lensDirt: 2.3,
    hazeDensity: 0.03,
    hazeColor: [0.006, 0.01, 0.017],
    hazeGlow: 0.9,
    exposure: 1.0,
    bloomStrength: 0.7,
    bloomRadius: 0.6,
    bloomThreshold: 0.75,
    bloomKnee: 0.35,
    bloomTints: [
      [1.0, 1.0, 1.0],
      [0.97, 1.0, 1.03],
      [0.9, 0.97, 1.08],
      [0.82, 0.94, 1.14],
      [0.75, 0.9, 1.2],
    ],
    tint: [0.8, 0.93, 1.1],
    contrast: 1.3,
    shadowTint: [0.7, 1.0, 1.12],
    highlightTint: [1.03, 1.0, 0.96],
    cdlSlope: [0.97, 1.0, 1.04],
    cdlOffset: [-0.005, -0.0025, 0.0005],
    cdlPower: [1.08, 1.05, 1.0],
    saturation: 0.82,
    xrayDark: [0.035, 0.006, 0.012],
    xrayMid: [0.48, 0.11, 0.09],
    xrayHot: [1.0, 0.8, 0.68],
    xrayEdgeScale: 40,
    xrayEdgeGain: 0.85,
    xrayDetail: 0.5,
    xrayDensity: 1.1,
    xrayFadeDistance: 24,
    scanlineIntensity: 0.45,
    scanlinePeriodPx: 3,
    scanSweepPeriod: 4.0,
    scanSweepSpeed: 0.8,
    scanSweepIntensity: 0.3,
    visionTransition: 0.25,
    transitionGlitch: 1.0,
    cloakRefraction: 0,
    cloakDispersion: 0,
    cloakRim: 0,
    enemyCore: 0,
    enemyHalo: 0.3,
    healthBar: {
      width: 0.8,
      height: 0.16,
      lift: 0.12,
      minScreenWidth: 0.035,
      maxScreenWidth: 0.09,
      fill: [0.36, 0.86, 1.0],
      back: [0.05, 0.02, 0.03],
    },
  },
  /**
   * The player: speeds in m/s, the eye as a share of the body height, the pitch limit in rad, and
   * the unit view direction at the start in world axes, which needs no yaw convention to read.
   */
  player: {
    walkSpeed: 3.5,
    sprintSpeed: 5.5,
    eyeRatio: 0.92,
    maxPitch: 1.55,
    startForward: [0, 0, -1],
  },
  /** Fixed simulation ticks per second. */
  tickRate: 60,
  /** The renderer start and the page frame, private constants of sec-111's view and page. */
  page: {
    /** The renderer's pixel-ratio cap. */
    pixelRatioCap: 1.5,
    /** The signature slots the composite reserves, all empty in the QA app. */
    signatureSlots: 12,
    /** The frame delta clamp as a rate: a frame never advances more than 1 / 15 s. */
    frameClampRate: 15,
    /** Frames rendered before the level is shown. */
    warmUpFrames: 2,
    /** The scene's clear colour behind everything, linear RGB. */
    clearColor: [0.004, 0.005, 0.007],
  },
} as const;
