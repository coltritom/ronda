import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/grupos", destination: "/groups", permanent: false },
      { source: "/grupo/:id/config", destination: "/groups/:id/settings", permanent: false },
      { source: "/grupo/:id/juntadas", destination: "/groups/:id", permanent: false },
      { source: "/grupo/:id/:path*", destination: "/groups/:id/:path*", permanent: false },
      { source: "/grupo/:id", destination: "/groups/:id", permanent: false },
    ];
  },
};

export default nextConfig;
