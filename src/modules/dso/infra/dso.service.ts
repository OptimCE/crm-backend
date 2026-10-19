import { inject, injectable } from "inversify";

import { container } from "../../../container/di-container.js";
import logger from "../../../shared/monitor/logger.js";
import type { IAuthContextRepository } from "../../../shared/context/i-authcontext.repository.js";
import type { ICommunityRepository } from "../../communities/domain/i-community.repository.js";
import type { IDsoService } from "../domain/i-dso.service.js";
import { DSO_LOOKUP_CLIENT_TOKEN, type IDsoLookupClient } from "../domain/i-dso-lookup.client.js";
import type { DsoEanCheck, DsoOperator, DsoResolution, DsoResolveQuery, DsoResolveResponse } from "../domain/dso.types.js";
import { DsoUnavailableError } from "../shared/dso-unavailable.error.js";
import { communeNamed, normaliseName, toNisString } from "../shared/dso-names.js";
import { computeWarnings } from "../shared/dso-warnings.js";

/** A fresh object each time: the answer is serialised per request, and nothing should share its `warnings`. */
function unavailable(): DsoResolution {
  return { available: false, status: "unavailable", warnings: [] };
}

/**
 * Prefills a meter's GRD from its address, through the internal dso-lookup.
 *
 * Advisory end to end. Every upstream failure — unbound, refused, slow, or
 * answering garbage — is `status: "unavailable"` with a 200, and the form keeps
 * whatever the user picks. `POST /meters` never comes through here, so a missing
 * dso-lookup can never cost anyone a meter.
 *
 * Budget: at most two sequential dso-lookup calls (the timeout is 1000 ms each
 * by default), plus an EAN check and the community's regulator read in
 * parallel, all inside KrakenD's 3000 ms gateway cap.
 */
@injectable()
export class DsoService implements IDsoService {
  constructor(
    @inject("AuthContext") private readonly authContext: IAuthContextRepository,
    @inject("CommunityRepository") private readonly communityRepository: ICommunityRepository,
  ) {}

  /**
   * Resolved lazily, never injected. The factory is skipped under NODE_ENV=test
   * and binds nothing when no URL is configured, so a constructor injection would
   * make `container.get(DsoController)` throw "no matching bindings" exactly when
   * the feature is meant to be quietly off. Same shape as GeocodingService.suggester().
   */
  private client(): IDsoLookupClient | null {
    try {
      return container.isBound(DSO_LOOKUP_CLIENT_TOKEN) ? container.get<IDsoLookupClient>(DSO_LOOKUP_CLIENT_TOKEN) : null;
    } catch {
      return null;
    }
  }

  async getOperators(): Promise<DsoOperator[]> {
    const client = this.client();
    if (!client) {
      return [];
    }
    try {
      return await client.operators();
    } catch (err) {
      logger.warn(
        { operation: "dsoOperators", reason: reasonOf(err) },
        "dso-lookup operators unavailable - the frontend falls back to its static list",
      );
      return [];
    }
  }

  async resolve(query: DsoResolveQuery): Promise<DsoResolution> {
    const client = this.client();
    if (!client) {
      return unavailable();
    }

    // Started first and awaited last: neither depends on the lookup, and both
    // swallow their own failures, so neither can leave a rejection unhandled
    // while the lookup is still running.
    const eanCheck: Promise<DsoEanCheck | null> = query.ean ? client.eanCheck(query.ean).catch(() => null) : Promise.resolve(null);
    const communityRegulator = this.communityRegulator();

    let answer: DsoResolveResponse;
    try {
      answer = await this.lookup(client, query);
    } catch (err) {
      // `reason` only. The query is a postcode, an address name and an EAN;
      // none of it belongs in a log line.
      logger.warn({ operation: "dsoResolve", reason: reasonOf(err) }, "dso-lookup unavailable - GRD left to the user");
      return unavailable();
    }

    const [ean_check, regulator] = await Promise.all([eanCheck, communityRegulator]);

    return {
      available: true,
      status: answer.status,
      ...(answer.communes ? { communes: answer.communes } : {}),
      ...(answer.sections ? { sections: answer.sections } : {}),
      ...(answer.result ? { result: answer.result } : {}),
      warnings: computeWarnings(answer.result, ean_check, regulator),
      data_version: answer.data_version,
      ...(ean_check ? { ean_check } : {}),
    };
  }

  /**
   * Which dso-lookup route to ask, and the one follow-up worth making.
   *
   *  1. An explicit `section` is the user's own choice from a previous
   *     `choose_section`, and outranks every hint: postcode route.
   *  2. A picker `nis_code` names the commune exactly, so the address route
   *     settles it — with the picker's `post_name` and NEVER the city, which
   *     the register fills with the commune name and would therefore never
   *     pick a section.
   *  3. Otherwise the postcode route, then at most one retry through the
   *     address route when the city typed by hand can settle the question:
   *       - `choose_section`: the city may be the section's own name
   *         ("Zondereigen" for 2387) — unless it is the commune's name, which
   *         by contract cannot settle it;
   *       - `choose_commune`: the city may name exactly one of the candidates
   *         (1040 "Etterbeek").
   *     The retry only replaces the first answer when it found something —
   *     a `not_found` second opinion would turn a useful choice into nothing.
   */
  private async lookup(client: IDsoLookupClient, query: DsoResolveQuery): Promise<DsoResolveResponse> {
    const nis = query.nis_code !== undefined ? toNisString(query.nis_code) : undefined;

    if (query.section) {
      return client.resolve(query.postcode, query.ins ?? nis, query.section);
    }
    if (nis) {
      return client.resolveAddress(nis, query.postcode, query.post_name);
    }

    const first = await client.resolve(query.postcode, query.ins);
    const city = normaliseName(query.city) ? query.city : undefined;
    if (!city) {
      return first;
    }

    let retryIns: string | undefined;
    if (first.status === "choose_section") {
      const commune = first.communes?.[0];
      // A city that IS the commune's name ("5020 Namur") cannot pick a section:
      // dso-lookup answers choose_section to it by contract, so the call is skipped.
      retryIns = commune && !communeNamed([commune], city) ? commune.ins : undefined;
    } else if (first.status === "choose_commune") {
      retryIns = communeNamed(first.communes ?? [], city)?.ins;
    }
    if (!retryIns) {
      return first;
    }

    const second = await client.resolveAddress(retryIns, query.postcode, city);
    return second.status === "not_found" ? first : second;
  }

  /**
   * The active community's regulator, or null when it cannot be read.
   *
   * Null rather than an error: it only decides whether one warning shows, and a
   * failed read must not cost the user the prefill itself.
   */
  private async communityRegulator(): Promise<string | null> {
    try {
      const community_id = await this.authContext.getInternalCommunityId();
      const found = await this.communityRepository.getCommunityById(community_id);
      return found?.community.regulator ?? null;
    } catch (err) {
      logger.warn({ operation: "dsoResolve:regulator", error: err }, "Could not read the community regulator - region warning skipped");
      return null;
    }
  }
}

function reasonOf(err: unknown): string {
  return err instanceof DsoUnavailableError ? err.reason : "unexpected";
}
