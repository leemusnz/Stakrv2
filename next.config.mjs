import { withSentryConfig } from "@sentry/nextjs"
import securityConfig from "./config/security-headers.cjs"
import turnstileConfig from "./config/turnstile.cjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not advertise the framework.
  poweredByHeader: false,
  headers: securityConfig.headers,

  // Tells the sign-in form whether the human check is on (both keys set), decided once at build
  // time from the same rule the server uses. A yes or no only; no key is exposed.
  env: turnstileConfig.turnstileClientEnv(),

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
