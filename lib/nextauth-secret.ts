/**
 * Single source of truth for the secret used to sign/verify NextAuth JWTs.
 * Must match everywhere: Route Handler (lib/auth), middleware (getToken), tests.
 */
export function nextAuthSecret(): string {
  const fromEnv =
    process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim()
  return fromEnv || "development-secret-change-in-production"
}
