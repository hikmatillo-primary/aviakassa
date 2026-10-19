"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";

export function VersionNotification() {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const currentVersionRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.version) return;

        if (!currentVersionRef.current) {
          // Birinchi yuklanganda joriy versiyani xotiraga olamiz
          currentVersionRef.current = String(data.version);
        } else if (currentVersionRef.current !== String(data.version)) {
          // Serverda yangi versiya aniqlandi!
          if (isMounted) {
            setHasNewVersion(true);
          }
        }
      } catch {
        // Tarmoq xatosi bo'lsa indamaymiz
      }
    };

    // 1. Dastlabki tekshiruv
    checkVersion();

    // 2. Har 60 soniyada tekshirib turish
    const timer = setInterval(checkVersion, 60_000);

    // 3. Foydalanuvchi oynaga qaytganda tekshirish
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  if (!hasNewVersion || isDismissed) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900/95 dark:bg-[#151c2e]/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 dark:border-blue-500/30 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            Tizim yangilandi!
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
            Yangi imkoniyatlar qo‘shildi. To‘liq yangilash uchun tugmani bosing.
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Yangilash</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Keyinroq
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
