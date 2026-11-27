import { randomUUID } from "node:crypto";
import { EXPORT_SCHEMA_VERSION, partPrefix, type ExportRequest, type ExportScope, type PartDone, type PartFailed } from "./contract.js";
import { handlePart, type ExportHandler, type PartOutcome } from "./part-runner.js";
import { MemoryPartStore } from "./part-store.js";
import { checkAgainst } from "./schemas.js";

export interface ContractCheckOptions {
  service: string;
  scope: ExportScope;
  requesterId: string;
  timeoutMs?: number;
}

export interface ContractCheckResult {
  outcome: "done" | "failed";
  message: PartDone | PartFailed;
  store: MemoryPartStore;
  elapsedMs: number;
}

/**
 * The contract test every service runs in its own CI: one request on a fixture scope must be
 * answered with a schema-valid `done` or `failed` within `timeoutMs` (60 s, README §10).
 * Throws with an explicit reason otherwise.
 */
export async function runContractCheck(handler: ExportHandler, options: ContractCheckOptions): Promise<ContractCheckResult> {
  const exportId = randomUUID();
  const request: ExportRequest = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportId,
    partId: randomUUID(),
    service: options.service,
    attempt: 1,
    scope: options.scope,
    requester: { userId: options.requesterId },
    requestedAt: new Date().toISOString(),
    storage: { bucket: "exports", prefix: partPrefix(exportId, options.service) },
  };
  const store = new MemoryPartStore();
  const published: { subject: string; payload: PartDone | PartFailed }[] = [];
  const timeoutMs = options.timeoutMs ?? 60_000;
  const started = Date.now();

  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`contract check: no answer within ${timeoutMs} ms`)), timeoutMs);
  });
  let outcome: PartOutcome;
  try {
    outcome = await Promise.race([
      handlePart(JSON.stringify(request), {
        service: options.service,
        handler,
        store,
        deliveryCount: 1,
        publisher: {
          async publish(subject, payload): Promise<void> {
            published.push({ subject, payload });
          },
        },
      }),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }

  if (outcome.kind !== "done" && outcome.kind !== "failed") {
    throw new Error(`contract check: handler did not answer (${outcome.kind}${"reason" in outcome ? `: ${outcome.reason}` : ""})`);
  }
  if (published.length !== 1) throw new Error(`contract check: expected one answer, got ${published.length}`);
  const schema = outcome.kind === "done" ? "export-part-done" : "export-part-failed";
  const check = checkAgainst(schema, published[0].payload);
  if (!check.valid) throw new Error(`contract check: answer does not match ${schema}: ${check.errors.join("; ")}`);
  for (const file of outcome.kind === "done" ? outcome.message.files : []) {
    if (!file.path.startsWith(`${options.service}/`)) throw new Error(`contract check: ${file.path} is outside ${options.service}/`);
    if (!store.objects.has(file.key)) throw new Error(`contract check: ${file.key} listed but not written`);
  }
  return { outcome: outcome.kind, message: outcome.message, store, elapsedMs: Date.now() - started };
}
