"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export const field =
  "w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950 focus:outline-none focus:ring-2 focus:ring-orange-500";
export const button =
  "inline-flex items-center justify-center rounded-xl bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800 disabled:opacity-50 disabled:cursor-wait";
export const panel =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7";
export const money = (value: string | number) =>
  Number(value).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export function utc(value: string) {
  const date = new Date(
    /[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : value.replace(" ", "T") + "Z",
  );
  return Number.isFinite(date.getTime())
    ? date.toLocaleString("en-GB", {
        timeZone: "UTC",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " UTC"
    : "Not scheduled";
}
export async function api<T = any>(
  url: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    signal,
    ...(body !== undefined
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && data.details?.[0]?.message)
    throw new Error(
      (data.details[0].path?.join(".") || "Input") +
        ": " +
        data.details[0].message,
    );
  if (!response.ok)
    throw new Error(
      data.error ||
        (response.status === 401
          ? "Please sign in to continue."
          : "The request failed. Please retry."),
    );
  return data;
}
export function useResource<T = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((n) => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    api<T>(url, undefined, controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url, version]);
  return { data, error, loading, refresh };
}
export function Message({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return error ? (
    <p
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
    >
      {error}
    </p>
  ) : message ? (
    <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-900">
      {message}
    </p>
  ) : null;
}
export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return loading ? (
    <p role="status" className="py-6">
      Loading…
    </p>
  ) : error ? (
    <div className="space-y-3">
      <Message error={error} />
      <button className={button} onClick={retry}>
        Retry
      </button>
    </div>
  ) : null;
}
export function Shell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname(),
    { data: session } = useSession();
  const links = [
    ["/dashboard", "Home"],
    ["/discover", "Discover"],
    ["/my-challenges", "My challenges"],
    ["/create-challenge", "Create"],
    ["/wallet", "Credits"],
    ["/notifications", "Notifications"],
    ["/profile", "Profile"],
  ];
  if (session?.user?.isAdmin) links.push(["/admin/challenges", "Admin"]);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-5 py-5">
          <Link
            href="/dashboard"
            className="text-3xl font-black tracking-tight text-orange-700"
          >
            stakr<span className="text-emerald-500">.</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex flex-1 flex-wrap gap-x-5 gap-y-3 text-sm font-semibold"
          >
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={
                  pathname === href
                    ? "text-orange-700 underline underline-offset-8"
                    : "text-slate-600 hover:text-orange-700"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="text-sm text-slate-600"
            >
              Sign out
            </button>
          ) : (
            <Link href="/auth/signin">Sign in</Link>
          )}
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl space-y-6 px-5 py-10">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-700">
            Credits MVP
          </p>
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          {intro && (
            <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
              {intro}
            </p>
          )}
        </div>
        {children}
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap gap-5 px-5 py-8 text-sm text-slate-500">
        <span>
          All challenge times use UTC. Credits have no cash withdrawal value.
        </span>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
