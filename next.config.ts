import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "easy-store-ecu-files.s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
    ],
  },
  // Evitar que Next.js intente hacer static export de páginas dinámicas
  output: 'standalone',
};

export default nextConfig;
