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
  totalQty: number | string;
  buyPrice: number | string;
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

import { DatePicker } from "./DatePicker";
import { PartnerSelect } from "./PartnerSelect";

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
  const [paidNow, setPaidNow] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  const [items, setItems] = useState<BatchItemInput[]>([]);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setItems([
        {
          id: Math.random().toString(),
          fromCity: "TAS",
          toCity: "DXB",
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
        fromCity: "TAS",
        toCity: "JED",
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
    (sum, it) => sum + (Number(it.totalQty) || 0) * (Number(it.buyPrice) || 0),
    0
  );
  const totalTickets = items.reduce((sum, it) => sum + (Number(it.totalQty) || 0), 0);
  const remainingDebt = Math.max(0, totalCost - (Number(paidNow) || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Iltimos, hamkorni tanlang!");
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
      if (Number(it.totalQty) <= 0) {
        setError(`${i + 1}-qatorda chiptalar soni kamida 1 ta bo'lishi kerak!`);
        return;
      }
      if (Number(it.buyPrice) <= 0) {
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
      maxWidth="max-w-4xl md:max-w-5xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            Jami: <strong className="text-sm sm:text-lg font-bold text-amber-500 font-mono">{formatUSD(totalCost)}</strong>{" "}
            <span className="text-slate-400 font-normal">({totalTickets} ta chipta)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              form="batch-form"
              className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              Xaridni qabul qilish
            </button>
          </div>
        </div>
      }
    >
      <form id="batch-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* 1. Hamkor va Xarid Sanasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <PartnerSelect
              label="Hamkor *"
              value={supplierId}
              onChange={(val) => setSupplierId(val)}
              partners={suppliers}
              onAddNew={onOpenSupplierModal}
              required
            />
          </div>

          <div>
            <DatePicker
              label="Xarid sanasi"
              value={purchaseDate}
              onChange={(val) => setPurchaseDate(val)}
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
          </div>

          <div className="space-y-3 pb-2">
            {items.map((item, index) => {
              const itemTotal = (Number(item.totalQty) || 0) * (Number(item.buyPrice) || 0);
              const autoBatchNumber = getAutoBatchCode(item.toCity, index);

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3"
                >
                  {/* AVIASALES USLUBIDAGI 1-QATOR: [Qayerdan] | [Qayerga] | [Qachon] | [Qaytish (Obratno)] */}
                  <div className="flex items-stretch gap-1.5 flex-col sm:flex-row">
                    <div className="grid grid-cols-2 sm:grid-cols-4 flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 divide-y sm:divide-y-0 divide-x divide-slate-200 dark:divide-slate-700/80 shadow-2xs">
                      {/* Qayerdan */}
                      <div className="p-2 sm:p-2.5 flex flex-col justify-between">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                          Qayerdan:
                        </label>
                        <input
                          type="text"
                          placeholder="TAS"
                          value={item.fromCity}
                          onChange={(e) =>
                            handleUpdateItem(index, "fromCity", e.target.value.toUpperCase())
                          }
                          className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-bold tracking-wider"
                          required
                        />
                      </div>

                      {/* Qayerga */}
                      <div className="p-2 sm:p-2.5 flex flex-col justify-between">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                          Qayerga:
                        </label>
                        <input
                          type="text"
                          placeholder="DXB"
                          value={item.toCity}
                          onChange={(e) =>
                            handleUpdateItem(index, "toCity", e.target.value.toUpperCase())
                          }
                          className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-bold tracking-wider"
                          required
                        />
                      </div>

                      {/* Qachon (Borish sanasi) */}
                      <div className="p-1.5 flex flex-col justify-between">
                        <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-0.5">
                          Qachon (Borish):
                        </label>
                        <DatePicker
                          value={item.flightDate}
                          onChange={(val) => handleUpdateItem(index, "flightDate", val)}
                          compact
                          required
                        />
                      </div>

                      {/* Qaytish (Obratno sanasi) */}
                      <div className="p-1.5 flex flex-col justify-between bg-blue-50/30 dark:bg-blue-950/20">
                        <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-0.5">
                          ⇄ Qaytish (Obratno):
                        </label>
                        <DatePicker
                          value={item.returnDate || ""}
                          onChange={(val) => handleUpdateItem(index, "returnDate", val)}
                          placeholder="Tanlanmagan"
                          compact
                          clearable
                          align="right"
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
                          handleUpdateItem(index, "flightNumber", e.target.value.toUpperCase())
                        }
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Chipta soni *
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItem(
                              index,
                              "totalQty",
                              Math.max(1, (Number(item.totalQty) || 1) - 1)
                            )
                          }
                          className="w-6 h-[30px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-l-xl font-bold text-xs cursor-pointer border border-r-0 border-slate-300 dark:border-slate-700 shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.totalQty}
                          onChange={(e) =>
                            handleUpdateItem(
                              index,
                              "totalQty",
                              e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 0)
                            )
                          }
                          onBlur={() => {
                            if (item.totalQty === "" || Number(item.totalQty) < 1) {
                              handleUpdateItem(index, "totalQty", 1);
                            }
                          }}
                          className="w-full text-center py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-y border-slate-300 dark:border-slate-700 focus:outline-none font-bold tabular-nums"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateItem(
                              index,
                              "totalQty",
                              (Number(item.totalQty) || 0) + 1
                            )
                          }
                          className="w-6 h-[30px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-r-xl font-bold text-xs cursor-pointer border border-l-0 border-slate-300 dark:border-slate-700 shrink-0"
                        >
                          +
                        </button>
                      </div>
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
                              e.target.value === "" ? "" : e.target.value
                            )
                          }
                          onBlur={() => {
                            if (item.buyPrice === "" || isNaN(Number(item.buyPrice))) {
                              handleUpdateItem(index, "buyPrice", 0);
                            } else {
                              handleUpdateItem(index, "buyPrice", Number(item.buyPrice));
                            }
                          }}
                          className="w-full pl-5 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold tabular-nums"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Bagaj (kg)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={
                            item.baggage === "Bagajsiz"
                              ? "0"
                              : item.baggage !== undefined
                              ? item.baggage.replace(/[^0-9]/g, "")
                              : "20"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              handleUpdateItem(index, "baggage", "");
                            } else if (val === "0") {
                              handleUpdateItem(index, "baggage", "0 kg");
                            } else {
                              handleUpdateItem(index, "baggage", `${val} kg`);
                            }
                          }}
                          onBlur={() => {
                            if (item.baggage === "") {
                              handleUpdateItem(index, "baggage", "20 kg");
                            }
                          }}
                          placeholder="20"
                          className="w-full pl-2.5 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold tabular-nums"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 pointer-events-none">
                          kg
                        </span>
                      </div>
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
                            handleUpdateItem(index, "returnFlightNumber", e.target.value.toUpperCase())
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-indigo-300 dark:border-indigo-700 rounded-xl uppercase font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Qator pastki qismi */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 px-0.5 border-t border-slate-200/50 dark:border-slate-700/50 tabular-nums">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Partiya kodi (avto):{" "}
                      <strong className="text-blue-600 dark:text-blue-400 font-bold">
                        {autoBatchNumber}
                      </strong>
                    </span>
                    <span>
                      Jami:{" "}
                      <strong className="text-amber-600 dark:text-amber-400 font-bold text-xs">
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
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs tabular-nums">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Jami xarid ({totalTickets} ta chipta):
          </span>
          <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
            {formatUSD(totalCost)}
          </span>
        </div>

        {/* 4. To'lov */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hozir to&apos;landi ($)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaidNow(totalCost)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                >
                  To‘liq (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setPaidNow(0)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Qarzga ($0)
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                max={totalCost}
                step="any"
                value={paidNow}
                onChange={(e) => setPaidNow(e.target.value === "" ? "" : e.target.value)}
                onBlur={() => {
                  if (paidNow === "" || isNaN(Number(paidNow))) {
                    setPaidNow(0);
                  } else {
                    setPaidNow(Math.max(0, Math.min(totalCost, Number(paidNow))));
                  }
                }}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium tabular-nums"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 px-0.5 tabular-nums">
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
      </form>
    </Modal>
  );
}
