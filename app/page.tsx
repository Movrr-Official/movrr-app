import { redirect } from "next/navigation";
import { getCurrentProductSession } from "@/lib/appUser";

export default async function HomePage() {
  const session = await getCurrentProductSession();
  if (!session) redirect("/auth/signin");
  redirect("/dashboard");
}
