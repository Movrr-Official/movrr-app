import { redirect } from "next/navigation";
import { getAuthenticatedAppUser, getCurrentProductSession } from "@/lib/appUser";

export default async function HomePage() {
  const account = await getAuthenticatedAppUser();
  if (!account) redirect("/auth/signin");
  const session = await getCurrentProductSession();
  if (!session) redirect("/workspaces");
  redirect("/dashboard");
}
