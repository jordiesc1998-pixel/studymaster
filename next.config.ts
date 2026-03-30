import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-b56f4d8a-970b-42cf-a34e-9386e65d408d.space.z.ai',
    '.space.z.ai',
  ],
};

export default nextConfig;
