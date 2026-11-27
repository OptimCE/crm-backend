import type { Container } from "inversify";
import type { DataSource } from "typeorm";
import type { ExportHandler } from "../../../shared/export/kit/part-runner.js";
import { runWithContext } from "../../../shared/middlewares/context.js";
import { resolveCrmExportDeps } from "./crm-export.deps.js";
import { resolveCrmExportScope } from "./crm-export.requester.js";
import { writeCommunityExport } from "./crm-export.community.js";
import { writeUserExport } from "./crm-export.user.js";

/**
 * The `crm` part: crm_db's tables and the Keycloak identity (contracts/export/README.md §6-§7).
 *
 * The requester's rights are read again first (a community export needs them to still be an
 * ADMIN), then every file is written under the context a request of theirs would have, through
 * the API's own repositories: the export never shows more than the app.
 */
export function createCrmExportHandler(container: Container): ExportHandler {
  return async (ctx) => {
    const deps = resolveCrmExportDeps(container);
    const scope = await resolveCrmExportScope(container.get<DataSource>("AppDataSource"), ctx.request);
    await runWithContext(scope.context, () => (scope.community ? writeCommunityExport(ctx, scope, deps) : writeUserExport(ctx, scope, deps)));
  };
}
