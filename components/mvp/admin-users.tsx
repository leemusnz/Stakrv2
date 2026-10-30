"use client";

import { useState } from "react";
import { api, button, field, Message, panel } from "./shell";

/** Admin account moderation: suspend a cheater or restore someone, by email or user ID. */
export function UserStatusForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(form: HTMLFormElement, action: "suspend" | "restore") {
    const f = new FormData(form);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { result } = await api("/api/admin/user-status", {
        user: String(f.get("user")),
        action,
        reason: String(f.get("reason")),
      });
      setMessage(
        result.changed
          ? `Account is now ${result.status}.`
          : `No change: the account was already ${result.status}.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "The request failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={panel + " space-y-4"}>
      <h2 className="text-2xl font-bold">Account status</h2>
      <p>
        Suspend a user who breaks the rules, or restore one. A suspended user is
        signed out on their next request and cannot sign in. Staked credits stay
        escrowed and settle under the challenge&apos;s published rules.
      </p>
      <Message error={error} message={message} />
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          Email address or user ID
          <input name="user" required className={field} />
        </label>
        <label className="block">
          Reason (recorded in the audit log)
          <input name="reason" required maxLength={2000} className={field} />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            className={button}
            onClick={(e) => {
              const form = e.currentTarget.form!;
              if (form.reportValidity()) void submit(form, "suspend");
            }}
          >
            Suspend account
          </button>
          <button
            type="button"
            disabled={busy}
            className={button}
            onClick={(e) => {
              const form = e.currentTarget.form!;
              if (form.reportValidity()) void submit(form, "restore");
            }}
          >
            Restore account
          </button>
        </div>
      </form>
    </section>
  );
}
