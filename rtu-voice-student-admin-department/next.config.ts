import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The app lives in this subfolder, but the repo root also has an empty package-lock.json, so Next
  // guessed the wrong workspace root and warned on every build. Point it at this folder.
  turbopack: {
    root: path.join(__dirname),
  },
  // Frontend-only demo build: all images are local files in /public.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
