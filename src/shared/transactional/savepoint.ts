import type { QueryRunner } from "typeorm";
import logger from "../monitor/logger.js";

/**
 * Runs `fn` inside a SAVEPOINT on the caller's QueryRunner, so a failure rolls
 * back only `fn` and leaves the caller's transaction clean and committable.
 *
 * Catching a JavaScript error does NOT un-abort a Postgres transaction. Once any
 * statement fails inside `START TRANSACTION`, every later statement errors with
 * 25P02 and the final `COMMIT` is silently downgraded to a `ROLLBACK` — so the
 * caller's business write disappears while the request still returns 200. A
 * best-effort side effect therefore needs a SAVEPOINT, not a try/catch.
 *
 * This is the TypeScript equivalent of `session.begin_nested()` in the Python
 * annexes (see `news-board/core/notifications/service.py`). TypeORM emits
 * SAVEPOINT / ROLLBACK TO SAVEPOINT / RELEASE SAVEPOINT for a nested
 * start/rollback/commit, so this uses its public API and no raw SQL.
 *
 * With no runner, or a runner not currently in a transaction, `fn` runs as-is:
 * without that guard a fresh runner would get a real `START TRANSACTION` and
 * `COMMIT`, i.e. an unwanted independent commit.
 *
 * @param query_runner - The caller's transaction, if it has one.
 * @param fn - The work to isolate.
 * @returns Whatever `fn` returns. Errors from `fn` still propagate — this
 *   protects the transaction, it does not swallow failures.
 */
export async function withSavepoint<T>(query_runner: QueryRunner | undefined, fn: () => Promise<T>): Promise<T> {
  if (!query_runner?.isTransactionActive) {
    return fn();
  }
  await query_runner.startTransaction();
  try {
    const result = await fn();
    await query_runner.commitTransaction();
    return result;
  } catch (err) {
    try {
      await query_runner.rollbackTransaction();
    } catch (rollback_err) {
      logger.error({ operation: "withSavepoint:rollback", error: rollback_err }, "SAVEPOINT rollback failed");
    }
    throw err;
  }
}
