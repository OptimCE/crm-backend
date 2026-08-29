import { describe, expect, it } from "@jest/globals";
import { simplifyGeometry } from "../../../src/modules/municipalities/shared/simplify.js";

type Position = [number, number];

/** A closed square with `extra` collinear points inserted along its bottom edge. */
function squareWithCollinearPoints(extra: number): { type: string; coordinates: Position[][] } {
  const bottom: Position[] = [];
  for (let i = 0; i <= extra; i++) {
    bottom.push([i / extra, 0]);
  }
  return {
    type: "Polygon",
    coordinates: [[...bottom, [1, 1], [0, 1], [0, 0]] as Position[]],
  };
}

describe("(Unit) simplifyGeometry", () => {
  it("drops collinear points that fall inside the tolerance", () => {
    const input = squareWithCollinearPoints(20);
    const before = simplifyGeometry(input, 0).simplified_points;

    const result = simplifyGeometry(input, 0.01);

    expect(result.simplified_points).toBeLessThan(before);
    expect(result.original_points).toBe(before);
  });

  it("is a pass-through at tolerance 0", () => {
    const input = squareWithCollinearPoints(20);

    const result = simplifyGeometry(input, 0);

    expect(result.simplified_points).toBe(result.original_points);
  });

  it("never returns more points at a larger tolerance", () => {
    const input = squareWithCollinearPoints(50);

    const loose = simplifyGeometry(input, 0.005).simplified_points;
    const tight = simplifyGeometry(input, 0.0001).simplified_points;

    expect(loose).toBeLessThanOrEqual(tight);
  });

  it("keeps the ring closed", () => {
    const result = simplifyGeometry(squareWithCollinearPoints(30), 0.01);
    const ring = (result.geometry as { coordinates: Position[][] }).coordinates[0];

    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("never reduces a ring below four points", () => {
    // A tolerance far larger than the shape would otherwise collapse it to a line.
    const result = simplifyGeometry(squareWithCollinearPoints(30), 100);
    const ring = (result.geometry as { coordinates: Position[][] }).coordinates[0];

    expect(ring.length).toBeGreaterThanOrEqual(4);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("does not mutate its input", () => {
    const input = squareWithCollinearPoints(30);
    const snapshot = JSON.stringify(input);

    simplifyGeometry(input, 0.01);

    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("returns a fresh array, not a reference into the input", () => {
    const input = squareWithCollinearPoints(10);

    const result = simplifyGeometry(input, 0);
    const ring = (result.geometry as { coordinates: Position[][] }).coordinates[0];
    ring[0][0] = 999;

    expect(input.coordinates[0][0][0]).not.toBe(999);
  });

  it("recurses into every polygon of a MultiPolygon", () => {
    const square = squareWithCollinearPoints(20).coordinates;
    const input = { type: "MultiPolygon", coordinates: [square, square] };

    const result = simplifyGeometry(input, 0.01);
    const polygons = (result.geometry as { coordinates: Position[][][] }).coordinates;

    expect(polygons).toHaveLength(2);
    expect(result.simplified_points).toBeLessThan(result.original_points);
    for (const polygon of polygons) {
      expect(polygon[0][0]).toEqual(polygon[0][polygon[0].length - 1]);
    }
  });

  it("returns a null geometry for anything that is not a polygon", () => {
    expect(simplifyGeometry(null, 0.001).geometry).toBeNull();
    expect(simplifyGeometry({ type: "Point", coordinates: [4.35, 50.85] }, 0.001).geometry).toBeNull();
    expect(simplifyGeometry({ nope: true }, 0.001).geometry).toBeNull();
  });

  it("infers Polygon vs MultiPolygon from nesting when `type` is missing", () => {
    const square = squareWithCollinearPoints(6).coordinates;

    expect((simplifyGeometry({ coordinates: square }, 0).geometry as { type: string }).type).toBe("Polygon");
    expect((simplifyGeometry({ coordinates: [square] }, 0).geometry as { type: string }).type).toBe("MultiPolygon");
  });
});
