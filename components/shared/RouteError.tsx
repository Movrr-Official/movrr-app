"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppSession } from "@/providers/SessionProvider";
import { partnerText } from "@/lib/partnerLocale";
import { logger } from "@/lib/logger";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const session = useAppSession();
  const partner = session.role === "partner";
  const t = (text: string) => partnerText(session.partnerLocale ?? "en", text);
  useEffect(() => {
    logger.error("Dashboard route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="page-canvas">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {partner ? <h1>{t("We couldn't load this page.")}</h1> : "We couldn't load this dashboard view / Deze pagina kon niet worden geladen"}
          </CardTitle>
          <CardDescription>
            {partner ? t("Check your connection and try again.") : "Please check your connection and try again. / Controleer je verbinding en probeer het opnieuw."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {partner ? t("Your workspace is temporarily unavailable.") : "Your workspace is temporarily unavailable. / Je werkruimte is tijdelijk niet beschikbaar."}
          </p>
          <Button type="button" onClick={reset} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            {partner ? t("Retry") : "Retry / Opnieuw proberen"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
