"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
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

const stat = (label: string, value: string | number) => (
  <div>
    <dt className="text-sm text-slate-600">{label}</dt>
    <dd className="text-3xl font-bold">{value}</dd>
  </div>
);

export function ProfilePage() {
  const me = useResource("/api/user/profile");
  const joined = useResource("/api/user/challenges");
  const hosted = useResource("/api/user/challenges?scope=hosted");
  const profile = me.data?.profile;
  const completed = (joined.data?.challenges ?? []).filter(
    (c: any) => c.completion_status === "completed",
  ).length;
  return (
    <Shell title="Your profile" intro="How you appear on Stakr.">
      <LoadState {...me} retry={me.refresh} />
      {profile && (
        <section className={panel + " space-y-5"}>
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-slate-600">
              @{profile.username} · Member since{" "}
              {utc(profile.createdAt).replace(/, .*$/, "")}
            </p>
          </div>
          <dl className="grid gap-5 sm:grid-cols-4">
            {stat("Credits", money(profile.credits))}
            {stat("Level", profile.level)}
            {stat(
              "Challenges joined",
              joined.data ? joined.data.challenges.length : "…",
            )}
            {stat("Completed", joined.data ? completed : "…")}
          </dl>
          <dl className="grid gap-5 sm:grid-cols-4">
            {stat(
              "Challenges hosted",
              hosted.data ? hosted.data.challenges.length : "…",
            )}
            {stat("Experience points", profile.xp)}
          </dl>
          <div className="flex flex-wrap gap-3">
            <Link href="/settings" className={button}>
              Account settings
            </Link>
            <Link href="/wallet" className={button}>
              Credit history
            </Link>
          </div>
        </section>
      )}
    </Shell>
  );
}

export function SettingsPage() {
  const me = useResource("/api/user/profile");
  const profile = me.data?.profile;
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const shown = name ?? profile?.name ?? "";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shown.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.message ||
            data.details?.[0]?.message ||
            data.error ||
            "Your changes could not be saved.",
        );
      setMessage("Name updated.");
      me.refresh();
      setName(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Your changes could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setDeleteError("");
    try {
      await api("/api/user/delete", { confirm: "DELETE" });
      await signOut({
        callbackUrl: "/auth/signin?message=Your account has been deleted.",
      });
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "The account could not be deleted.",
      );
      setBusy(false);
    }
  }

  return (
    <Shell title="Settings" intro="Manage your account and your data.">
      <LoadState {...me} retry={me.refresh} />
      {profile && (
        <>
          <section className={panel + " space-y-4"}>
            <h2 className="text-2xl font-bold">Your details</h2>
            <Message error={error} message={message} />
            <form className="space-y-3" onSubmit={save}>
              <label className="block">
                Display name
                <input
                  className={field}
                  value={shown}
                  minLength={2}
                  maxLength={50}
                  required
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="block">
                Email address
                <input
                  className={field}
                  value={profile.email}
                  readOnly
                  aria-readonly
                />
              </label>
              <p className="text-sm text-slate-600">
                {profile.emailVerified
                  ? "Email verified."
                  : "Email not verified."}{" "}
                To change your email address, contact support.
              </p>
              <button
                className={button}
                disabled={busy || shown.trim() === profile.name}
              >
                Save changes
              </button>
            </form>
          </section>

          <section className={panel + " space-y-4"}>
            <h2 className="text-2xl font-bold">Your data</h2>
            <p className="text-slate-700">
              Download a copy of the personal information Stakr holds about you:
              profile, credit history, challenges, evidence you submitted and
              notifications. Passwords are never included.
            </p>
            <a href="/api/user/export" download className={button}>
              Download my data
            </a>
          </section>

          <section className={panel + " space-y-4"}>
            <h2 className="text-2xl font-bold">Delete my account</h2>
            <p className="text-slate-700">
              This removes your name, email and login permanently. Any credits
              you have left are forfeited. You cannot delete your account while
              you host or take part in a challenge that has not finished,
              because other people&apos;s results depend on it. Records of
              settled challenges are kept in anonymised form for audit and
              dispute purposes.
            </p>
            <Message error={deleteError} />
            <label className="block">
              Type DELETE to confirm
              <input
                className={field}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
              />
            </label>
            <button
              className={button}
              disabled={busy || confirm !== "DELETE"}
              onClick={() => void remove()}
            >
              Delete my account permanently
            </button>
          </section>
        </>
      )}
    </Shell>
  );
}

export function NotificationsPage() {
  const list = useResource("/api/user/notifications");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(method: "PATCH" | "DELETE") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/user/notifications", { method });
      if (!response.ok) throw new Error("That did not work. Please retry.");
      list.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That did not work. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  const items: any[] = list.data?.notifications ?? [];
  return (
    <Shell
      title="Notifications"
      intro="Decisions on your evidence, appeals and challenge outcomes."
    >
      <LoadState {...list} retry={list.refresh} />
      <Message error={error} />
      {list.data && (
        <section className={panel + " space-y-4"}>
          <div className="flex flex-wrap gap-3">
            <button
              className={button}
              disabled={busy || !list.data.unread_count}
              onClick={() => void run("PATCH")}
            >
              Mark all as read
            </button>
            <button
              className={button}
              disabled={busy || !items.some((n) => n.read)}
              onClick={() => void run("DELETE")}
            >
              Clear read notifications
            </button>
          </div>
          {items.length === 0 ? (
            <p className="py-6 text-slate-600">
              No notifications yet. Decisions on your evidence will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {items.map((n) => (
                <li key={n.id} className="py-4">
                  <p className={n.read ? "font-medium" : "font-bold"}>
                    {!n.read && <span className="sr-only">Unread: </span>}
                    {n.title}
                  </p>
                  <p className="text-slate-700">{n.message}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {utc(n.timestamp)}
                    {n.actionUrl && (
                      <>
                        {" · "}
                        <Link
                          href={n.actionUrl}
                          className="text-orange-700 underline"
                        >
                          View
                        </Link>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Shell>
  );
}
