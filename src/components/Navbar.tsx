"use client";

import React, { useState } from "react";
import {
  Zap,
  Sun,
  Moon,
  Settings,
  Download,
  Upload,
  RotateCcw,
  LayoutDashboard,
  PackagePlus,
  Layers,
  ShoppingBag,
  Wallet,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSaleModal: () => void;
  onOpenBatchModal: () => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onResetDemo?: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  isDark,
  onToggleTheme,
  onExportData,
  onImportData,
  onResetDemo,
}: NavbarProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Exact 5 tabs requested by user: Dashboard, Xarid, Ombor, Sotuv, Kassa
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "purchases", label: "Xarid", icon: PackagePlus },
    { id: "inventory", label: "Ombor", icon: Layers },
    { id: "sales", label: "Sotuv", icon: ShoppingBag },
    { id: "cash", label: "Kassa", icon: Wallet },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#f4f5f8]/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Left: Brand Logo & Title */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => setActiveTab("dashboard")}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-0.5">
                  Aviakassa<span className="text-blue-600">.</span>
                </span>
              </div>
            </div>

            {/* Center: Floating Segmented Pill Nav (Desktop only) */}
            <nav className="hidden md:flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/70 dark:border-slate-800 p-1 rounded-full shadow-xs">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right: Theme Toggle & User Profile with Settings Dropdown */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={onToggleTheme}
                title={isDark ? "Yorug' rejim (Light mode)" : "Tungi rejim (Dark mode)"}
                className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 shadow-xs transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Profile Pill with Integrated Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  title="Profil va Sozlamalar"
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 pl-1.5 pr-2.5 sm:pr-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    A
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white leading-none">
                      Aviakassa Admin
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 leading-none mt-0.5 block">
                      admin@aviakassa.uz
                    </span>
                  </div>
                  <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-0.5 transition-colors" />
                </button>

                {showSettingsMenu && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 py-2 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setShowSettingsMenu(false)}
                  >
                    {/* Profile header inside dropdown */}
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Aviakassa Admin
                      </div>
                      <div className="text-[11px] text-slate-400">admin@aviakassa.uz</div>
                    </div>

                    <div className="px-3.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Tizim Sozlamalari
                    </div>

                    {onExportData && (
                      <button
                        onClick={onExportData}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-400" />
                        Zaxirani yuklab olish (JSON)
                      </button>
                    )}
                    {onImportData && (
                      <button
                        onClick={onImportData}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:text-emerald-600 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-slate-400" />
                        Zaxirani tiklash (JSON)
                      </button>
                    )}
                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-700" />
                    {onResetDemo && (
                      <button
                        onClick={onResetDemo}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                        Demo ma&apos;lumotlarni tiklash
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-bold leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
