"use client";

import { useState } from "react";
import { api, button, money, panel } from "./shell";

/** One-time welcome credits prompt: a new account has 0 credits and every challenge needs a stake. */
export function WelcomeCredits({
  amount,
  onClaimed,
}: {
  amount: number;
  onClaimed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function claim() {
    setBusy(true);
    setError("");
    try {
      await api("/api/user/welcome-credits", {});
      onClaimed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to claim credits.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={
        panel +
        " space-y-3 !border-orange-300 !bg-orange-50/90 dark:!border-[#F46036]/30 dark:!bg-[#F46036]/10"
      }
    >
      <h2 className="text-xl font-heading font-bold tracking-tight">
        Start with {money(amount)} free credits
      </h2>
      <p className="text-slate-700 dark:text-slate-300">
        Challenges are joined with credits. Claim your one-time welcome credits
        to back your first challenge. Credits have no cash value and cannot be
        withdrawn.
      </p>
      {error && (
        <p role="alert" className="text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button className={button} disabled={busy} onClick={claim}>
        {busy ? "Claiming…" : `Claim ${money(amount)} credits`}
      </button>
    </section>
  );
}
