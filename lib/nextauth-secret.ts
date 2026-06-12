/**
 * Single source of truth for the secret used to sign/verify NextAuth JWTs.
 * Must match everywhere: Route Handler (lib/auth), middleware (getToken), tests.
 *
 * Production servers refuse to run without an explicit secret — a predictable
 * fallback would let anyone mint valid session tokens for any user. The
 * fallback below is reachable only in development/test and during
 * `next build` (which imports route modules but never signs real tokens);
 * runtime enforcement also happens at boot via lib/assert-env.ts.
 */
export function nextAuthSecret(): string {
  const fromEnv =
    process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim()
  if (fromEnv) return fromEnv

  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    throw new Error(
      'NEXTAUTH_SECRET (or AUTH_SECRET) must be set in production — refusing to fall back to a hardcoded development secret.',
    )
  }
  return 'development-secret-change-in-production'
}
