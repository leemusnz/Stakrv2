/**
 * Boot-time environment guard, called from instrumentation.ts register().
 *
 * A production server must crash at startup when security-critical secrets
 * are missing, instead of silently running on hardcoded fallbacks (Phase 0
 * board condition — see docs/audits/2026-06-engineering-review). Development
 * and `next build` are exempt so local work and CI builds run without
 * production secrets.
 */

interface Requirement {
  /** Satisfied when ANY of these variables is set and non-empty. */
  anyOf: string[]
  hint: string
  /** Optional: requirement only applies when this returns true. */
  when?: () => boolean
}

const REQUIRED_IN_PRODUCTION: Requirement[] = [
  {
    anyOf: ['DATABASE_URL'],
    hint: 'Neon Postgres connection string',
  },
  {
    anyOf: ['NEXTAUTH_SECRET', 'AUTH_SECRET'],
    hint: 'secret used to sign session JWTs — without it tokens are forgeable',
  },
  {
    anyOf: ['ENCRYPTION_KEY'],
    hint: '32+ character key for integration-credential encryption',
  },
  {
    anyOf: ['ALPHA_ACCESS_PASSWORD'],
    hint: 'alpha gate access code (or set STAKR_ALPHA_GATE_DISABLED=true to open the app)',
    when: () => process.env.STAKR_ALPHA_GATE_DISABLED !== 'true',
  },
  {
    anyOf: ['STRIPE_WEBHOOK_SECRET'],
    hint: 'Stripe webhook signing secret — required whenever STRIPE_SECRET_KEY is configured',
    when: () => Boolean(process.env.STRIPE_SECRET_KEY),
  },
]

function isSet(name: string): boolean {
  const value = process.env[name]
  return typeof value === 'string' && value.trim().length > 0
}

export function assertRequiredEnv(): void {
  if (process.env.NODE_ENV !== 'production') return
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  const missing = REQUIRED_IN_PRODUCTION.filter(
    (req) => (req.when ? req.when() : true) && !req.anyOf.some(isSet),
  )

  if (missing.length > 0) {
    const lines = missing.map(
      (req) => `  - ${req.anyOf.join(' or ')}: ${req.hint}`,
    )
    throw new Error(
      `Refusing to start in production with missing required environment variables:\n${lines.join('\n')}`,
    )
  }
}
