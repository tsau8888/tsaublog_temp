import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "r3xdj.pages.dev",
        pathname: "/img/**",
      },
    ],
  },
  trailingSlash: true,
};

export default nextConfig;
