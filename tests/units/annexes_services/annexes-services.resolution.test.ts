import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { plainToInstance } from "class-transformer";
import type { NextFunction, Request, Response } from "express";
import type { QueryRunner } from "typeorm";
import logger from "../../../src/shared/monitor/logger.js";
import { AppError } from "../../../src/shared/middlewares/error.middleware.js";
import { contextMiddleware } from "../../../src/shared/middlewares/context.js";
import { Role } from "../../../src/shared/dtos/role.js";
import { AUDIT_ACTIONS } from "../../../src/modules/audit_log/domain/audit-log.actions.js";
import type { IAuditLogService } from "../../../src/modules/audit_log/domain/i-audit-log.service.js";
import { CommunityAnnexDTO } from "../../../src/modules/annexes_services/api/annexes-services.dtos.js";
import type { CommunitySubscription } from "../../../src/modules/annexes_services/domain/annexes-services.models.js";
import type { AnnexCatalog, AnnexCatalogEntry, AnnexCatalogOverrides } from "../../../src/modules/annexes_services/domain/annexes-services.types.js";
import type { IAnnexesServicesRepository } from "../../../src/modules/annexes_services/domain/i-annexes-services.repository.js";
import { AnnexesServicesService } from "../../../src/modules/annexes_services/infra/annexes-services.service.js";
import { getAnnexCatalog, parseAnnexCatalog, resolveAnnexCatalog } from "../../../src/modules/annexes_services/shared/annexes-catalog.js";
import { ANNEXES_SERVICES_ERRORS } from "../../../src/modules/annexes_services/shared/annexes-services.errors.js";
import { createMockAuthContextRepository } from "../../repository_mocked/authcontext.repository.mock.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";

/**
 * Per-deployment catalog resolution: `defaultEnabled` in the file plus the
 * ANNEX_CATALOG_ENABLE / ANNEX_CATALOG_DISABLE overrides (config `annex_catalog`).
 *
 * The fixture names are deliberately absent from the real catalog file, so a
 * service that ignored its injected catalog and read the file would fail here.
 */

const INVALID_FORMAT = ANNEXES_SERVICES_ERRORS.CATALOG.INVALID_FORMAT.errorCode;
const FEATURE_NOT_FOUND = ANNEXES_SERVICES_ERRORS.SUBSCRIPTION.FEATURE_NOT_FOUND.errorCode;
const NONE: AnnexCatalogOverrides = { enable: [], disable: [] };

function entry(feature: string, extra: Partial<AnnexCatalogEntry> = {}): AnnexCatalogEntry {
  const key = feature.toUpperCase();
  return {
    feature,
    displayKey: `ANNEXES_SERVICES.${key}.NAME`,
    descriptionKey: `ANNEXES_SERVICES.${key}.DESCRIPTION`,
    icon: "pi pi-box",
    minRole: Role.MEMBER,
    frontendRoute: `/${feature}`,
    subscribePath: `/annexes-services/${feature}/subscribe`,
    unsubscribePath: `/annexes-services/${feature}/unsubscribe`,
    ...extra,
  };
}

// alpha: no field (the five shipped annexes today); beta: explicitly on; gamma: shipped off.
const FIXTURE: AnnexCatalogEntry[] = [
  entry("alpha"),
  entry("beta", { defaultEnabled: true, minRole: Role.GESTIONNAIRE }),
  entry("gamma", { defaultEnabled: false }),
];

const featuresOf = (entries: ReadonlyArray<AnnexCatalogEntry>): string[] => entries.map((e) => e.feature);

function thrownBy(fn: () => unknown): unknown {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return undefined;
}

function expectAppError(err: unknown, errorCode: number, statusCode: number): void {
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).errorCode).toBe(errorCode);
  expect((err as AppError).statusCode).toBe(statusCode);
}

/** First-argument objects of every call to a logger spy whose `operation` matches. */
function logged(spy: { mock: { calls: unknown[][] } }, operation: string): Record<string, unknown>[] {
  return spy.mock.calls.map((call) => call[0] as Record<string, unknown>).filter((fields) => fields?.operation === operation);
}

afterEach(() => {
  // The unit project does not inherit the root `restoreMocks`.
  jest.restoreAllMocks();
});

describe("(Unit) annexes-services catalog resolution", () => {
  describe("resolveAnnexCatalog", () => {
    it("hides a default-off entry: with no override, enabled = every entry whose defaultEnabled is not false", () => {
      const catalog = resolveAnnexCatalog(FIXTURE, NONE);
      expect(featuresOf(catalog.all)).toEqual(["alpha", "beta", "gamma"]);
      expect(featuresOf(catalog.enabled)).toEqual(["alpha", "beta"]);
    });

    it("ENABLE shows a default-off entry", () => {
      const catalog = resolveAnnexCatalog(FIXTURE, { enable: ["gamma"], disable: [] });
      expect(featuresOf(catalog.enabled)).toEqual(["alpha", "beta", "gamma"]);
    });

    it("DISABLE hides a default-on entry, whether the field is absent or true", () => {
      expect(featuresOf(resolveAnnexCatalog(FIXTURE, { enable: [], disable: ["alpha"] }).enabled)).toEqual(["beta"]);
      expect(featuresOf(resolveAnnexCatalog(FIXTURE, { enable: [], disable: ["beta"] }).enabled)).toEqual(["alpha"]);
      // Hidden, not removed: unsubscribe still needs to find it.
      expect(featuresOf(resolveAnnexCatalog(FIXTURE, { enable: [], disable: ["alpha"] }).all)).toEqual(["alpha", "beta", "gamma"]);
    });

    it("DISABLE beats ENABLE when a feature is named in both", () => {
      expect(featuresOf(resolveAnnexCatalog(FIXTURE, { enable: ["gamma"], disable: ["gamma"] }).enabled)).toEqual(["alpha", "beta"]);
      expect(featuresOf(resolveAnnexCatalog(FIXTURE, { enable: ["alpha"], disable: ["alpha"] }).enabled)).toEqual(["beta"]);
    });

    it.each([
      ["ENABLE", { enable: ["gama"], disable: [] }, { unknown_enable: ["gama"], unknown_disable: [] }],
      ["DISABLE", { enable: [], disable: ["alpha", "bet"] }, { unknown_enable: [], unknown_disable: ["bet"] }],
      ["ENABLE (names are case-sensitive)", { enable: ["Gamma"], disable: [] }, { unknown_enable: ["Gamma"], unknown_disable: [] }],
    ])("refuses an unknown name in %s instead of ignoring it", (_list, overrides, unknown) => {
      const error = jest.spyOn(logger, "error").mockImplementation((() => logger) as never);

      expectAppError(
        thrownBy(() => resolveAnnexCatalog(FIXTURE, overrides)),
        INVALID_FORMAT,
        500,
      );
      // The thrown error only carries an i18n key; the log line is what names the culprit.
      expect(logged(error, "annexes_services:catalog_overrides")).toEqual([expect.objectContaining(unknown)]);
    });

    it("keeps the file's order in both lists", () => {
      const reordered = [FIXTURE[2], FIXTURE[0], FIXTURE[1]];
      const catalog = resolveAnnexCatalog(reordered, { enable: ["gamma"], disable: [] });
      expect(featuresOf(catalog.all)).toEqual(["gamma", "alpha", "beta"]);
      expect(featuresOf(catalog.enabled)).toEqual(["gamma", "alpha", "beta"]);
    });
  });

  describe("parseAnnexCatalog", () => {
    const fileWith = (defaultEnabled: unknown): string => JSON.stringify({ modules: [{ ...entry("alpha"), defaultEnabled }] });

    // A string "false" is truthy: accepted, it would leave the annex ON - the exact
    // failure this field exists to prevent.
    it.each([["false"], ["true"], [0], [null]])("refuses a defaultEnabled that is not a boolean (%p)", (value) => {
      jest.spyOn(logger, "error").mockImplementation((() => logger) as never);
      expectAppError(
        thrownBy(() => parseAnnexCatalog(fileWith(value))),
        INVALID_FORMAT,
        500,
      );
    });

    it("accepts true, false and an absent defaultEnabled", () => {
      const raw = JSON.stringify({ modules: [entry("alpha"), entry("beta", { defaultEnabled: true }), entry("gamma", { defaultEnabled: false })] });
      expect(parseAnnexCatalog(raw).map((m) => m.defaultEnabled)).toEqual([undefined, true, false]);
    });
  });

  describe("the real config/annexes-services.json", () => {
    const raw = readFileSync(resolve(process.cwd(), "config", "annexes-services.json"), "utf-8");

    it("parses, and with no override serves every entry whose defaultEnabled is not false", () => {
      const modules = parseAnnexCatalog(raw);
      const catalog = resolveAnnexCatalog(modules, NONE);
      expect(featuresOf(catalog.all)).toEqual(featuresOf(modules));
      expect(featuresOf(catalog.enabled)).toEqual(featuresOf(modules.filter((m) => m.defaultEnabled !== false)));
    });

    // A deployment without the live-data service must not advertise it: the
    // dev stack and config/test.cjs opt in with ANNEX_CATALOG_ENABLE instead.
    it("ships live-data off by default", () => {
      const liveData = parseAnnexCatalog(raw).find((m) => m.feature === "live-data");
      expect(liveData?.defaultEnabled).toBe(false);
    });

    it("getAnnexCatalog() resolves it once and logs the exposed set once", () => {
      const info = jest.spyOn(logger, "info").mockImplementation((() => logger) as never);

      const first = getAnnexCatalog();
      const second = getAnnexCatalog();

      expect(second).toBe(first);
      const modules = parseAnnexCatalog(raw);
      const optedIn = (m: AnnexCatalogEntry): boolean => m.defaultEnabled !== false || m.feature === "live-data";
      expect(logged(info, "annexes_services:catalog_loaded")).toEqual([
        expect.objectContaining({
          enabled: featuresOf(modules.filter(optedIn)),
          disabled: featuresOf(modules.filter((m) => !optedIn(m))),
          // config/test.cjs hardcodes these: live-data opted in, nothing hidden.
          overrides: { enable: ["live-data"], disable: [] },
        }),
      ]);
    });
  });

  // `excludeExtraneousValues` strips any field without `@Expose()`: the flag is
  // deployment plumbing, not something the frontend should ever branch on.
  it("never sends defaultEnabled to the frontend", () => {
    const dto = plainToInstance(
      CommunityAnnexDTO,
      { ...entry("gamma", { defaultEnabled: false }), subscribed: true },
      { excludeExtraneousValues: true },
    );
    const wire = JSON.parse(JSON.stringify(dto)) as Record<string, unknown>;
    expect(wire).not.toHaveProperty("defaultEnabled");
    expect(wire.feature).toBe("gamma");
  });
});

describe("(Unit) AnnexesServicesService with a resolved catalog", () => {
  const INTERNAL_COMMUNITY_ID = 100;

  let repo: jest.Mocked<IAnnexesServicesRepository>;
  let authContext: ReturnType<typeof createMockAuthContextRepository>;
  let auditLog: { log: jest.Mock<IAuditLogService["log"]> };
  let runner: QueryRunner;

  function row(feature: string, is_active: boolean): CommunitySubscription {
    return { id: 7, id_community: INTERNAL_COMMUNITY_ID, feature, is_active, created_at: new Date(0), updated_at: new Date(0) };
  }

  function serviceWith(catalog: AnnexCatalog): AnnexesServicesService {
    const dataSource = { createQueryRunner: (): QueryRunner => runner } as never;
    return new AnnexesServicesService(repo, authContext, dataSource, auditLog as unknown as IAuditLogService, catalog);
  }

  /** Runs `fn` inside the request context an ADMIN of AUTH_COMMUNITY_1 would get. */
  function asAdmin<T>(fn: () => Promise<T>): Promise<T> {
    let pending!: Promise<T>;
    contextMiddleware()(
      { headers: { "x-user-id": "auth0|admin", "x-community-id": AUTH_COMMUNITY_1, "x-user-orgs": ORGS_ADMIN } } as unknown as Request,
      {} as Response,
      (() => {
        pending = fn();
      }) as NextFunction,
    );
    return pending;
  }

  async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
    try {
      await promise;
    } catch (err) {
      return err;
    }
    return undefined;
  }

  beforeEach(() => {
    repo = {
      findActiveByCommunity: jest.fn<IAnnexesServicesRepository["findActiveByCommunity"]>().mockResolvedValue([]),
      findByCommunityAndFeature: jest.fn<IAnnexesServicesRepository["findByCommunityAndFeature"]>().mockResolvedValue(null),
      createSubscription: jest.fn<IAnnexesServicesRepository["createSubscription"]>().mockImplementation(async (_id, feature) => row(feature, true)),
      setActive: jest.fn<IAnnexesServicesRepository["setActive"]>().mockResolvedValue(undefined),
    };
    authContext = createMockAuthContextRepository();
    authContext.getInternalCommunityId.mockResolvedValue(INTERNAL_COMMUNITY_ID);
    auditLog = { log: jest.fn<IAuditLogService["log"]>().mockResolvedValue(undefined) };
    runner = {
      startTransaction: jest.fn(async () => undefined),
      commitTransaction: jest.fn(async () => undefined),
      rollbackTransaction: jest.fn(async () => undefined),
      release: jest.fn(async () => undefined),
    } as unknown as QueryRunner;
    // @Transactional logs every rollback, and these tests provoke some on purpose.
    jest.spyOn(logger, "error").mockImplementation((() => logger) as never);
  });

  it("getCommunityServices() lists only the enabled entries", async () => {
    const service = serviceWith(resolveAnnexCatalog(FIXTURE, NONE));

    const listed = await asAdmin(() => service.getCommunityServices());

    expect(listed.map((dto) => dto.feature)).toEqual(["alpha", "beta"]);
  });

  it("subscribe() to a disabled feature is FEATURE_NOT_FOUND, and the repository is untouched", async () => {
    const info = jest.spyOn(logger, "info").mockImplementation((() => logger) as never);
    const service = serviceWith(resolveAnnexCatalog(FIXTURE, NONE));

    expectAppError(await rejectionOf(service.subscribe("gamma")), FEATURE_NOT_FOUND, 404);

    expect(repo.findByCommunityAndFeature).not.toHaveBeenCalled();
    expect(repo.createSubscription).not.toHaveBeenCalled();
    expect(repo.setActive).not.toHaveBeenCalled();
    expect(auditLog.log).not.toHaveBeenCalled();
    // Same 404 on the wire as an unknown name; the log tells the two apart.
    expect(logged(info, "annexes_services:subscribe")).toEqual([expect.objectContaining({ feature: "gamma", reason: "hidden" })]);
  });

  it("subscribe() to an enabled feature creates the subscription (control for the case above)", async () => {
    const service = serviceWith(resolveAnnexCatalog(FIXTURE, { enable: ["gamma"], disable: ["alpha"] }));

    await service.subscribe("gamma");

    expect(repo.createSubscription).toHaveBeenCalledWith(INTERNAL_COMMUNITY_ID, "gamma", true, runner);
    expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: AUDIT_ACTIONS.COMMUNITY_SUBSCRIPTION_CREATED }), runner);
  });

  it("unsubscribe() still works for a disabled feature that is in the file", async () => {
    // A community that subscribed before the annex was turned off must be able to
    // leave: the annex keeps serving it as long as the row is active.
    repo.findByCommunityAndFeature.mockResolvedValue(row("gamma", true));
    const service = serviceWith(resolveAnnexCatalog(FIXTURE, NONE));

    await service.unsubscribe("gamma");

    expect(repo.findByCommunityAndFeature).toHaveBeenCalledWith(INTERNAL_COMMUNITY_ID, "gamma", runner);
    expect(repo.setActive).toHaveBeenCalledWith(7, false, runner);
    expect(auditLog.log).toHaveBeenCalledWith(expect.objectContaining({ action: AUDIT_ACTIONS.COMMUNITY_SUBSCRIPTION_UNSUBSCRIBED }), runner);
  });

  it("unsubscribe() of a name that is not in the file is still FEATURE_NOT_FOUND", async () => {
    const service = serviceWith(resolveAnnexCatalog(FIXTURE, NONE));

    expectAppError(await rejectionOf(service.unsubscribe("delta")), FEATURE_NOT_FOUND, 404);

    expect(repo.findByCommunityAndFeature).not.toHaveBeenCalled();
    expect(repo.setActive).not.toHaveBeenCalled();
  });
});
