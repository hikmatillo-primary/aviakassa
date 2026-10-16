"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
  className?: string;
  labelClassName?: string;
  compact?: boolean;
  align?: "left" | "right" | "auto";
  maxDate?: string; // "YYYY-MM-DD" — bundan keyingi kunlarni tanlash mumkin emas
}

const MONTH_NAMES = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const SHORT_MONTHS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyun",
  "Iyul",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

const WEEKDAY_NAMES = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const WEEKDAYS_FULL = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day)) return dateStr;

  const d = new Date(year, monthIdx, day);
  const weekday = WEEKDAYS_FULL[d.getDay()];
  const monthName = MONTH_NAMES[monthIdx];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${padZero(tomorrow.getMonth() + 1)}-${padZero(tomorrow.getDate())}`;

  let tag = "";
  if (dateStr === todayStr) tag = " (Bugun)";
  else if (dateStr === tomorrowStr) tag = " (Ertaga)";

  return `${day}-${monthName}, ${year} • ${weekday}${tag}`;
}

function formatCompactDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day)) return dateStr;

  const monthName = SHORT_MONTHS[monthIdx] || MONTH_NAMES[monthIdx].slice(0, 3);
  return `${day}-${monthName}, ${year}`;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Sanani tanlang",
  required = false,
  clearable = false,
  className = "",
  labelClassName = "",
  compact = false,
  align = "auto",
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initial month / year to view
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()
  );

  // Position state for portal
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: "bottom" | "top";
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync viewed month when value changes
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value]);

  // Compute smart portal position
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const popoverWidth = 295;
    const popoverHeight = 315;
    const margin = 8;

    // Vertical placement: open up if space below is too small and space above is bigger
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

    let top: number;
    if (openUp) {
      top = Math.max(margin, rect.top - popoverHeight - 4);
    } else {
      top = rect.bottom + 4;
    }

    // Horizontal placement
    let left = rect.left;
    if (align === "right") {
      left = rect.right - popoverWidth;
    } else if (align === "left") {
      left = rect.left;
    } else {
      if (left + popoverWidth > window.innerWidth - margin) {
        left = rect.right - popoverWidth;
      }
    }

    // Keep within window bounds
    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    setCoords({
      top,
      left,
      placement: openUp ? "top" : "bottom",
    });
  }, [align]);

  // Update position on open, scroll, resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        containerRef.current.contains(target)
      ) {
        return;
      }
      if (
        popoverRef.current &&
        popoverRef.current.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const exceedsMaxDate = (dateKey: string) => Boolean(maxDate && dateKey > maxDate);

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
    if (exceedsMaxDate(formatted)) return;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleQuickAddDays = (daysToAdd: number) => {
    const base = new Date();
    base.setDate(base.getDate() + daysToAdd);
    const formatted = `${base.getFullYear()}-${padZero(base.getMonth() + 1)}-${padZero(base.getDate())}`;
    if (exceedsMaxDate(formatted)) return;
    onChange(formatted);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setIsOpen(false);
  };

  // maxDate dan oshib ketadigan tezkor tugmalar ko'rsatilmaydi
  const quickPresets = [
    { label: "Bugun", days: 0 },
    { label: "Ertaga", days: 1 },
    { label: "+1 hafta", days: 7 },
    { label: "+2 hafta", days: 14 },
    { label: "+1 oy", days: 30 },
  ].filter((preset) => {
    if (!maxDate) return true;
    const d = new Date();
    d.setDate(d.getDate() + preset.days);
    const key = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
    return key <= maxDate;
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Month day calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className={labelClassName || "block text-xs font-semibold text-slate-700 dark:text-slate-300"}>
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer font-medium"
            >
              Tozalash
            </button>
          )}
        </div>
      )}

      {/* Trigger Input Button */}
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={label ? `${label}: ${value || placeholder}` : undefined}
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-[#111726] border rounded-xl cursor-pointer transition-all select-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
            : "border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600"
        } ${compact ? "min-h-[42px] py-1.5 px-2" : ""}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="min-w-0 flex-1">
            {value ? (
              <span
                className={`block font-bold text-slate-900 dark:text-white truncate ${
                  compact ? "text-[12px] sm:text-xs" : "text-xs sm:text-sm"
                }`}
              >
                {compact ? formatCompactDisplay(value) : formatDateDisplay(value)}
              </span>
            ) : (
              <span className="block text-xs text-slate-400 italic font-medium truncate">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        {clearable && value && (
          <button
            type="button"
            onClick={handleClear}
            title="Sanani o'chirish"
            aria-label="Sanani o'chirish"
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Calendar rendered via React Portal */}
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
              width: "295px",
              zIndex: 99999,
            }}
            className="bg-white dark:bg-[#0f1523] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.1] p-2.5 text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-100 select-none max-h-[85vh] overflow-y-auto"
          >
            {/* Quick Presets Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1.5 border-b border-slate-100 dark:border-white/[0.06] scrollbar-none text-[10px] font-semibold">
              {quickPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleQuickAddDays(preset.days)}
                  className={`px-2 py-0.5 rounded-md cursor-pointer whitespace-nowrap ${
                    preset.days === 0
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Month & Year Navigation Header */}
            <div className="flex items-center justify-between px-1 mb-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                title="Oldingi oy"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                title="Keyingi oy"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Labels (Dushanba -> Yakshanba) */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAY_NAMES.map((name, i) => (
                <span
                  key={name}
                  className={`text-[10px] font-bold py-0.5 ${
                    i >= 5 ? "text-amber-500 dark:text-amber-400" : "text-slate-400"
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>

            {/* Days Grid - All 31 days clearly displayed */}
            <div className="grid grid-cols-7 gap-1">
              {/* Blank leading cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="w-8 h-8" />
              ))}

              {/* Days 1 to daysInMonth */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
                const isSelected = value === dateKey;
                const isToday = todayStr === dateKey;
                const isDisabled = exceedsMaxDate(dateKey);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(day)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                      isDisabled
                        ? "text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105 cursor-pointer"
                        : isToday
                        ? "border border-blue-500 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer Bar */}
            <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-slate-100 dark:border-white/[0.06] text-xs">
              {clearable ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  Sanani tozalash
                </button>
              ) : (
                <span className="text-[10px] text-slate-400">Kalendar</span>
              )}
              <button
                type="button"
                onClick={() => handleQuickAddDays(0)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Bugungi sana
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
