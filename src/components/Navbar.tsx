"use client";

import React, { useState } from "react";
import {
  Plane,
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Wallet,
  Download,
  Upload,
  RotateCcw,
  MoreVertical,
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
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Umumiy holat", icon: LayoutDashboard },
    { id: "batches", label: "Partiyalar (Bloklar)", icon: Package },
    { id: "partners", label: "Hamkorlar & Qarzlar", icon: Users },
    { id: "sales", label: "Sotuvlar", icon: ShoppingBag },
    { id: "payments", label: "Kassa & To'lovlar", icon: Wallet },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                Aviakassa{" "}
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold tracking-normal">
                  Pro
                </span>
              </span>
              <p className="text-xs text-slate-500 hidden sm:block">Chiptalar va hisob-kitob tizimi</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions & Backup */}
          <div className="flex items-center gap-2">
            {/* Backup actions dropdown / buttons */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                title="Zaxira nusxa va sozlamalar"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs font-medium"
                  onClick={() => setShowMenu(false)}
                >
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Ma&apos;lumotlar zaxirasi
                  </div>
                  {onExportData && (
                    <button
                      onClick={onExportData}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-blue-600 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      Zaxirani yuklab olish (JSON)
                    </button>
                  )}
                  {onImportData && (
                    <button
                      onClick={onImportData}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 hover:text-emerald-600 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-slate-500" />
                      Zaxirani tiklash (JSON)
                    </button>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  {onResetDemo && (
                    <button
                      onClick={onResetDemo}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-600 hover:text-rose-600 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-400" />
                      Demo holatga qaytarish
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onOpenBatchModal}
              className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              + Yangi partiya
            </button>
            <button
              onClick={onOpenSaleModal}
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-600/30 cursor-pointer"
            >
              + Chipta sotish
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
