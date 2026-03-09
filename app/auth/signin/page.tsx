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
    <Card className="border-0">
      <CardHeader className="pb-6 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-lg">
          Sign in to access your MOVRR rider or advertiser workspace.
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
