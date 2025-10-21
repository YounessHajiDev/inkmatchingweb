/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig;
