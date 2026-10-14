"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Download, Share2, PlusSquare, Smartphone, CheckCircle2, Zap } from "lucide-react";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export function PwaInstallModal({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}: PwaInstallModalProps) {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        if (onInstalled) onInstalled();
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ilovani o‘rnatish"
      description="Aviakassa Pro ilovasini smartfoningiz yoki kompyuteringizga o‘rnating"
      maxWidth="max-w-md"
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* App Logo & Details */}
        <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Aviakassa Pro</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tezkor, xavfsiz va xuddi native ilovadek ishlaydi
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Brauzer manzillar qatori yo‘qolib, to‘liq ekranda ochiladi</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Bosh ekrandan (Home screen) 1 marta bosishda tezkor kirish</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Internet sust bo‘lganda ham zaxiradagi ma’lumotlar saqlanadi</span>
          </div>
        </div>

        {/* Install Action: Direct button if Chrome/Android prompt is available */}
        {deferredPrompt ? (
          <div className="pt-2">
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Ilovani hozir o‘rnatish
            </button>
          </div>
        ) : isIOS ? (
          /* iOS Safari Specific Step-by-Step Instructions */
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/70 dark:border-blue-500/20 rounded-xl text-xs space-y-2.5">
              <span className="font-bold text-blue-700 dark:text-blue-400 block">
                iPhone / iPad uchun qo‘llanma:
              </span>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-slate-700 dark:text-slate-200">
                  Safari brauzerining pastki qismidagi <strong>«Ulashish» (Share)</strong>{" "}
                  <Share2 className="w-3.5 h-3.5 inline text-blue-600 dark:text-blue-400" /> tugmasini bosing.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-slate-700 dark:text-slate-200">
                  Ochilgan menyudan pastga tushib, <strong>«Asosiy ekranga qo‘shish» (Add to Home Screen)</strong>{" "}
                  <PlusSquare className="w-3.5 h-3.5 inline text-blue-600 dark:text-blue-400" /> tugmasini tanlang.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-slate-700 dark:text-slate-200">
                  Yuqori o‘ng burchakdagi <strong>«Qo‘shish» (Add)</strong> tugmasini bosing.
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Tushunarli
            </button>
          </div>
        ) : (
          /* General Android/Browser instructions if deferredPrompt not ready */
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl text-xs space-y-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Brauzer menyusidan o‘rnatish:
              </span>
              <p className="text-slate-600 dark:text-slate-400">
                Brauzeringizning yuqori o‘ng burchagidagi <strong>3 nuqta (Menyu)</strong> ni bosing va{" "}
                <strong>«Ilovani o‘rnatish»</strong> yoki <strong>«Bosh ekranga qo‘shish»</strong> ni tanlang.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Yopish
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
