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

/**
 * Keeps `address.number` a string on the way out, whatever the column is.
 *
 * A Belgian house number is not a number: BeSt Address registers `12A`, `12-14`,
 * `1/3`, `12 bis`, `2/0001`. The column is being widened from `int` to
 * `varchar(32)` for that reason, and this transformer is what makes the widening
 * safe to do in two deploys instead of one.
 *
 * While the column is still `int`, node-postgres parses it to a JS number and the
 * API would emit `12`; once it is `varchar` the same driver returns `"12"`. That
 * flip happens the moment the DDL lands, regardless of what the TypeScript says,
 * so without this the wire type of every address response changes underneath a
 * frontend that was not deployed for it. With it, the response is a string from
 * the first backend deploy onwards and the DDL is invisible to every client.
 *
 * `to` is deliberately a pass-through: a digits-only string parameter is accepted
 * by both an `int` and a `varchar` column, which is what lets one build run
 * against either schema.
 */
export const houseNumberToString: ValueTransformer = {
  to: (value: string | null | undefined): string | null => value ?? null,
  from: (value: string | number | null): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return typeof value === "string" ? value : String(value);
  },
};
