/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-require-imports */
const { withSentryConfig } = require("@sentry/nextjs");

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{
      protocol: apiUrl.protocol.slice(0, -1),
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      pathname: "/**",
    }],
  },
  async rewrites() {
    const backend = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: `${backend}/:path*` }];
  },
  async redirects() {
    return [
      { source: "/public-projects", destination: "/gallery", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});

