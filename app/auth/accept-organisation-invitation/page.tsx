import { acceptAccountInvitation } from "@/app/actions/accountInvitations";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function AcceptOrganisationInvitation({ searchParams }: { searchParams: Promise<{ token?: string; accepted?: string; error?: string }> }) {
  const params = await searchParams;
  async function accept() {
    "use server";
    let error: string | undefined;
    try { await acceptAccountInvitation(params.token ?? ""); }
    catch (failure) { error = failure instanceof Error ? failure.message : "Acceptance failed"; }
    redirect(error ? `/auth/accept-organisation-invitation?token=${encodeURIComponent(params.token ?? "")}&error=${encodeURIComponent(error)}` : "/auth/accept-organisation-invitation?accepted=1");
  }
  return <div className="max-w-md mx-auto space-y-4 p-6">
    <h1 className="text-xl font-semibold">Organisation invitation</h1>
    {params.accepted ? <p>Your organisation membership is active.</p> : <>
      <p>Sign in with your verified invited email, then accept access to the organisation. Acceptance grants only the role recorded in your invitation.</p>
      {params.error && <p role="alert" className="text-destructive">{params.error}</p>}
      <a className="text-primary underline" href={`/auth/signin?redirectTo=${encodeURIComponent(`/auth/accept-organisation-invitation?token=${params.token ?? ""}`)}`}>Sign in with the invited email</a>
      <form action={accept}><Button disabled={!params.token}>Accept invitation</Button></form>
    </>}
  </div>;
}
