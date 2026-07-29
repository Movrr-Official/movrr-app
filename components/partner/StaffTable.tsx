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
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
];

export function StaffTable({
  members,
  canManage,
}: {
  members: PartnerStaffMember[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Organisation staff</CardTitle>
          <CardDescription>
            Membership list from Platform organisation APIs.
          </CardDescription>
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
                    {member.name ?? member.email ?? member.userId}
                  </p>
                  <p className="text-xs text-muted-foreground break-all">
                    {member.userId}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {member.role}
                  </Badge>
                  {member.status ? (
                    <Badge variant="secondary" className="capitalize">
                      {member.status}
                    </Badge>
                  ) : null}
                  {canManage ? (
                    <form
                      action={updateStaffRoleAction}
                      className="flex flex-wrap items-center gap-2"
                    >
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
                        options={ROLE_OPTIONS}
                        className="w-36"
                      />
                      <SubmitButton size="sm" pendingLabel="Saving…">
                        Update role
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No staff members"
              description="Invite organisation members via Platform when you have staff.manage."
              iconName="dashboard"
            />
          )}
        </CardContent>
      </Card>

      {canManage ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Invite staff</CardTitle>
            <CardDescription>
              Creates membership via POST /api/v1/organisations/:id/staff.
              Revoke is not exposed by Platform yet — change role instead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={inviteStaffAction}
              className="grid gap-4 md:grid-cols-3"
            >
              <Input name="userId" placeholder="Auth user id" required />
              <Select
                name="role"
                defaultValue="staff"
                options={ROLE_OPTIONS}
              />
              <SubmitButton pendingLabel="Inviting…">Invite</SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Viewer roles cannot invite or change staff memberships.
        </p>
      )}
    </div>
  );
}
