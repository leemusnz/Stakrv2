import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Skip linting during builds for faster deployment
  },
  typescript: {
    ignoreBuildErrors: true, // Skip type checking during builds for faster deployment
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Performance optimizations
  experimental: {
    // Optimize package imports to reduce bundle size and compilation time
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "recharts",
      "framer-motion",
      "react-day-picker",
      "zod",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
    ],
  },

  // Webpack optimizations for faster dev builds
  webpack: (config, { dev }) => {
    if (dev) {
      // Faster file watching on Windows
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    return config
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  // No SENTRY_AUTH_TOKEN required for builds; enable upload later in Sentry project settings.
  sourcemaps: {
    disable: true,
  },
})
