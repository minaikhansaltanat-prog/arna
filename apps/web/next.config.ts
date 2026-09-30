import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: Vercel (or any static host) serves /out. No server, no database.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@arna/i18n"],
  reactStrictMode: true,
  poweredByHeader: false,
  // Monorepo: let the bundler see packages/i18n and content/ one level above apps/web
  turbopack: { root: path.join(__dirname, "..", "..") },
  experimental: { optimizePackageImports: ["@phosphor-icons/react"] },
};

export default nextConfig;
