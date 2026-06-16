import type { NextConfig } from "next";

// Served from GitHub Pages at https://itsfixable.github.io/Korean-Quest/
// so the app lives under the "/Korean-Quest" base path.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/Korean-Quest";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // The parent folder contains other lockfiles; pin the root to this project
  // so Next infers the workspace root unambiguously.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
