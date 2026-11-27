import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ExportLocale } from "../domain/export.types.js";
import type { ExportManifest } from "./manifest.js";

/**
 * index.html of a user export: a self-contained page (inline CSS, no script, no external
 * resource) in the requester's language, built from the manifest. It lists each service with its
 * counters (`labelKey`s), relative links to its files and what was left out.
 *
 * The strings live in assets/export/i18n/<lang>.json. A counter or a service without a label
 * still shows, humanised from its key, so a service added later never breaks the page.
 */

interface Catalogue {
  title: string;
  intro: string;
  generated: string;
  export_id: string;
  manifest: string;
  contents: string;
  files: string;
  omitted: string;
  empty: string;
  reasons: Record<string, string>;
  services: Record<string, string>;
  labels: Record<string, string>;
}

const CATALOGUE_DIR = fileURLToPath(new URL("../../../../assets/export/i18n/", import.meta.url));
const catalogues = new Map<ExportLocale, Catalogue>();

function catalogue(locale: ExportLocale): Catalogue {
  let found = catalogues.get(locale);
  if (!found) {
    found = JSON.parse(readFileSync(`${CATALOGUE_DIR}${locale}.json`, "utf8")) as Catalogue;
    catalogues.set(locale, found);
  }
  return found;
}

/** Belgian conventions for the three national languages; British for English (dd/mm). */
const INTL_TAG: Record<ExportLocale, string> = { fr: "fr-BE", nl: "nl-BE", de: "de-BE", en: "en-GB" };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/gu, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** A relative link to an archive path: each segment percent-encoded, the slashes kept. */
export function relativeHref(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function humanise(key: string): string {
  const last = key.split(".").pop() ?? key;
  const words = last.replace(/[-_.]+/gu, " ").trim();
  return words === "" ? key : words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatSize(bytes: number, locale: ExportLocale): string {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return new Intl.NumberFormat(INTL_TAG[locale], {
    style: "unit",
    unit: units[unit],
    unitDisplay: "short",
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

export function formatDate(iso: string, locale: ExportLocale): string {
  return new Intl.DateTimeFormat(INTL_TAG[locale], { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Brussels" }).format(new Date(iso));
}

const STYLE = `
:root{color-scheme:light dark;--fg:#1f2933;--muted:#5f6b7a;--line:#d9dee5;--accent:#2e7d32;--bg:#ffffff;--card:#f6f8f6}
@media (prefers-color-scheme:dark){:root{--fg:#e6e9ee;--muted:#a3adba;--line:#36404c;--accent:#81c784;--bg:#14181d;--card:#1c2229}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 16px 48px}h1{margin:0 0 4px;font-size:26px}h2{margin:0 0 12px;font-size:18px}
.meta{margin:0 0 20px;color:var(--muted);font-size:13px}.intro{margin:0 0 16px}a{color:var(--accent)}
section{margin:20px 0;padding:16px 18px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
h3{margin:14px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
table{border-collapse:collapse;width:100%}td{padding:4px 0;border-bottom:1px solid var(--line);vertical-align:top}td.n{text-align:right;white-space:nowrap;padding-left:12px}
ul{margin:0;padding-left:18px}li{margin:2px 0;overflow-wrap:anywhere}.size{color:var(--muted);font-size:13px;margin-left:6px;white-space:nowrap}
.empty{color:var(--muted);margin:0}
`;

export function renderIndexHtml(manifest: ExportManifest): string {
  const locale = manifest.locale;
  const t = catalogue(locale);
  const number = new Intl.NumberFormat(INTL_TAG[locale]);
  const e = escapeHtml;

  const sections = manifest.parts.map((part) => {
    const title = t.services[part.service] ?? part.service;
    const rows = part.summary
      .map((s) => `<tr><td>${e(t.labels[s.labelKey] ?? humanise(s.labelKey))}</td><td class="n">${e(number.format(s.count))}</td></tr>`)
      .join("");
    const files = part.files
      .map((f) => `<li><a href="${e(relativeHref(f.path))}">${e(f.path)}</a><span class="size">${e(formatSize(f.size, locale))}</span></li>`)
      .join("");
    const omitted = part.omitted.map((o) => `<li>${e(humanise(o.what))} (${e(t.reasons[o.reason] ?? o.reason)})</li>`).join("");
    const body =
      part.files.length === 0 && part.summary.length === 0 && part.omitted.length === 0
        ? `<p class="empty">${e(t.empty)}</p>`
        : [
            rows ? `<h3>${e(t.contents)}</h3><table>${rows}</table>` : "",
            files ? `<h3>${e(t.files)}</h3><ul>${files}</ul>` : "",
            omitted ? `<h3>${e(t.omitted)}</h3><ul>${omitted}</ul>` : "",
          ].join("");
    return `<section><h2>${e(title)}</h2>${body}</section>`;
  });

  return [
    "<!DOCTYPE html>",
    `<html lang="${e(locale)}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    // No script can run, whatever the data contains.
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">`,
    `<title>${e(t.title)}</title>`,
    `<style>${STYLE}</style>`,
    "</head>",
    "<body><main>",
    `<h1>${e(t.title)}</h1>`,
    `<p class="meta">${e(manifest.scope.name)} · ${e(t.generated)} ${e(formatDate(manifest.generatedAt, locale))} · ${e(t.export_id)} ${e(manifest.exportId)}</p>`,
    `<p class="intro">${e(t.intro)}</p>`,
    `<p><a href="manifest.json">${e(t.manifest)}</a></p>`,
    ...sections,
    "</main></body>",
    "</html>",
    "",
  ].join("\n");
}
