"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Search,
  Check,
  Building2,
  User,
  Plus,
  Phone,
  Tag,
  X,
} from "lucide-react";

export interface PartnerItem {
  id: number | string;
  name: string;
  phone?: string;
  tags?: string[];
  type?: string; // "SUPPLIER" | "CLIENT" | "AIRLINE" | "AGENT" | "OTHER"
  balance?: number;
}

interface PartnerSelectProps {
  value: number | string;
  onChange: (id: string) => void;
  partners: PartnerItem[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  onAddNew?: () => void;
  className?: string;
  labelClassName?: string;
}

export function PartnerSelect({
  value,
  onChange,
  partners = [],
  label,
  placeholder = "-- Hamkorni tanlang --",
  required = false,
  onAddNew,
  className = "",
  labelClassName = "",
}: PartnerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedPartner = partners.find(
    (p) => String(p.id) === String(value)
  );

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 320);
    const height = 360;
    const margin = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < height && rect.top > spaceBelow;

    const top = openUp
      ? Math.max(margin, rect.top - height - margin)
      : Math.min(window.innerHeight - height - margin, rect.bottom + margin);

    let left = rect.left;
    if (left + width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - width - margin);
    }
    if (left < margin) left = margin;

    setCoords({ top, left, width });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    setTimeout(() => searchInputRef.current?.focus(), 50);

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Filtering
  const filtered = partners.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(q);
    const phoneMatch = p.phone ? p.phone.toLowerCase().includes(q) : false;
    const tagsMatch = p.tags ? p.tags.some((t) => t.toLowerCase().includes(q)) : false;
    return nameMatch || phoneMatch || tagsMatch;
  });

  const handleSelect = (id: string | number) => {
    onChange(String(id));
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label and optional Add New partner link */}
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label
            className={
              labelClassName ||
              "block text-xs font-semibold text-slate-700 dark:text-slate-300"
            }
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              Yangi hamkor
            </button>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-[#111726] border rounded-xl cursor-pointer transition-all select-none ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
            : "border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            {selectedPartner?.type === "SUPPLIER" ||
            selectedPartner?.type === "AIRLINE" ? (
              <Building2 className="w-3.5 h-3.5" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {selectedPartner ? (
              <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {selectedPartner.name}
                </span>
                {selectedPartner.tags && selectedPartner.tags.length > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                    {selectedPartner.tags.join(", ")}
                  </span>
                )}
                {selectedPartner.phone && (
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {selectedPartner.phone}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-slate-400 font-medium italic">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu via Portal */}
      {isOpen &&
        mounted &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              minWidth: "320px",
              maxWidth: "420px",
              zIndex: 99999,
            }}
            className="bg-white dark:bg-[#0f1523] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.1] p-2.5 animate-in fade-in zoom-in-95 duration-100 select-none text-slate-900 dark:text-white"
          >
            {/* Search Box */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Hamkor nomi yoki telefon..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Partners List */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5 text-xs scrollbar-thin">
              {filtered.map((p) => {
                const isSelected = String(p.id) === String(value);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                        : "hover:bg-slate-100/80 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600"
                        }`}
                      >
                        {p.type === "SUPPLIER" || p.type === "AIRLINE" ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {p.name}
                          </span>
                          {p.tags && p.tags.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 rounded font-medium">
                              {p.tags.join(", ")}
                            </span>
                          )}
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span className="font-mono">{p.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.balance !== undefined && (
                        <span
                          className={`text-[10px] font-bold ${
                            p.balance > 0
                              ? "text-rose-500"
                              : p.balance < 0
                              ? "text-emerald-500"
                              : "text-slate-400"
                          }`}
                        >
                          {p.balance > 0
                            ? `$${p.balance.toLocaleString()}`
                            : p.balance < 0
                            ? `-$${Math.abs(p.balance).toLocaleString()}`
                            : "$0"}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400 mb-2">Hamkor topilmadi</p>
                  {onAddNew && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onAddNew();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yangi hamkor qo&apos;shish
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Add Link if not empty */}
            {onAddNew && filtered.length > 0 && (
              <div className="pt-2 mt-1.5 border-t border-slate-100 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNew();
                  }}
                  className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Yangi hamkor qo&apos;shish
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
