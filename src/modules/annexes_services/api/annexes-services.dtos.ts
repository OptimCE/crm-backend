import { Expose } from "class-transformer";
import { Role } from "../../../shared/dtos/role.js";

/**
 * Single catalog entry as exposed to the frontend.
 * Mirrors the shape of an entry in `config/annexes-services.json`.
 */
export class AnnexCatalogEntryDTO {
  @Expose()
  feature!: string;

  @Expose()
  displayKey!: string;

  @Expose()
  descriptionKey!: string;

  @Expose()
  icon!: string;

  @Expose()
  minRole!: Role;

  @Expose()
  frontendRoute!: string;

  @Expose()
  subscribePath!: string;

  @Expose()
  unsubscribePath!: string;
}

/**
 * Catalog entry augmented with the active community's subscription state.
 */
export class CommunityAnnexDTO extends AnnexCatalogEntryDTO {
  @Expose()
  subscribed!: boolean;
}
