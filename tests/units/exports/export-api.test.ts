import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import type { NextFunction, Request, Response } from "express";
import { contextMiddleware, getContext } from "../../../src/shared/middlewares/context.js";
import { freshAuthChecker } from "../../../src/shared/middlewares/fresh-auth.middleware.js";
import { AppError } from "../../../src/shared/middlewares/error.middleware.js";
import { EXPORT_ERRORS } from "../../../src/modules/exports/shared/export.errors.js";
import { archiveFileName, isDownloadable, pickExportLocale, toExportJobDTO } from "../../../src/modules/exports/shared/to_dto.js";
import { contentDisposition, S3ExportDownloadSigner } from "../../../src/modules/exports/infra/s3-export-download-signer.js";
import { jobRequested } from "../../../src/modules/exports/infra/nats-export-job-publisher.js";
import { checkAgainst } from "../../../src/shared/export/kit/schemas.js";
import { msgIdForJob } from "../../../src/shared/export/kit/contract.js";
import type { ExportJob } from "../../../src/modules/exports/domain/export.models.js";

const NOW_MS = Date.parse("2026-11-15T12:00:00Z");
const NOW_S = NOW_MS / 1000;

/** Runs contextMiddleware with these headers, then `inner` inside the context it installed. */
function inContext<T>(headers: Record<string, string>, inner: () => T): T {
  let result!: T;
  contextMiddleware()(
    { headers } as unknown as Request,
    {} as Response,
    (() => {
      result = inner();
    }) as NextFunction,
  );
  return result;
}

/** What freshAuthChecker does with this x-auth-time: "next" or the HTTP status it throws. */
function stepUp(authTime: string | undefined, maxAge = 300): "next" | number {
  const headers: Record<string, string> = { "x-user-id": "sub-1" };
  if (authTime !== undefined) headers["x-auth-time"] = authTime;
  return inContext(headers, () => {
    let outcome: "next" | number = "next";
    try {
      freshAuthChecker(maxAge, EXPORT_ERRORS.REAUTH_REQUIRED, () => NOW_MS)({} as Request, {} as Response, () => undefined);
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).errorCode).toBe(35000);
      outcome = (err as AppError).statusCode;
    }
    return outcome;
  });
}

describe("(Unit) x-auth-time in the request context", () => {
  it("reads epoch seconds, in plain or exponent form, and floors them", () => {
    expect(inContext({ "x-auth-time": "1763208000" }, () => getContext().auth_time)).toBe(1763208000);
    expect(inContext({ "x-auth-time": "1.763208e+09" }, () => getContext().auth_time)).toBe(1763208000);
    expect(inContext({ "x-auth-time": "1763208000.9" }, () => getContext().auth_time)).toBe(1763208000);
  });

  it("leaves it unset when absent or not a positive number", () => {
    expect(inContext({}, () => getContext().auth_time)).toBeUndefined();
    for (const raw of ["abc", "-5", "0", "Infinity", " "]) {
      expect(inContext({ "x-auth-time": raw }, () => getContext().auth_time)).toBeUndefined();
    }
  });
});

describe("(Unit) freshAuthChecker", () => {
  it("lets a login of up to max age through", () => {
    expect(stepUp(String(NOW_S))).toBe("next");
    expect(stepUp(String(NOW_S - 300))).toBe("next");
  });

  it("answers 401 reauth when the login is older than max age", () => {
    expect(stepUp(String(NOW_S - 301))).toBe(401);
  });

  it("answers 401 reauth when the token carries no auth_time (password grant)", () => {
    expect(stepUp(undefined)).toBe(401);
    expect(stepUp("not-a-time")).toBe(401);
  });

  it("tolerates a minute of clock skew, not a login stamped in the future", () => {
    expect(stepUp(String(NOW_S + 60))).toBe("next");
    expect(stepUp(String(NOW_S + 61))).toBe(401);
  });

  it("refuses a window that is not a positive number of seconds", () => {
    expect(() => freshAuthChecker(0, EXPORT_ERRORS.REAUTH_REQUIRED)).toThrow(/positive/u);
    expect(() => freshAuthChecker(1.5, EXPORT_ERRORS.REAUTH_REQUIRED)).toThrow(/positive/u);
  });
});

describe("(Unit) export helpers", () => {
  it("picks the account's language, then the request's, then French", () => {
    expect(pickExportLocale("nl", "en")).toBe("nl");
    expect(pickExportLocale(null, "en-GB")).toBe("en");
    expect(pickExportLocale("fr-BE", undefined)).toBe("fr");
    expect(pickExportLocale("es", "it")).toBe("fr");
    expect(pickExportLocale(undefined, undefined)).toBe("fr");
    expect(pickExportLocale("DE", undefined)).toBe("de");
  });

  it("names the download after the archive's key", () => {
    expect(archiveFileName("archives/6f1c2a7e-3b9d-4c1e-9a52-0d8e4f7b1a23/optimce-export-user-20261115.zip")).toBe(
      "optimce-export-user-20261115.zip",
    );
    expect(archiveFileName("archives/x/")).toBe("optimce-export.zip");
  });

  it("writes Content-Disposition as RFC 6266 wants it", () => {
    expect(contentDisposition("optimce-export-user-20261115.zip")).toBe('attachment; filename="optimce-export-user-20261115.zip"');
    expect(contentDisposition('é"x.zip')).toBe(`attachment; filename="__x.zip"; filename*=UTF-8''%C3%A9%22x.zip`);
  });

  const job = (overrides: Partial<ExportJob>): ExportJob =>
    ({
      id: "6f1c2a7e-3b9d-4c1e-9a52-0d8e4f7b1a23",
      scope_type: "community",
      scope_id: "org-1",
      id_community: 1,
      requester_user_id: "sub-1",
      id_requester: 1,
      status: "ready",
      schema_version: "1.0",
      locale: "fr",
      created_at: new Date(NOW_MS - 3600_000),
      started_at: null,
      completed_at: null,
      expires_at: new Date(NOW_MS + 3600_000),
      updated_at: new Date(NOW_MS),
      object_key: "archives/x/a.zip",
      size_bytes: "1834221",
      sha256: null,
      assembly_attempts: 0,
      error_code: null,
      error_detail: null,
      requester: { firstName: "Demo", lastName: "User", email: "demo@example.com" },
      community: { auth_community_id: "org-1", name: "Test Community" },
      ...overrides,
    }) as unknown as ExportJob;

  it("offers the download to the requester only, while the archive is ready and not expired", () => {
    const now = new Date(NOW_MS);
    expect(toExportJobDTO(job({}), "sub-1", now)).toMatchObject({ is_mine: true, can_download: true, size_bytes: 1834221 });
    expect(toExportJobDTO(job({}), "sub-2", now)).toMatchObject({ is_mine: false, can_download: false });
    expect(toExportJobDTO(job({ status: "collecting" }), "sub-1", now).can_download).toBe(false);
    expect(toExportJobDTO(job({ expires_at: new Date(NOW_MS) }), "sub-1", now).can_download).toBe(false);
    expect(isDownloadable(job({ status: "expired" }), now)).toBe(false);
  });

  it("shows the parts only in the detail, and never the error detail", () => {
    const dto = toExportJobDTO(job({ parts: [], error_detail: "TypeError (internal)" }), "sub-1", new Date(NOW_MS), true);
    expect(dto.parts).toEqual([]);
    expect(JSON.stringify(dto)).not.toContain("TypeError");
    expect(toExportJobDTO(job({}), "sub-1", new Date(NOW_MS)).parts).toBeUndefined();
  });
});

describe("(Unit) export.job.requested", () => {
  it("is valid against the contract, with <exportId>:requested as message id", () => {
    const body = jobRequested("6f1c2a7e-3b9d-4c1e-9a52-0d8e4f7b1a23");
    expect(checkAgainst("export-job-requested", body)).toEqual({ valid: true, errors: [] });
    expect(msgIdForJob(body.exportId)).toBe("6f1c2a7e-3b9d-4c1e-9a52-0d8e4f7b1a23:requested");
  });
});

describe("(Unit) S3ExportDownloadSigner", () => {
  const settings = {
    public_endpoint: "http://localhost:8091",
    region: "us-east-1",
    access_key: "export-download",
    secret_key: "secret",
    bucket: "exports",
  };

  it("signs a GET of the archive on the public endpoint, for the TTL, with the file name", async () => {
    const url = new URL(
      await new S3ExportDownloadSigner(settings).sign("archives/abc/optimce-export-user-20261115.zip", "optimce-export-user-20261115.zip", 300),
    );
    expect(url.origin).toBe("http://localhost:8091");
    expect(url.pathname).toBe("/exports/archives/abc/optimce-export-user-20261115.zip");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-Credential")).toMatch(/^export-download\//u);
    expect(url.searchParams.get("response-content-disposition")).toBe('attachment; filename="optimce-export-user-20261115.zip"');
    expect(url.searchParams.get("response-content-type")).toBe("application/zip");
  });

  it("does not stop the API when unconfigured: signing fails, naming what is missing", async () => {
    const signer = new S3ExportDownloadSigner({ ...settings, secret_key: "" });
    await expect(signer.sign("archives/a/b.zip", "b.zip", 300)).rejects.toThrow(/secret_key/u);
  });
});

describe("(Unit) data export SQL", () => {
  it("carries the same tables in the dated script, init.sql and the test schema", () => {
    const dated = readFileSync("database_script/2026-11-15_data_export.sql", "utf8");
    const block = dated.split("BEGIN;\n")[1].split("COMMIT;")[0].trim();
    expect(block).toContain("CREATE TABLE IF NOT EXISTS export_job");
    expect(readFileSync("database_script/init.sql", "utf8")).toContain(block);
    expect(readFileSync("tests/sql/init.sql", "utf8")).toContain(block);
  });
});
