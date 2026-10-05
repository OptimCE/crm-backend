import { describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { container } from "../../../src/container/di-container.js";

// Seeded member invitation 1 (member 2, community 1) is attached below to user 3 (auth0|manager).
const INVITATION_ID = 1;

async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { AppDataSource } = await import("../../../src/shared/database/database.connector.js");
  return AppDataSource.manager.query(sql, params);
}

/**
 * Accepting an invitation is one transaction: linking the user to the member AND consuming the
 * invitation. When a later step fails, both must roll back together — otherwise the invitation is
 * gone for good while the link it was supposed to create is not, and the invitee cannot retry.
 */
describe("(Functional) Accepting an invitation is all-or-nothing", () => {
  useFunctionalTestDb();

  it("keeps the invitation when the acceptance fails after consuming it", async () => {
    await query(`UPDATE user_member_invitation SET id_user = 3 WHERE id = $1`, [INVITATION_ID]);
    // Import the app first: it registers the real bindings, which the rebind below then replaces
    // (rebinding before would leave two bindings and fail every request as ambiguous).
    const appModule = await import("../../../src/app.js");
    // The audit entry is the last step of the acceptance, after the invitation is deleted.
    const log = jest.fn(() => Promise.reject(new Error("audit down")));
    (await container.rebind("AuditLogService")).toConstantValue({ log });

    const response = await request(appModule.default)
      .post("/me/invitations/accept")
      .send({ invitation_id: INVITATION_ID })
      .set("x-user-id", "auth0|manager");

    // Guards the test itself: the failure must come from the last step, not from an earlier one.
    expect(log).toHaveBeenCalled();
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(await query(`SELECT id FROM user_member_invitation WHERE id = $1`, [INVITATION_ID])).toEqual([{ id: INVITATION_ID }]);
    expect(await query(`SELECT id FROM user_member_link WHERE id_user = 3 AND id_member = 2`)).toEqual([]);
  });
});
