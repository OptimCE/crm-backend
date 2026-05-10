import { container } from "./di-container.js";

/**
 * Returns a lazy controller proxy that resolves the underlying instance
 * from the DI container on every method call.
 *
 * This avoids freezing a controller instance at module load time, which would
 * trap stale repository/service bindings across tests that rebind the container.
 *
 * Usage in a route file:
 *   const user_controller = lazyController<UserController>(UserController);
 *   user_router.get("/", ..., user_controller.getProfile.bind(user_controller));
 */
export function lazyController<T extends object>(token: unknown): T {
  return new Proxy({} as T, {
    get: (_target, prop) =>
      (...args: unknown[]): unknown =>
        (container.get<T>(token as never) as unknown as Record<PropertyKey, (...a: unknown[]) => unknown>)[prop as PropertyKey](...args),
  });
}
