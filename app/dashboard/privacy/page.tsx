import { requireProductSession } from "@/lib/appUser";
import { requestAccountDeletion } from "@/app/actions/privacy";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/form/SubmitButton";
import { StatusToast } from "@/components/form/StatusToast";
export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireProductSession(["rider"]);
  const { error } = await searchParams;
  return (
    <div key={session.appUser.id} className="page-canvas space-y-6">
      <PageHeader
        title="Data and privacy"
        description="Export your rider data or request account deletion."
      />
      <StatusToast error={error} />
      <Card>
        <CardHeader>
          <CardTitle>Export your data</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/dashboard/account/export" method="POST">
            <SubmitButton pendingLabel="Preparing export">
              Download personal data
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Request account deletion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">If self-service deletion is paused or unavailable, email <a className="underline" href="mailto:privacy@movrr.nl">privacy@movrr.nl</a> to exercise your privacy rights. Existing requests and deletion receipts remain available through the existing review process.</p>
          <form action={requestAccountDeletion} className="space-y-4"><input type="hidden" name="accountId" value={session.appUser.id}/>
            <p id="deletion-disclosure">
              Requesting deletion restricts your account. MOVRR reviews outstanding
              rewards, campaign equipment and other obligations before completing
              deletion. Required financial and audit evidence may be retained under the
              existing policy. You receive a request reference and status receipt.
            </p>
            <label className="block">
              <input
                type="checkbox"
                name="acknowledgeDisclosure"
                required
                aria-describedby="deletion-disclosure"
              />{" "}
              I understand and request account deletion.
            </label>
            <label className="block">
              Current password (for email sign-in reauthentication)
              <Input name="password" type="password" autoComplete="current-password" />
            </label>
            <SubmitButton variant="destructive" pendingLabel="Requesting deletion">
              Request account deletion
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
