import Link from "next/link";
import { createCampaignAction } from "@/app/actions/advertiser";
import { StatusToast } from "@/components/form/StatusToast";
import { SubmitButton } from "@/components/form/SubmitButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProductSession } from "@/lib/appUser";
import { redirect } from "next/navigation";

export default async function CreateCampaignPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentProductSession();
  if (!session || session.appUser.role !== "advertiser") redirect("/dashboard");

  const params = await searchParams;
  const success = typeof params.success === "string" ? params.success : null;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="page-canvas">
      <div className="space-y-6 md:space-y-8">
        <PageHeader
          title="Create campaign"
          description="Create a draft campaign via Platform POST /campaigns."
        />
        <StatusToast success={success} error={error} />

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Campaign details</CardTitle>
            <CardDescription>
              Draft campaigns can be edited before launch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCampaignAction} className="grid gap-4 md:grid-cols-2">
              <Input name="name" placeholder="Campaign name" required className="md:col-span-2" />
              <Textarea
                name="description"
                placeholder="Description"
                className="md:col-span-2"
              />
              <Input name="budget" type="number" placeholder="Budget" min={0} step="0.01" required />
              <select
                name="campaignType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue="destination_ride"
              >
                <option value="destination_ride">Destination ride</option>
                <option value="swarm">Swarm</option>
              </select>
              <Input name="startDate" type="date" required />
              <Input name="endDate" type="date" required />
              <Input
                name="targetZones"
                placeholder="Target zones (comma-separated)"
                className="md:col-span-2"
              />
              <div className="flex gap-3 md:col-span-2">
                <SubmitButton type="submit" pendingLabel="Creating">
                  Create draft
                </SubmitButton>
                <Link
                  href="/dashboard/campaigns"
                  className="inline-flex h-10 items-center rounded-md border border-input px-4 text-sm"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
