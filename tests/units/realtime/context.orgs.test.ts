import { describe, expect, it } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { contextMiddleware, getContext } from "../../../src/shared/middlewares/context.js";
import { Role } from "../../../src/shared/dtos/role.js";

const ORG_A = "2c8a0ea5-d597-49d6-ae12-4dceb9e9a018";
const ORG_B = "a221664e-866e-46f6-9f7b-1087447c579e";
const ORGS_HEADER =
  `[orgId:${ORG_A} orgPath:/alpha roles:[ADMIN]],` +
  `map[orgId:${ORG_B} orgPath:/beta roles:[MEMBER]]`;

/** Run the middleware and capture the Context it installed. */
function withHeaders(headers: Record<string, string>): ReturnType<typeof getContext> {
  let captured!: ReturnType<typeof getContext>;
  contextMiddleware()({ headers } as unknown as Request, {} as Response, (() => {
    captured = getContext();
  }) as NextFunction);
  return captured;
}

describe("(Unit) contextMiddleware role derivation", () => {
  // These four pin the PRE-EXISTING behaviour. `parseUserOrgs` was moved out of
  // the `if (targetCommunityId && userGroupsHeader)` guard so the realtime ticket
  // mint can see every org; the role derivation had to stay byte-for-byte
  // identical, and this is what proves it did.

  it("resolves the role of the ACTIVE community only", () => {
    expect(withHeaders({ "x-user-id": "sub-1", "x-community-id": ORG_A, "x-user-orgs": ORGS_HEADER }).role).toBe(
      Role.ADMIN,
    );
    expect(withHeaders({ "x-user-id": "sub-1", "x-community-id": ORG_B, "x-user-orgs": ORGS_HEADER }).role).toBe(
      Role.MEMBER,
    );
  });

  it("clears the community and leaves the role unset when x-user-orgs is absent", () => {
    const ctx = withHeaders({ "x-user-id": "sub-1", "x-community-id": ORG_A });
    expect(ctx.community_id).toBeUndefined();
    expect(ctx.role).toBeUndefined();
  });

  it("leaves the role unset when the active community is not among the claims", () => {
    const ctx = withHeaders({
      "x-user-id": "sub-1",
      "x-community-id": "00000000-0000-0000-0000-000000000000",
      "x-user-orgs": ORGS_HEADER,
    });
    expect(ctx.role).toBeUndefined();
  });

  it("keeps no community when none was requested", () => {
    // The normal state for /notifications: community.context.inteceptor.ts omits
    // X-Community-ID entirely.
    const ctx = withHeaders({ "x-user-id": "sub-1", "x-user-orgs": ORGS_HEADER });
    expect(ctx.community_id).toBeUndefined();
    expect(ctx.role).toBeUndefined();
  });
});

describe("(Unit) contextMiddleware orgs", () => {
  it("exposes EVERY claimed org even with no active community", () => {
    // The realtime ticket must cover all of a user's communities: notifications
    // are global, and /notifications sends no X-Community-ID — so the active
    // community alone would leave the bell's own channel set incomplete.
    const ctx = withHeaders({ "x-user-id": "sub-1", "x-user-orgs": ORGS_HEADER });
    expect(ctx.orgs).toEqual([
      { orgId: ORG_A, orgPath: "/alpha", role: Role.ADMIN },
      { orgId: ORG_B, orgPath: "/beta", role: Role.MEMBER },
    ]);
  });

  it("is an empty list, never undefined, when the header is absent", () => {
    expect(withHeaders({ "x-user-id": "sub-1" }).orgs).toEqual([]);
  });

  it("resolves the highest role when an org grants several", () => {
    const ctx = withHeaders({
      "x-user-id": "sub-1",
      "x-user-orgs": `[orgId:${ORG_A} orgPath:/alpha roles:[MEMBER,ADMIN]]`,
    });
    expect(ctx.orgs?.[0].role).toBe(Role.ADMIN);
  });

  it("parses an orgPath containing spaces", () => {
    const ctx = withHeaders({
      "x-user-id": "sub-1",
      "x-user-orgs": `[orgId:${ORG_A} orgPath:/my community roles:[MEMBER]]`,
    });
    expect(ctx.orgs?.[0]).toEqual({ orgId: ORG_A, orgPath: "/my community", role: Role.MEMBER });
  });
});
