"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile ("prove you're human") for the sign-in form. Renders
 * nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. A token works once, so
 * the form remounts this (new `key`) after every attempt to get a fresh one.
 * The server decides what to do with the token (lib/turnstile.ts).
 */
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

/** Read at call time (not module load) so it follows the build-time value. */
export function turnstileConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const tag = script;
    tag.addEventListener("load", () => resolve(), { once: true });
    tag.addEventListener(
      "error",
      () => {
        // A dead tag never fires again, so drop it and let a later mount try afresh.
        tag.remove();
        reject(new Error("Turnstile script failed to load"));
      },
      { once: true },
    );
  });
}

export function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    if (!siteKey) return;
    let widgetId: string | undefined;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widgetId = window.turnstile.render(box.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setScriptFailed(true);
        onToken(null);
      });
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [onToken]);

  if (!turnstileConfigured()) return null;
  return (
    <div className="space-y-2">
      <div ref={box} data-testid="turnstile" />
      {scriptFailed && (
        <p role="alert" className="text-sm text-red-600">
          The security check could not load. Turn off any content blocker for
          this site, check your connection, then reload the page.
        </p>
      )}
    </div>
  );
}
