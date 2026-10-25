import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "MOVRR Workspace", short_name: "MOVRR",
    description: "Manage rewards and collections with MOVRR.", start_url: "/dashboard", scope: "/", display: "standalone",
    background_color: "#ffffff", theme_color: "#123c2c",
    icons: [...[192, 512].map(size => ({ src: `/pwa/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose: "any" as const })), { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
  };
}
