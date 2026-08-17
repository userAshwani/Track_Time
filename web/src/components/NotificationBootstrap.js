"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { unlockNotificationAudio } from "../../lib/notificationSound.js";

export default function NotificationBootstrap() {
  const [permission, setPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return undefined;
    }

    setPermission(Notification.permission);

    async function askPermission() {
      if (Notification.permission !== "default") {
        setPermission(Notification.permission);
        return;
      }
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        await unlockNotificationAudio();
      } catch {
        setPermission(Notification.permission);
      }
    }

    // Ask as soon as the site or PWA opens.
    askPermission();

    function onFirstGesture() {
      askPermission();
      unlockNotificationAudio();
    }

    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, []);

  if (permission !== "default" || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[80] flex justify-center p-3 sm:p-4">
      <div className="flex w-full max-w-xl items-start gap-3 rounded-xl border border-emerald-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-950">Allow task notifications</p>
          <p className="mt-1 text-xs text-slate-500">
            Track Time needs permission to alert you 30 minutes before tasks, ring when a slot starts, and show live countdowns in the website and app.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              onClick={async () => {
                if (typeof Notification === "undefined") return;
                const result = await Notification.requestPermission();
                setPermission(result);
                await unlockNotificationAudio();
              }}
            >
              Allow notifications
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => setDismissed(true)}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
