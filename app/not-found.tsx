import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="auth-shell bg-movrr-bg-soft flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-lg border-movrr-border-soft bg-movrr-bg-surface shadow-sm">
        <CardContent className="p-10 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-[0.24em]">MOVRR</p>
          <h1 className="mt-4 text-3xl font-semibold text-movrr-text-heading">Page not found</h1>
          <p className="mt-4 text-base text-movrr-text-secondary">The requested product surface could not be found for this authenticated experience.</p>
        </CardContent>
      </Card>
    </main>
  );
}
