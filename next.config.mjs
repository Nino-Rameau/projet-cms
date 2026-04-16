/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {},
  // PERF-6 — Autoriser les images externes depuis n'importe quel domaine (CMS)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },
};

export default nextConfig;
