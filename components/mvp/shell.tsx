"use client";

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BackgroundImage } from "@/components/ui/background-image";

// Visual language matches the alpha gate (app/alpha-gate/page.tsx): glass cards, the
// #F46036 → #D74E25 brand gradient, light and dark variants (dark is the default theme).
export const field =
  "w-full rounded-xl border border-slate-300 bg-white/70 p-3 text-slate-950 placeholder:text-slate-400 backdrop-blur-sm transition-colors focus:border-[#F46036] focus:outline-none focus:ring-2 focus:ring-[#F46036]/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:[color-scheme:dark]";
export const button =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#F46036] to-[#D74E25] px-5 py-3 font-heading font-bold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:from-[#ff724c] hover:to-[#e85a30] hover:shadow-orange-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F46036] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black disabled:cursor-wait disabled:opacity-50 aria-[pressed=false]:bg-none aria-[pressed=false]:border aria-[pressed=false]:border-slate-300 aria-[pressed=false]:bg-white/70 aria-[pressed=false]:text-slate-700 aria-[pressed=false]:shadow-none dark:aria-[pressed=false]:border-white/10 dark:aria-[pressed=false]:bg-white/5 dark:aria-[pressed=false]:text-slate-300";
export const panel =
  "rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-xl backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-black/40 dark:shadow-2xl";
export const money = (value: string | number) =>
  Number(value).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
export function utc(value: string | null | undefined) {
  // One missing date must not crash the whole page (B-030).
  if (typeof value !== "string" || !value) return "Not scheduled";
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
      className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-800 backdrop-blur-sm dark:text-red-300"
    >
      {error}
    </p>
  ) : message ? (
    <p
      role="status"
      className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-900 backdrop-blur-sm dark:text-emerald-300"
    >
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
    <p role="status" className="py-6 text-slate-600 dark:text-slate-400">
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
/** Gradient icon tile, the same as on the alpha gate. */
export function IconTile({
  icon: Icon,
  muted = false,
}: {
  icon: LucideIcon;
  muted?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={
        muted
          ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F46036]/20 bg-gradient-to-br from-[#F46036]/20 to-[#D74E25]/20 text-[#D74E25] backdrop-blur-sm dark:text-[#F46036]"
          : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F46036] to-[#D74E25] text-white shadow-lg shadow-orange-500/20"
      }
    >
      <Icon className="h-5 w-5" />
    </span>
  );
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
  // Navigation (top bar, phone bottom bar) and the site footer come from
  // components/application-frame.tsx, the same as every other page (B-030).
  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-gradient-to-br from-slate-50 via-white to-slate-100 font-body text-slate-950 dark:from-[#0A0A0A] dark:via-[#1A1A1A] dark:to-[#0F0F0F] dark:text-white">
      {/* Background photo, ambient glows and noise, as on the alpha gate. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[75vh]">
          <BackgroundImage
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=75"
            alt=""
            className="h-full w-full object-cover grayscale-[30%] dark:grayscale-[50%]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/80 to-white/85 dark:from-black/80 dark:via-black/75 dark:to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:to-[#151515]" />
        </div>
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-[#F46036] opacity-10 mix-blend-screen blur-[120px] filter dark:opacity-20" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-[#D74E25] opacity-[0.07] mix-blend-screen blur-[100px] filter dark:opacity-15" />
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-10">
        <div>
          <p className="mb-2 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-widest text-orange-700 dark:text-[#F46036]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[#F46036]"
            />
            Credit challenges
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {intro && (
            <p className="mt-3 max-w-3xl leading-relaxed text-slate-600 dark:text-slate-400">
              {intro}
            </p>
          )}
        </div>
        {children}
        <p className="pt-4 text-sm text-slate-500 dark:text-slate-400">
          All challenge times use UTC. Credits have no cash withdrawal value.
        </p>
      </div>
    </div>
  );
}
