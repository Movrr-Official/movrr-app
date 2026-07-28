import { updatePassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage() {
  const cookieStore = await cookies();
  const recoveryAllowed = cookieStore.get("movrr-password-recovery")?.value === "1";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!recoveryAllowed || !user) {
    redirect("/auth/signin");
  }

  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Set a new password for your MOVRR product account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updatePassword} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">New password</label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <Button className="w-full" type="submit">Save password</Button>
        </form>
      </CardContent>
    </Card>
  );
}
