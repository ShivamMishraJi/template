import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "@myriaddreamin/typst-ts-node-compiler"],
};

export default nextConfig;
