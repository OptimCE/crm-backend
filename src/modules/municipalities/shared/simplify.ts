/**
 * Ramer-Douglas-Peucker simplification for the GeoJSON stored in
 * `municipality.geo_shape`.
 *
 * Written here rather than pulled from @turf/simplify on purpose. The repo has
 * no geo dependencies at all, is strict ESM with .js specifiers, and runs
 * ts-jest under --experimental-vm-modules; adding a transitive @turf/* tree into
 * that is real module-resolution risk for sixty lines of well-understood
 * arithmetic. The invariants that matter here are also ones we own: rings must
 * stay closed, every ring keeps at least four points, and the result is ALWAYS a
 * fresh array — the output is memoized and shared between requests, so a
 * mutating simplify would be an aliasing bug rather than an optimisation.
 *
 * Tolerance is in degrees. At Belgian latitudes 0.0005 degrees is roughly 55 m,
 * which is invisible at city zoom and typically takes a commune ring from a few
 * thousand points to a few hundred.
 *
 * Known limitation, shared with every non-topological simplifier including
 * turf's: neighbouring communes are simplified independently, so their shared
 * border diverges and can show hairline gaps. Only topology-aware
 * simplification (mapshaper/TopoJSON) fixes that. Mitigated in the UI with a
 * 1-2px stroke.
 */

type Position = [number, number];
type Ring = Position[];

/** Below this a ring is a degenerate sliver, so it is returned untouched. */
const MIN_RING_POINTS = 4;

export interface SimplifyResult {
  geometry: unknown;
  original_points: number;
  simplified_points: number;
}

export function simplifyGeometry(geometry: unknown, tolerance: number): SimplifyResult {
  const parsed = asGeometry(geometry);
  if (!parsed) {
    return { geometry: null, original_points: 0, simplified_points: 0 };
  }

  const original_points = countPoints(parsed.coordinates);

  if (!(tolerance > 0)) {
    // Pass-through still deep-copies: callers memoize the result, and handing
    // back the entity's own array would let one request mutate another's cache.
    const copy = deepCopy(parsed.coordinates);
    return { geometry: { type: parsed.type, coordinates: copy }, original_points, simplified_points: original_points };
  }

  const coordinates =
    parsed.type === "MultiPolygon"
      ? (parsed.coordinates as Ring[][]).map((polygon) => polygon.map((ring) => simplifyRing(ring, tolerance)))
      : (parsed.coordinates as Ring[]).map((ring) => simplifyRing(ring, tolerance));

  return {
    geometry: { type: parsed.type, coordinates },
    original_points,
    simplified_points: countPoints(coordinates),
  };
}

/**
 * Simplifies one linear ring, keeping it closed.
 *
 * RDP is run on the ring minus its duplicated closing point, and the first
 * point is re-appended afterwards. Running it on the closed ring instead would
 * let the endpoint drift and leave an unclosed polygon, which renders as a
 * wedge-shaped hole.
 */
function simplifyRing(ring: Ring, tolerance: number): Ring {
  if (!Array.isArray(ring) || ring.length <= MIN_RING_POINTS) {
    return deepCopyRing(ring);
  }

  const closed = isSamePoint(ring[0], ring[ring.length - 1]);
  const open = closed ? ring.slice(0, -1) : ring.slice();

  let simplified = douglasPeucker(open, tolerance);

  // A triangle is the smallest ring that still encloses area. If the tolerance
  // ate too much, fall back to the original rather than emitting a line.
  if (simplified.length < MIN_RING_POINTS - 1) {
    simplified = open;
  }

  const result = simplified.map((point) => [point[0], point[1]] as Position);
  if (closed) {
    result.push([result[0][0], result[0][1]]);
  }
  return result;
}

/** Iterative RDP — recursion would blow the stack on a 20 000-point coastline. */
function douglasPeucker(points: Position[], tolerance: number): Position[] {
  if (points.length < 3) {
    return points.slice();
  }

  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  const stack: [number, number][] = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop() as [number, number];
    let maxDistance = 0;
    let index = -1;

    for (let i = first + 1; i < last; i++) {
      const distance = perpendicularDistance(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }

    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

/** Distance from `point` to the segment `start`-`end`, in degrees. */
function perpendicularDistance(point: Position, start: Position, end: Position): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];

  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - start[0], point[1] - start[1]);
  }

  // Project onto the segment and clamp, so a point beyond an endpoint measures
  // to that endpoint rather than to the infinite line.
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

function isSamePoint(a: Position | undefined, b: Position | undefined): boolean {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

function countPoints(coordinates: unknown): number {
  if (!Array.isArray(coordinates)) {
    return 0;
  }
  // A Position is [number, number]; anything else is a nested array to recurse into.
  if (coordinates.length > 0 && typeof coordinates[0] === "number") {
    return 1;
  }
  return (coordinates as unknown[]).reduce<number>((total, child) => total + countPoints(child), 0);
}

function deepCopy(coordinates: unknown): unknown {
  if (!Array.isArray(coordinates)) {
    return coordinates;
  }
  if (coordinates.length > 0 && typeof coordinates[0] === "number") {
    return [...(coordinates as number[])];
  }
  return (coordinates as unknown[]).map((child) => deepCopy(child));
}

function deepCopyRing(ring: Ring): Ring {
  return Array.isArray(ring) ? ring.map((point) => [point[0], point[1]] as Position) : [];
}

/** Narrows the untyped jsonb column to the two geometry types we store. */
function asGeometry(value: unknown): { type: "Polygon" | "MultiPolygon"; coordinates: unknown } | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const type = record["type"];
  const coordinates = record["coordinates"];
  if (!Array.isArray(coordinates)) {
    return null;
  }
  if (type === "Polygon" || type === "MultiPolygon") {
    return { type, coordinates };
  }
  // The seed data occasionally omits `type`. Infer it from the nesting depth
  // rather than dropping the polygon entirely.
  const depth = nestingDepth(coordinates);
  if (depth === 3) {
    return { type: "Polygon", coordinates };
  }
  if (depth === 4) {
    return { type: "MultiPolygon", coordinates };
  }
  return null;
}

function nestingDepth(value: unknown): number {
  let depth = 0;
  let current: unknown = value;
  while (Array.isArray(current)) {
    depth += 1;
    current = current[0];
  }
  return depth;
}
