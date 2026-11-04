"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile ("prove you're human") for the sign-in form. Renders
 * nothing unless the human check is fully switched on. A token works once, so
 * the form remounts this (new `key`) after every attempt to get a fresh one.
 * The server decides what to do with the token (lib/turnstile.ts).
 *
 * If the box cannot run at all (Cloudflare down, a content blocker), this says so
 * through `onUnavailable` and the form lets the person try anyway: the server asks
 * Cloudflare itself, so an outage does not stop password sign-in, and a visitor
 * cannot fake one.
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

/**
 * Is the check switched on? The build sets NEXT_PUBLIC_TURNSTILE_ENABLED only when BOTH
 * keys exist (config/turnstile.cjs), the same rule the server uses. The public site key
 * alone is not enough: the server ignores a lone key, so a form that demanded a token
 * would block password sign-in for everybody. Read at call time, not module load.
 */
export function turnstileConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === "1" &&
    Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())
  );
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
  onUnavailable,
}: {
  onToken: (token: string | null) => void;
  onUnavailable: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    if (!siteKey) return;
    let widgetId: string | undefined;
    let cancelled = false;
    const giveUp = () => {
      if (cancelled) return;
      setFailed(true);
      onUnavailable();
    };
    loadTurnstile()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widgetId = window.turnstile.render(box.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": giveUp,
        });
      })
      .catch(giveUp);
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [onToken, onUnavailable]);

  if (!turnstileConfigured()) return null;
  return (
    <div className="space-y-2">
      <div ref={box} data-testid="turnstile" />
      {failed && (
        <p role="alert" className="text-sm text-red-600">
          The security check did not load properly. You can still try to sign
          in. If it is refused, turn off any content blocker for this site and
          reload the page.
        </p>
      )}
    </div>
  );
}
