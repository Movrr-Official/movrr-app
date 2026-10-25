/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }, { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" }] }];
  },
  images: {
    unoptimized: true,
    qualities: [25, 50, 75, 100],
  },
};

export default nextConfig;
