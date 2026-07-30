import {
  markAdvertiserNotificationReadAction,
  markAdvertiserNotificationsReadAction,
  updateAdvertiserNotificationPreferencesAction,
} from "@/app/actions/advertiser";
import {
  markRiderNotificationReadAction,
  markRiderNotificationsReadAction,
  updateRiderNotificationPreferencesAction,
} from "@/app/actions/rider";
import { CheckboxField } from "@/components/form/CheckboxField";
import { StatusToast } from "@/components/form/StatusToast";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubmitButton } from "@/components/form/SubmitButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { formatRelativeDate } from "@/lib/format";
import { getAdvertiserDashboardData } from "@/services/advertiser";
import { getRiderDashboardData } from "@/services/rider";
import { redirect } from "next/navigation";

export default async function DashboardNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  if (!session) redirect("/auth/signin");

  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;
  const filter = typeof params.filter === "string" ? params.filter : "all";

  if (
    session.appUser.role === "government" ||
    session.appUser.role === "partner"
  ) {
    return (
      <div className="page-canvas">
        <div className="space-y-6 md:space-y-8">
          <PageHeader
            title="Notifications"
            description={`${session.appUser.role === "government" ? "Government" : "Partner"} workspace notifications.`}
          />
          <EmptyState
            title="No notifications yet"
            description="Account and programme notifications will appear here when available."
            iconName="bell"
          />
        </div>
      </div>
    );
  }

  if (session.appUser.role === "advertiser") {
    const dashboard = await getAdvertiserDashboardData();
    const categories = Array.from(
      new Set(dashboard.notifications.map((item) => item.category)),
    ).sort();
    const notifications =
      filter === "all"
        ? dashboard.notifications
        : dashboard.notifications.filter((item) => item.category === filter);

    return (
      <div className="page-canvas">
        <div className="space-y-6 md:space-y-8">
          <StatusToast success={success} error={error} />

          <Card className="border-border">
          <CardHeader>
            <CardTitle>Advertiser notification preferences</CardTitle>
            <CardDescription>
              Control in-product updates for your advertiser workspace. Campaign
              delivery updates remain read-only here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form
              action={updateAdvertiserNotificationPreferencesAction}
              className="flex items-center gap-3 text-sm font-medium"
            >
              <CheckboxField
                name="productNotifications"
                defaultChecked={dashboard.settings.productNotifications}
                label="Enable advertiser workspace notifications"
              />
              <SubmitButton
                type="submit"
                variant="outline"
                pendingLabel="Saving preference"
              >
                Save preference
              </SubmitButton>
            </form>
            <form action={markAdvertiserNotificationsReadAction}>
              <SubmitButton
                type="submit"
                variant="secondary"
                pendingLabel="Updating"
              >
                Mark all as read
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Inbox filters</CardTitle>
            <CardDescription>
              Filter campaign, billing, and account messages for your advertiser
              workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {["all", ...categories].map((value) => (
              <Button
                key={value}
                asChild
                variant={filter === value ? "default" : "outline"}
                size="sm"
              >
                <a href={`/dashboard/notifications?filter=${value}`}>
                  {value === "all" ? "All" : value.replace(/_/g, " ")}
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>

        {notifications.length ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Advertiser inbox</CardTitle>
              <CardDescription>
                Messages scoped to the authenticated advertiser workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{notification.title}</p>
                        <Badge variant="outline" className="capitalize">
                          {notification.category}
                        </Badge>
                        {!notification.isRead ? (
                          <Badge variant="secondary">Unread</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatRelativeDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead ? (
                      <form action={markAdvertiserNotificationReadAction}>
                        <input
                          type="hidden"
                          name="notificationId"
                          value={notification.id}
                        />
                        <SubmitButton
                          type="submit"
                          variant="outline"
                          size="sm"
                          pendingLabel="Updating"
                        >
                          Mark as read
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="No advertiser notifications"
            description="Campaign, billing, and account notices will appear here when MOVRR has updates for your workspace."
            iconName="bell"
          />
        )}

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Need support?</CardTitle>
              <CardDescription>
                Contact {dashboard.support.helpLabel.toLowerCase()} at{" "}
                {dashboard.support.supportEmail} for billing, campaign, or account
                visibility questions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (session.appUser.role !== "rider") redirect("/dashboard");

  const dashboard = await getRiderDashboardData();
  const categories = Array.from(
    new Set(dashboard.notifications.map((item) => item.category)),
  ).sort();
  const notifications =
    filter === "all"
      ? dashboard.notifications
      : dashboard.notifications.filter((item) => item.category === filter);

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <StatusToast success={success} error={error} />

        <Card className="border-border">
        <CardHeader>
          <CardTitle>Rider notification preferences</CardTitle>
          <CardDescription>
            Control whether MOVRR can show account, route, rewards, and campaign
            updates in this web workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form
            action={updateRiderNotificationPreferencesAction}
            className="flex items-center gap-3 text-sm font-medium"
          >
            <CheckboxField
              name="productNotifications"
              defaultChecked={dashboard.preferences.productNotifications}
              label="Enable rider workspace notifications"
            />
            <SubmitButton
              type="submit"
              variant="outline"
              pendingLabel="Saving preference"
            >
              Save preference
            </SubmitButton>
          </form>
          <form action={markRiderNotificationsReadAction}>
            <SubmitButton
              type="submit"
              variant="secondary"
              pendingLabel="Updating"
            >
              Mark all as read
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Inbox filters</CardTitle>
          <CardDescription>Filter rider messages by category.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["all", ...categories].map((value) => (
            <Button
              key={value}
              asChild
              variant={filter === value ? "default" : "outline"}
              size="sm"
            >
              <a href={`/dashboard/notifications?filter=${value}`}>
                {value === "all" ? "All" : value.replace(/_/g, " ")}
              </a>
            </Button>
          ))}
        </CardContent>
      </Card>

      {notifications.length ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Rider inbox</CardTitle>
            <CardDescription>
              Recent account, route, rewards, and campaign updates synced into
              the web workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-xl border border-border/60 bg-background/70 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{notification.title}</p>
                      <Badge variant="outline" className="capitalize">
                        {notification.category}
                      </Badge>
                      {!notification.isRead ? (
                        <Badge variant="secondary">Unread</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatRelativeDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead ? (
                    <form action={markRiderNotificationReadAction}>
                      <input
                        type="hidden"
                        name="notificationId"
                        value={notification.id}
                      />
                      <SubmitButton
                        type="submit"
                        variant="outline"
                        size="sm"
                        pendingLabel="Updating"
                      >
                        Mark as read
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No rider notifications"
          description="Route, rewards, and account notices will appear here when MOVRR has updates for your rider profile."
          iconName="bell"
        />
      )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Need support?</CardTitle>
            <CardDescription>
              Contact {dashboard.support.helpLabel.toLowerCase()} at{" "}
              {dashboard.support.supportEmail} if you need help with route
              visibility, rewards statements, or account preferences.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
