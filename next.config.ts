import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.117"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'" },
        ],
      },
      {
        source: "/theme/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, immutable" }],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api.php/provide/vod/:path*", destination: "/api/provide/vod" },
      { source: "/api.php/provide/vod", destination: "/api/provide/vod" },
    ];
  },
};

export default nextConfig;
