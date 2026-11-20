import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.117"],
  async rewrites() {
    return [
      { source: "/api.php/provide/vod/:path*", destination: "/api/provide/vod" },
      { source: "/api.php/provide/vod", destination: "/api/provide/vod" },
    ];
  },
};

export default nextConfig;
