import {
  updateAdvertiserNotificationPreferencesAction,
  updateAdvertiserSettingsAction,
} from "@/app/actions/advertiser";
import {
  updateRiderNotificationPreferencesAction,
  updateRiderProfileAction,
} from "@/app/actions/rider";
import { CheckboxField } from "@/components/form/CheckboxField";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentProductSession } from "@/lib/appUser";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import { getRiderDashboardData } from "@/services/rider";
import { redirect } from "next/navigation";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "nl", label: "Dutch" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
];

const TIMEZONE_OPTIONS = [
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
  { value: "Europe/Brussels", label: "Europe/Brussels" },
  { value: "UTC", label: "UTC" },
];

export default async function DashboardSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  if (!session) redirect("/auth/signin");

  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;

  if (session.appUser.role === "advertiser") {
    const dashboard = await getAdvertiserDashboardData();
    const settings = dashboard.settings;

    return (
      <div className="page-canvas min-h-screen px-4 sm:px-6 py-8 md:py-12 lg:py-16 lg:pt-6">
        <div className="space-y-6 md:space-y-8">
          <StatusToast success={success} error={error} />

          <Card className="border-border">
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
            <CardDescription>
              Structured organization information visible inside the advertiser
              workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={updateAdvertiserSettingsAction}
              className="grid gap-4 md:grid-cols-2"
            >
              <Input
                name="companyName"
                defaultValue={settings.companyName}
                placeholder="Company name"
                required
              />
              <Input
                name="contactName"
                defaultValue={settings.contactName}
                placeholder="Primary contact"
                required
              />
              <Input
                name="companyEmail"
                defaultValue={settings.companyEmail}
                placeholder="Company email"
                required
                type="email"
              />
              <Input
                name="phone"
                defaultValue={settings.phone ?? ""}
                placeholder="Phone"
              />
              <Input
                name="website"
                defaultValue={settings.website ?? ""}
                placeholder="Website"
              />
              <Input
                name="industry"
                defaultValue={settings.industry ?? ""}
                placeholder="Industry"
              />
              <Select
                name="language"
                defaultValue={settings.language}
                options={LANGUAGE_OPTIONS}
              />
              <Select
                name="timezone"
                defaultValue={settings.timezone}
                options={TIMEZONE_OPTIONS}
              />
              <CheckboxField
                name="emailNotifications"
                defaultChecked={settings.emailNotifications}
                label="Email notifications"
              />
              <CheckboxField
                name="campaignUpdates"
                defaultChecked={settings.campaignUpdates}
                label="Campaign updates"
              />
              <div className="md:col-span-2">
                <SubmitButton type="submit" pendingLabel="Saving settings">
                  Save company profile
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Product notifications</CardTitle>
            <CardDescription>
              Control in-app advertiser notification delivery separately from
              email-level campaign updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={updateAdvertiserNotificationPreferencesAction}
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <CheckboxField
                name="productNotifications"
                defaultChecked={settings.productNotifications}
                label="Enable product notifications"
              />
              <SubmitButton
                type="submit"
                variant="outline"
                pendingLabel="Saving preference"
              >
                Save preference
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Support and billing handoff</CardTitle>
              <CardDescription>
                For billing disputes, campaign visibility clarifications, or
                organization updates, contact {dashboard.support.supportEmail}.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const dashboard = await getRiderDashboardData();
  return (
    <div className="page-canvas min-h-screen px-4 sm:px-6 py-8 md:py-12 lg:py-16 lg:pt-6">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success} error={error} />

        <Card className="border-border">
        <CardHeader>
          <CardTitle>Rider profile</CardTitle>
          <CardDescription>
            Update profile and preference details used across your rider
            identity and support workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={updateRiderProfileAction}
            className="grid gap-4 md:grid-cols-2"
          >
            <Input
              value={dashboard.profile.email}
              readOnly
              disabled
              type="email"
            />
            <Input
              name="phone"
              placeholder="Phone"
              defaultValue={session.appUser.phone ?? ""}
            />
            <Input
              name="city"
              placeholder="City"
              defaultValue={dashboard.profile.city ?? ""}
            />
            <Input
              name="country"
              placeholder="Country"
              defaultValue={dashboard.profile.country ?? ""}
            />
            <Input
              name="vehicleType"
              placeholder="Vehicle type"
              defaultValue={dashboard.profile.vehicleType ?? ""}
            />
            <Input
              name="emergencyContact"
              placeholder="Emergency contact"
              defaultValue={dashboard.profile.emergencyContact ?? ""}
            />
            <Input
              name="emergencyPhone"
              placeholder="Emergency phone"
              defaultValue={dashboard.profile.emergencyPhone ?? ""}
            />
            <Select
              name="languagePreference"
              defaultValue={dashboard.profile.languagePreference}
              options={LANGUAGE_OPTIONS}
            />
            <Select
              name="timezone"
              defaultValue={dashboard.profile.timezone}
              options={TIMEZONE_OPTIONS}
            />
            <Textarea
              className="md:col-span-2"
              value={
                dashboard.profile.accountNotes ??
                "No account notes are currently available for your rider profile."
              }
              readOnly
              disabled
            />
            <div className="md:col-span-2">
              <SubmitButton type="submit" pendingLabel="Saving profile">
                Save rider profile
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>
            Control in-product rider notifications independently from mobile
            operational notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={updateRiderNotificationPreferencesAction}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <CheckboxField
              name="productNotifications"
              defaultChecked={dashboard.preferences.productNotifications}
              label="Enable product notifications"
            />
            <SubmitButton
              type="submit"
              variant="outline"
              pendingLabel="Saving preference"
            >
              Save preference
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Security and support</CardTitle>
            <CardDescription>
              Password resets and account recovery remain managed through
              authenticated MOVRR access flows. Contact{" "}
              {dashboard.support.supportEmail} if you need account support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
