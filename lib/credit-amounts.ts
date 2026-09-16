/** Convert PostgreSQL decimal strings or API numbers without floating-point rounding. */
export function toCreditCents(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Invalid credit amount')
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value))
  if (!match) throw new Error('Credit amounts must be non-negative with at most two decimal places')
  const cents = BigInt(match[1]) * BigInt(100) + BigInt((match[2] || '').padEnd(2, '0'))
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Credit amount is too large')
  return Number(cents)
}

export function creditDecimal(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error('Invalid integer credit amount')
  const absolute = Math.abs(cents)
  return `${cents < 0 ? '-' : ''}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`
}

export function entryFeeBps(percentage: unknown): number {
  // A database override of zero is intentional. Null uses the configured default.
  const bps = percentage == null
    ? Number(process.env.STAKR_ENTRY_FEE_BPS ?? '500')
    : toCreditCents(percentage)
  if (!Number.isInteger(bps) || bps < 0 || bps > 10000) throw new Error('Invalid entry fee configuration')
  return bps
}

export function feeCents(stakeCents: number, bps: number): number {
  if (!Number.isSafeInteger(stakeCents) || stakeCents < 0 || !Number.isInteger(bps) || bps < 0 || bps > 10000) {
    throw new Error('Invalid fee inputs')
  }
  return Number(BigInt(stakeCents) * BigInt(bps) / BigInt(10000))
}
