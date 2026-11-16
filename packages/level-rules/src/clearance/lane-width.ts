import type { PlanPoint } from "../plan/index.js";
import { CELL, cellCentre, cellOf } from "./lane-grid.js";
import type { LaneGrid } from "./lane-grid.js";

/** The widest route from one spawn to the player spawn: its width and its narrowest cell. */
export interface Route {
  readonly width: number;
  readonly narrowest: PlanPoint;
}

/** The doubled distance, in cells, from a cell centre to the edge of a cell `d` cells away. */
function reach(d: number): number {
  return Math.max(0, 2 * d - 1);
}

/** Per cell, the distance in cells to the nearest blocked cell of its row; outside counts as blocked. */
function rowDistances(grid: LaneGrid): Int32Array {
  const { nx, nz, blocked } = grid;
  const rows = new Int32Array(nx * nz);
  for (let k = 0; k < nz; k++) {
    let last = -1;
    for (let i = 0; i < nx; i++) {
      last = blocked[k * nx + i] === 1 ? i : last;
      rows[k * nx + i] = i - last;
    }
    let next = nx;
    for (let i = nx - 1; i >= 0; i--) {
      next = blocked[k * nx + i] === 1 ? i : next;
      rows[k * nx + i] = Math.min(rows[k * nx + i]!, next - i);
    }
  }
  return rows;
}

/**
 * The clearance key of the free cell (i, k): the squared doubled distance in cells from its
 * centre to the edge of the nearest blocked cell. Rows search outward until no nearer cell can
 * exist; the rows beyond the grid count as blocked.
 */
function keyAt(grid: LaneGrid, rows: Int32Array, i: number, k: number): number {
  const { nx, nz } = grid;
  let best = Math.min(reach(k + 1), reach(nz - k)) ** 2;
  for (let d = 0; reach(d) ** 2 < best; d++) {
    const lower = k - d;
    const upper = k + d;
    if (lower >= 0) {
      best = Math.min(best, reach(rows[lower * nx + i]!) ** 2 + reach(d) ** 2);
    }
    if (upper < nz) {
      best = Math.min(best, reach(rows[upper * nx + i]!) ** 2 + reach(d) ** 2);
    }
  }
  return best;
}

/**
 * Per free cell, the clearance key, so a clearance of `sqrt(key) / 2` cells from its centre to
 * the edge of the nearest blocked cell. Blocked cells get -1.
 */
function clearanceKeys(grid: LaneGrid): Int32Array {
  const { nx, nz, blocked } = grid;
  const rows = rowDistances(grid);
  const keys = new Int32Array(nx * nz).fill(-1);
  for (let k = 0; k < nz; k++) {
    for (let i = 0; i < nx; i++) {
      if (blocked[k * nx + i] === 0) {
        keys[k * nx + i] = keyAt(grid, rows, i, k);
      }
    }
  }
  return keys;
}

/** The root of a cell in the union-find forest, halving the path on the way. */
function root(parents: Int32Array, cell: number): number {
  let c = cell;
  while (parents[c] !== c) {
    parents[c] = parents[parents[c]!]!;
    c = parents[c]!;
  }
  return c;
}

/**
 * The free cells, widest clearance first and ties by cell index, each packed as
 * `key * cells + (cells - 1 - cell)` so one numeric sort orders them; read from the end.
 */
function widestLast(keys: Int32Array): Float64Array {
  const cells = keys.length;
  const order = new Float64Array(cells);
  let n = 0;
  for (let cell = 0; cell < cells; cell++) {
    const key = keys[cell]!;
    if (key >= 0) {
      order[n++] = key * cells + (cells - 1 - cell);
    }
  }
  return order.subarray(0, n).toSorted();
}

/** Joins cell `n`, when it lies in the grid and was added, into the tree of `cell`. */
function link(parents: Int32Array, cell: number, n: number): void {
  if (n >= 0 && n < parents.length && parents[n] !== -1) {
    parents[root(parents, n)] = root(parents, cell);
  }
}

/** Joins a newly added cell with its added neighbours that share a side with it. */
function join(grid: LaneGrid, parents: Int32Array, cell: number): void {
  const i = cell % grid.nx;
  if (i > 0) {
    link(parents, cell, cell - 1);
  }
  if (i < grid.nx - 1) {
    link(parents, cell, cell + 1);
  }
  link(parents, cell, cell - grid.nx);
  link(parents, cell, cell + grid.nx);
}

/**
 * The widest route from each spawn's cell to the player spawn's cell. Free cells join the
 * union-find forest widest first; the cell that first connects a spawn to the player is the
 * narrowest of a widest route. A route is twice its least clearance plus one cell wide; a
 * spawn without a route has width 0 and its own cell as the narrowest.
 */
export function widestRoutes(
  grid: LaneGrid,
  player: PlanPoint,
  spawns: readonly PlanPoint[],
): Route[] {
  const keys = clearanceKeys(grid);
  const cells = keys.length;
  const parents = new Int32Array(cells).fill(-1);
  const target = cellOf(grid, player);
  const starts = spawns.map((at) => cellOf(grid, at));
  const routes: (Route | undefined)[] = spawns.map(() => undefined);
  let open = spawns.length;
  const order = widestLast(keys);
  for (let n = order.length - 1; n >= 0; n--) {
    const cell = cells - 1 - (order[n]! % cells);
    parents[cell] = cell;
    join(grid, parents, cell);
    if (parents[target] === -1) {
      continue;
    }
    const goal = root(parents, target);
    for (let s = 0; s < starts.length; s++) {
      const start = starts[s]!;
      if (routes[s] === undefined && parents[start] !== -1 && root(parents, start) === goal) {
        const width = (Math.sqrt(keys[cell]!) + 1) * CELL;
        routes[s] = { width, narrowest: cellCentre(grid, cell) };
        open--;
      }
    }
    if (open === 0) {
      break;
    }
  }
  return starts.map((start, s) => routes[s] ?? { width: 0, narrowest: cellCentre(grid, start) });
}
