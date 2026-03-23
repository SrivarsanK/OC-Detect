import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'export',
    distDir: 'dist',
    basePath: '/view',
    images: {
        unoptimized: true
    }
};

export default nextConfig;
