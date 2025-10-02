import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduzir logs em desenvolvimento
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
