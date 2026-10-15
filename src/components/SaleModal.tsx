"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { formatUSD, formatDate } from "@/lib/format";
import { DatePicker } from "./DatePicker";
import { PartnerSelect } from "./PartnerSelect";
import { FlightBar } from "./FlightBar";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: any[];
  clients: any[];
  selectedBatchId?: number | null;
  onSave: (saleData: {
    clientId: number;
    saleDate: string;
    paidNow: number;
    paymentMethod: string;
    notes: string;
    items: Array<{
      batchId: number;
      qty: number;
      sellPrice: number;
      passengerNames?: string;
      departureTime?: string;
      arrivalTime?: string;
      isRoundTrip?: boolean;
      returnDate?: string;
      returnFlightNumber?: string;
      returnDepartureTime?: string;
      returnArrivalTime?: string;
    }>;
  }) => void;
  onOpenClientModal?: () => void;
  newlyCreatedPartnerId?: number | null;
}

export function SaleModal({
  isOpen,
  onClose,
  batches,
  clients,
  selectedBatchId,
  onSave,
  onOpenClientModal,
  newlyCreatedPartnerId,
}: SaleModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [saleDate, setSaleDate] = useState<string>("");
  const [qty, setQty] = useState<number | string>(1);
  const [sellPrice, setSellPrice] = useState<number | string>(0);
  const [paidNow, setPaidNow] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  const prevIsOpenRef = React.useRef(false);

  // Omborda qoldig'i mavjud bo'lgan partiyalar
  const activeBatches = batches.filter((b) => b.remainingQty > 0);

  // Modal ochilganda qiymatlarni tiklash va partiyani sozlash (faqat yangi ochilganda)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const active = batches.filter((b) => b.remainingQty > 0);
      const targetBatch = selectedBatchId
        ? batches.find((b) => b.id === selectedBatchId)
        : active[0];

      const bId = targetBatch ? String(targetBatch.id) : "";
      setCurrentBatchId(bId);
      setClientId("");
      setQty(1);
      setSellPrice(targetBatch ? Math.round(targetBatch.buyPrice + 30) : 0);
      setSaleDate(new Date().toISOString().split("T")[0]);
      setPaidNow(0);
      setNotes("");
      setError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, selectedBatchId, batches]);

  // Yangi hamkor qo'shilganda avtomatik tanlash
  useEffect(() => {
    if (newlyCreatedPartnerId) {
      setClientId(String(newlyCreatedPartnerId));
    }
  }, [newlyCreatedPartnerId]);

  const handleBatchChange = (newBatchId: string) => {
    setCurrentBatchId(newBatchId);
    const found = batches.find((b) => String(b.id) === newBatchId);
    if (found) {
      setSellPrice(Math.round(found.buyPrice + 30));
      setQty(1);
    }
  };

  const selectedBatch = batches.find((b) => String(b.id) === currentBatchId);
  const isLocked = Boolean(selectedBatchId);

  // Hisob-kitoblar (bo'sh qatorda ham xatoliksiz)
  const numQty = qty === "" ? 0 : Number(qty);
  const numSellPrice = sellPrice === "" ? 0 : Number(sellPrice);
  const numPaidNow = paidNow === "" ? 0 : Number(paidNow);
  const totalAmount = numQty * numSellPrice;
  const totalCost = numQty * (selectedBatch?.buyPrice || 0);
  const profit = totalAmount - totalCost;
  const remainingDebt = Math.max(0, totalAmount - numPaidNow);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBatch) {
      setError("Iltimos, sotiladigan partiyani tanlang!");
      return;
    }

    if (!clientId) {
      setError("Iltimos, hamkorni tanlang!");
      return;
    }

    if (numQty <= 0) {
      setError("Chipta soni kamida 1 ta bo'lishi kerak!");
      return;
    }

    if (numQty > selectedBatch.remainingQty) {
      setError(
        `"${selectedBatch.route}" partiyasida faqat ${selectedBatch.remainingQty} ta chipta mavjud! (${numQty} ta so'ralgan)`
      );
      return;
    }

    if (numSellPrice <= 0) {
      setError("Sotish narxi 0 dan katta bo'lishi kerak!");
      return;
    }

    try {
      onSave({
        clientId: Number(clientId),
        saleDate: saleDate || new Date().toISOString().split("T")[0],
        paidNow: numPaidNow,
        paymentMethod,
        notes,
        items: [
          {
            batchId: Number(selectedBatch.id),
            qty: numQty,
            sellPrice: numSellPrice,
            passengerNames: "",
            departureTime: selectedBatch.departureTime || "",
            arrivalTime: selectedBatch.arrivalTime || "",
            isRoundTrip: Boolean(selectedBatch.isRoundTrip),
            returnDate: selectedBatch.returnDate || undefined,
            returnFlightNumber: selectedBatch.returnFlightNumber || undefined,
            returnDepartureTime: selectedBatch.returnDepartureTime || undefined,
            returnArrivalTime: selectedBatch.returnArrivalTime || undefined,
          },
        ],
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
      title="Chipta sotish"
      maxWidth="max-w-xl md:max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            Jami:{" "}
            <strong className="text-sm sm:text-lg font-bold text-emerald-500 font-mono">
              {formatUSD(totalAmount)}
            </strong>{" "}
            <span className="text-slate-400 font-normal">({numQty} ta chipta)</span>
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
              form="sale-form"
              className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              Sotuvni tasdiqlash
            </button>
          </div>
        </div>
      }
    >
      <form id="sale-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs sm:text-sm bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* 1. AGAR OMBOARDAN EMAS, UMUMIY OCHILGAN BO'LSA - PARTIYA TANLASH */}
        {!isLocked && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Sotiladigan partiyani tanlang *
            </label>
            <select
              value={currentBatchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              required
            >
              <option value="">-- Partiya tanlang --</option>
              {activeBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.route} ({formatDate(b.flightDate, false)} • Qoldiq: {b.remainingQty} ta • Tannarx: {formatUSD(b.buyPrice)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2. REYS VA PARTIYA HAQIDA GDS FORMATIDAGI ANIQ MA'LUMOT KARTASI */}
        {selectedBatch && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="min-w-0">
                <FlightBar batch={selectedBatch} size="md" showSubtitle={false} />
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-slate-400 font-medium">Ombordagi qoldiq:</div>
                <div className="text-base sm:text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {selectedBatch.remainingQty} <span className="text-xs font-semibold text-slate-500">ta</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200/40 dark:border-slate-700/40 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-200/70 dark:bg-white/[0.08] px-2 py-0.5 rounded">
                  {selectedBatch.batchNumber || "---"}
                </span>
                <span>Marshrut: <strong className="text-slate-800 dark:text-slate-200">{selectedBatch.route}</strong></span>
              </div>
              <span>Tannarx: <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatUSD(selectedBatch.buyPrice)}</strong></span>
            </div>
          </div>
        )}

        {/* 3. HAMKOR VA SOTUV SANASI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <PartnerSelect
              label="Hamkor *"
              value={clientId}
              onChange={(val) => setClientId(val)}
              partners={clients}
              onAddNew={onOpenClientModal}
              placeholder="-- Hamkorni tanlang --"
              required
            />
          </div>

          <div>
            <DatePicker
              label="Sotuv sanasi"
              value={saleDate}
              onChange={(val) => setSaleDate(val)}
              required
            />
          </div>
        </div>

        {/* 4. CHIPTA SONI VA SOTISH NARXI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Chipta soni *
            </label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, (Number(qty) || 1) - 1))}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-l-xl font-bold text-sm cursor-pointer border border-r-0 border-slate-300 dark:border-slate-700 shrink-0"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={selectedBatch?.remainingQty || 9999}
                value={qty}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setQty("");
                  } else {
                    const parsed = parseInt(val, 10);
                    setQty(isNaN(parsed) ? "" : parsed);
                  }
                }}
                onBlur={() => {
                  if (qty === "" || Number(qty) < 1) {
                    setQty(1);
                  } else if (selectedBatch && Number(qty) > selectedBatch.remainingQty) {
                    setQty(selectedBatch.remainingQty);
                  }
                }}
                className="w-full text-center py-2 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-y border-slate-300 dark:border-slate-700 focus:outline-none font-black tabular-nums"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setQty(
                    Math.min(
                      selectedBatch?.remainingQty || 9999,
                      (Number(qty) || 0) + 1
                    )
                  )
                }
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-r-xl font-bold text-sm cursor-pointer border border-l-0 border-slate-300 dark:border-slate-700 shrink-0"
              >
                +
              </button>
            </div>
            {selectedBatch && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Maksimal sotish mumkin: <b>{selectedBatch.remainingQty} ta</b>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              1 ta chipta sotish narxi ($) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm sm:text-base font-bold">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={sellPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  setSellPrice(val === "" ? "" : val);
                }}
                onBlur={() => {
                  if (sellPrice === "" || isNaN(Number(sellPrice))) {
                    setSellPrice(0);
                  }
                }}
                className="w-full pl-8 pr-3 py-2 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold tabular-nums"
                required
              />
            </div>
            {selectedBatch && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Tannarx: <b>{formatUSD(selectedBatch.buyPrice)}</b>
              </span>
            )}
          </div>
        </div>

        {/* 5. JAMI SUMMA VA FOYDA HISOBI BAR */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm tabular-nums">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Jami ({numQty} ta chipta):
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              {formatUSD(totalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Sof foyda:</span>
            <span
              className={`font-black text-sm sm:text-base ${
                profit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {profit >= 0 ? `+${formatUSD(profit)}` : `-${formatUSD(Math.abs(profit))}`}
            </span>
          </div>
        </div>

        {/* 6. TO'LOV VA QARZ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1 gap-1 flex-wrap">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hozir to&apos;landi ($)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaidNow(totalAmount)}
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
                max={totalAmount}
                step="any"
                value={paidNow}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaidNow(val === "" ? "" : val);
                }}
                onBlur={() => {
                  if (paidNow === "" || isNaN(Number(paidNow))) {
                    setPaidNow(0);
                  }
                }}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium tabular-nums"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 px-0.5 tabular-nums">
              To‘lanmagan qoldiq:{" "}
              <strong
                className={
                  remainingDebt > 0
                    ? "text-rose-600 dark:text-rose-400 font-bold"
                    : "text-emerald-600 dark:text-emerald-400 font-bold"
                }
              >
                {formatUSD(remainingDebt)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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

        {/* 7. QO'SHIMCHA IZOH */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            placeholder="Qo'shimcha eslatma..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
}
