import type { QueryRunner } from "typeorm";
import logger from "../monitor/logger.js";

/**
 * Register side effects to run AFTER the caller's transaction actually commits.
 *
 * WHY THIS EXISTS. A realtime hint published from inside a transaction tells the
 * browser to refetch, and the browser then reads PRE-COMMIT state. Because the
 * transport is fire-and-forget there is no second event, ever — so the UI is
 * permanently stale behind a 200, with no error anywhere. That is the same
 * silhouette as the notification-savepoint and sweep-commit-ordering traps this
 * codebase has already been bitten by, and it is why the ordering is enforced
 * structurally rather than by asking each producer to remember.
 *
 * WHERE THE DRAIN LIVES, AND WHY ONLY THERE. `flushAfterCommit` is called from
 * `Transactional()` in `transaction.uow.ts`, immediately after the real
 * `commitTransaction()`. It is deliberately NOT called from `withSavepoint`,
 * even though `savepoint.ts` also calls `commitTransaction()` — that call
 * releases a SAVEPOINT, and draining there would fire every effect before the
 * outer transaction commits, which is precisely the bug this module prevents.
 * Do not "unify" the two.
 *
 * ACCEPTED LIMITATION: a nested `startTransaction()` reuses the same
 * QueryRunner, so an effect registered inside a savepoint that later rolls back
 * is still flushed on the outer commit. The cost is a spurious refetch, which is
 * harmless; savepoint-scoped queues would be complexity for nothing. The same
 * laxity in a DURABLE write would be a bug.
 *
 * EFFECTS MUST BE SYNCHRONOUS AND NON-THROWING. `safe()` below is a synchronous
 * try/catch and by construction cannot observe a rejected promise, while
 * TypeScript's void-return assignability happily accepts an `async () => …`
 * here. An async effect whose promise rejects would therefore become an
 * unhandled rejection and, under Node's default, kill the process — right after
 * a business COMMIT. Publishers must return void and own their own `.catch()`;
 * `IRealtimeHub.publish*` is typed that way for this reason.
 */
const pending = new WeakMap<QueryRunner, Array<() => void>>();

/**
 * Queue `fn` against `qr`'s transaction.
 *
 * With no runner, or a runner not currently in a transaction, `fn` runs
 * immediately — correct, because the repository writes were auto-committed.
 */
export function onAfterCommit(qr: QueryRunner | undefined, fn: () => void): void {
  if (!qr?.isTransactionActive) {
    safe(fn);
    return;
  }
  const list = pending.get(qr) ?? [];
  list.push(fn);
  pending.set(qr, list);
}

/** Run and clear everything queued against `qr`. Call only after a real COMMIT. */
export function flushAfterCommit(qr: QueryRunner): void {
  const list = pending.get(qr);
  pending.delete(qr);
  for (const fn of list ?? []) safe(fn);
}

/** Drop everything queued against `qr`. A rolled-back write emits nothing. */
export function discardAfterCommit(qr: QueryRunner): void {
  pending.delete(qr);
}

function safe(fn: () => void): void {
  try {
    fn();
  } catch (err) {
    logger.warn({ operation: "afterCommit", err }, "after-commit effect failed");
  }
}
