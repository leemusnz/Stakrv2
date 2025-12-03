/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Skip linting during builds for faster deployment
  },
  typescript: {
    ignoreBuildErrors: true, // Skip type checking during builds for faster deployment
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
