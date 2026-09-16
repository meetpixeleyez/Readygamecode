import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "standalone" }),
  serverExternalPackages: ["@prisma/client"],
  outputFileTracingExcludes: {
    "*": [
      "./assets/**/*",
      "./scripts/**/*",
      "./.next/standalone/**/*",
      "./public/uploads/**/*",
      "./upload/**/*",
      "./examples/**/*",
    ],
  },    
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Allow SVG product placeholder images (production should use real PNG/JPG)
    dangerouslyAllowSVG: true,
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  async headers() {
    return [
      {
        // Private / authenticated / administrative routes
        source: "/(admin|seller|dashboard|api|user|cart|checkout|login|register|forgot-password|reset-password|password-reset)/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
      {
        // Public pages
        source: "/((?!admin|seller|dashboard|api|user|cart|checkout|login|register|forgot-password|reset-password|password-reset).*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
