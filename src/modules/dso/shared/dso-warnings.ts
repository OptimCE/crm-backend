import type { DsoEanCheck, DsoResult, DsoWarning } from "../domain/dso.types.js";

/**
 * Non-blocking remarks about a resolved address, for the meter form to show.
 *
 * Pure, and computed only from a resolved `result`: a `choose_*` answer has no
 * single region yet, and the form re-resolves once the user has chosen.
 *
 *  - `REGION_OUTSIDE_COMMUNITY_REGULATOR` — the address is regulated by someone
 *    other than the community's own regulator. A sharing operation stays inside
 *    one region, so this is usually a typo in the postcode.
 *  - `EAN_SIBELGA_OUTSIDE_BRUSSELS` — the EAN carries Sibelga's prefix but the
 *    address is not in Brussels. Informative only: the prefix rule is a
 *    convention, not part of what an EAN is (see meters/shared/ean.ts).
 *
 * @param community_regulator the community's `regulator`, or null when it could
 *   not be read — which suppresses the first warning rather than guessing.
 */
export function computeWarnings(
  result: DsoResult | null | undefined,
  ean_check: DsoEanCheck | null | undefined,
  community_regulator: string | null,
): DsoWarning[] {
  const warnings: DsoWarning[] = [];
  if (!result) {
    return warnings;
  }

  if (community_regulator && result.regulator && result.regulator !== community_regulator) {
    warnings.push({
      code: "REGION_OUTSIDE_COMMUNITY_REGULATOR",
      params: { address_regulator: result.regulator, community_regulator },
    });
  }

  if (ean_check?.known_operator === "sibelga" && result.region !== "BRU") {
    warnings.push({ code: "EAN_SIBELGA_OUTSIDE_BRUSSELS", params: { region: result.region } });
  }

  return warnings;
}
