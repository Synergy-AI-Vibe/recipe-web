import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@recipe-web/api", "@recipe-web/ui"],
};

export default nextConfig;
