"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function PWARegistration() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // A controller already present at load means a later controllerchange is an
    // UPDATE. On a first visit the worker claims the page (clients.claim) and
    // fires controllerchange too, but reloading then would repeat any one-shot
    // request already in flight (e.g. the email-verification POST).
    const isUpdate = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    let updateTimer: ReturnType<typeof setInterval> | undefined;
    const onControllerChange = () => {
      if (!isUpdate || reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("✅ Service Worker registered successfully:", reg.scope);
        setRegistration(reg);

        // Check for updates periodically (every 5 minutes)
        updateTimer = setInterval(
          () => {
            reg.update();
          },
          5 * 60 * 1000,
        );

        // Listen for waiting service worker (new version available)
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                console.log("🔄 New version available!");
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("❌ Service Worker registration failed:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      if (updateTimer) clearInterval(updateTimer);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell waiting SW to skip waiting and activate
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      setShowUpdatePrompt(false);
    }
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-50 max-w-sm">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold text-sm">Update Available</p>
          <p className="text-xs opacity-90">A new version of Stakr is ready!</p>
        </div>
        <Button
          onClick={handleUpdate}
          variant="secondary"
          size="sm"
          className="shrink-0"
        >
          Update
        </Button>
      </div>
    </div>
  );
}
