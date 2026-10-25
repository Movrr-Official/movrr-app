import type { MetadataRoute } from "next";
import workspaceManifest from "@/app/manifest";

export default function manifest(): MetadataRoute.Manifest {
  return { ...workspaceManifest(), name: "MOVRR Partner", short_name: "MOVRR Partner", description: "Scan rewards and manage your MOVRR partner workspace.", background_color: "#f5f5f3" };
}
