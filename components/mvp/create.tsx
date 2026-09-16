"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, button, field, Message, panel, Shell } from "./shell";

export function CreateChallenge() {
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return (
    <Shell
      title="Create a clear commitment"
      intro="Publish the rules before anyone stakes credits. Terms are fixed after publication; admins can cancel with an explicit refund policy if a correction is needed."
    >
      <form
        className={panel + " space-y-5"}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          try {
            const signature = JSON.stringify(Array.from(f.entries()));
            if (!attempt.current || attempt.current.signature !== signature)
              attempt.current = { signature, key: crypto.randomUUID() };
            const challenge = await api("/api/challenges", {
              requestId: attempt.current.key,
              title: f.get("title"),
              description: f.get("description"),
              category: f.get("category"),
              difficulty: f.get("difficulty"),
              startDate: f.get("startDate") + "T00:00:00Z",
              endDate: f.get("endDate") + "T00:00:00Z",
              requiredDays: Number(f.get("requiredDays")),
              graceHours: Number(f.get("graceHours")),
              minStake: Number(f.get("minStake")),
              maxStake: Number(f.get("maxStake")),
              hostContribution: Number(f.get("hostContribution")),
              maxParticipants: Number(f.get("maxParticipants")),
              proofTypes: f.getAll("proofTypes"),
              proofInstructions: f.get("proofInstructions"),
              rules: String(f.get("rules"))
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            });
            router.push("/challenge/" + challenge.challenge.id);
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <label className="block">
          Title
          <input
            name="title"
            className={field}
            required
            minLength={5}
            maxLength={100}
          />
        </label>
        <label className="block">
          What will participants commit to?
          <textarea
            name="description"
            className={field}
            required
            minLength={20}
            maxLength={5000}
            rows={4}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            Category
            <select name="category" className={field}>
              {["fitness", "habit", "skill", "wellness", "productivity"].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Difficulty
            <select name="difficulty" className={field}>
              <option>easy</option>
              <option>medium</option>
              <option>hard</option>
            </select>
          </label>
        </div>
        <fieldset className="space-y-3">
          <legend className="text-xl font-bold">UTC schedule</legend>
          <p className="text-sm text-slate-600">
            Both dates begin at 00:00 UTC. The end date is exclusive: a 1–8
            October challenge has seven proof days, 1–7 October.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              Start date
              <input
                name="startDate"
                type="date"
                required
                min={tomorrow}
                className={field}
              />
            </label>
            <label>
              End date
              <input
                name="endDate"
                type="date"
                required
                min={tomorrow}
                className={field}
              />
            </label>
            <label>
              Required approved days
              <input
                name="requiredDays"
                type="number"
                required
                min={1}
                max={365}
                defaultValue={7}
                className={field}
              />
            </label>
            <label>
              Grace period after end (hours)
              <input
                name="graceHours"
                type="number"
                required
                min={0}
                max={168}
                defaultValue={24}
                className={field}
              />
            </label>
          </div>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-xl font-bold">Credits</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["minStake", "Minimum stake", 10, "0.01", 999999.99],
              ["maxStake", "Maximum stake", 100, "0.01", 999999.99],
              [
                "hostContribution",
                "Your funded contribution",
                0,
                "0.01",
                999999.99,
              ],
              ["maxParticipants", "Participant limit", 100, "1", 500],
            ].map(([name, label, value, step, max]) => (
              <label key={name}>
                {label}
                <input
                  name={String(name)}
                  type="number"
                  step={String(step)}
                  required
                  min={name === "hostContribution" ? 0 : step}
                  max={max}
                  defaultValue={value}
                  className={field}
                />
              </label>
            ))}
          </div>
          <p className="text-sm text-slate-600">
            Your contribution is deducted when you publish. Entry fee and
            platform cut are fixed at publication and displayed on the challenge
            before anyone joins.
          </p>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-xl font-bold">Evidence & rules</legend>
          <p>Allowed proof types (select at least one)</p>
          <div className="flex gap-6">
            {["text", "photo", "video"].map((t) => (
              <label key={t} className="flex gap-2">
                <input
                  name="proofTypes"
                  type="checkbox"
                  value={t}
                  defaultChecked={t === "text"}
                />
                {t}
              </label>
            ))}
          </div>
          <label className="block">
            What must evidence demonstrate?
            <textarea
              name="proofInstructions"
              required
              minLength={20}
              maxLength={5000}
              className={field}
              rows={3}
            />
          </label>
          <label className="block">
            Rules (one per line)
            <textarea
              name="rules"
              required
              minLength={5}
              maxLength={10000}
              className={field}
              rows={4}
            />
          </label>
          <p className="text-sm text-slate-600">
            A neutral admin reviews each submission. Rejected evidence has a
            24-hour appeal window. The host and participants cannot review their
            challenge.
          </p>
        </fieldset>
        <Message error={error} />
        <button disabled={busy} className={button}>
          {busy ? "Publishing…" : "Publish challenge & fund contribution"}
        </button>
      </form>
    </Shell>
  );
}
