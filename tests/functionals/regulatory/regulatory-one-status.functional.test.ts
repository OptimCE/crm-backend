import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import type { DataSource } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_ADMIN } from "../../utils/shared.consts.js";
import { ClientType, MeterDataStatus, MeterRate } from "../../../src/modules/meters/shared/meter.types.js";
import { METER_ERRORS } from "../../../src/modules/meters/shared/meter.errors.js";
import { SHARING_OPERATION_ERRORS } from "../../../src/modules/sharing_operations/shared/sharing_operation.errors.js";
import { RegulatoryStatus, RegulatorySubjectType } from "../../../src/modules/regulatory/domain/regulatory-link-status.models.js";

// Seeded (tests/sql/init.sql): community 1 (AUTH_COMMUNITY_1) owns operations 1 and 2;
// meter 123456789012345678 is ACTIVE in operation 1 from 2024-01-01, held by member 1.
const EAN = "123456789012345678";
const OP2_EAN = "987654321098765432";

async function db(): Promise<DataSource> {
  return (await import("../../../src/shared/database/database.connector.js")).AppDataSource;
}

async function subscribe(active: boolean): Promise<void> {
  await (
    await db()
  ).query(
    `INSERT INTO community_subscription (id_community, feature, is_active)
     VALUES (1, 'administrative-document', $1)
     ON CONFLICT (id_community, feature) DO UPDATE SET is_active = EXCLUDED.is_active`,
    [active],
  );
}

async function episode(dossier: number, status: RegulatoryStatus, op = 1, ref = EAN, from: string | null = null): Promise<void> {
  await (
    await db()
  ).query(
    `INSERT INTO regulatory_link_status
       (id_community, id_sharing_operation, subject_type, subject_ref, id_dossier_origin, regulatory_status, valid_from)
     VALUES (1, $1, $2, $3, $4, $5, $6)`,
    [op, RegulatorySubjectType.METER, ref, dossier, status, from],
  );
}

type Method = "get" | "patch" | "delete";

async function send(method: Method, url: string, body?: Record<string, unknown>): Promise<request.Response> {
  const app = (await import("../../../src/app.js")).default;
  const req = request(app)[method](url).set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_ADMIN);
  return body ? req.send(body) : req;
}

const approve = (status = MeterDataStatus.WAITING_GRD): Record<string, unknown> => ({ id_sharing: 1, id_meter: EAN, status, date: "2026-03-01" });

const dialog = (status: MeterDataStatus): Record<string, unknown> => ({
  EAN,
  start_date: "2026-03-01",
  status,
  rate: MeterRate.SIMPLE,
  client_type: ClientType.RESIDENTIAL,
  member_id: 1,
});

/**
 * One status for a meter in an operation (2026-11-01). With the administrative module active,
 * the procedure drives a tracked meter's status: the CRM refuses to set it by hand.
 */
describe("(Functional) one status: the procedure drives a tracked meter", () => {
  useFunctionalTestDb();

  describe("PATCH /sharing_operations/meter (approve, put on waiting)", () => {
    it.each([
      RegulatoryStatus.TO_NOTIFY,
      RegulatoryStatus.PENDING_GRD,
      RegulatoryStatus.AUTHORIZED,
      RegulatoryStatus.ACTIVE,
      RegulatoryStatus.REFUSED,
    ])("is refused (409) while the newest episode is %s", async (status) => {
      await subscribe(true);
      await episode(10, status);

      const response = await send("patch", "/sharing_operations/meter", approve());

      await expectWithLog(response, () => {
        expect(response.status).toBe(409);
        expect(response.body.error_code).toBe(SHARING_OPERATION_ERRORS.PATCH_METER_STATUS.STATUS_FOLLOWS_PROCEDURE.errorCode);
      });
    });

    it.each([RegulatoryStatus.ENDED, RegulatoryStatus.WITHDRAWN])("is the manager's again once the newest episode is %s", async (status) => {
      await subscribe(true);
      await episode(10, RegulatoryStatus.ACTIVE, 1, EAN, "2025-01-01");
      await episode(11, status);

      const response = await send("patch", "/sharing_operations/meter", approve());

      await expectWithLog(response, () => expect(response.status).toBe(200));
    });

    it("is the manager's while the module is off, whatever the core holds", async () => {
      await subscribe(false);
      await episode(10, RegulatoryStatus.PENDING_GRD);

      const response = await send("patch", "/sharing_operations/meter", approve());

      await expectWithLog(response, () => expect(response.status).toBe(200));
    });

    it("never takes a removal: INACTIVE is refused (422), the operation page removes through DELETE /:id/meter", async () => {
      const response = await send("patch", "/sharing_operations/meter", approve(MeterDataStatus.INACTIVE));

      await expectWithLog(response, () => {
        expect(response.status).toBe(422);
        expect(response.body.error_code).toBe(SHARING_OPERATION_ERRORS.VALIDATION.PATCH_METER_TO_SHARING_OPERATION.STATUS_OUT_OF_RANGE.errorCode);
      });
    });

    it("is the manager's for a meter no procedure tracks (no plugin, or the event still in flight)", async () => {
      await subscribe(true);
      await episode(10, RegulatoryStatus.PENDING_GRD, 2, OP2_EAN);

      const response = await send("patch", "/sharing_operations/meter", approve());

      await expectWithLog(response, () => expect(response.status).toBe(200));
    });
  });

  describe("PATCH /meters/data (the meter's update dialog)", () => {
    it("refuses a status change in the same operation (409)", async () => {
      await subscribe(true);
      await episode(10, RegulatoryStatus.PENDING_GRD);

      const response = await send("patch", "/meters/data", dialog(MeterDataStatus.WAITING_GRD));

      await expectWithLog(response, () => {
        expect(response.status).toBe(409);
        expect(response.body.error_code).toBe(METER_ERRORS.PATCH_METER_DATA.STATUS_FOLLOWS_PROCEDURE.errorCode);
      });
    });

    it("accepts every other edit, which sends the current status along", async () => {
      await subscribe(true);
      await episode(10, RegulatoryStatus.ACTIVE, 1, EAN, "2024-01-01");

      const response = await send("patch", "/meters/data", { ...dialog(MeterDataStatus.ACTIVE), rate: MeterRate.BI_HORAIRE });

      await expectWithLog(response, () => expect(response.status).toBe(200));
    });
  });

  // Operation 2 holds no consumption, so nothing but the guard stands in the way of its deletion.
  describe("DELETE /sharing_operations/:id", () => {
    it("is refused (409) while a procedure tracks its meters: the episodes would cascade away", async () => {
      await subscribe(true);
      await episode(10, RegulatoryStatus.LEAVING, 2, OP2_EAN);

      const response = await send("delete", "/sharing_operations/2");

      await expectWithLog(response, () => {
        expect(response.status).toBe(409);
        expect(response.body.error_code).toBe(SHARING_OPERATION_ERRORS.DELETE_SHARING_OPERATION.REGULATORY_LINKS_LIVE.errorCode);
      });
      const [{ count }] = (await (await db()).query("SELECT count(*)::int AS count FROM sharing_operation WHERE id = 2")) as { count: number }[];
      expect(count).toBe(1);
    });

    it("goes through once every episode is over", async () => {
      await subscribe(true);
      await episode(10, RegulatoryStatus.ENDED, 2, OP2_EAN);
      await episode(11, RegulatoryStatus.WITHDRAWN, 2, "541448200000000001");

      const response = await send("delete", "/sharing_operations/2");

      await expectWithLog(response, () => expect(response.status).toBe(200));
    });
  });

  describe("GET /regulatory/status without an operation (the global meters list)", () => {
    it("returns each subject's newest episode in every operation, narrowed to the asked EANs", async () => {
      await subscribe(true);
      await episode(10, RegulatoryStatus.ACTIVE, 1, EAN, "2025-01-01");
      await episode(11, RegulatoryStatus.PENDING_GRD, 2, OP2_EAN);
      await episode(12, RegulatoryStatus.TO_NOTIFY, 2, "541448200000000001");

      const response = await send("get", `/regulatory/status?subject_type=1&subject_ref=${EAN}&subject_ref=${OP2_EAN}`);

      await expectWithLog(response, () => {
        expect(response.status).toBe(200);
        const rows = (response.body.data as { id_sharing_operation: number; subject_ref: string; regulatory_status: number }[]).map((r) => [
          r.id_sharing_operation,
          r.subject_ref,
          r.regulatory_status,
        ]);
        expect(rows).toEqual([
          [1, EAN, RegulatoryStatus.ACTIVE],
          [2, OP2_EAN, RegulatoryStatus.PENDING_GRD],
        ]);
      });
    });

    it("takes a comma-separated list too", async () => {
      await subscribe(true);
      await episode(10, RegulatoryStatus.ACTIVE, 1, EAN, "2025-01-01");
      await episode(11, RegulatoryStatus.PENDING_GRD, 2, OP2_EAN);

      const response = await send("get", `/regulatory/status?subject_ref=${EAN},${OP2_EAN}`);

      await expectWithLog(response, () => expect((response.body.data as unknown[]).length).toBe(2));
    });
  });
});
