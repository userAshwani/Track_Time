import type { NextConfig } from "next";
import path from "node:path";

const monorepoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
