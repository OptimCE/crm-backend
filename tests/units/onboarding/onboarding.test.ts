import { describe, expect, it, jest } from "@jest/globals";
import { onboardingTransition, isOnboardingTourKey, type OnboardingApiOutcome, type OnboardingOutcome } from "../../../src/modules/onboarding/shared/onboarding.tours.js";
import { OnboardingService } from "../../../src/modules/onboarding/infra/onboarding.service.js";
import type { IOnboardingRepository } from "../../../src/modules/onboarding/domain/i-onboarding.repository.js";
import type { IAuthContextRepository } from "../../../src/shared/context/i-authcontext.repository.js";
import type { UserOnboarding } from "../../../src/modules/onboarding/domain/onboarding.models.js";
import { AppError } from "../../../src/shared/middlewares/error.middleware.js";

describe("(Unit) onboardingTransition", () => {
  const cases: [OnboardingOutcome | null, OnboardingApiOutcome, ReturnType<typeof onboardingTransition>][] = [
    [null, "dismissed", "insert"],
    [null, "started", "insert"],
    [null, "completed", "forbidden"],
    [null, "abandoned", "forbidden"],
    ["started", "completed", "update"],
    ["started", "abandoned", "update"],
    ["started", "started", "noop"],
    ["started", "dismissed", "forbidden"],
    ["dismissed", "dismissed", "noop"],
    ["dismissed", "started", "forbidden"],
    ["completed", "completed", "noop"],
    ["completed", "started", "forbidden"],
    ["completed", "abandoned", "forbidden"],
    ["abandoned", "completed", "forbidden"],
    ["backfilled", "started", "forbidden"],
    ["backfilled", "dismissed", "forbidden"],
  ];
  it.each(cases)("%s -> %s is %s", (current, next, expected) => {
    expect(onboardingTransition(current, next)).toBe(expected);
  });

  it("accepts only the four known tour keys", () => {
    expect(isOnboardingTourKey("welcome")).toBe(true);
    expect(isOnboardingTourKey("community_admin")).toBe(true);
    expect(isOnboardingTourKey("onboarding-welcome")).toBe(false);
    expect(isOnboardingTourKey("")).toBe(false);
    expect(isOnboardingTourKey(undefined)).toBe(false);
  });
});

describe("(Unit) OnboardingService.setState", () => {
  function row(outcome: OnboardingOutcome): UserOnboarding {
    return { id_user: 7, tour_key: "welcome", outcome, tour_version: null, created_at: new Date(0), updated_at: new Date(0) } as UserOnboarding;
  }

  function build(repo: Partial<IOnboardingRepository>): OnboardingService {
    const query_runner = {
      isTransactionActive: true,
      startTransaction: jest.fn(async () => undefined),
      commitTransaction: jest.fn(async () => undefined),
      rollbackTransaction: jest.fn(async () => undefined),
      release: jest.fn(async () => undefined),
    };
    const dataSource = { createQueryRunner: () => query_runner } as never;
    const authContext = { getInternalUserId: jest.fn(async () => 7) } as unknown as IAuthContextRepository;
    return new OnboardingService(dataSource, authContext, repo as IOnboardingRepository);
  }

  it("judges a request against the row a concurrent request inserted first", async () => {
    const findForUpdate = jest
      .fn<IOnboardingRepository["findForUpdate"]>()
      .mockResolvedValueOnce(null) // no row when this request looked
      .mockResolvedValueOnce(row("dismissed")); // ...but another request won the insert
    const service = build({ findForUpdate, insertIfAbsent: jest.fn(async () => false), update: jest.fn<IOnboardingRepository["update"]>() });

    await expect(service.setState("welcome", { outcome: "started" })).rejects.toMatchObject({ statusCode: 409, errorCode: 110003 });
  });

  it("treats a concurrent identical insert as a no-op", async () => {
    const findForUpdate = jest.fn<IOnboardingRepository["findForUpdate"]>().mockResolvedValueOnce(null).mockResolvedValueOnce(row("started"));
    const update = jest.fn<IOnboardingRepository["update"]>();
    const service = build({ findForUpdate, insertIfAbsent: jest.fn(async () => false), update });

    const state = await service.setState("welcome", { outcome: "started" });

    expect(state.outcome).toBe("started");
    expect(update).not.toHaveBeenCalled();
  });

  it("keeps the stored tour_version when the update does not send one", async () => {
    const started = { ...row("started"), tour_version: "sha384-abc" } as UserOnboarding;
    const update = jest.fn<IOnboardingRepository["update"]>(async (r) => r);
    const service = build({ findForUpdate: jest.fn(async () => started), update });

    const state = await service.setState("welcome", { outcome: "completed" });

    expect(state).toMatchObject({ outcome: "completed", tour_version: "sha384-abc" });
  });

  it("refuses an unknown tour before touching the database", async () => {
    const findForUpdate = jest.fn<IOnboardingRepository["findForUpdate"]>();
    const service = build({ findForUpdate });

    await expect(service.setState("tour_inconnu", { outcome: "started" })).rejects.toBeInstanceOf(AppError);
    expect(findForUpdate).not.toHaveBeenCalled();
  });
});
