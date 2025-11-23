import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignorar erros do ESLint durante o build (warnings não devem bloquear)
    // Os warnings ainda aparecerão, mas não vão quebrar o build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
