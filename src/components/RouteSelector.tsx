"use client";

import React, { useState, useRef, useEffect } from "react";
import { PlaneTakeoff, PlaneLanding, ArrowLeftRight, Search, Check, MapPin } from "lucide-react";

export interface Airport {
  code: string;
  city: string;
  country: string;
  category: "UZB" | "ME_UMRAH" | "TURKEY" | "CIS" | "WORLD";
}

export const POPULAR_AIRPORTS: Airport[] = [
  // O'zbekiston
  { code: "TAS", city: "Toshkent", country: "O'zbekiston", category: "UZB" },
  { code: "SKD", city: "Samarqand", country: "O'zbekiston", category: "UZB" },
  { code: "FEG", city: "Farg'ona", country: "O'zbekiston", category: "UZB" },
  { code: "NMA", city: "Namangan", country: "O'zbekiston", category: "UZB" },
  { code: "BHK", city: "Buxoro", country: "O'zbekiston", category: "UZB" },
  { code: "UGC", city: "Urganch", country: "O'zbekiston", category: "UZB" },
  { code: "NCU", city: "Nukus", country: "O'zbekiston", category: "UZB" },
  { code: "TMJ", city: "Termiz", country: "O'zbekiston", category: "UZB" },
  { code: "NVI", city: "Navoiy", country: "O'zbekiston", category: "UZB" },
  { code: "AZN", city: "Andijon", country: "O'zbekiston", category: "UZB" },

  // Yaqin Sharq & Umra yo'nalishlari
  { code: "DXB", city: "Dubay", country: "BAA", category: "ME_UMRAH" },
  { code: "SHJ", city: "Sharja", country: "BAA", category: "ME_UMRAH" },
  { code: "AUH", city: "Abu-Dabi", country: "BAA", category: "ME_UMRAH" },
  { code: "JED", city: "Jidda", country: "Saudiya Arabistoni", category: "ME_UMRAH" },
  { code: "MED", city: "Madina", country: "Saudiya Arabistoni", category: "ME_UMRAH" },
  { code: "RUH", city: "Ar-Riyod", country: "Saudiya Arabistoni", category: "ME_UMRAH" },
  { code: "DOH", city: "Doha", country: "Qatar", category: "ME_UMRAH" },
  { code: "KWI", city: "Kuvayt", country: "Kuvayt", category: "ME_UMRAH" },

  // Turkiya & Kurortlar
  { code: "IST", city: "Istanbul", country: "Turkiya", category: "TURKEY" },
  { code: "SAW", city: "Istanbul (Sabiha)", country: "Turkiya", category: "TURKEY" },
  { code: "AYT", city: "Antaliya", country: "Turkiya", category: "TURKEY" },
  { code: "BJV", city: "Bodrum", country: "Turkiya", category: "TURKEY" },
  { code: "SSH", city: "Sharm-el-Sheyx", country: "Misr", category: "TURKEY" },
  { code: "HRG", city: "Xurgada", country: "Misr", category: "TURKEY" },

  // MDH & Kavkaz
  { code: "VKO", city: "Moskva (Vnukovo)", country: "Rossiya", category: "CIS" },
  { code: "DME", city: "Moskva (Domodedovo)", country: "Rossiya", category: "CIS" },
  { code: "SVO", city: "Moskva (Sheremetyevo)", country: "Rossiya", category: "CIS" },
  { code: "LED", city: "Sankt-Peterburg", country: "Rossiya", category: "CIS" },
  { code: "KZN", city: "Qozon", country: "Rossiya", category: "CIS" },
  { code: "SVX", city: "Yekaterinburg", country: "Rossiya", category: "CIS" },
  { code: "OVB", city: "Novosibirsk", country: "Rossiya", category: "CIS" },
  { code: "ALA", city: "Olmaota", country: "Qozog'iston", category: "CIS" },
  { code: "NQZ", city: "Ostona", country: "Qozog'iston", category: "CIS" },
  { code: "FRU", city: "Bishkek", country: "Qirg'iziston", category: "CIS" },
  { code: "DYU", city: "Dushanbe", country: "Tojikiston", category: "CIS" },
  { code: "TBS", city: "Tbilisi", country: "Gruziya", category: "CIS" },
  { code: "BUS", city: "Batumi", country: "Gruziya", category: "CIS" },
  { code: "GYD", city: "Boku", country: "Ozarbayjon", category: "CIS" },

  // Jahon & Osiyo
  { code: "DEL", city: "Dehli", country: "Hindiston", category: "WORLD" },
  { code: "BKK", city: "Bangkok", country: "Tailand", category: "WORLD" },
  { code: "HKT", city: "Phuket", country: "Tailand", category: "WORLD" },
  { code: "KUL", city: "Kuala-Lumpur", country: "Malayziya", category: "WORLD" },
  { code: "ICN", city: "Seul", country: "Janubiy Koreya", category: "WORLD" },
  { code: "PKX", city: "Pekin", country: "Xitoy", category: "WORLD" },
  { code: "FRA", city: "Frankfurt", country: "Germaniya", category: "WORLD" },
  { code: "LHR", city: "London", country: "Buyuk Britaniya", category: "WORLD" },
  { code: "JFK", city: "Nyu-York", country: "AQSH", category: "WORLD" },
];

const CATEGORY_NAMES = {
  UZB: "O'zbekiston shaharlari",
  ME_UMRAH: "Yaqin Sharq & Umra",
  TURKEY: "Turkiya & Kurortlar",
  CIS: "MDH & Kavkaz",
  WORLD: "Osiyo & Jahon",
};

interface RouteSelectorProps {
  initialOrigin?: string;
  initialDestination?: string;
  onChange: (route: string, origin: Airport | { city: string; code: string; country: string }, destination: Airport | { city: string; code: string; country: string }) => void;
}

export function RouteSelector({
  initialOrigin = "Toshkent",
  initialDestination = "Dubay",
  onChange,
}: RouteSelectorProps) {
  // Find initial airport or create custom
  const findAirport = (query: string, defaultCode: string) => {
    const found = POPULAR_AIRPORTS.find(
      (a) => a.city.toLowerCase() === query.toLowerCase() || a.code.toLowerCase() === query.toLowerCase()
    );
    if (found) return found;
    return {
      code: defaultCode,
      city: query,
      country: "Xalqaro",
      category: "WORLD" as const,
    };
  };

  const [origin, setOrigin] = useState<Airport | { city: string; code: string; country: string }>(
    findAirport(initialOrigin, "TAS")
  );
  const [destination, setDestination] = useState<Airport | { city: string; code: string; country: string }>(
    findAirport(initialDestination, "DXB")
  );

  const [activeDropdown, setActiveDropdown] = useState<"ORIGIN" | "DESTINATION" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (activeDropdown && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [activeDropdown]);

  // Sync to parent whenever origin or destination changes
  useEffect(() => {
    const formattedRoute = `${origin.city} — ${destination.city}`;
    onChange(formattedRoute, origin, destination);
  }, [origin, destination, onChange]);

  // Swap handler
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Filtered airports
  const filteredAirports = POPULAR_AIRPORTS.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.city.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    );
  });

  const handleSelectAirport = (airport: Airport | { code: string; city: string; country: string }) => {
    if (activeDropdown === "ORIGIN") {
      setOrigin(airport);
    } else if (activeDropdown === "DESTINATION") {
      setDestination(airport);
    }
    setActiveDropdown(null);
    setSearchQuery("");
  };

  // Custom city submission if not found
  const handleSelectCustom = () => {
    if (!searchQuery.trim()) return;
    const trimmed = searchQuery.trim();
    const custom = {
      code: trimmed.slice(0, 3).toUpperCase(),
      city: trimmed,
      country: "Xalqaro",
    };
    handleSelectAirport(custom);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        Yo&apos;nalish (Qayerdan ➔ Qayerga) *
      </label>

      {/* Visual Airline-style 2-Card Picker */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        {/* Card 1: Qayerdan */}
        <button
          type="button"
          onClick={() => {
            setActiveDropdown(activeDropdown === "ORIGIN" ? null : "ORIGIN");
            setSearchQuery("");
          }}
          className={`flex flex-col text-left px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeDropdown === "ORIGIN"
              ? "bg-white dark:bg-slate-700 ring-2 ring-blue-500 shadow-xs"
              : "bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1">
            <PlaneTakeoff className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Qayerdan
          </span>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-sm font-black text-slate-900 dark:text-white truncate">
              {origin.city}
            </span>
            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 ml-1.5 shrink-0">
              {origin.code}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {origin.country}
          </span>
        </button>

        {/* Swap Button (⇄) */}
        <button
          type="button"
          onClick={handleSwap}
          title="Yo'nalishlarni almashtirish (Qayerdan ⇄ Qayerga)"
          className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 flex items-center justify-center transition-all shadow-xs cursor-pointer active:rotate-180 duration-200 shrink-0"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>

        {/* Card 2: Qayerga */}
        <button
          type="button"
          onClick={() => {
            setActiveDropdown(activeDropdown === "DESTINATION" ? null : "DESTINATION");
            setSearchQuery("");
          }}
          className={`flex flex-col text-left px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeDropdown === "DESTINATION"
              ? "bg-white dark:bg-slate-700 ring-2 ring-blue-500 shadow-xs"
              : "bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1">
            <PlaneLanding className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Qayerga
          </span>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-sm font-black text-slate-900 dark:text-white truncate">
              {destination.city}
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 ml-1.5 shrink-0">
              {destination.code}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {destination.country}
          </span>
        </button>
      </div>

      {/* Selected Route Preview Pill */}
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <span>Tanlangan reys:</span>
        <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 font-mono">
          {origin.city} ({origin.code}) ➔ {destination.city} ({destination.code})
        </span>
      </div>

      {/* Modern Flight Dropdown Popover */}
      {activeDropdown && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[380px] flex flex-col">
          {/* Header & Search Bar */}
          <div className="relative mb-2 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                activeDropdown === "ORIGIN"
                  ? "Uchish shahrini yoki kodini yozing..."
                  : "Qo'nish shahrini yoki kodini yozing..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredAirports.length > 0) {
                    handleSelectAirport(filteredAirports[0]);
                  } else {
                    handleSelectCustom();
                  }
                }
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Popular Tags */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Ommabop:</span>
            {(activeDropdown === "ORIGIN"
              ? ["TAS", "SKD", "FEG", "NMA", "BHK"]
              : ["DXB", "JED", "MED", "IST", "SSH", "AYT", "VKO"]
            ).map((code) => {
              const apt = POPULAR_AIRPORTS.find((a) => a.code === code);
              if (!apt) return null;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectAirport(apt)}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                >
                  {apt.city} ({apt.code})
                </button>
              );
            })}
          </div>

          {/* Scrollable Airport List */}
          <div className="overflow-y-auto space-y-3 flex-1 pr-1">
            {/* If user types custom city that is not in list */}
            {searchQuery.trim() && filteredAirports.length === 0 && (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Ro&apos;yxatda topilmadi. Shahar nomini saqlamoqchimisiz?
                </p>
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  &quot;{searchQuery.trim()}&quot; deb qabul qilish
                </button>
              </div>
            )}

            {/* Render by categories */}
            {(["UZB", "ME_UMRAH", "TURKEY", "CIS", "WORLD"] as const).map((cat) => {
              const items = filteredAirports.filter((a) => a.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2 py-0.5">
                    {CATEGORY_NAMES[cat]}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {items.map((airport) => {
                      const isSelected =
                        (activeDropdown === "ORIGIN" && origin.city === airport.city) ||
                        (activeDropdown === "DESTINATION" && destination.city === airport.city);

                      return (
                        <button
                          key={airport.code + airport.city}
                          type="button"
                          onClick={() => handleSelectAirport(airport)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer w-full text-left ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold truncate">{airport.city}</span>
                            <span className="text-[11px] text-slate-400 font-normal truncate">
                              ({airport.country})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                              {airport.code}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
