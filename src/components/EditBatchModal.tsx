"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { DatePicker } from "./DatePicker";
import { PartnerSelect, PartnerItem } from "./PartnerSelect";
import { formatUSD } from "@/lib/format";
import { getValidationMessage } from "@/lib/api";
import { PlaneTakeoff, PlaneLanding, Loader2, Info } from "lucide-react";
import { Batch } from "@/lib/storage";

export interface BatchUpdatePayload {
  supplierId: number;
  purchaseDate?: string | null;
  batchNumber: string;
  route: string;
  flightDate: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  isRoundTrip: boolean;
  returnDate?: string | null;
  returnFlightNumber: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
  totalQty: number;
  buyPrice: number;
  baggage: string;
  notes: string;
}

interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  suppliers: PartnerItem[];
  onOpenSupplierModal?: () => void;
  onSave: (batchId: number, data: BatchUpdatePayload) => void | Promise<void>;
}

function splitRoute(route?: string): { from: string; to: string } {
  const raw = (route || "").trim();
  if (!raw) return { from: "", to: "" };
  const parts = raw.split(/\s*[—–-]\s*/);
  if (parts.length >= 2) {
    return { from: parts[0].trim(), to: parts.slice(1).join(" - ").trim() };
  }
  return { from: raw, to: "" };
}

export function EditBatchModal({
  isOpen,
  onClose,
  batch,
  suppliers,
  onOpenSupplierModal,
  onSave,
}: EditBatchModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierId, setSupplierId] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [fromCity, setFromCity] = useState<string>("");
  const [toCity, setToCity] = useState<string>("");
  const [flightDate, setFlightDate] = useState<string>("");
  const [flightNumber, setFlightNumber] = useState<string>("");
  const [departureTime, setDepartureTime] = useState<string>("");
  const [arrivalTime, setArrivalTime] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [returnFlightNumber, setReturnFlightNumber] = useState<string>("");
  const [returnDepartureTime, setReturnDepartureTime] = useState<string>("");
  const [returnArrivalTime, setReturnArrivalTime] = useState<string>("");
  const [totalQty, setTotalQty] = useState<number | string>(1);
  const [buyPrice, setBuyPrice] = useState<number | string>(0);
  const [baggage, setBaggage] = useState<string>("20");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen && batch) {
      const { from, to } = splitRoute(batch.route);
      setSupplierId(batch.supplierId ? String(batch.supplierId) : "");
      setPurchaseDate(batch.purchaseDate || "");
      setBatchNumber(batch.batchNumber || "");
      setFromCity(from);
      setToCity(to);
      setFlightDate(batch.flightDate || "");
      setFlightNumber(batch.flightNumber || "");
      setDepartureTime(batch.departureTime || "");
      setArrivalTime(batch.arrivalTime || "");
      setReturnDate(batch.returnDate || "");
      setReturnFlightNumber(batch.returnFlightNumber || "");
      setReturnDepartureTime(batch.returnDepartureTime || "");
      setReturnArrivalTime(batch.returnArrivalTime || "");
      setTotalQty(batch.totalQty || 1);
      setBuyPrice(batch.buyPrice || 0);
      setBaggage((batch.baggage || "20").replace(/[^0-9]/g, "") || "20");
      setNotes(batch.notes || "");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, batch]);

  if (!isOpen || !batch) return null;

  const liveRoundTrip = Boolean(returnDate);
  const soldOut = Math.max(0, (batch.totalQty || 0) - (batch.remainingQty || 0));
  const retPool =
    typeof batch.returnRemainingQty === "number"
      ? batch.returnRemainingQty
      : batch.totalQty || 0;
  const soldRet = liveRoundTrip ? Math.max(0, (batch.totalQty || 0) - retPool) : 0;
  const soldQty = Math.max(soldOut, soldRet);
  const numQty = totalQty === "" ? 0 : Number(totalQty);
  const numPrice = buyPrice === "" ? 0 : Number(buyPrice);
  const newTotalCost = numQty * numPrice;
  const deltaQty = numQty - (batch.totalQty || 0);
  const newRemaining = Math.max(0, (batch.remainingQty || 0) + deltaQty);
  const newReturnRemaining = Math.max(0, retPool + deltaQty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError("Iltimos, hamkorni tanlang!");
      return;
    }
    if (!fromCity.trim() || !toCity.trim()) {
      setError("Marshrutning \u201cQayerdan\u201d va \u201cQayerga\u201d qismlarini kiriting!");
      return;
    }
    if (!flightDate) {
      setError("Uchish sanasi tanlanmagan!");
      return;
    }
    if (numQty <= 0) {
      setError("Chipta soni kamida 1 ta bo\u2018lishi kerak!");
      return;
    }
    if (numQty < soldQty) {
      const detail =
        liveRoundTrip && soldRet > soldOut
          ? ` Borish: ${soldOut} ta, kelish: ${soldRet} ta sotilgan.`
          : "";
      setError(
        `Ushbu partiyadan allaqachon ${soldQty} ta chipta sotilgan! Jami soni ${soldQty} tadan kam bo\u2018la olmaydi.${detail}`
      );
      return;
    }
    if (numPrice <= 0) {
      setError("Tannarx 0 dan katta bo\u2018lishi kerak!");
      return;
    }
    if (returnDate && flightDate && returnDate < flightDate) {
      setError("Qaytish sanasi uchish sanasidan oldin bo\u2018lishi mumkin emas!");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(batch.id, {
        supplierId: Number(supplierId),
        purchaseDate: purchaseDate || null,
        batchNumber: batchNumber.trim(),
        route: `${fromCity.trim().toUpperCase()} \u2014 ${toCity.trim().toUpperCase()}`,
        flightDate,
        flightNumber: flightNumber.trim().toUpperCase(),
        departureTime,
        arrivalTime,
        isRoundTrip: Boolean(returnDate),
        returnDate: returnDate || null,
        returnFlightNumber: returnDate ? returnFlightNumber.trim().toUpperCase() : "",
        returnDepartureTime: returnDate ? returnDepartureTime : "",
        returnArrivalTime: returnDate ? returnArrivalTime : "",
        totalQty: numQty,
        buyPrice: numPrice,
        baggage: `${baggage.replace(/[^0-9]/g, "") || "0"} kg`,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(getValidationMessage(err));
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold";
  const labelCls =
    "block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xaridni tahrirlash"
      maxWidth="max-w-3xl md:max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
            Jami:{" "}
            <strong className="text-sm sm:text-lg font-bold text-amber-500 font-mono">
              {formatUSD(newTotalCost)}
            </strong>{" "}
            <span className="text-slate-400 font-normal">({numQty} ta chipta)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              form="edit-batch-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Saqlanmoqda..." : "O\u2018zgarishlarni saqlash"}
            </button>
          </div>
        </div>
      }
    >
      <form id="edit-batch-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PartnerSelect
            label="Hamkor *"
            value={supplierId}
            onChange={(val) => setSupplierId(val)}
            partners={suppliers}
            onAddNew={onOpenSupplierModal}
            required
          />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Xarid sanasi
              </label>
            </div>
            <DatePicker value={purchaseDate} onChange={(val) => setPurchaseDate(val)} compact />
          </div>
          <div>
            <label className={labelCls}>Partiya raqami</label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="P00001"
              className={`${inputCls} font-mono uppercase`}
            />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>Qayerdan *</label>
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value.toUpperCase())}
                placeholder="TAS"
                className={`${inputCls} uppercase font-bold tracking-wider`}
              />
            </div>
            <div>
              <label className={labelCls}>Qayerga *</label>
              <input
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value.toUpperCase())}
                placeholder="DXB"
                className={`${inputCls} uppercase font-bold tracking-wider`}
              />
            </div>
            <div>
              <label className={labelCls}>Uchish sanasi *</label>
              <DatePicker value={flightDate} onChange={(val) => setFlightDate(val)} compact required />
            </div>
            <div>
              <label className={labelCls}>Qaytish sanasi</label>
              <DatePicker
                value={returnDate}
                onChange={(val) => setReturnDate(val)}
                placeholder="Tanlanmagan"
                compact
                clearable
                align="right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <PlaneTakeoff className="w-3 h-3 text-blue-500" /> Uchish vaqti
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className={`${inputCls} font-mono font-bold`}
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <PlaneLanding className="w-3 h-3 text-emerald-500" /> Qo&lsquo;nish vaqti
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className={`${inputCls} font-mono font-bold`}
              />
            </div>
            <div>
              <label className={labelCls}>Borish reysi</label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="FZ-780"
                className={`${inputCls} font-mono uppercase font-bold`}
              />
            </div>
          </div>

          {returnDate && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/60">
              <div>
                <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  <PlaneTakeoff className="w-3 h-3" /> &#8646; Qaytish uchish vaqti
                </label>
                <input
                  type="time"
                  value={returnDepartureTime}
                  onChange={(e) => setReturnDepartureTime(e.target.value)}
                  className={`${inputCls} font-mono font-bold`}
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  <PlaneLanding className="w-3 h-3" /> &#8646; Qaytish qo&lsquo;nish vaqti
                </label>
                <input
                  type="time"
                  value={returnArrivalTime}
                  onChange={(e) => setReturnArrivalTime(e.target.value)}
                  className={`${inputCls} font-mono font-bold`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  &#8646; Qaytish reys raqami
                </label>
                <input
                  type="text"
                  value={returnFlightNumber}
                  onChange={(e) => setReturnFlightNumber(e.target.value.toUpperCase())}
                  placeholder="FZ-781"
                  className={`${inputCls} font-mono uppercase font-bold`}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Chipta soni *</label>
              <input
                type="number"
                min="1"
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value === "" ? "" : e.target.value)}
                onBlur={() => {
                  if (totalQty === "" || Number(totalQty) < 1) setTotalQty(1);
                }}
                className={`${inputCls} text-center tabular-nums font-bold`}
              />
            </div>
            <div>
              <label className={labelCls}>Tannarx ($) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value === "" ? "" : e.target.value)}
                  onBlur={() => {
                    if (buyPrice === "" || isNaN(Number(buyPrice))) setBuyPrice(0);
                  }}
                  className={`${inputCls} pl-6 tabular-nums font-bold`}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Bagaj (kg)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={baggage}
                  onChange={(e) => setBaggage(e.target.value)}
                  onBlur={() => {
                    if (baggage === "") setBaggage("0");
                  }}
                  placeholder="20"
                  className={`${inputCls} pr-7 font-mono font-bold tabular-nums`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 px-0.5 border-t border-slate-200/50 dark:border-slate-700/50 tabular-nums flex-wrap gap-1">
            <span>
              {liveRoundTrip ? (
                <>
                  Sotilgan: <strong className="text-slate-700 dark:text-slate-300">borish {soldOut} ta • kelish {soldRet} ta</strong>
                </>
              ) : (
                <>
                  Sotilgan: <strong className="text-slate-700 dark:text-slate-300">{soldQty} ta</strong>
                </>
              )}
            </span>
            <span>
              {liveRoundTrip ? (
                <>
                  O&lsquo;zgarishdan keyingi qoldiq: borish{" "}
                  <strong className="text-blue-600 dark:text-blue-400 font-bold">{newRemaining} ta</strong>
                  {" • "}kelish{" "}
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">{newReturnRemaining} ta</strong>
                </>
              ) : (
                <>
                  O&lsquo;zgarishdan keyingi qoldiq:{" "}
                  <strong className="text-blue-600 dark:text-blue-400 font-bold">{newRemaining} ta</strong>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/70 dark:border-blue-800/60 text-[11px] text-blue-700 dark:text-blue-300">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Reys ma&rsquo;lumotlari (marshrut, sana, reys raqami, vaqtlar) o&lsquo;zgarsa, ushbu
            partiyadagi barcha sotuvlarga ham avtomatik yangilanadi. Tannarx o&lsquo;zgarsa,
            sotuvlarning sof foydasi qayta hisoblanadi.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Charter shartnomasi, eslatma..."
            className={`${inputCls} font-normal`}
          />
        </div>
      </form>
    </Modal>
  );
}
