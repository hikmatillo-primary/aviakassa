"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Plane } from "lucide-react";

export interface AirportOption {
  code: string;
  city: string;
  country: string;
  region: "uz" | "mideast" | "tr_eu" | "cis" | "other";
}

export const AIRPORTS: AirportOption[] = [
  // O'zbekiston ichki
  { code: "TAS", city: "Toshkent", country: "O'zbekiston", region: "uz" },
  { code: "SKD", city: "Samarqand", country: "O'zbekiston", region: "uz" },
  { code: "FEG", city: "Farg'ona", country: "O'zbekiston", region: "uz" },
  { code: "NMA", city: "Namangan", country: "O'zbekiston", region: "uz" },
  { code: "AZN", city: "Andijon", country: "O'zbekiston", region: "uz" },
  { code: "BHK", city: "Buxoro", country: "O'zbekiston", region: "uz" },
  { code: "UGC", city: "Urganch", country: "O'zbekiston", region: "uz" },
  { code: "NCU", city: "Nukus", country: "O'zbekiston", region: "uz" },
  { code: "TMJ", city: "Termiz", country: "O'zbekiston", region: "uz" },
  { code: "NVI", city: "Navoiy", country: "O'zbekiston", region: "uz" },
  { code: "KSQ", city: "Qarshi", country: "O'zbekiston", region: "uz" },

  // Umra & Yaqin Sharq & BAA
  { code: "JED", city: "Jidda", country: "Saudiya Arabistoni", region: "mideast" },
  { code: "MED", city: "Madina", country: "Saudiya Arabistoni", region: "mideast" },
  { code: "DXB", city: "Dubay", country: "BAA", region: "mideast" },
  { code: "DWC", city: "Dubay (Al-Maktum)", country: "BAA", region: "mideast" },
  { code: "SHJ", city: "Sharja", country: "BAA", region: "mideast" },
  { code: "AUH", city: "Abu Dabi", country: "BAA", region: "mideast" },
  { code: "DOH", city: "Doha", country: "Qatar", region: "mideast" },
  { code: "KWI", city: "Quvayt", country: "Quvayt", region: "mideast" },
  { code: "BAH", city: "Bahrayn", country: "Bahrayn", region: "mideast" },
  { code: "MCT", city: "Maskat", country: "Omon", region: "mideast" },
  { code: "RUH", city: "Ar-Riyod", country: "Saudiya Arabistoni", region: "mideast" },

  // Turkiya & Misr & Yevropa
  { code: "IST", city: "Istanbul", country: "Turkiya", region: "tr_eu" },
  { code: "SAW", city: "Istanbul (Sabiha)", country: "Turkiya", region: "tr_eu" },
  { code: "AYT", city: "Antaliya", country: "Turkiya", region: "tr_eu" },
  { code: "ESB", city: "Anqara", country: "Turkiya", region: "tr_eu" },
  { code: "ADB", city: "Izmir", country: "Turkiya", region: "tr_eu" },
  { code: "BJV", city: "Bodrum", country: "Turkiya", region: "tr_eu" },
  { code: "SSH", city: "Sharm-el-Sheyx", country: "Misr", region: "tr_eu" },
  { code: "HRG", city: "Xurgada", country: "Misr", region: "tr_eu" },
  { code: "CAI", city: "Qohira", country: "Misr", region: "tr_eu" },
  { code: "FRA", city: "Frankfurt", country: "Germaniya", region: "tr_eu" },
  { code: "LHR", city: "London", country: "Buyuk Britaniya", region: "tr_eu" },
  { code: "CDG", city: "Parij", country: "Fransiya", region: "tr_eu" },
  { code: "FCO", city: "Rim", country: "Italiya", region: "tr_eu" },
  { code: "MXP", city: "Milan", country: "Italiya", region: "tr_eu" },
  { code: "VIE", city: "Vena", country: "Avstriya", region: "tr_eu" },
  { code: "PRG", city: "Praga", country: "Chexiya", region: "tr_eu" },
  { code: "WAW", city: "Varshava", country: "Polsha", region: "tr_eu" },
  { code: "RIX", city: "Riga", country: "Latviya", region: "tr_eu" },

  // Rossiya & MDH
  { code: "SVO", city: "Moskva (Sheremetyevo)", country: "Rossiya", region: "cis" },
  { code: "DME", city: "Moskva (Domodedovo)", country: "Rossiya", region: "cis" },
  { code: "VKO", city: "Moskva (Vnukovo)", country: "Rossiya", region: "cis" },
  { code: "MOW", city: "Moskva (Barchasi)", country: "Rossiya", region: "cis" },
  { code: "LED", city: "Sankt-Peterburg", country: "Rossiya", region: "cis" },
  { code: "SVX", city: "Yekaterinburg", country: "Rossiya", region: "cis" },
  { code: "OVB", city: "Novosibirsk", country: "Rossiya", region: "cis" },
  { code: "KZN", city: "Qozon", country: "Rossiya", region: "cis" },
  { code: "UFA", city: "Ufa", country: "Rossiya", region: "cis" },
  { code: "AER", city: "Sochi", country: "Rossiya", region: "cis" },
  { code: "KJA", city: "Krasnoyarsk", country: "Rossiya", region: "cis" },
  { code: "IKT", city: "Irkutsk", country: "Rossiya", region: "cis" },
  { code: "ALA", city: "Olmaota", country: "Qozog'iston", region: "cis" },
  { code: "NQZ", city: "Ostona", country: "Qozog'iston", region: "cis" },
  { code: "CIT", city: "Chimkent", country: "Qozog'iston", region: "cis" },
  { code: "FRU", city: "Bishkek", country: "Qirg'iziston", region: "cis" },
  { code: "OSS", city: "O‘sh", country: "Qirg'iziston", region: "cis" },
  { code: "DYU", city: "Dushanbe", country: "Tojikiston", region: "cis" },
  { code: "ASB", city: "Ashxobod", country: "Turkmaniston", region: "cis" },
  { code: "GYD", city: "Boku", country: "Ozarbayjon", region: "cis" },
  { code: "TBS", city: "Tbilisi", country: "Gruziya", region: "cis" },
  { code: "EVN", city: "Yerevan", country: "Armaniston", region: "cis" },
  { code: "MSQ", city: "Minsk", country: "Belarus", region: "cis" },

  // Osiyo & AQSH
  { code: "ICN", city: "Seul", country: "Janubiy Koreya", region: "other" },
  { code: "PEK", city: "Pekin", country: "Xitoy", region: "other" },
  { code: "CAN", city: "Guanchjou", country: "Xitoy", region: "other" },
  { code: "URC", city: "Urumchi", country: "Xitoy", region: "other" },
  { code: "BKK", city: "Bangkok", country: "Tailand", region: "other" },
  { code: "HKT", city: "Pxuket", country: "Tailand", region: "other" },
  { code: "KUL", city: "Kuala-Lumpur", country: "Malayziya", region: "other" },
  { code: "DEL", city: "Dehli", country: "Hindiston", region: "other" },
  { code: "JFK", city: "Nyu-York", country: "AQSH", region: "other" },
];

export function findAirport(value: string | undefined): AirportOption | undefined {
  if (!value) return undefined;
  const val = value.trim().toLowerCase();
  return AIRPORTS.find(
    (a) =>
      a.code.toLowerCase() === val ||
      a.city.toLowerCase() === val ||
      a.city.toLowerCase().includes(val)
  );
}

interface AirportPickerProps {
  label: string;
  value: string; // Ticker kodi (masalan "TAS") yoki shahar nomi
  onChange: (tickerCode: string) => void;
  placeholder?: string;
  className?: string;
}

export function AirportPicker({
  label,
  value,
  onChange,
  placeholder = "Tanlang",
  className = "",
}: AirportPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Qiymatni topish
  const matched = findAirport(value);
  const displayCode = matched ? matched.code : value?.toUpperCase() || "";
  const displayCity = matched ? matched.city : "";

  // Dropdown tashqarisiga bosilganda yopish
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Qidiruv va filtr
  const filteredAirports = AIRPORTS.filter((a) => {
    if (regionFilter !== "all" && a.region !== regionFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch("");
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      handleSelect(search.trim().toUpperCase());
    } else if (filteredAirports.length > 0) {
      handleSelect(filteredAirports[0].code);
    }
  };

  return (
    <div className={`relative ${isOpen ? "z-40" : ""} ${className}`} ref={containerRef}>
      {/* Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group flex flex-col justify-between min-h-[52px]"
      >
        <div className="flex items-center justify-between w-full">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              isOpen ? "rotate-180 text-blue-600" : "group-hover:text-slate-600 dark:group-hover:text-slate-200"
            }`}
          />
        </div>

        <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap leading-tight">
          {displayCode ? (
            <>
              {/* Ticker (Katta, qalin harflarda) */}
              <span className="text-sm sm:text-base font-black font-mono tracking-wide text-slate-900 dark:text-white uppercase">
                {displayCode}
              </span>
              {/* Shahar nomi (Kichikroq, nozikroq) */}
              {displayCity && (
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {displayCity}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-400 italic font-medium">{placeholder}</span>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-84 bg-white dark:bg-[#111726] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/[0.1] z-50 p-2.5 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          <form onSubmit={handleCustomSubmit} className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ticker yoki shahar (TAS, JED, Dubay...)"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0c121e] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </form>

          {/* Region Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1.5 border-b border-slate-100 dark:border-white/[0.06] text-[10px] font-semibold scrollbar-none">
            {[
              { id: "all", label: "Barchasi" },
              { id: "uz", label: "O‘zbekiston" },
              { id: "mideast", label: "Umra / BAA" },
              { id: "tr_eu", label: "Turkiya / Misr" },
              { id: "cis", label: "Rossiya / MDH" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRegionFilter(tab.id)}
                className={`px-2 py-0.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  regionFilter === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Airports List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 text-xs">
            {filteredAirports.map((item) => {
              const isSelected = displayCode === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer group ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                      : "hover:bg-slate-100/80 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-[#1a233a] px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 tracking-wider">
                      {item.code}
                    </span>
                    <div className="min-w-0">
                      <span className="block font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {item.city}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {item.country}
                      </span>
                    </div>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}

            {filteredAirports.length === 0 && (
              <div className="py-3 text-center">
                <p className="text-[11px] text-slate-400 mb-1.5">Ro‘yxatdan topilmadi</p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(search.trim().toUpperCase())}
                    className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Ticker sifatida ishlatish: &ldquo;{search.trim().toUpperCase()}&rdquo;
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
