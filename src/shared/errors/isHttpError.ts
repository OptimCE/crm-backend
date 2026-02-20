export function isHttpError(err: unknown): err is { response: { status: number } } {
  return typeof err === "object" && err !== null && "response" in err && typeof (err as { response?: unknown }).response === "object";
}
