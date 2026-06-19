/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@damora/shared-types', 'react-markdown', 'remark-gfm'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
