import type { NextConfig } from "next";

// Force rebuild - native select dropdowns
const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-left',
  },
};

export default nextConfig;
