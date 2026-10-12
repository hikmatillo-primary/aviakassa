"use client";

import React, { useState } from "react";
import {
  Zap,
  Bell,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Plane,
  Plus,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSaleModal: () => void;
  onOpenBatchModal: () => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onResetDemo?: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenSaleModal,
  onOpenBatchModal,
  onExportData,
  onImportData,
  onResetDemo,
}: NavbarProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "batches", label: "Partiyalar (Bloklar)" },
    { id: "sales", label: "Sotuvlar" },
    { id: "partners", label: "Hamkorlar & Qarz" },
    { id: "payments", label: "Kassa & To'lovlar" },
  ];

  return (
    <header className="pt-4 pb-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none"
          onClick={() => setActiveTab("dashboard")}
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1">
              Aviakassa<span className="text-blue-600">.</span>
            </span>
          </div>
        </div>

        {/* Center: Floating Segmented Pill Nav */}
        <nav className="hidden md:flex items-center bg-white/80 backdrop-blur border border-slate-200/70 p-1 rounded-full shadow-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions, Notification, Settings, User Profile */}
        <div className="flex items-center gap-3">
          {/* Settings / Backup Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              title="Sozlamalar va Zaxira nusxa"
              className="w-9 h-9 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-xs transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            {showSettingsMenu && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowSettingsMenu(false)}
              >
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Zaxira & Sozlamalar
                </div>
                {onExportData && (
                  <button
                    onClick={onExportData}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-blue-600 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    Zaxirani yuklab olish (JSON)
                  </button>
                )}
                {onImportData && (
                  <button
                    onClick={onImportData}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 hover:text-emerald-600 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-400" />
                    Zaxirani tiklash (JSON)
                  </button>
                )}
                <div className="my-1.5 border-t border-slate-100" />
                {onResetDemo && (
                  <button
                    onClick={onResetDemo}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-600 hover:text-rose-600 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    Demo ma&apos;lumotlarni tiklash
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Profile Pill matching Boltshift */}
          <div className="flex items-center gap-2.5 bg-white pl-1.5 pr-3 py-1 rounded-full border border-slate-200/80 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              A
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-bold text-slate-900 leading-none">
                Aviakassa Admin
              </span>
              <span className="text-[10px] text-slate-400 leading-none mt-0.5 block">
                admin@aviakassa.uz
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Segmented Pill Bar */}
      <div className="flex md:hidden overflow-x-auto py-2 gap-1.5 scrollbar-none mt-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
