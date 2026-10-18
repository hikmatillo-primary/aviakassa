"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  Settings,
  Download,
  Upload,
  LayoutDashboard,
  PackagePlus,
  Layers,
  ShoppingBag,
  Wallet,
  Users,
  LogOut,
  Smartphone,
  Database,
  ChevronDown,
  CheckCircle2,
  ServerCog,
} from "lucide-react";
import Image from "next/image";
import { PwaInstallModal } from "./PwaInstallModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { DatabaseInfo, apiActivateDatabase } from "@/lib/api";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  currentUser?: { username: string; name?: string; isStaff?: boolean } | null;
  onToggleTheme: () => void;
  onLogout?: () => void;
  onOpenSaleModal: () => void;
  onOpenBatchModal: () => void;
  onOpenPaymentModal?: (type: "INCOME" | "EXPENSE") => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onOpenDatabases?: () => void;
  databases?: DatabaseInfo[];
  activeDatabaseName?: string;
}

export function Navbar({
  activeTab,
  setActiveTab,
  isDark,
  currentUser,
  onToggleTheme,
  onLogout,
  onOpenSaleModal,
  onOpenBatchModal,
  onOpenPaymentModal,
  onExportData,
  onImportData,
  onOpenDatabases,
  databases,
  activeDatabaseName,
}: NavbarProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDbMenu, setShowDbMenu] = useState(false);
  const [confirmSwitchDb, setConfirmSwitchDb] = useState<DatabaseInfo | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const dbMenuRef = useRef<HTMLDivElement>(null);

  // Check standalone mode and listen for PWA install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowInstallModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
          setIsStandalone(true);
        }
      });
    } else {
      setShowInstallModal(true);
    }
  };

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (dbMenuRef.current && !dbMenuRef.current.contains(e.target as Node)) {
        setShowDbMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSettingsMenu(false);
        setShowDbMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const currentActiveDb = databases?.find((d) => d.isActive);
  const displayName = currentActiveDb?.name || activeDatabaseName || "Asosiy";
  const isCustomDbActive = Boolean(
    currentActiveDb &&
      currentActiveDb.dbName !== "aviakassa_db" &&
      currentActiveDb.dbName !== "default"
  );

  const handleSwitchDatabase = async () => {
    if (!confirmSwitchDb) return;
    setIsSwitching(true);
    try {
      await apiActivateDatabase(confirmSwitchDb.id);
      window.location.reload();
    } catch (e) {
      console.error(e);
      setIsSwitching(false);
      setConfirmSwitchDb(null);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "purchases", label: "Xarid", icon: PackagePlus },
    { id: "inventory", label: "Ombor", icon: Layers },
    { id: "sales", label: "Sotuv", icon: ShoppingBag },
    { id: "partners", label: "Hamkorlar", icon: Users },
    { id: "cash", label: "Kassa", icon: Wallet },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#f6f7f9]/90 dark:bg-[#090d16]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-white/[0.07] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Left: Brand Logo & Title */}
            <div
              className="flex items-center cursor-pointer select-none"
              onClick={() => setActiveTab("dashboard")}
            >
              <Image
                src="/brand/5tour-wordmark.png"
                alt="5TOUR"
                width={1464}
                height={316}
                priority
                className="h-7 sm:h-8 w-auto dark:hidden"
              />
              <Image
                src="/brand/5tour-wordmark-dark.png"
                alt="5TOUR"
                width={1464}
                height={316}
                priority
                className="h-7 sm:h-8 w-auto hidden dark:block"
              />
            </div>

            {/* Center: Floating Segmented Pill Nav (Desktop only) */}
            <nav className="hidden md:flex items-center bg-white dark:bg-[#111726] border border-slate-200/70 dark:border-white/[0.07] p-1 rounded-xl shadow-xs">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right: Quick Action, Theme Toggle & User Profile with Settings Dropdown */}
            <div className="flex items-center gap-2">
              {/* Database Switcher (Theme toggle yonida, faqat staff uchun) */}
              {currentUser?.isStaff && (
                <div className="relative" ref={dbMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowDbMenu((prev) => !prev)}
                    title={`Faol baza: ${displayName}`}
                    aria-label="Ma'lumotlar bazasini almashtirish"
                    aria-haspopup="menu"
                    aria-expanded={showDbMenu}
                    className={`h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                      isCustomDbActive
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-900/40"
                        : "bg-white dark:bg-[#111726] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate max-w-[5.5rem] sm:max-w-[7.5rem] font-bold">
                      {displayName}
                    </span>
                    {isCustomDbActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"
                        title="Maxsus baza faol"
                      />
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {showDbMenu && (
                    <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-[#111726] rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/[0.08] py-2 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs">
                          <Database className="w-3.5 h-3.5 text-blue-600" />
                          Ma&apos;lumotlar bazasi
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Faol: <span className="font-semibold text-slate-700 dark:text-slate-200">{displayName}</span>
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto py-1">
                        {(!databases || databases.length === 0) && (
                          <div className="px-3.5 py-2 text-slate-400 text-center text-xs">
                            Bazalar ro&apos;yxati yo&apos;q
                          </div>
                        )}
                        {databases?.map((db) => {
                          const isBase =
                            db.dbName === "aviakassa_db" || db.dbName === "default";
                          return (
                            <button
                              key={db.id}
                              type="button"
                              onClick={() => {
                                setShowDbMenu(false);
                                if (!db.isActive) {
                                  setConfirmSwitchDb(db);
                                }
                              }}
                              className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                db.isActive
                                  ? "bg-blue-50/70 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold"
                                  : "hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="truncate">{db.name}</span>
                                  {isBase && (
                                    <span className="text-[9px] px-1 py-0.2 rounded font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-500">
                                      Asosiy
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {db.dbName}
                                </span>
                              </div>

                              {db.isActive && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                                  <CheckCircle2 className="w-3 h-3" /> Faol
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {onOpenDatabases && (
                        <div className="pt-1 mt-1 border-t border-slate-100 dark:border-white/[0.06] px-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDbMenu(false);
                              onOpenDatabases();
                            }}
                            className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-white/[0.05] flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
                          >
                            <ServerCog className="w-3.5 h-3.5" />
                            Bazalarni boshqarish...
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={onToggleTheme}
                title={isDark ? "Yorug' rejim (Light mode)" : "Tungi rejim (Dark mode)"}
                aria-label={isDark ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish"}
                className="w-9 h-9 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-center text-slate-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] shadow-xs transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Profile Pill (Settings inside dropdown on click) */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setShowSettingsMenu((prev) => !prev)}
                  title="Profil va Sozlamalar"
                  aria-label="Profil va sozlamalar menyusi"
                  aria-haspopup="menu"
                  aria-expanded={showSettingsMenu}
                  className="flex items-center gap-2 bg-white dark:bg-[#111726] p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.15] transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 uppercase">
                    {currentUser?.username?.[0] || "A"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-semibold text-slate-900 dark:text-white leading-none">
                      {currentUser?.name || currentUser?.username || "5TOUR Admin"}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-none mt-0.5 block">
                      {currentUser?.username ? `@${currentUser.username}` : "admin@aviakassa.uz"}
                    </span>
                  </div>
                </button>

                {showSettingsMenu && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#111726] rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/[0.08] py-2 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setShowSettingsMenu(false)}
                  >
                    {/* Profile header inside dropdown */}
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {currentUser?.name || currentUser?.username || "5TOUR Admin"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {currentUser?.username ? `@${currentUser.username}` : "admin@aviakassa.uz"}
                      </div>
                    </div>

                    <div className="px-3.5 pt-2 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Tizim sozlamalari
                    </div>

                    {onOpenDatabases && currentUser?.isStaff && (
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onOpenDatabases();
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/[0.05] flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
                      >
                        <Database className="w-4 h-4 text-slate-400" />
                        Bazalar
                        {activeDatabaseName && (
                          <span className="ml-auto text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md truncate max-w-[6rem]">
                            {activeDatabaseName}
                          </span>
                        )}
                      </button>
                    )}

                    {!isStandalone && (
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          handleInstallClick();
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-blue-50/70 dark:hover:bg-blue-500/10 flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-blue-500" />
                        Ilovani o‘rnatish (PWA)
                      </button>
                    )}

                    {onExportData && (
                      <button
                        onClick={onExportData}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/[0.05] flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-400" />
                        Zaxirani yuklab olish (JSON)
                      </button>
                    )}
                    {onImportData && currentUser?.isStaff && (
                      <button
                        onClick={onImportData}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/[0.05] flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-slate-400" />
                        Zaxirani tiklash (JSON)
                      </button>
                    )}
                    {onLogout && (
                      <>
                        <div className="my-1.5 border-t border-slate-100 dark:border-white/[0.06]" />
                        <button
                          onClick={onLogout}
                          className="w-full px-3.5 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Tizimdan chiqish (Logout)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Apple HIG / Telegram clean tab style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111726]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/[0.07] px-1 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-6 gap-0.5 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-6 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive ? "bg-blue-500/10" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold leading-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* PWA Installation Modal */}
      <PwaInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsStandalone(true)}
      />

      {/* Bazaga o'tish tasdiq modali (in-app, brauzer pop-up'isiz) */}
      <ConfirmDialog
        isOpen={confirmSwitchDb !== null}
        title="Bazaga o'tish"
        message={
          <span>
            «<strong>{confirmSwitchDb?.name}</strong>» bazasiga o&apos;tilsinmi?
            Barcha foydalanuvchilar shu bazaga o&apos;tadi va yangi ma&apos;lumotlar ushbu bazada yuritiladi.
          </span>
        }
        variant="primary"
        confirmLabel={isSwitching ? "O'tilmoqda..." : "O'tish"}
        onCancel={() => setConfirmSwitchDb(null)}
        onConfirm={handleSwitchDatabase}
      />
    </>
  );
}
