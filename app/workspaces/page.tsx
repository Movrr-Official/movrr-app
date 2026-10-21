import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountWorkspaces } from "@/lib/platform/workspaces";
import { getAuthenticatedAppUser } from "@/lib/appUser";
import { Button } from "@/components/ui/button";

export default async function WorkspacesPage() {
  const account = await getAuthenticatedAppUser();
  if (!account) redirect("/auth/signin?redirectTo=/workspaces");
  const workspaces = await getAccountWorkspaces();
  async function select(form: FormData) {
    "use server";
    const requested = String(form.get("workspace") ?? "");
    const current = await getAccountWorkspaces();
    if (!(requested === "rider" && current.rider) && !current.memberships.some(member => member.organisationId === requested)) throw new Error("Active workspace membership required");
    (await cookies()).set("movrr-workspace", requested, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    redirect("/dashboard");
  }
  return <main className="max-w-xl mx-auto p-6 space-y-4"><h1 className="text-2xl font-semibold">{workspaces.rider || workspaces.memberships.length ? "Choose your workspace" : "Your MOVRR account"}</h1>
    <p className="text-sm text-muted-foreground">{account.appUser.name} · {account.appUser.email}</p>
    {workspaces.rider && <form action={select}><input type="hidden" name="workspace" value="rider" /><Button variant="outline">Rider</Button></form>}
    {workspaces.memberships.map(member => <form key={member.id} action={select}><input type="hidden" name="workspace" value={member.organisationId} />
      <Button variant="outline">{member.name} · {member.domain.charAt(0).toUpperCase() + member.domain.slice(1)} · {member.role.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</Button></form>)}
    {!workspaces.rider && !workspaces.memberships.length && <p>Your account is ready. No Rider profile or organisation access has been added. If you received an invitation, use its link to accept access.</p>}
    <form action="/api/auth/signout" method="post"><Button variant="ghost">Sign out</Button></form>
  </main>;
}
