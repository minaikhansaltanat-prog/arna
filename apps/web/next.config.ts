import path from "node:path";
import type { NextConfig } from "next";

// GitHub Pages serves a project site under /<repo>; Vercel and custom domains use no prefix.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  // Static export: Vercel (or any static host) serves /out. No server, no database.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@arna/i18n"],
  reactStrictMode: true,
  poweredByHeader: false,
  // Monorepo: let the bundler see packages/i18n and content/ one level above apps/web
  turbopack: { root: path.join(__dirname, "..", "..") },
  // globalNotFound: the app has two root layouts, so the 404 page (logo and slogan) is one full HTML document of its own
  experimental: { optimizePackageImports: ["@phosphor-icons/react"], globalNotFound: true },
};

export default nextConfig;
