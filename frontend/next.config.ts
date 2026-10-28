import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Only enable static export if explicitly requested via environment variable.
  // Standard Next.js server mode supports Clerk middleware and Server Actions.
  ...(process.env.OUTPUT_EXPORT === "true" ? { output: "export" } : {}),
  basePath: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
