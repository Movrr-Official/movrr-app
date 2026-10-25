import manifest from "@/lib/partnerManifest";

// Explicit route: Next only discovers its special manifest convention at root.
export function GET() {
  return Response.json(manifest(), { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
