import type { DataSource, QueryRunner } from "typeorm";
import logger from "../monitor/logger.js";
import { discardAfterCommit, flushAfterCommit } from "./after-commit.js";
export interface HasDataSource {
  dataSource: DataSource;
}
/**
 * Decorator that implements the Transactional Unit Of Work design pattern
 * Wraps the decorated method in a database transaction that will be committed on success
 * or rolled back on error
 *
 * @returns A method decorator that handles transaction management
 * @throws Error if the class instance doesn't have a dataSource property
 */
export function Transactional() {
  /**
   * Method decorator implementation
   * @param target - The prototype of the class
   * @param propertyKey - The name of the method
   * @param descriptor - The descriptor of the method
   * @returns The modified descriptor with transaction handling
   */
  return function (_target: object, _propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: HasDataSource, ...args: unknown[]): Promise<unknown> {
      if (!this.dataSource) {
        throw new Error("UnitOfWork decorator requires 'dataSource' property on the class instance");
      }
      const query_runner: QueryRunner = this.dataSource.createQueryRunner();
      await query_runner.startTransaction();
      try {
        const result = await originalMethod.apply(this, [...args, query_runner]);
        await query_runner.commitTransaction();
        // AFTER the real COMMIT, never before. This is the ONLY drain point:
        // withSavepoint() also calls commitTransaction() (to release a
        // SAVEPOINT), so draining there would fire effects while the outer
        // transaction is still open. See shared/transactional/after-commit.ts.
        flushAfterCommit(query_runner);
        return result;
      } catch (err) {
        // A rolled-back write must emit nothing.
        discardAfterCommit(query_runner);
        logger.error(err);
        await query_runner.rollbackTransaction();
        throw err;
      } finally {
        await query_runner.release();
      }
    };
    return descriptor;
  };
}
