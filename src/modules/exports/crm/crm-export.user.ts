import type { PartContext } from "../../../shared/export/kit/part-context.js";
import { safeFileName } from "../../../shared/export/kit/part-context.js";
import { runWithContext } from "../../../shared/middlewares/context.js";
import type { MeMemberPartialQuery, MeMetersPartialQuery, MeDocumentPartialQuery } from "../../me/api/me.dtos.js";
import type { NotificationQueryDTO } from "../../notifications/api/notification.dtos.js";
import type { CommunityQueryDTO } from "../../communities/api/community.dtos.js";
import type { UserManagerInvitationQuery, UserMemberInvitationQuery } from "../../invitations/api/invitation.dtos.js";
import type { Member } from "../../members/domain/member.models.js";
import type { Document } from "../../documents/domain/document.models.js";
import { pages, type CrmExportDeps } from "./crm-export.deps.js";
import type { CrmExportScope } from "./crm-export.requester.js";
import { CONSUMPTION_HEADER, consumptionRow, documentItem, iso, member, meter, profile, yearsCovered } from "./crm-export.mappers.js";

/**
 * The `crm` part of a user export: the data about the user, never the data they can reach. Each
 * file replays the read behind the matching /me screen, under the user's context, so it holds
 * what the user sees there and nothing more: a member only while linked to them, a meter only
 * for their own holding periods, a document only of their own members. An ADMIN who is not a
 * member therefore gets their account, their identity and their activity log, and nothing about
 * the community's members (contract §8).
 */
export async function writeUserExport(ctx: PartContext, scope: CrmExportScope, deps: CrmExportDeps): Promise<void> {
  const { user } = scope;

  // identity.json: what Keycloak holds, without any credential.
  const identity = await deps.iam.getUserExport(user.auth_user_id);
  await ctx.writeJson("identity", identity ? [identity] : []);

  // account.json: the profile, the preferences, the onboarding, the communities and roles.
  const account = await deps.users.getUser();
  const communities: Record<string, unknown>[] = [];
  for await (const cu of pages((page, limit) => deps.communities.getMyCommunities({ page, limit, sort_id: "ASC" } as CommunityQueryDTO))) {
    communities.push({ id: cu.community.id, name: cu.community.name, role: cu.role });
  }
  await ctx.writeJson(
    "account",
    account
      ? [
          {
            ...profile(account),
            notification_preferences: (await deps.notifications.listPreferences()).map((p) => ({
              type_prefix: p.type_prefix,
              channel: p.channel,
              mode: p.mode,
            })),
            onboarding: (await deps.onboarding.list()).map((o) => ({
              tour_key: o.tour_key,
              outcome: o.outcome,
              tour_version: o.tour_version,
              created_at: iso(o.created_at),
              updated_at: iso(o.updated_at),
            })),
            communities,
          },
        ]
      : [],
  );

  // members.json: the members linked to the user, in full (the /me read loads no manager).
  const linked: Member[] = [];
  for await (const m of pages((page, limit) => deps.me.getMembersList({ page, limit } as MeMemberPartialQuery))) linked.push(m);
  ctx.count(
    "members",
    await ctx.writeJson(
      "members",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for (const m of linked) {
          const full = await runWithContext({ user_id: user.auth_user_id, community_id: m.community?.auth_community_id }, () =>
            deps.members.getFullMember(m.id),
          );
          yield member(full ?? m);
        }
      })(),
    ),
  );

  // meters.json: the meters the user's members hold or held, each with the user's own holdings.
  const holdings: { ean: string; windows: { start: string | null; end: string | null }[] }[] = [];
  const participations: Record<string, unknown>[] = [];
  ctx.count(
    "meters",
    await ctx.writeJson(
      "meters",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const listed of pages((page, limit) => deps.me.getMeters({ page, limit } as MeMetersPartialQuery))) {
          const detail = (await deps.me.getMeterById(listed.EAN)) ?? listed;
          const history = detail.meter_data ?? [];
          holdings.push({ ean: detail.EAN, windows: history.map((d) => ({ start: iso(d.start_date), end: iso(d.end_date) })) });
          for (const d of history) {
            if (!d.sharing_operation) continue;
            participations.push({
              ean: detail.EAN,
              member: d.member ? { id: d.member.id, name: d.member.name } : null,
              sharing_operation: { id: d.sharing_operation.id, name: d.sharing_operation.name, type: d.sharing_operation.type },
              start_date: iso(d.start_date),
              end_date: iso(d.end_date),
              status: d.status,
            });
          }
          yield meter(detail);
        }
      })(),
    ),
  );

  // consumptions/<EAN>/<year>.csv: the readings of the user's own holding periods.
  let consumptionFiles = 0;
  for (const holding of holdings) {
    for (const year of yearsCovered(holding.windows)) {
      ctx.checkpoint();
      const rows = await deps.me.getMeterConsumptions(holding.ean, { date_start: new Date(`${year}-01-01`), date_end: new Date(`${year}-12-31`) });
      if (rows.length === 0) continue;
      await ctx.writeCsv(`consumptions/${safeFileName(holding.ean)}/${year}.csv`, CONSUMPTION_HEADER, rows.map(consumptionRow));
      consumptionFiles++;
    }
  }
  ctx.count("consumption_files", consumptionFiles);

  // sharing-participations.json: the user's members' participations, from those same holdings.
  ctx.count("sharing_participations", await ctx.writeJson("sharing-participations", participations));

  // allocation-shares.json: only the share of the user's own members (/me/allocation-shares), today.
  const shares = await deps.meService.getAllocationShares({});
  ctx.count(
    "allocation_shares",
    await ctx.writeJson(
      "allocation-shares",
      shares.shares.map((s) => ({ at: shares.at, ...s, community: s.community ? { id: s.community.id, name: s.community.name } : null })),
    ),
  );

  // documents.json + documents/files/…: the documents of the user's members, by reference.
  const documentCount = await writeDocuments(
    ctx,
    deps,
    pages((page, limit) => deps.me.getDocuments({ page, limit } as MeDocumentPartialQuery)),
  );
  ctx.count("documents", documentCount);

  // invitations.json: those the user received and has not answered.
  ctx.count(
    "invitations",
    await ctx.writeJson(
      "invitations",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const i of pages((page, limit) => deps.me.getOwnMembersPendingInvitation({ page, limit } as UserMemberInvitationQuery))) {
          yield {
            kind: "member",
            id: i.id,
            community: ref(i.community),
            member: ref(i.member),
            member_name: i.memberName ?? null,
            email: i.userEmail,
            created_at: iso(i.created_at),
          };
        }
        for await (const i of pages((page, limit) => deps.me.getOwnManagersPendingInvitation({ page, limit } as UserManagerInvitationQuery))) {
          yield {
            kind: "manager",
            id: i.id,
            community: ref(i.community),
            member: null,
            member_name: null,
            email: i.userEmail,
            created_at: iso(i.created_at),
          };
        }
      })(),
    ),
  );

  // notifications.json and email-messages.json: what the user was told, in-app and by mail.
  ctx.count(
    "notifications",
    await ctx.writeJson(
      "notifications",
      (async function* (): AsyncGenerator<Record<string, unknown>> {
        for await (const n of pages((page, limit) => deps.notifications.list({ page, limit } as NotificationQueryDTO))) {
          yield {
            id: String(n.id),
            community: ref(n.community),
            type: n.type,
            data: n.data ?? {},
            read_at: iso(n.read_at),
            created_at: iso(n.created_at),
          };
        }
      })(),
    ),
  );
  ctx.count("email_messages", await ctx.writeJson("email-messages", deps.reads.emailMessages(user.id, user.email)));
  await ctx.writeJson("email-suppression", await deps.reads.emailSuppression(user.email));

  // activity-log.json: the user's own actions, admin actions included, in every community.
  ctx.count("activity_entries", await ctx.writeJson("activity-log", deps.reads.userActivity(user.id)));
}

function ref(value: unknown): { id: number; name: string } | null {
  const v = value as { id?: number; name?: string } | null | undefined;
  return v && typeof v.id === "number" ? { id: v.id, name: v.name ?? "" } : null;
}

/**
 * Lists documents in documents.json and adds each stored file as a reference, which the worker
 * copies from its bucket into `crm/documents/files/<id>-<name>`. A document whose object is
 * missing is still listed, with `file_missing: true`, rather than failing every export.
 */
export async function writeDocuments(ctx: PartContext, deps: CrmExportDeps, documents: AsyncIterable<Document>): Promise<number> {
  let missing = 0;
  const count = await ctx.writeJson(
    "documents",
    (async function* (): AsyncGenerator<Record<string, unknown>> {
      for await (const d of documents) {
        ctx.checkpoint();
        const stat = d.file_url ? await deps.storage.stat(d.file_url) : null;
        let file: string | null = null;
        if (stat) {
          const path = `documents/files/${d.id}-${safeFileName(d.file_name)}`;
          ctx.addReference({ bucket: deps.storage.bucket, key: d.file_url, path, size: stat.size, contentType: stat.contentType ?? d.file_type });
          file = `crm/${path}`;
        } else {
          missing++;
        }
        yield documentItem(d, file);
      }
    })(),
  );
  if (missing > 0) ctx.count("documents_missing", missing);
  return count;
}
