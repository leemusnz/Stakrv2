// Security headers for every response. Kept separate from next.config.mjs so it can be unit-tested.
//
// CSP notes:
//  - 'unsafe-inline' scripts are required by Next.js hydration without a per-request nonce. The
//    policy still blocks every foreign script origin, plugins (object-src), <base> hijacking,
//    framing (frame-ancestors) and cross-origin form posts, which is the bulk of the benefit.
//  - connect-src allows direct browser uploads of evidence to the private S3 bucket and Sentry.
//  - 'unsafe-eval' is development-only (React refresh).

const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.amazonaws.com https://*.ingest.sentry.io https://*.sentry.io" +
    (isDev ? " ws: wss:" : ""),
  "media-src 'self' blob: https://*.amazonaws.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

async function headers() {
  return [
    { source: "/:path*", headers: securityHeaders },
    // The service worker must always be revalidated or updates never reach users.
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ];
}

module.exports = { contentSecurityPolicy, securityHeaders, headers };
