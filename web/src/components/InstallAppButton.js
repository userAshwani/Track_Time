"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

const LOGO_URL = "https://ashwanitiwari.com/logo.png";

export default function InstallAppButton({ compact = false, className = "" }) {
  const [installEvent, setInstallEvent] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setMessage("");
    };

    const onAppInstalled = () => {
      setInstallEvent(null);
      setMessage("Track Time is installed.");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function installApp() {
    if (!installEvent) {
      setMessage("Use the browser install icon or menu to add Track Time to your phone or desktop.");
      return;
    }

    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={installApp}
        className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
      >
        <span
          className="h-8 w-8 shrink-0 rounded-lg bg-white bg-contain bg-center bg-no-repeat shadow-sm"
          style={{ backgroundImage: `url(${LOGO_URL})` }}
        />
        {!compact ? (
          <span className="hidden min-w-0 sm:block">
            <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700">Android web app</span>
            <span className="block truncate text-sm font-bold text-slate-950">Track Time CRM</span>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
          <Smartphone className="h-4 w-4" />
          <Download className="h-4 w-4" />
          Install
        </span>
      </button>
      {message ? (
        <p className="absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600 shadow-lg">
          {message}
        </p>
      ) : null}
    </div>
  );
}
