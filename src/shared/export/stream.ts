import { DiscardPolicy, nanos, RetentionPolicy, StorageType, type JetStreamManager } from "nats";
import { EXPORT_STREAM_DUPLICATE_WINDOW_MS, EXPORT_STREAM_MAX_AGE_MS, EXPORT_SUBJECT_ROOT, EXPORTS_STREAM } from "./kit/contract.js";
import { jetstreamErrorCode } from "./kit/consumer.js";

const STREAM_NOT_FOUND = 10059;

/**
 * Creates the EXPORTS stream, or brings an existing one to the contract's subjects, age and
 * duplicate window (contracts/export/README.md §3). crm-backend owns it: the API publishes
 * `export.job.requested`, the worker the requests; the annexes only bind consumers.
 *
 * Retention and storage cannot change on a live stream. A stream created with other ones (by
 * hand, or by an older build) is reported with the command that clears it, instead of being
 * left half-reconciled.
 */
export async function ensureExportsStream(jsm: JetStreamManager): Promise<void> {
  const mutable = {
    subjects: [EXPORT_SUBJECT_ROOT],
    max_age: nanos(EXPORT_STREAM_MAX_AGE_MS),
    duplicate_window: nanos(EXPORT_STREAM_DUPLICATE_WINDOW_MS),
    discard: DiscardPolicy.Old,
  };
  let existing;
  try {
    existing = await jsm.streams.info(EXPORTS_STREAM);
  } catch (err) {
    if (jetstreamErrorCode(err) !== STREAM_NOT_FOUND) throw err;
    await jsm.streams.add({ name: EXPORTS_STREAM, retention: RetentionPolicy.Workqueue, storage: StorageType.File, ...mutable });
    return;
  }
  const { retention, storage } = existing.config;
  if (retention !== RetentionPolicy.Workqueue || storage !== StorageType.File) {
    throw new Error(
      `stream ${EXPORTS_STREAM} exists with retention=${retention} storage=${storage}; the export contract needs workqueue/file. ` +
        `It only holds transient requests: remove it (nats stream rm ${EXPORTS_STREAM}) and restart.`,
    );
  }
  await jsm.streams.update(EXPORTS_STREAM, mutable);
}
