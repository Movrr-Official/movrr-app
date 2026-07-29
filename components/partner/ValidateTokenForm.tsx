"use client";

import { useState } from "react";
import { validateTokenAction } from "@/app/actions/partner";
import { SubmitButton } from "@/components/form/SubmitButton";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ValidateTokenForm({ canValidate }: { canValidate: boolean }) {
  const [token, setToken] = useState("");

  if (!canValidate) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Validate token</CardTitle>
          <CardDescription>
            Your membership role cannot validate fulfilment tokens.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Validate token</CardTitle>
        <CardDescription>
          Manual code entry (Phase 1). Accept/reject decisions come only from
          Platform POST /api/v1/partners/validate — never local rules. Camera
          scanning can be added later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={validateTokenAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="token" className="text-sm font-medium">
              Validation code
            </label>
            <Input
              id="token"
              name="token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste or type the rider code"
              autoComplete="off"
              required
            />
          </div>
          <SubmitButton pendingLabel="Validating…">Validate</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
