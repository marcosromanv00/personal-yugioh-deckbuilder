import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ygoprodeck.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ygoprodeck.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.yugiohmeta.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.masterduelmeta.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

