import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // This setting ensures static export works correctly
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
