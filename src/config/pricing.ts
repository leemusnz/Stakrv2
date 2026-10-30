import { feeCents, toCreditCents } from "@/lib/credit-amounts";

export function configuredBps(
  value: unknown,
  env: string,
  fallback: number,
): number {
  const bps =
    value == null ? Number(process.env[env] ?? fallback) : toCreditCents(value);
  if (!Number.isInteger(bps) || bps < 0 || bps > 10000)
    throw new Error("Invalid pricing configuration");
  return bps;
}

export interface StakeParticipant {
  userId: string;
  stakeCents: number;
  completed: boolean;
}
export function settleChallenge(
  participants: StakeParticipant[],
  hostContributionCents: number,
  platformCutBps: number,
) {
  const seen = new Set<string>();
  for (const p of participants) {
    if (
      seen.has(p.userId) ||
      !Number.isSafeInteger(p.stakeCents) ||
      p.stakeCents < 0
    )
      throw new Error("Invalid participants");
    seen.add(p.userId);
  }
  if (!Number.isSafeInteger(hostContributionCents) || hostContributionCents < 0)
    throw new Error("Invalid host contribution");
  const winners = participants
    .filter((p) => p.completed)
    .sort((a, b) => (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0));
  const poolCents = participants
    .filter((p) => !p.completed)
    .reduce((n, p) => n + p.stakeCents, hostContributionCents);
  if (!Number.isSafeInteger(poolCents))
    throw new Error("Pool exceeds safe integer range");
  const cut = feeCents(poolCents, platformCutBps);
  const platformTakeCents = winners.length ? cut : poolCents;
  const shared = poolCents - platformTakeCents;
  const credits = winners.map((p, i) => {
    const bonusCents =
      Math.floor(shared / winners.length) +
      (i < shared % winners.length ? 1 : 0);
    const amountCents = p.stakeCents + bonusCents;
    if (!Number.isSafeInteger(amountCents))
      throw new Error("Reward exceeds safe integer range");
    return {
      userId: p.userId,
      stakeCents: p.stakeCents,
      bonusCents,
      amountCents,
    };
  });
  return { poolCents, platformTakeCents, platformCutBps, credits };
}
