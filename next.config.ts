import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/apicaller",
  assetPrefix: "/apicaller/",
};

export default nextConfig;
