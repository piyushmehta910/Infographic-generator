const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Pin the workspace root explicitly. Without this, Next.js scans up the
  // directory tree for lockfiles and can pick up an unrelated
  // package-lock.json in the user's home folder (breaks standalone tracing).
  outputFileTracingRoot: path.join(__dirname),
  // Remove the default "X-Powered-By: Next.js" header (info disclosure).
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
