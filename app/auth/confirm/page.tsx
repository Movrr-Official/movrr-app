import { redirect } from "next/navigation";
import { confirmPasswordRecovery } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ConfirmRecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const tokenHash = (await searchParams).token_hash;
  if (!tokenHash) redirect("/auth/signin?error=invalid_recovery_link");

  const action = confirmPasswordRecovery.bind(null, tokenHash);
  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="pb-6 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-movrr-text-heading md:text-3xl">
          Reset your password
        </CardTitle>
        <CardDescription className="text-base text-movrr-text-secondary">
          Continue to verify this one-time link and choose a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <Button type="submit" className="w-full">
            Continue to reset password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
