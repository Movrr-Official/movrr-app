import type { MetadataRoute } from "next";
import workspaceManifest from "@/app/manifest";

export default function manifest(): MetadataRoute.Manifest {
  return { ...workspaceManifest(), name: "MOVRR Partner", short_name: "MOVRR Partner", description: "Scan rewards and manage your MOVRR partner workspace.", background_color: "#f5f5f3", theme_color: "#f5f5f3", icons: [
    ...[192, 512].map(size => ({ src: `/pwa/partner/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose: "any" as const })),
    { src: "/pwa/partner/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ] };
}
