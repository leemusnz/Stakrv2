import { z } from "zod";
import { withTransaction } from "@/lib/db/transaction";
import {
  audit,
  ChallengeError,
  databaseNow,
  enqueue,
} from "@/lib/challenge-engine";
import { creditDecimal, toCreditCents } from "@/lib/credit-amounts";
import { configuredBps } from "@/src/config/pricing";

const amount = z
  .number()
  .finite()
  .min(0)
  .max(999999.99)
  .refine(
    (n) =>
      Number.isInteger(Math.round(n * 100)) &&
      Math.abs(n * 100 - Math.round(n * 100)) < 0.000001,
    "Use at most two decimal places",
  );
export const createChallengeInput = z.object({
  requestId: z.string().uuid(),
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(20).max(5000),
  category: z.enum(["fitness", "habit", "skill", "wellness", "productivity"]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
  requiredDays: z.number().int().min(1).max(365),
  graceHours: z.number().int().min(0).max(168).default(24),
  minStake: amount.refine((n) => n > 0),
  maxStake: amount.refine((n) => n > 0),
  hostContribution: amount.default(0),
  maxParticipants: z.number().int().min(1).max(500).default(100),
  proofTypes: z
    .array(z.enum(["text", "photo", "video"]))
    .min(1)
    .max(3),
  proofInstructions: z.string().trim().min(20).max(5000),
  rules: z.array(z.string().trim().min(5).max(500)).min(1).max(20),
});

export async function createChallenge(
  user: string,
  data: z.infer<typeof createChallengeInput>,
) {
  return withTransaction(async (sql) => {
    const users =
      await sql`SELECT id,credits FROM users WHERE id=${user} FOR UPDATE`;
    if (!users[0]) throw new ChallengeError("User not found", 404);
    const existing =
      await sql`SELECT *,create_request_terms=${JSON.stringify(data)}::jsonb AS same_terms FROM challenges WHERE host_id=${user} AND create_request_key=${data.requestId}`;
    if (existing[0]) {
      if (!existing[0].same_terms)
        throw new ChallengeError(
          "Request key already used for different challenge terms",
        );
      return existing[0];
    }
    const start = Date.parse(data.startDate),
      end = Date.parse(data.endDate),
      now = await databaseNow(sql);
    // UTC midnights make the daily requirement and deadline unambiguous.
    if (
      start % 86400000 !== 0 ||
      end % 86400000 !== 0 ||
      start <= now ||
      end <= start ||
      end - start > 365 * 86400000
    )
      throw new ChallengeError(
        "Use future UTC midnight boundaries and a duration of 1–365 days",
        400,
      );
    if (
      data.requiredDays > (end - start) / 86400000 ||
      data.maxStake < data.minStake
    )
      throw new ChallengeError(
        "Required days and stake limits must fit the challenge",
        400,
      );
    const min = toCreditCents(data.minStake),
      max = toCreditCents(data.maxStake),
      host = toCreditCents(data.hostContribution);
    const feeBps = configuredBps(null, "STAKR_ENTRY_FEE_BPS", 500),
      cutBps = configuredBps(null, "STAKR_PLATFORM_CUT_BPS", 2000);
    const policy = {
      requiredDays: data.requiredDays,
      graceSeconds: data.graceHours * 3600,
      appealSeconds: 86400,
      proofTypes: [...new Set(data.proofTypes)],
    };
    const c = (
      await sql`INSERT INTO challenges
      (create_request_key,create_request_terms,title,description,category,duration,difficulty,min_stake,max_stake,host_id,host_contribution,entry_fee_percentage,failed_stake_cut,start_date,end_date,status,
       verification_type,proof_requirements,rules,allow_points_only,enable_team_mode,max_participants,privacy_type,lifecycle_version,lifecycle_policy)
      VALUES (${data.requestId},${JSON.stringify(data)}::jsonb,${data.title},${data.description},${data.category},${String((end - start) / 86400000) + " days"},${data.difficulty},${creditDecimal(min)},${creditDecimal(max)},${user},${creditDecimal(host)},
        ${creditDecimal(feeBps)},${creditDecimal(cutBps)},${data.startDate},${data.endDate},'pending','manual',
        ${JSON.stringify({ currency: "CREDITS", description: data.proofInstructions })}::jsonb,${data.rules},false,false,${data.maxParticipants},'public',1,${JSON.stringify(policy)}::jsonb) RETURNING *`
    )[0];
    if (host > 0) {
      if (!users[0] || toCreditCents(users[0].credits) < host)
        throw new ChallengeError(
          "Insufficient credits to fund the host contribution",
          400,
        );
      await sql`UPDATE users SET credits=credits-${creditDecimal(host)},updated_at=now() WHERE id=${user}`;
      await sql`INSERT INTO credit_transactions (user_id,amount,transaction_type,related_challenge_id,description,created_at)
        VALUES (${user},${creditDecimal(-host)},'host_contribution',${c.id},'Funded host contribution',now())`;
      await sql`INSERT INTO challenge_funding (challenge_id,user_id,amount_cents) VALUES (${c.id},${user},${host})`;
    }
    await audit(
      sql,
      c.id,
      user,
      "challenge_created",
      "Challenge rules published",
      { policy, feeBps, cutBps, hostCents: host },
    );
    await enqueue(sql, c.id);
    return c;
  });
}
