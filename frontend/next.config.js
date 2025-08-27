/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone', // Disabled for Docker compatibility
  trailingSlash: true,
  images: {
    domains: ['localhost', 'e-taca.borg.tools'],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://e-taca.borg.tools',
  },
}

module.exports = nextConfig