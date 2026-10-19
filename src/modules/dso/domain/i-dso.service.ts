import type { DsoOperator, DsoResolution, DsoResolveQuery } from "./dso.types.js";

export interface IDsoService {
  /**
   * The operator catalogue, DSOs first and Elia last.
   *
   * NEVER throws: `[]` when dso-lookup is unbound or unreachable, and the
   * frontend falls back to its own static list.
   */
  getOperators(): Promise<DsoOperator[]>;

  /**
   * Which DSO runs the network at an address, for prefilling a meter's GRD.
   *
   * NEVER throws for an upstream problem: a missing, slow or broken dso-lookup
   * is `{ available: false, status: "unavailable" }`. The prefill is advisory —
   * `POST /meters` never calls this, so creating a meter can never wait on it.
   */
  resolve(query: DsoResolveQuery): Promise<DsoResolution>;
}
