import { describe, expect, it } from "@jest/globals";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import { escapeHtml, formatDate, formatSize, relativeHref, renderIndexHtml } from "../../../src/modules/exports/worker/index-html.js";
import { archiveKey, buildManifest, storeWithoutCompression, type ExportManifest } from "../../../src/modules/exports/worker/manifest.js";
import { invalidPart } from "../../../src/modules/exports/worker/orchestrator.js";
import { displayDate } from "../../../src/modules/exports/worker/notifier.js";
import { AssemblyError, assembleArchive } from "../../../src/modules/exports/worker/assembler.js";
import { MemoryExportStorage } from "../../../src/modules/exports/worker/object-store.js";
import type { AssemblyJob } from "../../../src/modules/exports/worker/worker.repository.js";
import { checkAgainst } from "../../../src/shared/export/kit/schemas.js";
import type { PartDone } from "../../../src/shared/export/kit/contract.js";

const EXPORT_ID = "6f1c2a7e-3b9d-4c1e-9a52-0d8e4f7b1a23";
const PART_ID = "0d8e4f7b-1a23-4c1e-9a52-6f1c2a7e3b9d";
const sha = (text: string | Buffer): string => createHash("sha256").update(text).digest("hex");

function manifest(overrides: Partial<ExportManifest> = {}): ExportManifest {
  return {
    ...buildManifest({
      exportId: EXPORT_ID,
      scope: { type: "user", id: "sub-1", name: "Demo <User>" },
      requesterId: "sub-1",
      locale: "fr",
      platformVersion: "2026.11.0",
      generatedAt: new Date("2026-11-15T14:05:00Z"),
      parts: [
        {
          service: "crm",
          status: "done",
          files: [{ path: "crm/documents/files/12-statuts été.pdf", size: 2048, sha256: sha("x") }],
          summary: [
            { labelKey: "export.crm.members", count: 1234 },
            { labelKey: "export.crm.meter_readings", count: 2 },
          ],
          omitted: [{ what: "crm.aggregate", reason: "below_threshold" }],
        },
        { service: "simulation-key", status: "done", files: [], summary: [], omitted: [] },
      ],
    }),
    ...overrides,
  };
}

describe("(Unit) export index.html", () => {
  it("escapes what it shows and percent-encodes the links, slashes kept", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    expect(relativeHref("crm/documents/files/12-statuts été.pdf")).toBe("crm/documents/files/12-statuts%20%C3%A9t%C3%A9.pdf");
    expect(relativeHref("crm/a#b?.json")).toBe("crm/a%23b%3F.json");
  });

  it("formats sizes and dates the Belgian way in each language", () => {
    // Intl separates with no-break spaces.
    const plain = (text: string): string => text.replace(/\s/gu, " ");
    expect(plain(formatSize(512, "fr"))).toBe("512 o");
    expect(plain(formatSize(1536, "en"))).toBe("1.5 kB");
    expect(plain(formatSize(1536, "nl"))).toBe("1,5 kB");
    expect(plain(formatSize(5 * 1024 * 1024, "de"))).toBe("5 MB");
    expect(plain(formatDate("2026-11-15T14:05:00Z", "fr"))).toBe("15 novembre 2026 à 15:05");
    expect(plain(formatDate("2026-11-15T14:05:00Z", "nl"))).toBe("15 november 2026 om 15:05");
  });

  it("lists each service with its counters, links and omissions, in the export's language", () => {
    const html = renderIndexHtml(manifest());
    expect(html).toContain('<html lang="fr">');
    expect(html).toContain("<h2>Compte, communautés et membres</h2>");
    expect(html).toContain('<a href="crm/documents/files/12-statuts%20%C3%A9t%C3%A9.pdf">crm/documents/files/12-statuts été.pdf</a>');
    // A counter without a label yet still shows, humanised; figures in the export's language.
    expect(html).toMatch(/<td>Meter readings<\/td><td class="n">2<\/td>/u);
    expect(html).toMatch(/<td>Membres<\/td><td class="n">1\u202f?\s?234<\/td>/u);
    expect(html).toContain("trop peu de participants pour cette donnée");
    expect(html).toContain("Ce service ne détient aucune donnée vous concernant.");
    expect(html).toContain("Demo &lt;User&gt;");
    expect(html).toContain('<a href="manifest.json">');
  });

  it("runs no script and loads nothing from outside", () => {
    const html = renderIndexHtml(manifest({ scope: { type: "user", id: "sub-1", name: "<script>alert(1)</script>" } }));
    expect(html).not.toMatch(/<script/iu);
    expect(html).toContain(`content="default-src 'none'; style-src 'unsafe-inline'"`);
    expect(html).not.toMatch(/(src|href)="(https?:)?\/\//u);
  });

  it("speaks the four languages", () => {
    for (const [locale, title] of [
      ["en", "Your OptimCE data"],
      ["nl", "Uw OptimCE-gegevens"],
      ["de", "Ihre OptimCE-Daten"],
    ] as const) {
      expect(renderIndexHtml(manifest({ locale }))).toContain(`<h1>${title}</h1>`);
    }
  });
});

describe("(Unit) export manifest and archive", () => {
  it("builds a manifest valid against the contract", () => {
    expect(checkAgainst("manifest", manifest())).toEqual({ valid: true, errors: [] });
  });

  it("names the archive after the scope and the day of the request in Brussels", () => {
    // 23:30 UTC on 14 November is already the 15th in Brussels.
    expect(archiveKey(EXPORT_ID, "user", new Date("2026-11-14T23:30:00Z"))).toBe(`archives/${EXPORT_ID}/optimce-export-user-20261115.zip`);
    expect(archiveKey(EXPORT_ID, "community", new Date("2026-06-30T12:00:00Z"))).toBe(`archives/${EXPORT_ID}/optimce-export-community-20260630.zip`);
  });

  it("stores already compressed formats as they are", () => {
    expect(storeWithoutCompression("crm/documents/files/a.pdf")).toBe(true);
    expect(storeWithoutCompression("crm/documents/files/a", "image/png")).toBe(true);
    expect(storeWithoutCompression("crm/members.json", "application/json")).toBe(false);
    expect(storeWithoutCompression("crm/consumptions/x/2026.csv", "text/csv; charset=utf-8")).toBe(false);
  });
});

function done(overrides: Partial<PartDone> = {}): PartDone {
  return {
    schemaVersion: "1.0",
    exportId: EXPORT_ID,
    partId: PART_ID,
    service: "crm",
    attempt: 1,
    files: [{ path: "crm/members.json", key: `parts/${EXPORT_ID}/crm/members.json`, size: 2, sha256: sha("[]"), contentType: "application/json" }],
    references: [{ bucket: "crm-files", key: "documents/abc-statuts.pdf", targetPath: "crm/documents/files/12-statuts.pdf" }],
    summary: [],
    omitted: [],
    producedAt: "2026-11-15T14:00:00Z",
    ...overrides,
  };
}

describe("(Unit) ready notification date", () => {
  it("is the Brussels calendar day, dd/mm/yyyy, whatever the server zone", () => {
    expect(displayDate(new Date("2026-11-23T14:05:00Z"))).toBe("23/11/2026");
    // 23:30 UTC is already the next day in Brussels (UTC+1 in November).
    expect(displayDate(new Date("2026-11-23T23:30:00Z"))).toBe("24/11/2026");
    // Summer time: UTC+2.
    expect(displayDate(new Date("2026-06-30T22:30:00Z"))).toBe("01/07/2026");
  });
});

describe("(Unit) invalidPart", () => {
  const buckets = ["crm-files", "optimce-documents"];

  it("accepts a part inside its prefix and folder", () => {
    expect(invalidPart(done(), buckets)).toBeNull();
  });

  it("refuses files and references outside the part's prefix, folder or buckets, or named twice", () => {
    const file = done().files[0];
    const reference = done().references[0];
    expect(invalidPart(done({ files: [{ ...file, key: `parts/${EXPORT_ID}/billing/members.json` }] }), buckets)).toMatch(/prefix/u);
    expect(invalidPart(done({ files: [{ ...file, key: `parts/${EXPORT_ID}/crm/.export/done.json` }] }), buckets)).toMatch(/prefix/u);
    expect(invalidPart(done({ files: [{ ...file, path: "billing/members.json" }] }), buckets)).toMatch(/folder/u);
    expect(invalidPart(done({ references: [{ ...reference, bucket: "exports" }] }), buckets)).toMatch(/bucket/u);
    expect(invalidPart(done({ references: [{ ...reference, targetPath: "signature/x.pdf" }] }), buckets)).toMatch(/folder/u);
    expect(invalidPart(done({ references: [{ ...reference, targetPath: "crm/members.json" }] }), buckets)).toMatch(/twice/u);
  });
});

describe("(Unit) assembleArchive", () => {
  const pdf = Buffer.from("%PDF-1.7 statuts");

  function job(result: PartDone, scope: "user" | "community" = "user"): AssemblyJob {
    return {
      id: EXPORT_ID,
      scope_type: scope,
      scope_id: scope === "user" ? "sub-1" : "org-1",
      id_community: scope === "user" ? null : 1,
      requester_user_id: "sub-1",
      id_requester: 1,
      status: "assembling",
      locale: "en",
      created_at: new Date("2026-11-15T10:00:00Z"),
      assembly_attempts: 1,
      object_key: null,
      scope_name: scope === "user" ? "Demo User" : "Test Community",
      community_name: scope === "user" ? null : "Test Community",
      parts: [{ id: PART_ID, export_job_id: EXPORT_ID, service: "crm", status: "done", attempts: 1, requested_at: null, result }],
    };
  }

  function storage(): MemoryExportStorage {
    const s = new MemoryExportStorage();
    s.putObject("exports", `parts/${EXPORT_ID}/crm/members.json`, "[]");
    s.putObject("crm-files", "documents/abc-statuts.pdf", pdf);
    return s;
  }

  const options = { bucket: "exports", documentBuckets: ["crm-files"], platformVersion: "test", signal: new AbortController().signal };

  it("writes every file, the referenced document, the manifest and index.html, and reports the ZIP's size and sha256", async () => {
    const s = storage();
    s.putObject("exports", `archives/${EXPORT_ID}/left-by-a-previous-attempt.zip`, "x");

    const result = await assembleArchive(s, job(done()), options);

    expect(result.key).toBe(`archives/${EXPORT_ID}/optimce-export-user-20261115.zip`);
    expect(s.keys("exports", `archives/${EXPORT_ID}/`)).toEqual([result.key]);
    const bytes = s.object("exports", result.key)!;
    expect(result).toMatchObject({ size: bytes.length, sha256: sha(bytes), entries: 4 });
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(["crm/documents/files/12-statuts.pdf", "crm/members.json", "index.html", "manifest.json"]);
    expect(await zip.file("crm/documents/files/12-statuts.pdf")!.async("nodebuffer")).toEqual(pdf);
    const written = JSON.parse(await zip.file("manifest.json")!.async("string"));
    expect(checkAgainst("manifest", written).valid).toBe(true);
    expect(written.parts[0].files).toEqual([
      { path: "crm/documents/files/12-statuts.pdf", size: pdf.length, sha256: sha(pdf) },
      { path: "crm/members.json", size: 2, sha256: sha("[]") },
    ]);
    expect(written).toMatchObject({ locale: "en", scope: { type: "user", id: "sub-1", name: "Demo User" } });
  });

  it("writes no index.html for a community export", async () => {
    const s = storage();
    const result = await assembleArchive(s, job(done(), "community"), options);
    const zip = await JSZip.loadAsync(s.object("exports", result.key)!);
    expect(zip.file("index.html")).toBeNull();
    expect(JSON.parse(await zip.file("manifest.json")!.async("string")).scope.name).toBe("Test Community");
  });

  it("stops for good on a file that is not what its part declared, or a missing document", async () => {
    const s = storage();
    s.putObject("exports", `parts/${EXPORT_ID}/crm/members.json`, "[1]");
    await expect(assembleArchive(s, job(done()), options)).rejects.toMatchObject({ code: "corrupt_part", permanent: true });

    const t = storage();
    t.buckets.get("crm-files")!.clear();
    await expect(assembleArchive(t, job(done()), options)).rejects.toMatchObject({ code: "corrupt_data", permanent: true });
  });

  it("fails retryably when the upload fails, and leaves no archive", async () => {
    const s = storage();
    s.failUploads = 1;
    const error = await assembleArchive(s, job(done()), options).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(AssemblyError);
    expect(s.keys("exports", "archives/")).toEqual([]);
  });

  it("stops when the worker shuts down", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(assembleArchive(storage(), job(done()), { ...options, signal: controller.signal })).rejects.toMatchObject({
      name: "AssemblyAbortedError",
    });
  });
});
