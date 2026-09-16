"use client";

import { useRef, useState } from "react";
import {
  api,
  button,
  field,
  LoadState,
  Message,
  money,
  panel,
  Shell,
  useResource,
  utc,
} from "./shell";
import { creditDecimal, feeCents, toCreditCents } from "@/lib/credit-amounts";

export function EvidenceLink({ id }: { id: string }) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <span className="block space-y-2">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-700 underline"
        >
          Open private evidence (link expires in five minutes)
        </a>
      ) : (
        <button
          type="button"
          disabled={busy}
          className="text-orange-700 underline"
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              setUrl((await api("/api/proofs/" + id + "/file")).url);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Loading evidence…" : "View evidence"}
        </button>
      )}
      <Message error={error} />
    </span>
  );
}

function ProofHistory({ id, paused }: { id: string; paused: boolean }) {
  const r = useResource("/api/challenges/" + id + "/checkins");
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  return (
    <section className={panel + " space-y-4"}>
      <h2 className="text-2xl font-bold">Your evidence & appeals</h2>
      <LoadState {...r} retry={r.refresh} />
      <Message error={error} message={message} />
      {r.data?.checkins.length === 0 && <p>No proof submitted yet.</p>}
      {r.data?.checkins.map((p: any) => (
        <article
          key={p.id}
          className="space-y-3 rounded-xl border border-slate-200 p-4"
        >
          <h3 className="font-bold">
            {String(p.proof_day).slice(0, 10)} · {p.status.replaceAll("_", " ")}
          </h3>
          {p.text_content && (
            <p className="whitespace-pre-wrap break-words">{p.text_content}</p>
          )}
          {p.file_url && <EvidenceLink id={p.id} />}
          {p.admin_notes && <p>Reviewer: {p.admin_notes}</p>}
          {p.appeal_status && <p>Appeal: {p.appeal_status}</p>}
          {p.status === "rejected" && !p.appeal_status && (
            <>
              <p className="text-sm">
                Appeal deadline: {utc(p.appeal_deadline_at)}
              </p>
              {!paused &&
                new Date(p.appeal_deadline_at).getTime() > Date.now() && (
                  <form
                    className="space-y-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const reason = String(
                        new FormData(e.currentTarget).get("reason"),
                      );
                      setBusy(p.id);
                      setError("");
                      setMessage("");
                      try {
                        await api("/api/user/appeals", {
                          verificationId: p.id,
                          appealReason: reason,
                        });
                        setMessage(
                          "Appeal saved for a different neutral reviewer.",
                        );
                        r.refresh();
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    <label className="block">
                      Why should this decision be reconsidered?
                      <textarea
                        name="reason"
                        required
                        minLength={1}
                        maxLength={4000}
                        className={field}
                      />
                    </label>
                    <button disabled={!!busy} className={button}>
                      {busy === p.id ? "Saving…" : "Submit appeal"}
                    </button>
                  </form>
                )}
            </>
          )}
        </article>
      ))}
    </section>
  );
}

function ProofForm({ c, onSaved }: { c: any; onSaved: () => void }) {
  const [type, setType] = useState(c.lifecycle_policy.proofTypes[0]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  // Retain the key and confirmed upload across network retries of the same submission.
  const attempt = useRef<{
    signature: string;
    key: string;
    fileKey?: string;
  } | null>(null);
  const endDay = new Date(new Date(c.end_date).getTime() - 1)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <section className={panel}>
      <h2 className="mb-4 text-2xl font-bold">Submit your daily proof</h2>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            data = new FormData(form),
            file = data.get("file") as File | null;
          const signature = JSON.stringify([
            data.get("day"),
            type,
            data.get("text"),
            file?.name,
            file?.size,
            file?.lastModified,
          ]);
          if (!attempt.current || attempt.current.signature !== signature)
            attempt.current = { signature, key: crypto.randomUUID() };
          const current = attempt.current;
          setBusy(true);
          setError("");
          setMessage("");
          try {
            if (type !== "text" && !current.fileKey) {
              if (!file?.size) throw new Error("Choose an evidence file.");
              const { uploadFile, validateFileForUpload } =
                await import("@/lib/file-upload");
              const check = validateFileForUpload(file);
              if (!check.valid) throw new Error(check.error);
              const result = await uploadFile(file, { challengeId: c.id });
              if (!result.success) throw new Error(result.error);
              current.fileKey = result.fileKey;
            }
            await api("/api/challenges/" + c.id + "/checkins", {
              submission_type: "manual",
              submission_key: current.key,
              proof_day: data.get("day"),
              proof_type: type,
              proof_data: {
                text: String(data.get("text") || ""),
                file_key: current.fileKey,
              },
            });
            attempt.current = null;
            form.reset();
            setMessage("Proof saved. It is awaiting neutral review.");
            onSaved();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-slate-600">{c.proof_requirements?.description}</p>
        <label className="block">
          Proof day (UTC)
          <input
            name="day"
            type="date"
            required
            min={String(c.start_date).slice(0, 10)}
            max={endDay < today ? endDay : today}
            defaultValue={endDay < today ? endDay : today}
            className={field}
          />
        </label>
        <label className="block">
          Evidence type
          <select
            className={field}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {c.lifecycle_policy.proofTypes.map((t: string) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {type === "text" ? (
          <label className="block">
            Describe your evidence
            <textarea
              name="text"
              required
              minLength={10}
              maxLength={10000}
              rows={5}
              className={field}
            />
          </label>
        ) : (
          <label className="block">
            Evidence file (maximum 10 MB)
            <input
              key={type}
              name="file"
              type="file"
              required
              accept={
                type === "photo"
                  ? "image/jpeg,image/png,image/webp"
                  : "video/mp4,video/quicktime,video/webm"
              }
              className={field}
            />
          </label>
        )}
        <Message error={error} message={message} />
        <button className={button} disabled={busy}>
          {busy ? "Saving evidence…" : "Save proof for review"}
        </button>
      </form>
    </section>
  );
}

function JoinForm({ c, onJoined }: { c: any; onJoined: () => void }) {
  const [stake, setStake] = useState(String(c.min_stake)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  let fee = 0,
    total = 0;
  try {
    const cents = toCreditCents(stake);
    fee = feeCents(cents, toCreditCents(c.entry_fee_percentage));
    total = cents + fee;
  } catch {
    /* Invalid input is shown by the form and server. */
  }
  return (
    <section className={panel + " space-y-4"}>
      <h2 className="text-2xl font-bold">Back your commitment</h2>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api("/api/challenges/" + c.id + "/join", {
              stakeAmount: Number(stake),
              pointsOnly: false,
              insurancePurchased: false,
            });
            onJoined();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block">
          Stake (credits)
          <input
            className={field}
            type="number"
            step="0.01"
            required
            min={c.min_stake}
            max={c.max_stake}
            value={stake}
            onChange={(e) => setStake(e.target.value)}
          />
        </label>
        <p>
          Entry fee: <strong>{creditDecimal(fee)}</strong> credits (
          {c.entry_fee_percentage}%). Total deducted:{" "}
          <strong>{creditDecimal(total)}</strong> credits.
        </p>
        <p className="text-sm text-slate-600">
          The entry fee is not part of the prize pool. Successful participants
          recover their own stake and receive an equal share of failed stakes
          plus the host contribution after the {c.failed_stake_cut}% platform
          cut. The reward depends on final outcomes. If nobody succeeds, the
          platform receives the full pool.
        </p>
        <label className="flex items-start gap-3">
          <input type="checkbox" required className="mt-1" />
          <span>
            I accept the published rules, UTC deadlines and proof requirements.
            I may lose my stake if I do not complete them.
          </span>
        </label>
        <Message error={error} />
        <button disabled={busy} className={button}>
          {busy ? "Joining…" : "Accept terms and join"}
        </button>
      </form>
    </section>
  );
}

export function ChallengeDetail({ id }: { id: string }) {
  const r = useResource("/api/challenges/" + id),
    [proofVersion, setProofVersion] = useState(0);
  const c = r.data?.challenge,
    p = r.data?.participation;
  const now = Date.now(),
    ended = c && ["cancelled", "rewards_distributed"].includes(c.status),
    paused = c?.status === "suspended";
  const canonical = c?.lifecycle_version === 1;
  return (
    <Shell title={c?.title || "Challenge"} intro={c?.description}>
      <LoadState {...r} retry={r.refresh} />
      {c && (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <section className={panel + " space-y-3 md:col-span-2"}>
              <p className="font-semibold text-orange-700">
                {c.category} · {c.status.replaceAll("_", " ")}
              </p>
              <h2 className="text-2xl font-bold">Published rules</h2>
              <p>Hosted by {c.host_name || "a Stakr member"}</p>
              <ul className="list-disc space-y-2 pl-5">
                {(c.rules || []).map((rule: string, i: number) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
              {canonical && (
                <>
                  <p>
                    <strong>
                      {c.lifecycle_policy.requiredDays} different approved proof
                      days
                    </strong>{" "}
                    required. Evidence:{" "}
                    {c.lifecycle_policy.proofTypes.join(", ")}.
                  </p>
                  <p className="whitespace-pre-wrap">
                    {c.proof_requirements?.description}
                  </p>
                  <p className="text-sm text-slate-600">
                    One current proof per UTC day. Admins who host or
                    participate cannot review this challenge. You have{" "}
                    {c.lifecycle_policy.appealSeconds / 3600} hours after
                    rejection to appeal to a different reviewer. Pending reviews
                    and appeals hold settlement.
                  </p>
                </>
              )}
            </section>
            <section className={panel + " space-y-3"}>
              <h2 className="text-xl font-bold">Dates & pool</h2>
              <p>Start: {utc(c.start_date)}</p>
              <p>End: {utc(c.end_date)}</p>
              {canonical && (
                <p>
                  Proof deadline:{" "}
                  {utc(
                    new Date(
                      new Date(c.end_date).getTime() +
                        c.lifecycle_policy.graceSeconds * 1000,
                    ).toISOString(),
                  )}
                </p>
              )}
              <p>
                {c.current_participants}/{c.max_participants} participants
              </p>
              <p>{money(c.total_stake_pool)} credits staked</p>
              <p>{money(c.host_contribution)} funded by host</p>
              {p && (
                <p className="rounded-xl bg-orange-50 p-3 font-semibold">
                  Your stake: {money(p.stake_amount)}
                  <br />
                  Your outcome: {p.completion_status.replaceAll("_", " ")}
                </p>
              )}
            </section>
          </div>
          {!canonical && (
            <Message message="This legacy challenge needs an admin review of its rules and historical credits before new activity can proceed." />
          )}
          {paused && (
            <Message message="This challenge is suspended. Proof, reviews and settlement are paused. Deadlines will be extended when it resumes." />
          )}
          {canonical &&
            !p &&
            !paused &&
            !ended &&
            now < new Date(c.start_date).getTime() && (
              <JoinForm c={c} onJoined={r.refresh} />
            )}
          {!p && canonical && now >= new Date(c.start_date).getTime() && (
            <p>Joining closed at the scheduled start.</p>
          )}
          {p &&
            canonical &&
            !paused &&
            !ended &&
            now >= new Date(c.start_date).getTime() &&
            now <
              new Date(c.end_date).getTime() +
                c.lifecycle_policy.graceSeconds * 1000 && (
              <ProofForm c={c} onSaved={() => setProofVersion((v) => v + 1)} />
            )}
          {p && (
            <ProofHistory key={proofVersion} id={id} paused={paused || ended} />
          )}
          {r.data.settlement && (
            <section className={panel + " space-y-3"}>
              <h2 className="text-2xl font-bold">
                {r.data.settlement.kind === "settlement"
                  ? "Settlement complete"
                  : "Cancellation complete"}
              </h2>
              <p>Recorded {utc(r.data.settlement.created_at)}</p>
              {p && (
                <p>
                  Your return: {money(p.reward_earned || 0)} credits. See your
                  credit history for the recorded transfers.
                </p>
              )}
              <p>
                Platform allocation:{" "}
                {money(
                  (r.data.settlement.snapshot.platformTakeCents ??
                    r.data.settlement.snapshot.platformCents ??
                    0) / 100,
                )}{" "}
                credits
                {r.data.settlement.kind === "settlement"
                  ? ", plus entry fees."
                  : "."}
              </p>
            </section>
          )}
        </>
      )}
    </Shell>
  );
}
