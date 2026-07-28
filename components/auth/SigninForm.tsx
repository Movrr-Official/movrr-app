"use client";

import React, { useState, useTransition } from "react";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";

const signInFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
});

type SignInFormData = z.infer<typeof signInFormSchema>;

export function SigninForm() {
  const [isPending, startTransition] = useTransition();
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const { getValues, trigger, control, handleSubmit } = form;
  const emailValue = useWatch({ control, name: "email" });

  const handleEmailSubmit = async () => {
    const isValid = await trigger("email");
    if (isValid) setEmailSubmitted(true);
  };

  const onSubmit = async (data: SignInFormData) => {
    setError("");

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });

        if (error) {
          setError(error.message);
          return;
        }

        router.push(redirectTo);
        router.refresh();
      } catch (submitError) {
        console.error("Error during sign in:", submitError);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!emailSubmitted ? (
          <>
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your email"
                      disabled={isPending}
                      className="border border-border-input bg-background"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && emailValue.trim()) {
                          event.preventDefault();
                          void handleEmailSubmit();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button type="button" className="w-full" disabled={isPending || !emailValue.trim() || !!form.formState.errors.email} onClick={() => void handleEmailSubmit()}>
              Continue
            </Button>
          </>
        ) : (
          <>
            <div className="flex h-9 items-center justify-between rounded-md border border-border-input px-4 py-2 text-sm dark:border-input dark:bg-input/30">
              <p className="text-sm font-medium">{getValues("email")}</p>
              <button type="button" className="cursor-pointer font-semibold text-primary transition-colors hover:text-primary/80" onClick={() => setEmailSubmitted(false)}>
                <Badge variant="outline" className="hover:bg-muted">Change</Badge>
              </button>
            </div>
            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        {...field}
                        placeholder="Enter your password"
                        disabled={isPending}
                        className="border border-border-input bg-background"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 text-foreground/60 hover:bg-transparent hover:text-foreground"
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={isPending}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending} aria-busy={isPending}>
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Access is provisioned internally. If you cannot sign in, contact the MOVRR platform owner or support team.
            </p>
          </>
        )}
      </form>
    </Form>
  );
}
