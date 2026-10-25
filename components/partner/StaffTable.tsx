import { getPartnerLocale } from "@/lib/partnerLocaleServer";
import { partnerText } from "@/lib/partnerLocale";
import { partnerLabel } from "@/lib/partnerPresentation";
import { randomBytes } from "node:crypto";
import {
  inviteStaffAction,
  updateStaffRoleAction,
} from "@/app/actions/partner";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import type { PartnerStaffMember } from "@/schemas";

const ROLE_OPTIONS = [
  { value: "manager", label: "Manager" },
  { value: "partner_operations_manager", label: "Partner Operations Manager" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
];

export async function StaffTable({
  members,
  canManage,
  actorRole,
}: {
  members: PartnerStaffMember[];
  canManage: boolean;
  actorRole: string | null;
}) {
  const locale = await getPartnerLocale();
  const t = (text: string) => partnerText(locale, text);
  const roleOptions = actorRole === "partner_operations_manager" ? ROLE_OPTIONS.filter(option => ["staff", "viewer"].includes(option.value)) : ROLE_OPTIONS;
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>{t("Organisation staff")}</CardTitle>
          <CardDescription>{t("Your team and their workspace access.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length ? (
            members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold">
                    {member.name ?? member.email ?? t("Team member")}
                  </p>
                  <p className="text-xs text-muted-foreground break-all">
                    {member.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {partnerLabel(member.role, locale)}
                  </Badge>
                  {member.status ? (
                    <Badge variant="secondary" className="capitalize">
                      {t(member.status)}
                    </Badge>
                  ) : null}
                  {canManage && member.role !== "owner" && (actorRole !== "partner_operations_manager" || ["staff", "viewer"].includes(member.role)) ? (
                    <form
                      action={updateStaffRoleAction}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="expectedUpdatedAt" value={member.updatedAt ?? ""} />
                      <input
                        type="hidden"
                        name="membershipId"
                        value={member.id}
                      />
                      <Select
                        name="role"
                        defaultValue={
                          typeof member.role === "string" ? member.role : "viewer"
                        }
                        options={roleOptions.map(option => ({ ...option, label: locale === "nl" ? partnerLabel(option.value, locale) : option.label }))}
                        className="w-36"
                      />
                      <SubmitButton size="sm" pendingLabel={t("Saving…")}>{t("Update role")}</SubmitButton>
                      <SubmitButton size="sm" name="status" value={member.status === "revoked" ? "active" : "revoked"} pendingLabel={t("Saving…")}>{member.status === "revoked" ? t("Restore membership") : t("Revoke membership")}</SubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title={t("No staff members")}
              description={t("Invite a team member to get started.")}
              iconName="dashboard"
            />
          )}
        </CardContent>
      </Card>

      {canManage ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t("Invite staff")}</CardTitle>
            <CardDescription>{t("Invite an existing account to this organisation. Access begins after verified acceptance.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={inviteStaffAction}
              className="grid gap-4 md:grid-cols-3"
            >
              <input type="hidden" name="operationToken" value={randomBytes(32).toString("hex")} />
              <Input name="email" type="email" aria-label={t("Staff email")} placeholder={t("name@example.com")} required />
              <Select
                name="role"
                defaultValue="staff"
                options={roleOptions.map(option => ({ ...option, label: locale === "nl" ? partnerLabel(option.value, locale) : option.label }))}
              />
              <SubmitButton pendingLabel={t("Inviting…")}>{t("Invite")}</SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">{t("Viewer roles cannot invite or change staff memberships.")}</p>
      )}
    </div>
  );
}
