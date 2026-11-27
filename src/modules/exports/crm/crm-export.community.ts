import type { PartContext } from "../../../shared/export/kit/part-context.js";
import { safeFileName } from "../../../shared/export/kit/part-context.js";
import type { MemberPartialQuery } from "../../members/api/member.dtos.js";
import type { MeterPartialQuery } from "../../meters/api/meter.dtos.js";
import type { SharingOperationPartialQuery } from "../../sharing_operations/api/sharing_operation.dtos.js";
import type { KeyPartialQuery } from "../../keys/api/key.dtos.js";
import type { DocumentQueryDTO } from "../../documents/api/document.dtos.js";
import type { CommunityUsersQueryDTO } from "../../communities/api/community.dtos.js";
import type { UserManagerInvitationQuery, UserMemberInvitationQuery } from "../../invitations/api/invitation.dtos.js";
import type { AuditLogQueryDTO } from "../../audit_log/api/audit-log.dtos.js";
import type { Document } from "../../documents/domain/document.models.js";
import { pages, type CrmExportDeps } from "./crm-export.deps.js";
import type { CrmExportScope } from "./crm-export.requester.js";
import { activityItem } from "./crm-export.reads.js";
import { writeDocuments } from "./crm-export.user.js";
import {
  address,
  allocationKey,
  CONSUMPTION_HEADER,
  consumptionRow,
  iso,
  member,
  meter,
  sharingOperation,
  yearsCovered,
} from "./crm-export.mappers.js";

/**
 * The `crm` part of a community export: what an ADMIN of the community sees in the app, read
 * through the same repositories under their context (community scoping included). No individual
 * notification ever: notifications.json, email-messages.json and identity.json are user files.
 */
export async function writeCommunityExport(ctx: PartContext, scope: CrmExportScope, deps: CrmExportDeps): Promise<void> {
  const community = scope.community!;

  // community.json: identity, legal and bank data, representative, regulator, modules, logo.
  const found = await deps.communities.getCommunityById(community.id);
  const c = found?.community;
  let logo: string | null = null;
  if (c?.logo_url) {
    const stat = await deps.storage.stat(c.logo_url);
    if (stat) {
      const path = `community/logo-${safeFileName(c.logo_url.split("/").pop() ?? "logo")}`;
      ctx.addReference({ bucket: deps.storage.bucket, key: c.logo_url, path, size: stat.size, contentType: stat.contentType ?? undefined });
      logo = `crm/${path}`;
    }
  }
  const modules = (await deps.annexes.findActiveByCommunity(community.id)).map((s) => s.feature).sort();
  await ctx.writeJson(
    "community",
    c
      ? [
          {
            id: c.id,
            name: c.name,
            description: c.description ?? null,
            website_url: c.website_url ?? null,
            regulator: c.regulator,
            vat_number: c.vat_number ?? null,
            legal_name: c.legal_name ?? null,
            iban: c.iban ?? null,
            account_holder_name: c.account_holder_name ?? null,
            representative: {
              first_name: c.representative_first_name ?? null,
              last_name: c.representative_last_name ?? null,
              email: c.representative_email ?? null,
            },
            contact: {
              email: c.contact_email ?? null,
              phone: c.contact_phone ?? null,
            },
            statutes_date: iso(c.statutes_date),
            internal_rules_date: iso(c.internal_rules_date),
            headquarters_address: address(c.headquarters_address),
            logo,
            member_count: found!.member_count,
            modules,
            created_at: iso(c.created_at),
            updated_at: iso(c.updated_at),
          },
        ]
      : [],
  );

  // users.json: the community's accounts and their role.
  ctx.count(
    "users",
    await ctx.writeJson(
      "users",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const cu of pages((page, limit) => deps.communities.getUsers({ page, limit, sort_id: "ASC" } as CommunityUsersQueryDTO))) {
          yield {
            id: cu.user.id,
            first_name: cu.user.firstName ?? null,
            last_name: cu.user.lastName ?? null,
            email: cu.user.email,
            phone_number: cu.user.phoneNumber ?? null,
            role: cu.role,
          };
        }
      })(),
    ),
  );

  // members.json: every member the members screen shows, in full.
  const memberIds: number[] = [];
  ctx.count(
    "members",
    await ctx.writeJson(
      "members",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const m of pages((page, limit) => deps.members.getMembersList({ page, limit } as MemberPartialQuery))) {
          memberIds.push(m.id);
          yield member((await deps.members.getFullMember(m.id)) ?? m);
        }
      })(),
    ),
  );

  // meters.json + consumptions/<EAN>/<year>.csv: every meter, its whole history, its readings.
  const holdings: { ean: string; windows: { start: string | null; end: string | null }[] }[] = [];
  ctx.count(
    "meters",
    await ctx.writeJson(
      "meters",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const listed of pages((page, limit) => deps.meters.getMetersList({ page, limit } as MeterPartialQuery))) {
          const detail = (await deps.meters.getMeter(listed.EAN)) ?? listed;
          holdings.push({ ean: detail.EAN, windows: (detail.meter_data ?? []).map((d) => ({ start: iso(d.start_date), end: iso(d.end_date) })) });
          yield meter(detail);
        }
      })(),
    ),
  );
  let consumptionFiles = 0;
  for (const holding of holdings) {
    for (const year of yearsCovered(holding.windows)) {
      ctx.checkpoint();
      const rows = await deps.meters.getMeterConsumptions(holding.ean, {
        date_start: new Date(`${year}-01-01`),
        date_end: new Date(`${year}-12-31`),
      });
      if (rows.length === 0) continue;
      await ctx.writeCsv(`consumptions/${safeFileName(holding.ean)}/${year}.csv`, CONSUMPTION_HEADER, rows.map(consumptionRow));
      consumptionFiles++;
    }
  }

  // sharing-operations.json + sharing-operation-consumptions/<id>/<year>.csv.
  const operationIds: number[] = [];
  ctx.count(
    "sharing_operations",
    await ctx.writeJson(
      "sharing-operations",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const o of pages((page, limit) =>
          deps.sharing.getSharingOperationList({ page, limit, sort_name: "ASC" } as SharingOperationPartialQuery),
        )) {
          operationIds.push(o.id);
          yield sharingOperation((await deps.sharing.getSharingOperationById(o.id)) ?? o);
        }
      })(),
    ),
  );
  for (const id of operationIds) {
    const years = [...new Set((await deps.sharing.getSharingOperationConsumptionCoverage(id)).map((c) => Number(c.month.slice(0, 4))))].sort();
    for (const year of years) {
      ctx.checkpoint();
      const rows = await deps.sharing.getSharingOperationConsumption(id, {
        date_start: new Date(`${year}-01-01`),
        date_end: new Date(`${year}-12-31`),
      });
      if (!rows || rows.length === 0) continue;
      await ctx.writeCsv(`sharing-operation-consumptions/${id}/${year}.csv`, CONSUMPTION_HEADER, rows.map(consumptionRow));
      consumptionFiles++;
    }
  }
  ctx.count("consumption_files", consumptionFiles);

  // allocation-keys.json: every key with its iterations and consumers.
  ctx.count(
    "allocation_keys",
    await ctx.writeJson(
      "allocation-keys",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const k of pages((page, limit) => deps.keys.getPartialKeyList({ page, limit, sort_name: "ASC" } as KeyPartialQuery))) {
          yield allocationKey((await deps.keys.getKeyById(k.id)) ?? k);
        }
      })(),
    ),
  );

  // documents.json + documents/files/…: the documents of every member, by reference.
  const documents = (async function* (): AsyncGenerator<Document> {
    for (const id of memberIds) {
      yield* pages((page, limit) => deps.documents.getDocuments(id, { page, limit } as DocumentQueryDTO));
    }
  })();
  ctx.count("documents", await writeDocuments(ctx, deps, documents));

  // invitations.json: the pending member and manager invitations.
  ctx.count(
    "invitations",
    await ctx.writeJson(
      "invitations",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const i of pages((page, limit) => deps.invitations.getMembersPendingInvitation({ page, limit } as UserMemberInvitationQuery))) {
          yield {
            kind: "member",
            id: i.id,
            community: { id: community.id, name: community.name },
            member: i.member ? { id: i.member.id, name: i.member.name } : null,
            member_name: i.memberName ?? null,
            email: i.userEmail,
            created_at: iso(i.created_at),
          };
        }
        for await (const i of pages((page, limit) => deps.invitations.getManagersPendingInvitation({ page, limit } as UserManagerInvitationQuery))) {
          yield {
            kind: "manager",
            id: i.id,
            community: { id: community.id, name: community.name },
            member: null,
            member_name: null,
            email: i.userEmail,
            created_at: iso(i.created_at),
          };
        }
      })(),
    ),
  );

  // regulatory-status.json: every regulatory episode, even with the module off.
  ctx.count("regulatory_entries", await ctx.writeJson("regulatory-status", deps.reads.regulatoryStatus(community.id)));

  // activity-log.json: the community's activity log, oldest first.
  ctx.count(
    "activity_entries",
    await ctx.writeJson(
      "activity-log",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const a of pages((page, limit) => deps.auditLog.list({ page, limit, sort_timestamp: "ASC" } as AuditLogQueryDTO), 500)) {
          yield activityItem(a as unknown as Record<string, unknown>);
        }
      })(),
    ),
  );
}
