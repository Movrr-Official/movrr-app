import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="border-border max-w-lg shadow-sm">
        <CardContent className="p-10 text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-[0.24em]">MOVRR</p>
          <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
          <p className="text-muted-foreground mt-4 text-base">The requested product surface could not be found for this authenticated experience.</p>
        </CardContent>
      </Card>
    </main>
  );
}
