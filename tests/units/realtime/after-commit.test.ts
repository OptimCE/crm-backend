import { describe, expect, it, jest } from "@jest/globals";
import type { DataSource, QueryRunner } from "typeorm";
import { discardAfterCommit, flushAfterCommit, onAfterCommit } from "../../../src/shared/transactional/after-commit.js";
import { Transactional } from "../../../src/shared/transactional/transaction.uow.js";
import { withSavepoint } from "../../../src/shared/transactional/savepoint.js";

/**
 * A QueryRunner that records the ORDER of everything it is asked to do, so a
 * test can assert that an effect ran after the COMMIT rather than merely that it
 * ran.
 *
 * Nesting depth is modelled because TypeORM overloads the same three methods for
 * both real transactions and SAVEPOINTs — which is precisely the asymmetry the
 * after-commit drain depends on. A nested `rollbackTransaction` pops the
 * savepoint and leaves the OUTER transaction active and committable; a fake that
 * cleared `isTransactionActive` there would make effects run inline and hide the
 * very ordering these tests exist to check.
 */
function makeRunner(trace: string[]): QueryRunner {
  let depth = 0;
  const runner = {
    isTransactionActive: false,
    startTransaction: jest.fn(async () => {
      depth += 1;
      trace.push(depth === 1 ? "begin" : "savepoint");
      runner.isTransactionActive = true;
    }),
    commitTransaction: jest.fn(async () => {
      trace.push(depth === 1 ? "commit" : "release-savepoint");
      depth -= 1;
      runner.isTransactionActive = depth > 0;
    }),
    rollbackTransaction: jest.fn(async () => {
      trace.push(depth === 1 ? "rollback" : "rollback-savepoint");
      depth -= 1;
      runner.isTransactionActive = depth > 0;
    }),
    release: jest.fn(async () => {
      trace.push("release");
    }),
  };
  return runner as unknown as QueryRunner;
}

class Subject {
  constructor(
    public readonly dataSource: DataSource,
    private readonly trace: string[],
  ) {}

  @Transactional()
  async succeeds(query_runner?: QueryRunner): Promise<string> {
    onAfterCommit(query_runner, () => this.trace.push("effect"));
    return "ok";
  }

  @Transactional()
  async fails(query_runner?: QueryRunner): Promise<never> {
    onAfterCommit(query_runner, () => this.trace.push("effect"));
    throw new Error("business write failed");
  }

  @Transactional()
  async savepointRollsBack(query_runner?: QueryRunner): Promise<string> {
    // A best-effort side effect that fails inside its SAVEPOINT — the shape
    // NotificationService.publish() uses.
    try {
      await withSavepoint(query_runner, async () => {
        throw new Error("notification failed");
      });
    } catch {
      /* swallowed, exactly as publish() does */
    }
    onAfterCommit(query_runner, () => this.trace.push("effect"));
    return "ok";
  }

  @Transactional()
  async throwingEffect(query_runner?: QueryRunner): Promise<string> {
    onAfterCommit(query_runner, () => {
      throw new Error("realtime exploded");
    });
    return "ok";
  }
}

const dataSourceFor = (runner: QueryRunner): DataSource => ({ createQueryRunner: () => runner }) as unknown as DataSource;

describe("(Unit) after-commit seam", () => {
  it("runs the effect AFTER the real COMMIT, not merely at some point", async () => {
    // This is the whole reason the module exists. An effect that fires before the
    // commit tells the browser to refetch and read PRE-COMMIT state — and because
    // the transport is fire-and-forget there is no second event, so the UI is
    // permanently stale behind a 200 with no error anywhere.
    const trace: string[] = [];
    const runner = makeRunner(trace);
    await new Subject(dataSourceFor(runner), trace).succeeds();

    expect(trace).toEqual(["begin", "commit", "effect", "release"]);
    expect(trace.indexOf("effect")).toBeGreaterThan(trace.indexOf("commit"));
  });

  it("emits NOTHING when the transaction rolls back", async () => {
    const trace: string[] = [];
    const runner = makeRunner(trace);
    await expect(new Subject(dataSourceFor(runner), trace).fails()).rejects.toThrow("business write failed");

    expect(trace).toEqual(["begin", "rollback", "release"]);
    expect(trace).not.toContain("effect");
  });

  it("still emits once when a SAVEPOINT inside the transaction rolled back", async () => {
    // Documented, accepted laxity: a nested startTransaction() shares the same
    // QueryRunner, so an effect registered around a rolled-back savepoint is
    // still flushed on the outer commit. The cost is a spurious refetch. The
    // same laxity in a DURABLE write would be a bug.
    const trace: string[] = [];
    const runner = makeRunner(trace);
    await new Subject(dataSourceFor(runner), trace).savepointRollsBack();

    expect(trace).toContain("effect");
    expect(trace.indexOf("effect")).toBeGreaterThan(trace.lastIndexOf("commit"));
  });

  it("does not let a throwing effect break the caller, whose write already committed", async () => {
    const trace: string[] = [];
    const runner = makeRunner(trace);
    await expect(new Subject(dataSourceFor(runner), trace).throwingEffect()).resolves.toBe("ok");
    expect(trace).toEqual(["begin", "commit", "release"]);
  });

  it("runs the effect immediately when there is no active transaction", () => {
    // Correct, because then the repository writes were already auto-committed.
    const ran: string[] = [];
    onAfterCommit(undefined, () => ran.push("effect"));
    expect(ran).toEqual(["effect"]);
  });

  it("does not leak effects between transactions on the same runner", () => {
    const trace: string[] = [];
    const runner = makeRunner(trace);
    (runner as { isTransactionActive: boolean }).isTransactionActive = true;

    onAfterCommit(runner, () => trace.push("first"));
    flushAfterCommit(runner);
    flushAfterCommit(runner); // a second drain must find nothing
    expect(trace.filter((t) => t === "first")).toHaveLength(1);

    onAfterCommit(runner, () => trace.push("second"));
    discardAfterCommit(runner);
    flushAfterCommit(runner);
    expect(trace).not.toContain("second");
  });
});
