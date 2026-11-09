import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { connect, type JetStreamManager, type NatsConnection } from "nats";
import config from "config";
import type { DataSource } from "typeorm";
import { useFunctionalTestDb } from "../../utils/test.functional.wrapper.js";
import { expectWithLog } from "../../utils/helper.js";
import { AUTH_COMMUNITY_1, ORGS_GESTIONNAIRE } from "../../utils/shared.consts.js";
import { addDaysISO, appTodayISO } from "../../../src/shared/utils/date.utils.js";
import { CORE_EVENTS, CORE_EVENTS_STREAM, subjectFor, type CoreEventEnvelope } from "../../../src/shared/outbox/core-events.js";
import { ensureCoreEventsStream, natsPublisher, relayBatch, type EventPublisher, type RelaySettings } from "../../../src/shared/outbox/relay.js";

// Seeded (tests/sql/init.sql): EAN_OP1 is in Op 1 since 2024-01-01.
const EAN_OP1 = "123456789012345678";
const settings = config.get<RelaySettings>("outbox_relay");

async function call(method: "post" | "delete", path: string, body: object): Promise<request.Response> {
  const appModule = await import("../../../src/app.js");
  const agent = request(appModule.default);
  const req = agent[method](path).set("x-user-id", "auth0|admin").set("x-community-id", AUTH_COMMUNITY_1).set("x-user-orgs", ORGS_GESTIONNAIRE);
  return req.send(body);
}

async function dataSource(): Promise<DataSource> {
  return (await import("../../../src/shared/database/database.connector.js")).AppDataSource;
}

/** Leaves Op 1 yesterday, then joins Op 2 today: a removal, then a pure addition. */
async function addMeterToOp2(): Promise<void> {
  const today = appTodayISO();
  const leave = await call("delete", "/sharing_operations/1/meter", { id_sharing: 1, id_meter: EAN_OP1, date: addDaysISO(today, -1) });
  await expectWithLog(leave, () => expect(leave.status).toBe(200));
  const add = await call("post", "/sharing_operations/meter", { id_sharing: 2, date: today, ean_list: [EAN_OP1] });
  await expectWithLog(add, () => expect(add.status).toBe(200));
}

async function streamSubjects(jsm: JetStreamManager): Promise<Record<string, number>> {
  const info = await jsm.streams.info(CORE_EVENTS_STREAM, { subjects_filter: ">" });
  return info.state.subjects ?? {};
}

async function streamEnvelopes(jsm: JetStreamManager): Promise<{ subject: string; envelope: CoreEventEnvelope }[]> {
  const info = await jsm.streams.info(CORE_EVENTS_STREAM);
  const out: { subject: string; envelope: CoreEventEnvelope }[] = [];
  for (let seq = info.state.first_seq; seq <= info.state.last_seq && info.state.messages > 0; seq++) {
    const msg = await jsm.streams.getMessage(CORE_EVENTS_STREAM, { seq });
    out.push({ subject: msg.subject, envelope: msg.json<CoreEventEnvelope>() });
  }
  return out;
}

async function unpublished(): Promise<{ event_type: string; attempts: number; last_error: string | null }[]> {
  return (await dataSource()).query("SELECT event_type, attempts, last_error FROM outbox_event WHERE published_at IS NULL ORDER BY id");
}

describe("(Functional) Outbox relay to JetStream", () => {
  useFunctionalTestDb();

  let nc: NatsConnection;
  let jsm: JetStreamManager;

  beforeEach(async () => {
    nc = await connect({ servers: settings.nats_url });
    jsm = await nc.jetstreamManager();
    try {
      await jsm.streams.delete(CORE_EVENTS_STREAM);
    } catch {
      // first test: no stream yet
    }
    await ensureCoreEventsStream(jsm, settings);
  });

  afterEach(async () => {
    await nc.drain();
  });

  it("adding a meter lands exactly one meter_added in the stream, even if the relay dies before stamping", async () => {
    await addMeterToOp2();
    const ds = await dataSource();

    // A relay that published the batch and died before its stamp was committed.
    await expect(
      relayBatch(ds, natsPublisher(nc), settings.batch_size, {
        beforeMark: () => Promise.reject(new Error("relay killed")),
      }),
    ).rejects.toThrow("relay killed");
    expect(await unpublished()).toHaveLength(2);

    // The restarted relay publishes the same rows again: JetStream recognises both.
    const restarted = await relayBatch(ds, natsPublisher(nc), settings.batch_size);
    expect(restarted).toEqual({ published: 2, duplicates: 2, failed: false });
    expect(await unpublished()).toHaveLength(0);

    const subjects = await streamSubjects(jsm);
    expect(subjects[subjectFor(CORE_EVENTS.OPERATION_METER_ADDED)]).toBe(1);
    expect(subjects[subjectFor(CORE_EVENTS.OPERATION_METER_REMOVED)]).toBe(1);
  });

  it("publishes in outbox order, with the event id and the CRM snapshot in the envelope", async () => {
    await addMeterToOp2();
    const ds = await dataSource();
    const rows = (await ds.query("SELECT event_id, event_type FROM outbox_event ORDER BY id")) as { event_id: string; event_type: string }[];

    await relayBatch(ds, natsPublisher(nc), settings.batch_size);

    const messages = await streamEnvelopes(jsm);
    expect(messages.map((m) => m.subject)).toEqual(rows.map((r) => subjectFor(r.event_type)));
    expect(messages.map((m) => m.envelope.event_id)).toEqual(rows.map((r) => r.event_id));
    const added = messages[1].envelope;
    expect(added).toMatchObject({
      event_type: CORE_EVENTS.OPERATION_METER_ADDED,
      schema_version: 1,
      id_community: 1,
      aggregate: { type: "operation", id: "2" },
      payload: { ean: EAN_OP1, id_sharing_operation: 2, effective_date: appTodayISO() },
    });
  });

  it("replaying the relay publishes nothing new", async () => {
    await addMeterToOp2();
    const ds = await dataSource();
    await relayBatch(ds, natsPublisher(nc), settings.batch_size);

    expect(await relayBatch(ds, natsPublisher(nc), settings.batch_size)).toEqual({ published: 0, duplicates: 0, failed: false });
    expect((await jsm.streams.info(CORE_EVENTS_STREAM)).state.messages).toBe(2);
  });

  it("stops at the first failure, records it, and resumes in order on the next turn", async () => {
    await addMeterToOp2();
    const ds = await dataSource();
    const real = natsPublisher(nc);
    let calls = 0;
    const flaky: EventPublisher = {
      publish: (subject, data, msg_id) => (++calls === 2 ? Promise.reject(new Error("broker unavailable")) : real.publish(subject, data, msg_id)),
    };

    expect(await relayBatch(ds, flaky, settings.batch_size)).toEqual({ published: 1, duplicates: 0, failed: true });
    const left = await unpublished();
    expect(left).toEqual([{ event_type: CORE_EVENTS.OPERATION_METER_ADDED, attempts: 1, last_error: "Error: broker unavailable" }]);

    expect(await relayBatch(ds, real, settings.batch_size)).toEqual({ published: 1, duplicates: 0, failed: false });
    expect((await streamEnvelopes(jsm)).map((m) => m.envelope.event_type)).toEqual([
      CORE_EVENTS.OPERATION_METER_REMOVED,
      CORE_EVENTS.OPERATION_METER_ADDED,
    ]);
  });

  it("brings an existing stream to the configured subjects and windows", async () => {
    await jsm.streams.update(CORE_EVENTS_STREAM, { duplicate_window: 1_000_000_000 });

    await ensureCoreEventsStream(jsm, settings);

    const info = await jsm.streams.info(CORE_EVENTS_STREAM);
    expect(info.config.subjects).toEqual(["core.evt.>"]);
    expect(info.config.duplicate_window).toBe(settings.duplicate_window_ms * 1_000_000);
  });
});
