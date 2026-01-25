import type { NextConfig } from "next";

// Force rebuild - navigation system update
const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-left',
  },
};

export default nextConfig;
