import type { BuildError, Report } from "@level-designer/level-pipeline";

/**
 * An accepted report. Its lengths carry float noise, as sec-111's and the lane rule's sums do,
 * so the printed lines prove the format's length rendering.
 */
export const ACCEPTED: Report = {
  hall: {
    interior: { min: [-16.6655, 0, -89.8707], max: [16.6655, 18.7, 30.3188] },
    floors: [0, 0.32410000000000005],
    ramp: { from: -60.2, to: -57.1 },
    spawns: [
      { name: "player", position: [0, 0, -22] },
      { name: "+x+z", position: [10.5, 0, 25.75] },
    ],
  },
  findings: [],
  summary: {
    triangles: { count: 113709, limit: 300000 },
    points: { count: 1, limit: 8 },
    bodyBoxes: { count: 225, limit: 256 },
    lanes: [{ spawn: "+x+z", width: 9.000000000000002, keeps: 3 }],
    slabs: { count: 10, limit: 800 },
    props: { count: 2, limit: 200 },
  },
  accepted: true,
};

/** The accepted report's printed lines, written by hand from the level format's report. */
export const ACCEPTED_LINES: readonly string[] = [
  "interior\t-16.6655,0,-89.8707\t16.6655,18.7,30.3188",
  "floors\t0\t0.3241",
  "ramp\t-60.2\t-57.1",
  "spawn\tplayer\t0,0,-22",
  "spawn\t+x+z\t10.5,0,25.75",
  "triangles\t113709\t300000",
  "points\t1\t8",
  "body-boxes\t225\t256",
  "lane\t+x+z\t9\t3",
  "slabs\t10\t800",
  "props\t2\t200",
  "accepted",
];

/** A rejected report with two findings and no ramp. */
export const REJECTED: Report = {
  ...ACCEPTED,
  hall: { ...ACCEPTED.hall, ramp: null },
  findings: [
    {
      rule: "light-floor",
      subject: "lighting.points[0]",
      message: "lighting.points[0] sits 0.5 m under the floor at (0, 0)",
    },
    {
      rule: "spawn",
      subject: "front",
      message: "prop front stands 2 m from the player spawn; keep 6 m",
    },
  ],
  accepted: false,
};

/** Two build errors of one step, as the pipeline returns them. */
export const BLOCKING: readonly BuildError[] = [
  {
    rule: "place",
    path: "props[0].at",
    message: "props[0].at: (100, 0) lies outside the interior",
  },
  {
    rule: "kind",
    path: "props[1].kind",
    message: 'props[1].kind: unknown kind "robot"; the kinds are conveyor',
  },
];
