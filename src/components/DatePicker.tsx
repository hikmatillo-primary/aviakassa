"use client";

import React, { useState, useEffect, useRef } from "react";
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
  "Okt",
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

  // Bugun yoki ertaga ekanini tekshirish
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

  const d = new Date(year, monthIdx, day);
  const weekday = WEEKDAYS_FULL[d.getDay()];
  const monthName = MONTH_NAMES[monthIdx].slice(0, 3);

  return `${day}-${monthName}, ${year} (${weekday})`;
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
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Kalendar hozir qaysi oyda turgani
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()
  );

  // Qiymat o'zgarganda kalendarni o'sha oyga sinxronlash
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

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
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

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleQuickAddDays = (daysToAdd: number) => {
    const base = new Date();
    base.setDate(base.getDate() + daysToAdd);
    const formatted = `${base.getFullYear()}-${padZero(base.getMonth() + 1)}-${padZero(base.getDate())}`;
    onChange(formatted);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Oydagi kunlar soni
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Oyning 1-kuni haftaning qaysi kuniga to'g'ri keladi (Dushanba = 0 ... Yakshanba = 6)
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  // Bugungi sana
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;

  return (
    <div className={`relative ${isOpen ? "z-50" : ""} ${className}`} ref={containerRef}>
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

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-[#111726] border rounded-xl cursor-pointer transition-all select-none ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
            : "border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600"
        } ${compact ? "min-h-[46px] py-1.5" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="min-w-0 flex-1">
            {value ? (
              <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {compact ? formatCompactDisplay(value) : formatDateDisplay(value)}
              </span>
            ) : (
              <span className="block text-xs sm:text-sm text-slate-400 italic font-medium truncate">
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
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Calendar Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-76 sm:w-80 bg-white dark:bg-[#111726] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.1] z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Quick Buttons Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-slate-100 dark:border-white/[0.06] scrollbar-none text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => handleQuickAddDays(0)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer whitespace-nowrap"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(1)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              Ertaga
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(7)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              +1 hafta
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(14)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              +2 hafta
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(30)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              +1 oy
            </button>
          </div>

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between px-1 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels (Dushanba -> Yakshanba) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((name, i) => (
              <span
                key={name}
                className={`text-[10px] font-bold py-1 ${
                  i >= 5 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank padding cells before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />
            ))}

            {/* Days 1 to daysInMonth */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${viewYear}-${padZero(viewMonth + 1)}-${padZero(day)}`;
              const isSelected = value === dateKey;
              const isToday = todayStr === dateKey;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/40"
                      : isToday
                      ? "border border-blue-500 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Clear / Today Action */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
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
              <span className="text-[10px] text-slate-400">Aviakassa kalendari</span>
            )}
            <button
              type="button"
              onClick={() => handleQuickAddDays(0)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Bugungi sana
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
