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
import { logger } from "@/lib/logger";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            We couldn{"'"}t load this dashboard view / Deze pagina kon niet worden geladen
          </CardTitle>
          <CardDescription>
            Please check your connection and try again. / Controleer je verbinding en probeer het opnieuw.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Your workspace is temporarily unavailable. / Je werkruimte is tijdelijk niet beschikbaar.
          </p>
          <Button type="button" onClick={reset} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry / Opnieuw proberen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
