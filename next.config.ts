import type { NextConfig } from "next";

/**
 * Static export is only for GitHub/GitLab Pages builds (see npm run pages:docs).
 * Leaving it off for `next dev` / default `next build` allows dynamic routes
 * like /projects/[id] for IDs not in generateStaticParams().
 */
const staticExport = process.env.NEXT_STATIC_EXPORT === "1";

/** Subpath on Pages hosts. Set with NEXT_PUBLIC_BASE_PATH when running static export. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const, trailingSlash: true } : {}),
  ...(basePath ? { basePath } : {}),
  ...(staticExport ? { images: { unoptimized: true } } : {}),
};

export default nextConfig;
