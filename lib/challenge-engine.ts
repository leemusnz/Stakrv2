import { createDbConnection } from "@/lib/db";
import { withTransaction, type TransactionSql } from "@/lib/db/transaction";
import { creditDecimal, toCreditCents } from "@/lib/credit-amounts";
import { configuredBps, settleChallenge } from "@/src/config/pricing";

export class ChallengeError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
export type Policy = {
  requiredDays: number;
  graceSeconds: number;
  appealSeconds: number;
  proofTypes: string[];
};
export function policyOf(c: any): Policy {
  const p = c.lifecycle_policy;
  if (
    c.lifecycle_version !== 1 ||
    !p ||
    !Number.isInteger(p.requiredDays) ||
    p.requiredDays < 1 ||
    !Number.isInteger(p.graceSeconds) ||
    p.graceSeconds < 0 ||
    p.graceSeconds > 604800 ||
    !Number.isInteger(p.appealSeconds) ||
    p.appealSeconds < 3600 ||
    p.appealSeconds > 604800 ||
    !Array.isArray(p.proofTypes) ||
    !p.proofTypes.length ||
    p.proofTypes.some((x: string) => !["text", "photo", "video"].includes(x))
  ) {
    throw new ChallengeError(
      "This challenge needs its rules and historical credits reviewed before processing",
    );
  }
  return p;
}
export async function audit(
  sql: TransactionSql,
  id: string,
  actor: string | null,
  event: string,
  reason: string,
  details: unknown,
) {
  await sql`INSERT INTO challenge_audit_events (challenge_id, actor_id, event_type, reason, details)
    VALUES (${id}, ${actor}, ${event}, ${reason}, ${JSON.stringify(details)}::jsonb)`;
}
export async function enqueue(sql: TransactionSql, id: string) {
  await sql`INSERT INTO challenge_lifecycle_queue (challenge_id) VALUES (${id})
    ON CONFLICT (challenge_id) DO UPDATE SET next_attempt_at = now(), last_error = NULL`;
}
export async function lockedChallenge(sql: TransactionSql, id: string) {
  const rows = await sql`SELECT * FROM challenges WHERE id = ${id} FOR UPDATE`;
  if (!rows[0]) throw new ChallengeError("Challenge not found", 404);
  return rows[0];
}
export async function databaseNow(sql: TransactionSql): Promise<number> {
  return Number(
    (await sql`SELECT extract(epoch FROM clock_timestamp()) * 1000 AS ms`)[0]
      .ms,
  );
}
export function utcTime(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  const s = String(value);
  return Date.parse(
    /[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(" ", "T") + "Z",
  );
}

/** Called only with the challenge lock. Pending proof/appeal keeps the whole pool unsettled. */
export async function evaluateLocked(
  sql: TransactionSql,
  c: any,
  actor: string | null,
) {
  const policy = policyOf(c);
  if (["suspended", "cancelled", "rewards_distributed"].includes(c.status))
    return { ready: false, status: c.status };
  const now = await databaseNow(sql);
  const start = utcTime(c.start_date),
    end = utcTime(c.end_date);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    throw new ChallengeError("Invalid challenge schedule");
  if (now < start) return { ready: false, status: c.status };
  if (c.status === "pending") {
    await sql`UPDATE challenges SET status = 'active', updated_at = now() WHERE id = ${c.id}`;
    await audit(
      sql,
      c.id,
      actor,
      "challenge_started",
      "Scheduled start reached",
      { from: "pending", to: "active" },
    );
    c.status = "active";
  }
  const participants =
    await sql`SELECT * FROM challenge_participants WHERE challenge_id = ${c.id} ORDER BY user_id FOR UPDATE`;
  const proofCounts = await sql`
      SELECT participant_id, count(DISTINCT proof_day) FILTER (WHERE status = 'approved') AS approved,
        count(*) FILTER (WHERE status IN ('pending','pending_review') OR appeal_status = 'pending'
          OR (status = 'rejected' AND appeal_status IS NULL AND coalesce(appeal_deadline_at, reviewed_at + ${policy.appealSeconds} * interval '1 second') > clock_timestamp())) AS pending
      FROM proof_submissions WHERE challenge_id = ${c.id} AND superseded_at IS NULL
        AND proof_day IS NOT NULL AND submitted_at >= ${c.start_date}
        AND proof_day >= (${c.start_date}::timestamp AT TIME ZONE 'UTC')::date
        AND proof_day <= ((${c.end_date}::timestamp - interval '1 microsecond') AT TIME ZONE 'UTC')::date
     GROUP BY participant_id`;
  const countsByParticipant = new Map(
    proofCounts.map((p) => [p.participant_id, p]),
  );
  let holds = false;
  const transitions = [];
  for (const cp of participants) {
    const counts = countsByParticipant.get(cp.id) || {
      approved: 0,
      pending: 0,
    };
    const approved = Number(counts.approved),
      pending = Number(counts.pending);
    const complete = approved >= policy.requiredDays;
    if (pending > 0) holds = true;
    const next = complete
      ? "completed"
      : now >= end + policy.graceSeconds * 1000 && pending === 0
        ? "failed"
        : "active";
    if (next !== cp.completion_status) {
      transitions.push({
        id: cp.id,
        status: next,
        verification: complete ? "approved" : pending ? "pending" : "rejected",
        event: "participant_" + next,
        reason: complete
          ? "Required proof days approved"
          : next === "failed"
            ? "Grace and review windows elapsed without sufficient proof"
            : "Proof review remains open",
        details: {
          participantId: cp.id,
          userId: cp.user_id,
          from: cp.completion_status,
          to: next,
          approvedDays: approved,
          requiredDays: policy.requiredDays,
        },
      });
    }
  }
  if (transitions.length) {
    const payload = JSON.stringify(transitions);
    await sql`UPDATE challenge_participants cp SET completion_status=p.status,verification_status=p.verification,
      completed_at=CASE WHEN p.status='completed' THEN now() ELSE NULL END
      FROM jsonb_to_recordset(${payload}::jsonb) AS p(id uuid,status text,verification text) WHERE cp.id=p.id`;
    await sql`INSERT INTO challenge_audit_events (challenge_id,actor_id,event_type,reason,details)
      SELECT ${c.id},${actor},p.event,p.reason,p.details FROM jsonb_to_recordset(${payload}::jsonb) AS p(event text,reason text,details jsonb)`;
  }
  const ready = now >= end + policy.graceSeconds * 1000 && !holds;
  if (now >= end && c.status !== "ended") {
    await sql`UPDATE challenges SET status = 'ended', updated_at = now() WHERE id = ${c.id}`;
    await audit(
      sql,
      c.id,
      actor,
      "challenge_ended",
      "Scheduled end reached; review and grace rules still apply",
      { from: c.status, to: "ended" },
    );
    c.status = "ended";
  }
  return { ready, status: c.status };
}

async function verifyEscrow(sql: TransactionSql, c: any, participants: any[]) {
  if (c.allow_points_only || c.enable_team_mode)
    throw new ChallengeError("Unsupported legacy reward mode requires review");
  const ledgerRows =
    await sql`SELECT user_id,count(*) FILTER (WHERE transaction_type = 'stake_lock') AS stakes,
    count(*) FILTER (WHERE transaction_type = 'entry_fee') AS fees,
    coalesce(sum(amount) FILTER (WHERE transaction_type = 'stake_lock'),0)::text AS stake,
    coalesce(sum(amount) FILTER (WHERE transaction_type = 'entry_fee'),0)::text AS fee
    FROM credit_transactions WHERE related_challenge_id = ${c.id} GROUP BY user_id`;
  const byUser = new Map(ledgerRows.map((row) => [row.user_id, row]));
  for (const cp of participants) {
    if (
      cp.insurance_purchased ||
      toCreditCents(cp.insurance_fee_paid ?? "0") > 0
    )
      throw new ChallengeError("Legacy insurance requires review");
    const rows = byUser.get(cp.user_id) || {
      stakes: 0,
      fees: 0,
      stake: "0",
      fee: "0",
    };
    if (
      Number(rows.stakes) !== 1 ||
      Number(rows.fees) !== 1 ||
      rows.stake !== creditDecimal(-toCreditCents(cp.stake_amount)) ||
      rows.fee !== creditDecimal(-toCreditCents(cp.entry_fee_paid))
    ) {
      throw new ChallengeError(
        "Stake ledger does not reconcile; financial review required",
      );
    }
  }
  const hostCents = toCreditCents(c.host_contribution);
  const funding =
    await sql`SELECT * FROM challenge_funding WHERE challenge_id = ${c.id}`;
  if (
    hostCents &&
    (!funding[0] ||
      Number(funding[0].amount_cents) !== hostCents ||
      funding[0].user_id !== c.host_id)
  ) {
    throw new ChallengeError("Host contribution is not funded");
  }
  const ledger = (
    await sql`SELECT count(*) AS count,coalesce(sum(amount),0)::text AS amount FROM credit_transactions
    WHERE related_challenge_id=${c.id} AND user_id=${c.host_id} AND transaction_type='host_contribution'`
  )[0];
  if (
    Number(ledger.count) !== (hostCents ? 1 : 0) ||
    Math.round(Number(ledger.amount) * 100) !== -hostCents
  ) {
    throw new ChallengeError("Host contribution ledger does not reconcile");
  }
  return hostCents;
}
async function credit(
  sql: TransactionSql,
  user: string,
  id: string,
  cents: number,
  type: string,
  reason: string,
) {
  if (!cents) return;
  const updated =
    await sql`UPDATE users SET credits = credits + ${creditDecimal(cents)}, updated_at = now() WHERE id = ${user} RETURNING id`;
  if (!updated.length) throw new ChallengeError("Credit recipient missing");
  await sql`INSERT INTO credit_transactions (user_id, amount, transaction_type, related_challenge_id, description, created_at)
    VALUES (${user}, ${creditDecimal(cents)}, ${type}, ${id}, ${reason}, now())`;
}
async function settleLocked(sql: TransactionSql, c: any, actor: string | null) {
  const participants =
    await sql`SELECT * FROM challenge_participants WHERE challenge_id = ${c.id} ORDER BY user_id FOR UPDATE`;
  if (
    participants.some(
      (p) => !["completed", "failed"].includes(p.completion_status),
    )
  )
    throw new ChallengeError("Participant outcomes remain unresolved");
  const hostCents = await verifyEscrow(sql, c, participants);
  const plan = settleChallenge(
    participants.map((p) => ({
      userId: p.user_id,
      stakeCents: toCreditCents(p.stake_amount),
      completed: p.completion_status === "completed",
    })),
    hostCents,
    configuredBps(c.failed_stake_cut, "STAKR_PLATFORM_CUT_BPS", 2000),
  );
  const entryFeeCents = participants.reduce(
    (n, p) => n + toCreditCents(p.entry_fee_paid),
    0,
  );
  const snapshot = {
    ...plan,
    entryFeeCents,
    policy: policyOf(c),
    participants: participants.map((p) => ({
      userId: p.user_id,
      status: p.completion_status,
      stakeCents: toCreditCents(p.stake_amount),
    })),
  };
  // Row lock + unique settlement record: duplicate and concurrent workers cannot pay twice.
  await sql`INSERT INTO challenge_settlement_records (challenge_id, kind, snapshot) VALUES (${c.id}, 'settlement', ${JSON.stringify(snapshot)}::jsonb)`;
  const payout = JSON.stringify(
    plan.credits.map((r) => ({
      user_id: r.userId,
      amount: creditDecimal(r.amountCents),
    })),
  );
  // Bulk writes keep a large pool within the serverless execution budget.
  await sql`SELECT id FROM users WHERE id IN (SELECT user_id FROM jsonb_to_recordset(${payout}::jsonb) AS p(user_id uuid,amount numeric)) ORDER BY id FOR UPDATE`;
  const paid =
    await sql`UPDATE users u SET credits=u.credits+p.amount,updated_at=now()
    FROM jsonb_to_recordset(${payout}::jsonb) AS p(user_id uuid,amount numeric) WHERE u.id=p.user_id RETURNING u.id`;
  if (paid.length !== plan.credits.length)
    throw new ChallengeError("Credit recipient missing");
  await sql`INSERT INTO credit_transactions (user_id,amount,transaction_type,related_challenge_id,description,created_at)
    SELECT p.user_id,p.amount,'challenge_reward',${c.id},${"Stake returned plus equal share of failed stakes: " + c.title},now()
    FROM jsonb_to_recordset(${payout}::jsonb) AS p(user_id uuid,amount numeric)`;
  await sql`UPDATE challenge_participants cp SET reward_earned=p.amount
    FROM jsonb_to_recordset(${payout}::jsonb) AS p(user_id uuid,amount numeric) WHERE cp.challenge_id=${c.id} AND cp.user_id=p.user_id`;
  await sql`INSERT INTO notifications (user_id,type,title,message,action_url,metadata,read,created_at)
    SELECT user_id,'challenge','Challenge settled',CASE WHEN completion_status='completed'
      THEN 'Your stake and reward have been returned. View your credit history.'
      ELSE 'Challenge ended without sufficient approved proof. Your stake was allocated under the published rules.' END,
      ${"/challenge/" + c.id},'{}'::jsonb,false,now() FROM challenge_participants WHERE challenge_id=${c.id}`;
  await sql`INSERT INTO challenge_platform_ledger (challenge_id, amount_cents, reason) VALUES (${c.id}, ${plan.platformTakeCents + entryFeeCents}, 'Settlement fees and failed-stakes share')`;
  await sql`UPDATE challenges SET status = 'rewards_distributed', updated_at = now() WHERE id = ${c.id}`;
  await audit(
    sql,
    c.id,
    actor,
    "challenge_settled",
    "All review windows closed; deterministic credits distribution",
    snapshot,
  );
  await sql`DELETE FROM challenge_lifecycle_queue WHERE challenge_id = ${c.id}`;
  return snapshot;
}
export async function processChallenge(
  id: string,
  actor: string | null = null,
  reason?: string,
) {
  return withTransaction(async (sql) => {
    const c = await lockedChallenge(sql, id);
    const existing =
      await sql`SELECT kind, snapshot FROM challenge_settlement_records WHERE challenge_id = ${id}`;
    if (existing[0])
      return {
        status: c.status,
        settled: existing[0].kind === "settlement",
        result: existing[0].snapshot,
      };
    if (actor)
      await audit(
        sql,
        id,
        actor,
        "processing_requested",
        reason || "Admin requested lifecycle evaluation",
        {},
      );
    const outcome = await evaluateLocked(sql, c, actor);
    if (!outcome.ready) return { ...outcome, settled: false };
    return {
      status: "rewards_distributed",
      settled: true,
      result: await settleLocked(sql, c, actor),
    };
  });
}
export async function administerChallenge(
  id: string,
  actor: string,
  action: string,
  reason: string,
  preset?: string,
) {
  if (!reason?.trim() || reason.length > 2000)
    throw new ChallengeError("Provide a reason (1–2000 characters)", 400);
  return withTransaction(async (sql) => {
    const c = await lockedChallenge(sql, id);
    policyOf(c);
    if (action === "suspend") {
      if (c.status === "suspended") return { status: c.status };
      if (!["pending", "active", "ended"].includes(c.status))
        throw new ChallengeError("Challenge cannot be suspended");
      const at = await databaseNow(sql);
      const resumeStatus =
        c.status === "pending" && at >= utcTime(c.start_date)
          ? at >= utcTime(c.end_date)
            ? "ended"
            : "active"
          : c.status;
      await sql`UPDATE challenges SET resume_status = ${resumeStatus}, status = 'suspended', suspended_at = clock_timestamp(), updated_at = now() WHERE id = ${id}`;
      await audit(sql, id, actor, "challenge_suspended", reason, {
        from: c.status,
        to: "suspended",
      });
      return { status: "suspended" };
    }
    if (action === "resume") {
      if (c.status !== "suspended") return { status: c.status };
      const elapsed =
        ((await databaseNow(sql)) - utcTime(c.suspended_at)) / 1000;
      if (
        !Number.isFinite(elapsed) ||
        elapsed < 0 ||
        !["pending", "active", "ended"].includes(c.resume_status)
      )
        throw new ChallengeError("Invalid suspension record");
      // Preserve elapsed time and appeal opportunities. Evidence dates remain unchanged.
      await sql`UPDATE challenges SET
        start_date = start_date + CASE WHEN resume_status = 'pending' THEN ${elapsed} * interval '1 second' ELSE interval '0 seconds' END,
        end_date = end_date + ${elapsed} * interval '1 second', paused_seconds = paused_seconds + ${elapsed},
        status = resume_status, resume_status = NULL, suspended_at = NULL, updated_at = now() WHERE id = ${id}`;
      await sql`UPDATE proof_submissions SET appeal_deadline_at = appeal_deadline_at + ${elapsed} * interval '1 second'
        WHERE challenge_id = ${id} AND status = 'rejected' AND appeal_status IS NULL AND appeal_deadline_at > ${c.suspended_at}`;
      await audit(sql, id, actor, "challenge_resumed", reason, {
        elapsedSeconds: elapsed,
        to: c.resume_status,
      });
      await enqueue(sql, id);
      return { status: c.resume_status };
    }
    if (
      action !== "cancel" ||
      !["refund_all", "refund_participants", "refund_none"].includes(
        preset ?? "",
      )
    )
      throw new ChallengeError("Choose a valid cancellation preset", 400);
    const existing =
      await sql`SELECT kind, snapshot FROM challenge_settlement_records WHERE challenge_id = ${id}`;
    if (existing[0]) {
      if (
        existing[0].kind === "cancellation" &&
        existing[0].snapshot.preset === preset
      )
        return { status: "cancelled", result: existing[0].snapshot };
      throw new ChallengeError("Challenge has already been financially closed");
    }
    const participants =
      await sql`SELECT * FROM challenge_participants WHERE challenge_id = ${id} ORDER BY user_id FOR UPDATE`;
    const hostCents = await verifyEscrow(sql, c, participants);
    const recipients = [
      ...new Set([
        ...participants.map((p) => String(p.user_id)),
        ...(hostCents ? [String(c.host_id)] : []),
      ]),
    ].sort();
    await sql`SELECT id FROM users WHERE id = ANY(${recipients}::uuid[]) ORDER BY id FOR UPDATE`;
    let platformCents = 0;
    const transfers = [];
    for (const p of participants) {
      const stake = toCreditCents(p.stake_amount),
        fee = toCreditCents(p.entry_fee_paid);
      const refund =
        preset === "refund_all"
          ? stake + fee
          : preset === "refund_participants"
            ? stake
            : 0;
      platformCents += stake + fee - refund;
      transfers.push({ userId: p.user_id, amountCents: refund });
    }
    const refunds = JSON.stringify(
      transfers.map((t) => ({
        user_id: t.userId,
        amount: creditDecimal(t.amountCents),
      })),
    );
    await sql`UPDATE users u SET credits=u.credits+p.amount,updated_at=now()
      FROM jsonb_to_recordset(${refunds}::jsonb) AS p(user_id uuid,amount numeric) WHERE u.id=p.user_id AND p.amount>0`;
    await sql`INSERT INTO credit_transactions (user_id,amount,transaction_type,related_challenge_id,description,created_at)
      SELECT p.user_id,p.amount,'challenge_refund',${id},${reason},now()
      FROM jsonb_to_recordset(${refunds}::jsonb) AS p(user_id uuid,amount numeric) WHERE p.amount>0`;
    await sql`UPDATE challenge_participants cp SET completion_status='cancelled',reward_earned=p.amount
      FROM jsonb_to_recordset(${refunds}::jsonb) AS p(user_id uuid,amount numeric) WHERE cp.challenge_id=${id} AND cp.user_id=p.user_id`;
    await sql`INSERT INTO notifications (user_id,type,title,message,action_url,metadata,read,created_at)
      SELECT p.user_id,'challenge','Challenge cancelled',${reason} || '. Refund: ' || p.amount::text || ' credits.',
        ${"/challenge/" + id},'{}'::jsonb,false,now() FROM jsonb_to_recordset(${refunds}::jsonb) AS p(user_id uuid,amount numeric)`;
    if (preset === "refund_all")
      await credit(sql, c.host_id, id, hostCents, "host_refund", reason);
    else platformCents += hostCents;
    const snapshot = {
      preset,
      transfers,
      hostRefundCents: preset === "refund_all" ? hostCents : 0,
      platformCents,
    };
    await sql`INSERT INTO challenge_settlement_records (challenge_id,kind,snapshot) VALUES (${id},'cancellation',${JSON.stringify(snapshot)}::jsonb)`;
    await sql`INSERT INTO challenge_platform_ledger (challenge_id,amount_cents,reason) VALUES (${id},${platformCents},${reason})`;
    await sql`UPDATE challenges SET status='cancelled', updated_at=now() WHERE id=${id}`;
    await audit(sql, id, actor, "challenge_cancelled", reason, snapshot);
    await sql`DELETE FROM challenge_lifecycle_queue WHERE challenge_id=${id}`;
    return { status: "cancelled", result: snapshot };
  });
}
export async function runLifecycleBatch() {
  const sql = createDbConnection();
  const due =
    await sql`SELECT c.id FROM challenges c LEFT JOIN challenge_lifecycle_queue q ON q.challenge_id=c.id
    WHERE c.lifecycle_version=1 AND c.status IN ('pending','active','ended')
      AND (q.next_attempt_at IS NULL OR q.next_attempt_at <= now())
      AND (c.start_date <= now() OR q.challenge_id IS NOT NULL)
    ORDER BY coalesce(q.next_attempt_at, c.end_date), c.id LIMIT 3`;
  const results = [];
  const deadline = Date.now() + 40000;
  for (const row of due) {
    if (Date.now() >= deadline) break;
    try {
      const result = await processChallenge(row.id);
      if (!result.settled)
        await sql`INSERT INTO challenge_lifecycle_queue (challenge_id,next_attempt_at) VALUES (${row.id},now()+interval '5 minutes')
        ON CONFLICT (challenge_id) DO UPDATE SET next_attempt_at=now()+interval '5 minutes', last_error=NULL`;
      results.push({ id: row.id, status: result.status });
    } catch {
      await sql`INSERT INTO challenge_lifecycle_queue (challenge_id,next_attempt_at,attempts,last_error)
        VALUES (${row.id},now()+interval '15 minutes',1,'processing_failed')
        ON CONFLICT (challenge_id) DO UPDATE SET attempts=challenge_lifecycle_queue.attempts+1,next_attempt_at=now()+interval '15 minutes',last_error='processing_failed'`;
      results.push({ id: row.id, status: "needs_review" });
    }
  }
  return results;
}
