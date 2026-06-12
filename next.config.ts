import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  allowedDevOrigins: ['192.168.0.*'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

const isDev = process.env.NODE_ENV === 'development';

export default isDev
  ? nextConfig
  : withPWA({
      dest: "public",
      cacheOnFrontEndNav: true,
      aggressiveFrontEndNavCaching: true,
      reloadOnOnline: true,
    })(nextConfig);
