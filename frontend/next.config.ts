import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GENERATOR_ACTION_URL: process.env.NEXT_PUBLIC_GENERATOR_ACTION_URL,
  },
};

export default nextConfig;
