import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * S3StorageService.ping(), which GET /health reports as the document store.
 *
 * Against a local HTTP server rather than MinIO, which CI does not run. What needs pinning
 * is how the SDK reports a failed HeadBucket, and a bodiless HEAD reply is all it sees.
 * Measured against the dev stack's MinIO on 2026-10-06 (@aws-sdk/client-s3 3.1029.0): a
 * missing bucket rejects with name "NotFound" and a wrong secret with name "Unknown", both
 * with message "UnknownError". The status is only in `$metadata.httpStatusCode`.
 */

let reply: number | "never" = 200;
const requests: string[] = [];
const server = createServer((req, res) => {
  requests.push(`${req.method} ${req.url}`);
  if (reply !== "never") {
    res.writeHead(reply).end();
  }
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

// config/test.cjs has no storage_service.settings.public_endpoint, which the constructor
// reads. NODE_CONFIG is merged over it when `config` is first imported, so set it first.
process.env.NODE_CONFIG = JSON.stringify({ storage_service: { settings: { endpoint, public_endpoint: endpoint } } });
const { S3StorageService } = await import("../../../src/shared/storage/implementations/s3.storage.service.js");

describe("(Unit) S3StorageService.ping", () => {
  beforeEach(() => {
    reply = 200;
    requests.length = 0;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("resolves when the bucket answers, after one HEAD of the configured bucket", async () => {
    await expect(new S3StorageService().ping(1_000)).resolves.toBeUndefined();

    expect(requests).toEqual(["HEAD /crm-files/"]);
  });

  it.each([
    [404, "a missing bucket"],
    [403, "a refused credential"],
  ])("names HTTP %d (%s) rather than the SDK's 'UnknownError'", async (status) => {
    reply = status;

    await expect(new S3StorageService().ping(1_000)).rejects.toThrow(`HeadBucket crm-files: HTTP ${status}`);
  });

  it("gives up at the deadline when the endpoint never answers", async () => {
    reply = "never";

    await expect(new S3StorageService().ping(200)).rejects.toThrow("HeadBucket crm-files: no answer within 200 ms");
  });
});
