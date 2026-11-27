import { describe, expect, it, jest } from "@jest/globals";
import { S3StorageService } from "../../../src/shared/storage/implementations/s3.storage.service.js";

/** S3StorageService.stat, which the data export uses before listing a document by reference. */
/** Without the constructor, which reads a storage config the unit tests do not carry. */
function service(send: (command: unknown) => Promise<unknown>): S3StorageService {
  const s = Object.create(S3StorageService.prototype) as S3StorageService;
  Object.assign(s, { client: { send }, bucket: "crm-files" });
  return s;
}

describe("(Unit) S3StorageService.stat", () => {
  it("answers no object for a URL stored instead of a key, without asking the store", async () => {
    const send = jest.fn<(command: unknown) => Promise<unknown>>();
    const s = service(send);
    await expect(s.stat("https://test-community.example.com/logo.png")).resolves.toBeNull();
    await expect(s.stat("http://url")).resolves.toBeNull();
    await expect(s.stat("")).resolves.toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  it("gives the size and type of a stored object", async () => {
    const s = service(async () => ({ ContentLength: 42, ContentType: "application/pdf" }));
    await expect(s.stat("documents/abc-statuts.pdf")).resolves.toEqual({ size: 42, contentType: "application/pdf" });
  });

  it("answers no object on 404 and on 400, and keeps a 403 an error", async () => {
    const failing = (status: number): S3StorageService =>
      service(async () => Promise.reject({ name: "Unknown", $metadata: { httpStatusCode: status } }));
    await expect(failing(404).stat("documents/gone.pdf")).resolves.toBeNull();
    await expect(failing(400).stat("documents/bad key")).resolves.toBeNull();
    await expect(failing(403).stat("documents/abc.pdf")).rejects.toMatchObject({ $metadata: { httpStatusCode: 403 } });
  });
});
