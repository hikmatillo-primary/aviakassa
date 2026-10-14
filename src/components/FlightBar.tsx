import React from "react";
import { Plane, Calendar } from "lucide-react";
import { getFlightDisplayData } from "@/lib/format";

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
  if (!batch) return null;

  const data = getFlightDisplayData(batch);
  const isRoundTripWithReturn = Boolean(data.isRoundTrip && data.returnDate);

  return (
    <div className={`space-y-1.5 max-w-full ${className}`}>
      {/* Aviasales style Flight Bar container */}
      <div className="inline-flex flex-col max-w-full bg-slate-100/90 dark:bg-[#1a2234] border border-slate-200/90 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-200/80 dark:divide-white/[0.08]">
        {/* Row 1: Outbound Leg (Borish) */}
        <div className="flex items-center flex-nowrap whitespace-nowrap divide-x divide-slate-200/80 dark:divide-white/[0.08]">
          {/* Segment 1: Route (Origin ➔ Destination) */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                {data.origin}
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-white/[0.04]">
                {data.originIata}
              </span>
            </div>

            <span className="text-slate-400 dark:text-slate-500 text-xs px-0.5">➔</span>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                {data.destination}
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-white/[0.04]">
                {data.destIata}
              </span>
            </div>
          </div>

          {/* Segment 2: Outbound Date & Time */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-50/60 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{data.outboundDate}</span>
            </div>
            {data.outboundTime && (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                ({data.outboundTime})
              </span>
            )}
          </div>

          {/* Segment 3: Outbound Flight Number */}
          {data.outboundFlightNumber && (
            <div className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-500/[0.04] shrink-0">
              <Plane className="w-3 h-3 shrink-0" />
              <span>{data.outboundFlightNumber}</span>
            </div>
          )}
        </div>

        {/* Row 2: Return Leg (Qaytish / Obratno) - Agar obratno bo'lsa pastiga tushadi */}
        {isRoundTripWithReturn && (
          <div className="flex items-center flex-nowrap whitespace-nowrap divide-x divide-slate-200/80 dark:divide-white/[0.08] bg-slate-50/30 dark:bg-white/[0.01]">
            {/* Segment 1: Return Route (Destination ➔ Origin) */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                  {data.destination}
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-white/[0.04]">
                  {data.destIata}
                </span>
              </div>

              <span className="text-slate-400 dark:text-slate-500 text-xs px-0.5">➔</span>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                  {data.origin}
                </span>
                <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-white/[0.04]">
                  {data.originIata}
                </span>
              </div>
            </div>

            {/* Segment 2: Return Date & Time */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-50/60 dark:bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-indigo-600 dark:text-indigo-300">
                <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">⇄</span>
                <span>{data.returnDate}</span>
              </div>
              {data.returnTime && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  ({data.returnTime})
                </span>
              )}
            </div>

            {/* Segment 3: Return Flight Number */}
            {(data.returnFlightNumber || data.outboundFlightNumber) && (
              <div className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-500/[0.04] shrink-0">
                <Plane className="w-3 h-3 shrink-0" />
                <span>{data.returnFlightNumber || data.outboundFlightNumber}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subtitle / Administrative context */}
      {showSubtitle && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 px-0.5">
          <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
            {data.batchNumber}
          </span>
          <span>•</span>
          <span>Partiya raqami</span>
          {isRoundTripWithReturn && (
            <>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Borish-qaytish</span>
            </>
          )}
          {batch.baggage && (
            <>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400">{batch.baggage} bagaj</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
