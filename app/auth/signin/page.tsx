import React, { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SigninForm } from "@/components/auth/SigninForm";

export default function SignInPage() {
  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="pb-6 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-movrr-text-heading md:text-3xl">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-base text-movrr-text-secondary">
          Sign in to MOVRR. We&apos;ll open the right workspace for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <SigninForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
