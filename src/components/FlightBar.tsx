"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { getBatchFlightSchedule } from "@/lib/format";
import { copyToClipboard } from "@/lib/clipboard";

interface FlightBarProps {
  batch: any;
  showSubtitle?: boolean;
  className?: string;
}

export function FlightBar({
  batch,
  showSubtitle = true,
  className = "",
}: FlightBarProps) {
  const [copied, setCopied] = useState(false);

  if (!batch) return null;

  const schedule = getBatchFlightSchedule(batch);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!schedule.clipboardText) return;
    const ok = await copyToClipboard(schedule.clipboardText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-1 max-w-full ${className}`}>
      {/* Flight Row with GDS format + Copy to Clipboard button */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
        {/* Monospace GDS Ticket Container */}
        <div className="inline-flex flex-col bg-slate-100/95 dark:bg-[#131b2e] border border-slate-200/90 dark:border-white/[0.08] rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 font-mono text-[11px] sm:text-[13px] leading-snug shadow-2xs divide-y divide-slate-200/70 dark:divide-white/[0.06] shrink-0">
          {/* Outbound Leg (Borish) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 whitespace-nowrap pb-0.5">
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {schedule.outbound.date}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {schedule.outbound.flightNumber}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {schedule.outbound.originIata}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {schedule.outbound.destIata}
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {schedule.outbound.depTime}
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {schedule.outbound.arrTime}
            </span>
          </div>

          {/* Inbound / Return Leg (Qaytish) - Agar obratno bo'lsa pastiga tushadi */}
          {schedule.inbound && (
            <div className="flex items-center gap-1.5 sm:gap-2.5 whitespace-nowrap pt-1">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {schedule.inbound.date}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {schedule.inbound.flightNumber}
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {schedule.inbound.originIata}
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {schedule.inbound.destIata}
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {schedule.inbound.depTime}
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {schedule.inbound.arrTime}
              </span>
            </div>
          )}
        </div>

        {/* Copy to Clipboard Icon Button */}
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? "Nusxalandi!" : "Reys jadvalini nusxalash"}
          aria-label="Reys jadvalini nusxalash"
          className={`shrink-0 inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl transition-all border shadow-2xs cursor-pointer active:scale-95 ${
            copied
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-[#131b2e] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border-slate-200/80 dark:border-white/[0.08] hover:border-blue-300 dark:hover:border-blue-700"
          }`}
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Subtitle / Context */}
      {showSubtitle && (
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
            {batch.batchNumber || "---"}
          </span>
          {schedule.routeFull && (
            <>
              <span>•</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {schedule.routeFull}
              </span>
            </>
          )}
          {schedule.inbound && (
            <>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Borish-qaytish</span>
            </>
          )}
          {batch.baggage && (
            <>
              <span>•</span>
              <span>{batch.baggage} bagaj</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
