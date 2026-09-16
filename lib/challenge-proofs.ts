import { z } from "zod";
import { createDbConnection } from "@/lib/db";
import { withTransaction } from "@/lib/db/transaction";
import {
  audit,
  ChallengeError,
  databaseNow,
  enqueue,
  lockedChallenge,
  policyOf,
  utcTime,
} from "@/lib/challenge-engine";

export const proofInput = z.object({
  submission_type: z.literal("manual").default("manual"),
  submission_key: z.string().uuid(),
  proof_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  proof_type: z.enum(["text", "photo", "video"]),
  proof_data: z.object({
    text: z.string().max(10000).optional(),
    file_key: z.string().max(1000).optional(),
  }),
  notes: z.string().max(2000).default(""),
});
export async function submitProof(
  id: string,
  user: string,
  input: z.infer<typeof proofInput>,
) {
  return withTransaction(async (sql) => {
    const c = await lockedChallenge(sql, id);
    const policy = policyOf(c);
    const duplicate =
      await sql`SELECT * FROM proof_submissions WHERE user_id=${user} AND submission_key=${input.submission_key}`;
    if (duplicate[0]) {
      if (duplicate[0].challenge_id !== id)
        throw new ChallengeError("Submission key already used");
      return duplicate[0];
    }
    if (!["pending", "active", "ended"].includes(c.status))
      throw new ChallengeError("Proof submission is closed");
    const now = await databaseNow(sql),
      start = utcTime(c.start_date),
      end = utcTime(c.end_date);
    if (now < start || now >= end + policy.graceSeconds * 1000)
      throw new ChallengeError("Outside the proof submission window");
    const day = Date.parse(input.proof_day + "T00:00:00Z");
    if (
      !Number.isFinite(day) ||
      new Date(day).toISOString().slice(0, 10) !== input.proof_day ||
      day + 86400000 <= start ||
      day >= end ||
      day > now
    )
      throw new ChallengeError(
        "Proof day must fall within the challenge and cannot be in the future",
        400,
      );
    if (!policy.proofTypes.includes(input.proof_type))
      throw new ChallengeError("This proof type is not allowed", 400);
    const participants =
      await sql`SELECT * FROM challenge_participants WHERE challenge_id=${id} AND user_id=${user} FOR UPDATE`;
    const cp = participants[0];
    if (!cp || cp.completion_status === "cancelled")
      throw new ChallengeError(
        "Join this challenge before submitting proof",
        403,
      );
    const current =
      await sql`SELECT * FROM proof_submissions WHERE participant_id=${cp.id} AND proof_day=${input.proof_day}::date AND superseded_at IS NULL FOR UPDATE`;
    if (
      current[0] &&
      (current[0].status !== "rejected" ||
        current[0].appeal_status === "pending")
    )
      throw new ChallengeError(
        "A proof for this day is already awaiting review or approved",
      );
    let content = input.proof_data.text?.trim() || "";
    let key: string | null = null;
    if (input.proof_type === "text") {
      if (content.length < 10)
        throw new ChallengeError(
          "Describe your evidence in at least 10 characters",
          400,
        );
    } else {
      key = input.proof_data.file_key ?? null;
      const uploads =
        await sql`SELECT * FROM proof_uploads WHERE file_key=${key} AND user_id=${user} AND challenge_id=${id}`;
      if (
        !uploads[0] ||
        !(input.proof_type === "photo"
          ? uploads[0].content_type.startsWith("image/")
          : uploads[0].content_type.startsWith("video/"))
      )
        throw new ChallengeError(
          "Upload and confirm your own evidence file first",
          400,
        );
      content = key!;
    }
    if (current[0])
      await sql`UPDATE proof_submissions SET superseded_at=now() WHERE id=${current[0].id}`;
    const proof = (
      await sql`INSERT INTO proof_submissions
      (participant_id,challenge_id,user_id,submission_type,proof_type,proof_content,text_content,file_url,metadata,status,submitted_at,proof_day,submission_key)
      VALUES (${cp.id},${id},${user},'manual',${input.proof_type === "photo" ? "image" : input.proof_type},${content},${input.proof_type === "text" ? content : null},
        ${key},${JSON.stringify({ notes: input.notes, proofType: input.proof_type })}::jsonb,'pending_review',clock_timestamp(),${input.proof_day}::date,${input.submission_key}) RETURNING *`
    )[0];
    await sql`UPDATE challenge_participants SET proof_submitted=true,verification_status='pending' WHERE id=${cp.id}`;
    await audit(
      sql,
      id,
      user,
      "proof_submitted",
      "Evidence queued for neutral review",
      {
        proofId: proof.id,
        participantId: cp.id,
        proofDay: input.proof_day,
        replaces: current[0]?.id ?? null,
      },
    );
    await enqueue(sql, id);
    return proof;
  });
}
export async function reviewProof(
  proofId: string,
  actor: string,
  decision: "approved" | "rejected",
  reason: string,
  appeal = false,
) {
  if (!reason?.trim() || reason.length > 2000)
    throw new ChallengeError(
      "Provide a review reason (1–2000 characters)",
      400,
    );
  const db = createDbConnection();
  const ref = (
    await db`SELECT challenge_id FROM proof_submissions WHERE id=${proofId}`
  )[0];
  if (!ref) throw new ChallengeError("Proof not found", 404);
  return withTransaction(async (sql) => {
    const c = await lockedChallenge(sql, ref.challenge_id);
    const policy = policyOf(c);
    if (["suspended", "cancelled", "rewards_distributed"].includes(c.status))
      throw new ChallengeError(
        "Reviews are closed or suspended for this challenge",
      );
    const peers =
      await sql`SELECT id FROM challenge_participants WHERE challenge_id=${c.id} AND user_id=${actor}`;
    if (c.host_id === actor || peers.length)
      throw new ChallengeError(
        "The host and participants cannot review this challenge",
        403,
      );
    const proof = (
      await sql`SELECT * FROM proof_submissions WHERE id=${proofId} FOR UPDATE`
    )[0];
    if (proof.superseded_at)
      throw new ChallengeError("This proof has been replaced");
    if (appeal) {
      if (proof.appeal_status === decision) return proof;
      if (proof.appeal_status !== "pending")
        throw new ChallengeError("No appeal awaiting review");
      if (proof.reviewed_by === actor)
        throw new ChallengeError(
          "An appeal needs a different neutral reviewer",
          403,
        );
    } else {
      if (proof.status === decision) return proof;
      if (!["pending", "pending_review"].includes(proof.status))
        throw new ChallengeError(
          "Use the appeal workflow to change a final proof decision",
        );
    }
    const updated = (
      await sql`UPDATE proof_submissions SET status=${decision},admin_notes=${reason},reviewed_by=${actor},reviewed_at=clock_timestamp(),
      appeal_deadline_at=clock_timestamp()+${policy.appealSeconds}*interval '1 second',
      appeal_status=CASE WHEN ${appeal} THEN ${decision} ELSE appeal_status END WHERE id=${proofId} RETURNING *`
    )[0];
    await audit(
      sql,
      c.id,
      actor,
      appeal ? "appeal_reviewed" : "proof_reviewed",
      reason,
      { proofId, from: proof.status, to: decision },
    );
    await sql`INSERT INTO notifications (user_id,type,title,message,action_url,metadata,read,created_at)
      VALUES (${proof.user_id},'verification',${appeal ? "Appeal reviewed" : "Proof reviewed"},${decision + ": " + reason},${"/challenge/" + c.id},'{}'::jsonb,false,now())`;
    await enqueue(sql, c.id);
    return updated;
  });
}
export async function appealProof(
  proofId: string,
  user: string,
  reason: string,
) {
  if (!reason?.trim() || reason.length > 4000)
    throw new ChallengeError(
      "Provide an appeal reason (1–4000 characters)",
      400,
    );
  const db = createDbConnection();
  const ref = (
    await db`SELECT challenge_id FROM proof_submissions WHERE id=${proofId} AND user_id=${user}`
  )[0];
  if (!ref) throw new ChallengeError("Proof not found", 404);
  return withTransaction(async (sql) => {
    const c = await lockedChallenge(sql, ref.challenge_id);
    policyOf(c);
    if (["cancelled", "rewards_distributed", "suspended"].includes(c.status))
      throw new ChallengeError("Appeals are closed or suspended");
    const proof = (
      await sql`SELECT * FROM proof_submissions WHERE id=${proofId} AND user_id=${user} FOR UPDATE`
    )[0];
    if (proof.appeal_status === "pending") return proof;
    if (
      proof.status !== "rejected" ||
      proof.superseded_at ||
      proof.appeal_status ||
      !Number.isFinite(utcTime(proof.appeal_deadline_at)) ||
      utcTime(proof.appeal_deadline_at) <= (await databaseNow(sql))
    )
      throw new ChallengeError("This proof is not eligible for an appeal");
    const updated = (
      await sql`UPDATE proof_submissions SET appeal_status='pending',appeal_reason=${reason},appealed_at=now() WHERE id=${proofId} RETURNING *`
    )[0];
    await audit(sql, c.id, user, "appeal_submitted", reason, { proofId });
    await enqueue(sql, c.id);
    return updated;
  });
}
