"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  api,
  button,
  field,
  LoadState,
  Message,
  panel,
  Shell,
  useResource,
  utc,
} from "./shell";
import { EvidenceLink } from "./detail";

export function AdminChallenges() {
  const grantKey = useRef<{ signature: string; key: string } | null>(null);
  const r = useResource("/api/admin/challenges"),
    proofs = useResource("/api/admin/verifications");
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState("");
  async function act(key: string, url: string, body: unknown) {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      const result = await api(url, body);
      setMessage(
        result.status
          ? "Challenge status: " + result.status.replaceAll("_", " ")
          : result.grant
            ? "Credit grant recorded."
            : "Review saved and queued for lifecycle processing.",
      );
      r.refresh();
      proofs.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <Shell
      title="Challenge operations"
      intro="Review evidence independently, resolve appeals and manage challenge lifecycle actions. Every decision records the acting admin and reason."
    >
      <Message error={error} message={message} />
      <section className={panel + " space-y-5"}>
        <h2 className="text-2xl font-bold">Review queue</h2>
        <LoadState {...proofs} retry={proofs.refresh} />
        {proofs.data?.proofs.length === 0 && (
          <p>No evidence or appeals awaiting review.</p>
        )}
        {proofs.data?.proofs.map((p: any) => (
          <article
            key={p.id}
            className="space-y-3 rounded-xl border border-slate-200 p-4"
          >
            <h3 className="text-xl font-bold">
              {p.challenge_title} ·{" "}
              {p.appeal_status === "pending" ? "Appeal" : "Proof review"}
            </h3>
            <p>
              {p.user_name} · {String(p.proof_day).slice(0, 10)} · submitted{" "}
              {utc(p.submitted_at)}
            </p>
            <Link
              className="text-orange-700 underline"
              href={"/challenge/" + p.challenge_id}
            >
              Read published challenge rules
            </Link>
            {p.text_content && (
              <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4">
                {p.text_content}
              </p>
            )}
            {p.file_url && <EvidenceLink id={p.id} />}
            {p.admin_notes && <p>Previous decision: {p.admin_notes}</p>}
            {p.appeal_reason && <p>Appeal reason: {p.appeal_reason}</p>}
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void act(p.id, "/api/admin/verifications", {
                  verificationId: p.id,
                  decision: f.get("decision"),
                  reason: f.get("reason"),
                  appeal: p.appeal_status === "pending",
                });
              }}
            >
              <label className="block">
                Decision
                <select name="decision" className={field}>
                  <option value="approved">Approve evidence</option>
                  <option value="rejected">Reject evidence</option>
                </select>
              </label>
              <label className="block">
                Reason
                <textarea
                  required
                  name="reason"
                  maxLength={2000}
                  className={field}
                />
              </label>
              <button disabled={!!busy} className={button}>
                {busy === p.id ? "Saving…" : "Record decision"}
              </button>
            </form>
          </article>
        ))}
      </section>
      <section className={panel + " space-y-5"}>
        <h2 className="text-2xl font-bold">Challenges</h2>
        <LoadState {...r} retry={r.refresh} />
        {r.data?.challenges.map((c: any) => (
          <article
            key={c.id}
            className="space-y-3 rounded-xl border border-slate-200 p-4"
          >
            <h3 className="text-xl font-semibold">
              <Link href={"/challenge/" + c.id} className="hover:underline">
                {c.title}
              </Link>
            </h3>
            <p>
              {c.status.replaceAll("_", " ")} · {c.participants} participants
              {c.last_error ? " · Processing needs review" : ""}
            </p>
            {c.lifecycle_version !== 1 ? (
              <p className="text-amber-800">
                Legacy rules or credits require reconciliation before lifecycle
                processing can be enabled.
              </p>
            ) : (
              !["cancelled", "rewards_distributed"].includes(c.status) && (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void act(c.id, "/api/admin/challenges/" + c.id, {
                      action: f.get("action"),
                      reason: f.get("reason"),
                      preset: f.get("preset"),
                    });
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Action
                      <select name="action" className={field}>
                        <option value="process">
                          Check outcomes & settle when ready
                        </option>
                        {c.status === "suspended" ? (
                          <option value="resume">
                            Resume and extend deadlines
                          </option>
                        ) : (
                          <option value="suspend">Suspend</option>
                        )}
                        <option value="cancel">Cancel challenge</option>
                      </select>
                    </label>
                    <label>
                      Refund policy if cancelling
                      <select name="preset" className={field}>
                        <option value="refund_all">
                          Return all stakes, fees & host contribution
                        </option>
                        <option value="refund_participants">
                          Return stakes; retain fees & host contribution
                        </option>
                        <option value="refund_none">
                          No refunds; allocate all to platform
                        </option>
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    Reason
                    <textarea
                      name="reason"
                      required
                      maxLength={2000}
                      className={field}
                    />
                  </label>
                  <label className="flex gap-2">
                    <input type="checkbox" required />I have reviewed this
                    action and the selected cancellation policy.
                  </label>
                  <button disabled={!!busy} className={button}>
                    {busy === c.id ? "Processing…" : "Apply action"}
                  </button>
                </form>
              )
            )}
          </article>
        ))}
      </section>
      <section className={panel + " space-y-4"}>
        <h2 className="text-2xl font-bold">Issue MVP credits</h2>
        <p>
          Fund a test participant without cash payments. Grants record your
          identity, a reason and a matching credit ledger entry.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const body = {
              userId: String(f.get("userId")),
              amount: Number(f.get("amount")),
              reason: String(f.get("reason")),
            };
            const signature = JSON.stringify(body);
            if (!grantKey.current || grantKey.current.signature !== signature)
              grantKey.current = { signature, key: crypto.randomUUID() };
            void act("grant", "/api/admin/credits", {
              ...body,
              requestId: grantKey.current.key,
            });
          }}
        >
          <label className="block">
            User ID
            <input name="userId" required className={field} />
          </label>
          <label className="block">
            Credits
            <input
              name="amount"
              type="number"
              min="0.01"
              max="10000"
              step="0.01"
              required
              className={field}
            />
          </label>
          <label className="block">
            Reason
            <input name="reason" required maxLength={2000} className={field} />
          </label>
          <button disabled={!!busy} className={button}>
            Record credit grant
          </button>
        </form>
      </section>
      {r.data && (
        <section className={panel + " space-y-3"}>
          <h2 className="text-2xl font-bold">Ledger reconciliation</h2>
          <p>
            {r.data.ledgerDrift.length
              ? "These balances differ from their credit ledger. Investigate opening balances and legacy writes before release."
              : "All user balances match their credit ledger."}
          </p>
          {r.data.ledgerDrift.map((u: any) => (
            <p key={u.id} className="break-all text-sm">
              {u.id}: balance {u.credits}; ledger {u.ledger_balance}
            </p>
          ))}
        </section>
      )}
    </Shell>
  );
}
