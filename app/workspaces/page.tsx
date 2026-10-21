import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountWorkspaces } from "@/lib/platform/workspaces";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";

export default async function WorkspacesPage() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/auth/signin?redirectTo=/workspaces");
  const workspaces = await getAccountWorkspaces();
  async function select(form: FormData) {
    "use server";
    const requested = String(form.get("workspace") ?? "");
    const current = await getAccountWorkspaces();
    if (!(requested === "rider" && current.rider) && !current.memberships.some(member => member.organisationId === requested)) throw new Error("Active workspace membership required");
    (await cookies()).set("movrr-workspace", requested, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    redirect("/dashboard");
  }
  return <main className="max-w-xl mx-auto p-6 space-y-4"><h1 className="text-2xl font-semibold">Choose your workspace</h1>
    {workspaces.rider && <form action={select}><input type="hidden" name="workspace" value="rider" /><Button variant="outline">Rider</Button></form>}
    {workspaces.memberships.map(member => <form key={member.id} action={select}><input type="hidden" name="workspace" value={member.organisationId} />
      <Button variant="outline">{member.name} · {member.domain} · {member.role}</Button></form>)}
    {!workspaces.rider && !workspaces.memberships.length && <p>No active workspace memberships. Accept your invitation or contact your organisation owner.</p>}
  </main>;
}
