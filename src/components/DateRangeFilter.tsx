"use client";

import React from "react";
import { X } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onClear: () => void;
  className?: string;
}

/**
 * Ro'yxat sahifalari uchun "dan - gacha" sana filtri.
 */
export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
  className = "",
}: DateRangeFilterProps) {
  const hasRange = Boolean(from || to);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <DatePicker
        value={from}
        onChange={onFromChange}
        placeholder="Dan"
        compact
        clearable
        align="left"
        className="w-32 sm:w-36"
      />
      <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold shrink-0">—</span>
      <DatePicker
        value={to}
        onChange={onToChange}
        placeholder="Gacha"
        compact
        clearable
        align="left"
        className="w-32 sm:w-36"
      />
      {hasRange && (
        <button
          type="button"
          onClick={onClear}
          title="Sana filtrini tozalash"
          aria-label="Sana filtrini tozalash"
          className="inline-flex items-center gap-1 px-2.5 py-2 text-[11px] font-semibold rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/[0.1] transition-all cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tozalash</span>
        </button>
      )}
    </div>
  );
}
