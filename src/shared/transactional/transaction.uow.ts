import type {DataSource, QueryRunner} from "typeorm";
import logger from "../monitor/logger.js";
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
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: HasDataSource, ...args: any[]) {
      if (!this.dataSource) {
        throw new Error("UnitOfWork decorator requires 'dataSource' property on the class instance");
      }
      const query_runner: QueryRunner = this.dataSource.createQueryRunner();
      await query_runner.startTransaction();
      try {
        const result = await originalMethod.apply(this, [...args, query_runner]);
        await query_runner.commitTransaction();
        return result;
      } catch (err) {
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
