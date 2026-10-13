"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Plus, Trash2, Sparkles, PlaneTakeoff, PlaneLanding, X } from "lucide-react";
import { formatUSD } from "@/lib/format";

export interface BatchItemInput {
  id: string;
  fromCity: string;
  toCity: string;
  flightDate: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  isRoundTrip: boolean;
  returnDate: string;
  returnFlightNumber: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
  totalQty: number;
  buyPrice: number;
  baggage: string;
}

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: any[];
  onSave: (batchData: {
    supplierId: number;
    purchaseDate?: string;
    paidNow?: number;
    paymentMethod?: string;
    notes?: string;
    items: Array<{
      route: string;
      flightDate: string;
      flightNumber?: string;
      departureTime?: string;
      arrivalTime?: string;
      isRoundTrip?: boolean;
      returnDate?: string;
      returnFlightNumber?: string;
      returnDepartureTime?: string;
      returnArrivalTime?: string;
      totalQty: number;
      buyPrice: number;
      baggage?: string;
      notes?: string;
      batchNumber?: string;
    }>;
  }) => void;
  onOpenSupplierModal?: () => void;
}

const POPULAR_CITIES = [
  "Toshkent",
  "Samarqand",
  "Farg'ona",
  "Namangan",
  "Buxoro",
  "Urganch",
  "Dubay",
  "Jidda",
  "Madina",
  "Sharja",
  "Istanbul",
  "Antaliya",
  "Sharm-el-Sheyx",
  "Moskva",
  "Sankt-Peterburg",
];

function getAutoBatchCode(toCity: string, index: number): string {
  const clean = (toCity || "BLK").trim();
  const code = clean.slice(0, 3).toUpperCase() || "BLK";
  return `P-${code}-${101 + index}`;
}

export function BatchModal({
  isOpen,
  onClose,
  suppliers,
  onSave,
  onOpenSupplierModal,
}: BatchModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  const [items, setItems] = useState<BatchItemInput[]>([]);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setItems([
        {
          id: Math.random().toString(),
          fromCity: "Toshkent",
          toCity: "Dubay",
          flightDate: today,
          flightNumber: "FZ-780",
          departureTime: "08:30",
          arrivalTime: "12:15",
          isRoundTrip: false,
          returnDate: "",
          returnFlightNumber: "",
          returnDepartureTime: "14:00",
          returnArrivalTime: "19:30",
          totalQty: 50,
          buyPrice: 300,
          baggage: "20 kg",
        },
      ]);
      setPurchaseDate(today);
      setPaidNow(0);
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  const handleAddItem = () => {
    const today = new Date().toISOString().split("T")[0];
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        fromCity: "Toshkent",
        toCity: "Jidda",
        flightDate: today,
        flightNumber: "",
        departureTime: "09:00",
        arrivalTime: "14:20",
        isRoundTrip: false,
        returnDate: "",
        returnFlightNumber: "",
        returnDepartureTime: "16:00",
        returnArrivalTime: "21:45",
        totalQty: 30,
        buyPrice: 400,
        baggage: "20 kg",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof BatchItemInput, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };
      if (field === "returnDate") {
        updated.isRoundTrip = Boolean(value);
      }
      next[index] = updated;
      return next;
    });
  };

  // Calculations
  const totalCost = items.reduce(
    (sum, it) => sum + (it.totalQty || 0) * (it.buyPrice || 0),
    0
  );
  const totalTickets = items.reduce((sum, it) => sum + (it.totalQty || 0), 0);
  const remainingDebt = Math.max(0, totalCost - (paidNow || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Iltimos, ta'minotchini tanlang!");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.fromCity.trim() || !it.toCity.trim()) {
        setError(`${i + 1}-qatorda "Qayerdan" va "Qayerga" shaharlarini kiriting!`);
        return;
      }
      if (!it.flightDate) {
        setError(`${i + 1}-qatorda uchish sanasi tanlanmagan!`);
        return;
      }
      if (it.totalQty <= 0) {
        setError(`${i + 1}-qatorda chiptalar soni kamida 1 ta bo'lishi kerak!`);
        return;
      }
      if (it.buyPrice <= 0) {
        setError(`${i + 1}-qatorda tannarx 0 dan katta bo'lishi kerak!`);
        return;
      }
    }

    try {
      onSave({
        supplierId: Number(supplierId),
        purchaseDate: purchaseDate || new Date().toISOString().split("T")[0],
        paidNow: Number(paidNow) || 0,
        paymentMethod,
        notes,
        items: items.map((it, idx) => {
          const fullRoute = `${it.fromCity.trim()} — ${it.toCity.trim()}`;
          const hasReturn = Boolean(it.isRoundTrip && it.returnDate);
          return {
            route: fullRoute,
            flightDate: it.flightDate,
            flightNumber: it.flightNumber.trim().toUpperCase(),
            departureTime: it.departureTime,
            arrivalTime: it.arrivalTime,
            isRoundTrip: hasReturn,
            returnDate: hasReturn ? it.returnDate : undefined,
            returnFlightNumber: hasReturn
              ? it.returnFlightNumber.trim().toUpperCase()
              : undefined,
            returnDepartureTime: hasReturn ? it.returnDepartureTime : undefined,
            returnArrivalTime: hasReturn ? it.returnArrivalTime : undefined,
            totalQty: Number(it.totalQty),
            buyPrice: Number(it.buyPrice),
            baggage: it.baggage,
            batchNumber: getAutoBatchCode(it.toCity, idx),
          };
        }),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi!");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yangi xarid (Chipta bloki olish)"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        <datalist id="popular-cities-list">
          {POPULAR_CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {/* 1. Ta'minotchi va Xarid Sanasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ta&apos;minotchi (Kompaniya) *
              </label>
              {onOpenSupplierModal && (
                <button
                  type="button"
                  onClick={onOpenSupplierModal}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  + Yangi ta&apos;minotchi
                </button>
              )}
            </div>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            >
              <option value="">-- Ta&apos;minotchini tanlang --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Xarid sanasi *
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>
        </div>

        {/* 2. Xarid qilinayotgan reyslar (Aviasales uslubidagi blok) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Xarid qilinayotgan reyslar ({items.length} ta)
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Reys qo‘shish
            </button>
          </div>

          <div className="space-y-3 sm:max-h-[360px] sm:overflow-y-auto pr-0.5">
            {items.map((item, index) => {
              const itemTotal = (item.totalQty || 0) * (item.buyPrice || 0);
              const autoBatchNumber = getAutoBatchCode(item.toCity, index);

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3"
                >
                  {/* AVIASALES USLUBIDAGI 1-QATOR: [Qayerdan] | [Qayerga] | [Qachon] | [Qaytish (Obratno)] */}
                  <div className="flex items-stretch gap-1.5 flex-col sm:flex-row">
                    <div className="grid grid-cols-2 sm:grid-cols-4 flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden divide-y sm:divide-y-0 divide-x divide-slate-200 dark:divide-slate-700/80 shadow-2xs">
                      {/* Qayerdan */}
                      <div className="p-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">
                          Qayerdan:
                        </label>
                        <input
                          list="popular-cities-list"
                          type="text"
                          placeholder="Toshkent"
                          value={item.fromCity}
                          onChange={(e) =>
                            handleUpdateItem(index, "fromCity", e.target.value)
                          }
                          className="w-full text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white bg-transparent focus:outline-none mt-0.5"
                          required
                        />
                      </div>

                      {/* Qayerga */}
                      <div className="p-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">
                          Qayerga:
                        </label>
                        <input
                          list="popular-cities-list"
                          type="text"
                          placeholder="Dubay"
                          value={item.toCity}
                          onChange={(e) =>
                            handleUpdateItem(index, "toCity", e.target.value)
                          }
                          className="w-full text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white bg-transparent focus:outline-none mt-0.5"
                          required
                        />
                      </div>

                      {/* Qachon (Borish sanasi) */}
                      <div className="p-2">
                        <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                          Qachon (Borish):
                        </label>
                        <input
                          type="date"
                          value={item.flightDate}
                          onChange={(e) =>
                            handleUpdateItem(index, "flightDate", e.target.value)
                          }
                          className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none mt-0.5"
                          required
                        />
                      </div>

                      {/* Qaytish (Obratno sanasi) */}
                      <div className="p-2 relative bg-blue-50/30 dark:bg-blue-950/20">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                            ⇄ Qaytish (Obratno):
                          </label>
                          {item.returnDate && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(index, "returnDate", "")}
                              title="Obratnoni olib tashlash"
                              className="text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <input
                          type="date"
                          value={item.returnDate}
                          onChange={(e) =>
                            handleUpdateItem(index, "returnDate", e.target.value)
                          }
                          className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none mt-0.5"
                        />
                      </div>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        title="Ushbu reysni o'chirish"
                        className="px-2.5 py-2 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 2-QATOR: BORISH UCHISH-QO'NISH VAQTLARI, REYS, SONI, TANNARX, BAGAJ */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        <PlaneTakeoff className="w-3 h-3 text-blue-500" /> Uchish vaqti
                      </label>
                      <input
                        type="time"
                        value={item.departureTime}
                        onChange={(e) =>
                          handleUpdateItem(index, "departureTime", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        <PlaneLanding className="w-3 h-3 text-emerald-500" /> Qo‘nish vaqti
                      </label>
                      <input
                        type="time"
                        value={item.arrivalTime}
                        onChange={(e) =>
                          handleUpdateItem(index, "arrivalTime", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Borish reysi
                      </label>
                      <input
                        type="text"
                        placeholder="FZ-780"
                        value={item.flightNumber}
                        onChange={(e) =>
                          handleUpdateItem(index, "flightNumber", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Chipta soni *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.totalQty}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "totalQty",
                            Math.max(1, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Tannarx ($) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.buyPrice}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "buyPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full pl-5 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Bagaj
                      </label>
                      <select
                        value={item.baggage}
                        onChange={(e) =>
                          handleUpdateItem(index, "baggage", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="20 kg">20 kg</option>
                        <option value="25 kg">25 kg</option>
                        <option value="30 kg">30 kg</option>
                        <option value="Qo'l yuki (7 kg)">7 kg</option>
                        <option value="Bagajsiz">Bagajsiz</option>
                      </select>
                    </div>
                  </div>

                  {/* 3-QATOR: AGAR QAYTISH (OBRATNO) SANASI TANLANGAN BO'LSA — QAYTISH UCHISH-QO'NISH VAQTLARI */}
                  {item.returnDate && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60">
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">
                          <PlaneTakeoff className="w-3 h-3" /> ⇄ Qaytish uchish vaqti
                        </label>
                        <input
                          type="time"
                          value={item.returnDepartureTime}
                          onChange={(e) =>
                            handleUpdateItem(index, "returnDepartureTime", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-indigo-300 dark:border-indigo-700 rounded-xl font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">
                          <PlaneLanding className="w-3 h-3" /> ⇄ Qaytish qo‘nish vaqti
                        </label>
                        <input
                          type="time"
                          value={item.returnArrivalTime}
                          onChange={(e) =>
                            handleUpdateItem(index, "returnArrivalTime", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-indigo-300 dark:border-indigo-700 rounded-xl font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">
                          ⇄ Qaytish reys raqami
                        </label>
                        <input
                          type="text"
                          placeholder="Masalan: FZ-781"
                          value={item.returnFlightNumber}
                          onChange={(e) =>
                            handleUpdateItem(index, "returnFlightNumber", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-indigo-300 dark:border-indigo-700 rounded-xl uppercase font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Qator pastki qismi */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 px-0.5 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Partiya kodi (avto):{" "}
                      <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold">
                        {autoBatchNumber}
                      </strong>
                    </span>
                    <span>
                      Jami:{" "}
                      <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs">
                        {formatUSD(itemTotal)}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yana reys (mahsulot) qo‘shish
          </button>
        </div>

        {/* 3. Real-time Calculation Summary Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Jami xarid ({totalTickets} ta chipta):
          </span>
          <span className="font-black font-mono text-sm text-amber-600 dark:text-amber-400">
            {formatUSD(totalCost)}
          </span>
        </div>

        {/* 4. To'lov */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hozir to&apos;landi ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                max={totalCost}
                step="any"
                value={paidNow || ""}
                onChange={(e) => setPaidNow(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 px-0.5">
              Qarz:{" "}
              <strong
                className={
                  remainingDebt > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {formatUSD(remainingDebt)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              To&apos;lov usuli
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="CASH">Naqd (Cash)</option>
              <option value="CARD">Karta / O&apos;tkazma</option>
              <option value="BANK">Bank hisob raqami</option>
            </select>
          </div>
        </div>

        {/* 5. Izoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            placeholder="Charter shartnomasi, eslatma..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            Xaridni qabul qilish
          </button>
        </div>
      </form>
    </Modal>
  );
}
