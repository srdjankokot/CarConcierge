import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fiksiraj workspace root (postoji stray lockfile u home direktorijumu).
  outputFileTracingRoot: __dirname,
  // Landing (statički) je početna na "/"; app živi na /login, /register, /home, ...
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/landing.html" }],
    };
  },
};

export default nextConfig;
