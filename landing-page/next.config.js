/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'media.licdn.com'],
    unoptimized: false,
  },
}

module.exports = nextConfig
