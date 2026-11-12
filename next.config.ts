import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // โดเมนโปสเตอร์ที่ใช้จริงใน DB (เพิ่มโดเมนใหม่ที่นี่เมื่อเรื่องใหม่มาจากแหล่งอื่น)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.gstatic.com" },
      { protocol: "https", hostname: "**.dramaboxdb.com" },
      { protocol: "https", hostname: "lakornv.com" },
      { protocol: "https", hostname: "**.aliyuncs.com" },
      { protocol: "https", hostname: "**.rongyok.tv" },
      { protocol: "https", hostname: "xn--42c6de8aao8i7a.com" },
      { protocol: "https", hostname: "gravatar.com" },
    ],
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
