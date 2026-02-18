import { AppError } from "../middlewares/error.middleware.js";

export function isAppErrorLike(err: unknown): err is AppError {
  return (
    err instanceof AppError || (typeof err === "object" && err !== null && "constructor" in err && (err as Error).constructor?.name === "AppError")
  );
}
