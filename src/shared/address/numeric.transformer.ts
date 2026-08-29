import type { ValueTransformer } from "typeorm";

/**
 * Converts a Postgres `numeric` column to a JavaScript number on read.
 *
 * node-postgres returns `numeric` as a STRING — deliberately, because the type
 * is arbitrary-precision and `Number` would silently lose digits — and TypeORM
 * does not coerce it. Without this transformer `address.latitude` reaches the
 * DTO as `"50.846700"`, the JSON response carries a quoted string, and MapLibre
 * silently refuses to plot it. There is no error anywhere in that chain, which
 * is why it is worth a transformer and a test rather than a cast at the call
 * site.
 *
 * Latitude/longitude at scale 6 (~11 cm) are far inside the 2^53 range where a
 * double is exact, so the precision argument against Number does not apply here.
 */
export const numericToNumber: ValueTransformer = {
  to: (value: number | null | undefined): number | null => value ?? null,
  from: (value: string | number | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return typeof value === "number" ? value : Number(value);
  },
};
