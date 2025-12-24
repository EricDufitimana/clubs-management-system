/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/lab'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
      },
    ],
  },
  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  // Path aliases are handled by tsconfig.json paths
  turbopack: {},
};

module.exports = nextConfig;
