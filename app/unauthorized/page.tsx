import { Card, CardContent } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <main className="auth-shell bg-movrr-bg-soft flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-lg border-movrr-border-soft bg-movrr-bg-surface shadow-sm">
        <CardContent className="p-10 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-[0.24em]">MOVRR</p>
          <h1 className="mt-4 text-3xl font-semibold text-movrr-text-heading">Unauthorized</h1>
          <p className="mt-4 text-base text-movrr-text-secondary">Your authenticated account does not have access to this product surface.</p>
        </CardContent>
      </Card>
    </main>
  );
}
