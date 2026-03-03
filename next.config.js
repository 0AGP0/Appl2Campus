/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  powerByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
    ];
    const noCacheHeaders = [
      { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
    ];
    const noCache = [...securityHeaders, ...noCacheHeaders];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/login", headers: noCache },
      { source: "/register", headers: noCache },
      { source: "/gizlilik", headers: noCache },
      { source: "/kullanim-kosullari", headers: noCache },
      { source: "/dashboard", headers: noCache },
      { source: "/dashboard/:path*", headers: noCache },
      { source: "/admin", headers: noCache },
      { source: "/admin/:path*", headers: noCache },
      { source: "/students", headers: noCache },
      { source: "/students/:path*", headers: noCache },
      { source: "/operasyon", headers: noCache },
      { source: "/operasyon/:path*", headers: noCache },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["next-auth"],
  },
  webpack: (config) => {
    const path = require("path");
    config.resolve = config.resolve || {};
    config.resolve.alias = { ...config.resolve.alias };
    const root = path.resolve(__dirname);
    const na = path.join(root, "node_modules", "next-auth");
    config.resolve.alias["next-auth"] = na;
    config.resolve.alias["next-auth/middleware"] = path.join(na, "middleware.js");
    config.resolve.alias["next-auth/providers/credentials"] = path.join(na, "providers", "credentials.js");
    config.resolve.alias["next-auth/providers/google"] = path.join(na, "providers", "google.js");
    return config;
  },
};

module.exports = nextConfig;
