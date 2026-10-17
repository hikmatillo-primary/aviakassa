"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { DatePicker } from "./DatePicker";
import { PartnerSelect, PartnerItem } from "./PartnerSelect";
import {
  formatUSD,
  getTodayISO,
  isBatchExpired,
  SALE_SEGMENT_OPTIONS,
  saleSegmentLabel,
  isSegmentSellable,
  getDefaultSellableSegment,
  type SaleSegment,
} from "@/lib/format";
import { getValidationMessage } from "@/lib/api";
import { PlaneTakeoff, PlaneLanding, Loader2, Info } from "lucide-react";
import { Batch, Sale } from "@/lib/storage";

export interface SaleUpdatePayload {
  batchId: number;
  clientId: number;
  qty: number;
  buyPrice: number;
  sellPrice: number;
  passengerNames: string;
  segment: string;
  saleDate: string;
  route: string;
  flightDate: string | null;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  isRoundTrip: boolean;
  returnDate: string | null;
  returnFlightNumber: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
  notes: string;
}

/** Sotuv qatorining borish/kelish o'rinlaridan qanchasini egallashini hisoblash. */
function poolUsage(
  qty: number | undefined,
  segment: string | undefined,
  isRoundTrip: boolean
): { out: number; ret: number } {
  const q = qty || 0;
  if (!isRoundTrip) return { out: q, ret: 0 };
  if (segment === "RETURN") return { out: 0, ret: q };
  if (segment === "BOTH" || !segment) return { out: q, ret: q };
  return { out: q, ret: 0 };
}

/** Partiyada sotilishi mumkin bo'lgan o'rin bormi (segment-muddati hisobga olinadi). */
function hasSellableSeats(b: Batch): boolean {
  if (!b.isRoundTrip) return (b.remainingQty || 0) > 0 && !isBatchExpired(b);
  const retLeft = typeof b.returnRemainingQty === "number" ? b.returnRemainingQty : b.remainingQty || 0;
  const outOk = (b.remainingQty || 0) > 0 && isSegmentSellable(b, "OUTBOUND");
  const retOk = retLeft > 0 && isSegmentSellable(b, "RETURN");
  return outOk || retOk;
}

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  batches: Batch[];
  clients: PartnerItem[];
  onOpenClientModal?: () => void;
  onSave: (saleId: number, data: SaleUpdatePayload) => void | Promise<void>;
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

export function EditSaleModal({
  isOpen,
  onClose,
  sale,
  batches,
  clients,
  onOpenClientModal,
  onSave,
}: EditSaleModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchId, setBatchId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [saleDate, setSaleDate] = useState<string>("");
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
  const [qty, setQty] = useState<number | string>(1);
  const [buyPrice, setBuyPrice] = useState<number | string>(0);
  const [sellPrice, setSellPrice] = useState<number | string>(0);
  const [segment, setSegment] = useState<SaleSegment>("");
  const [passengerNames, setPassengerNames] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen && sale) {
      const { from, to } = splitRoute(sale.route);
      setBatchId(sale.batchId ? String(sale.batchId) : "");
      setClientId(sale.clientId ? String(sale.clientId) : "");
      setSaleDate(sale.saleDate || getTodayISO());
      setFromCity(from);
      setToCity(to);
      setFlightDate(sale.flightDate || "");
      setFlightNumber(sale.flightNumber || "");
      setDepartureTime(sale.departureTime || "");
      setArrivalTime(sale.arrivalTime || "");
      setReturnDate(sale.returnDate || "");
      setReturnFlightNumber(sale.returnFlightNumber || "");
      setReturnDepartureTime(sale.returnDepartureTime || "");
      setReturnArrivalTime(sale.returnArrivalTime || "");
      setQty(sale.qty || 1);
      setBuyPrice(sale.buyPrice || 0);
      setSellPrice(sale.sellPrice || 0);
      // Segment: serverdan kelgan qiymat, bo'lmasa borish-kelish sotuvda BOTH
      let initSegment: SaleSegment = (sale.segment as SaleSegment) || "";
      if (sale.isRoundTrip && !initSegment) initSegment = "BOTH";
      setSegment(initSegment);
      setPassengerNames(sale.passengerNames || "");
      setNotes(sale.notes || "");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, sale]);

  useEffect(() => {
    if (!isOpen || !sale) return;
    const b = batches.find((x) => String(x.id) === batchId);
    if (!b?.isRoundTrip) return;
    const retLeft = typeof b.returnRemainingQty === "number" ? b.returnRemainingQty : b.remainingQty || 0;
    const avail =
      segment === "OUTBOUND"
        ? b.remainingQty || 0
        : segment === "RETURN"
        ? retLeft
        : Math.min(b.remainingQty || 0, retLeft);
    if (!segment || !isSegmentSellable(b, segment) || avail === 0) {
      setSegment(getDefaultSellableSegment(b));
    }
    // Partiya almashganda yoki modal ochilganda bir marta tekshiriladi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, batchId]);

  if (!isOpen || !sale) return null;

  const selectedBatch = batches.find((b) => String(b.id) === batchId) || null;
  const isSameBatch = selectedBatch ? selectedBatch.id === sale.batchId : false;

  // Joriy sotuv shu partiyada egallab turgan borish/kelish o'rinlari
  const ownUsage = isSameBatch
    ? poolUsage(sale.qty, sale.segment, Boolean(sale.isRoundTrip || selectedBatch?.isRoundTrip))
    : { out: 0, ret: 0 };

  const retPoolRaw = selectedBatch
    ? typeof selectedBatch.returnRemainingQty === "number"
      ? selectedBatch.returnRemainingQty
      : selectedBatch.remainingQty || 0
    : 0;
  const outAvail = (selectedBatch?.remainingQty || 0) + ownUsage.out;
  const retAvail = retPoolRaw + ownUsage.ret;

  const effectiveSegment: SaleSegment = selectedBatch?.isRoundTrip ? segment : "";

  const availableFor = (seg: SaleSegment): number => {
    if (!selectedBatch) return 0;
    if (!selectedBatch.isRoundTrip) return Math.max(0, outAvail);
    if (seg === "OUTBOUND") return Math.max(0, outAvail);
    if (seg === "RETURN") return Math.max(0, retAvail);
    return Math.max(0, Math.min(outAvail, retAvail));
  };

  const availableQty = selectedBatch
    ? availableFor(effectiveSegment)
    : sale.qty || 0;

  const selectableBatches = batches.filter(
    (b) => b.id === sale.batchId || hasSellableSeats(b)
  );

  const numQty = qty === "" ? 0 : Number(qty);
  const numBuy = buyPrice === "" ? 0 : Number(buyPrice);
  const numSell = sellPrice === "" ? 0 : Number(sellPrice);
  const totalAmount = numQty * numSell;
  const profit = (numSell - numBuy) * numQty;

  const handleBatchChange = (val: string) => {
    setBatchId(val);
    const b = batches.find((x) => String(x.id) === val);
    if (b) {
      const { from, to } = splitRoute(b.route);
      setFromCity(from);
      setToCity(to);
      setFlightDate(b.flightDate || "");
      setFlightNumber(b.flightNumber || "");
      setDepartureTime(b.departureTime || "");
      setArrivalTime(b.arrivalTime || "");
      setReturnDate(b.returnDate || "");
      setReturnFlightNumber(b.returnFlightNumber || "");
      setReturnDepartureTime(b.returnDepartureTime || "");
      setReturnArrivalTime(b.returnArrivalTime || "");
      setBuyPrice(b.buyPrice || 0);
      setSegment(b.isRoundTrip ? getDefaultSellableSegment(b) : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBatch) {
      setError("Iltimos, partiyani tanlang!");
      return;
    }
    if (!clientId) {
      setError("Iltimos, mijozni tanlang!");
      return;
    }
    if (!saleDate) {
      setError("Sotuv sanasi tanlanmagan!");
      return;
    }
    if (numQty <= 0) {
      setError("Chiptalar soni kamida 1 ta bo\u2018lishi kerak!");
      return;
    }
    if (!isSegmentSellable(selectedBatch, effectiveSegment)) {
      const subject = selectedBatch.isRoundTrip
        ? `"${saleSegmentLabel(effectiveSegment)}" qismining`
        : "partiyaning";
      setError(
        `"${selectedBatch.route}" ${subject} muddati o'tgan — chipta sotib bo\u2018linmaydi!`
      );
      return;
    }
    if (numQty > availableQty) {
      const poolLabel = selectedBatch.isRoundTrip
        ? `${saleSegmentLabel(effectiveSegment)} qoldig'ida`
        : "Bu partiyada";
      setError(
        `${poolLabel} faqat ${availableQty} ta chipta mavjud! (sotuvdagi ${sale.qty} ta hisobga olingan)`
      );
      return;
    }
    if (!fromCity.trim() || !toCity.trim()) {
      setError("Marshrutning \u201cQayerdan\u201d va \u201cQayerga\u201d qismlarini kiriting!");
      return;
    }
    if (numSell <= 0) {
      setError("Sotish narxi 0 dan katta bo\u2018lishi kerak!");
      return;
    }
    if (numBuy < 0) {
      setError("Tan narx manfiy bo\u2018lishi mumkin emas!");
      return;
    }
    if (returnDate && flightDate && returnDate < flightDate) {
      setError("Qaytish sanasi uchish sanasidan oldin bo\u2018lishi mumkin emas!");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(sale.id, {
        batchId: selectedBatch.id,
        clientId: Number(clientId),
        qty: numQty,
        buyPrice: numBuy,
        sellPrice: numSell,
        passengerNames: passengerNames.trim(),
        segment: selectedBatch.isRoundTrip ? effectiveSegment || "BOTH" : "",
        saleDate,
        route: `${fromCity.trim().toUpperCase()} \u2014 ${toCity.trim().toUpperCase()}`,
        flightDate: flightDate || null,
        flightNumber: flightNumber.trim().toUpperCase(),
        departureTime,
        arrivalTime,
        isRoundTrip: Boolean(returnDate),
        returnDate: returnDate || null,
        returnFlightNumber: returnDate ? returnFlightNumber.trim().toUpperCase() : "",
        returnDepartureTime: returnDate ? returnDepartureTime : "",
        returnArrivalTime: returnDate ? returnArrivalTime : "",
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
      title="Sotuvni tahrirlash"
      maxWidth="max-w-3xl md:max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
            Jami:{" "}
            <strong className="text-sm sm:text-lg font-bold text-emerald-500 font-mono">
              {formatUSD(totalAmount)}
            </strong>{" "}
            <span
              className={`text-[11px] sm:text-xs font-mono font-bold ${
                profit >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              (Foyda: {profit >= 0 ? "+" : "-"}
              {formatUSD(Math.abs(profit))})
            </span>
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
              form="edit-sale-form"
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
      <form id="edit-sale-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Partiya *</label>
            <select
              value={batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">Partiyani tanlang</option>
              {selectableBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} — {b.route}
                  {b.id === sale.batchId ? " (joriy)" : ""} —{" "}
                  {b.isRoundTrip
                    ? `borish: ${b.remainingQty} ta, kelish: ${
                        typeof b.returnRemainingQty === "number"
                          ? b.returnRemainingQty
                          : b.remainingQty
                      } ta`
                    : `qoldiq: ${b.remainingQty} ta`}
                </option>
              ))}
            </select>
            {selectedBatch && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                Mavjud: <strong className="text-slate-700 dark:text-slate-300">{availableQty} ta</strong>
                {" · "}Tannarx: <strong className="text-amber-600 dark:text-amber-400">{formatUSD(selectedBatch.buyPrice)}</strong>
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PartnerSelect
              label="Mijoz *"
              value={clientId}
              onChange={(val) => setClientId(val)}
              partners={clients}
              onAddNew={onOpenClientModal}
              required
            />
            <div>
              <label className={labelCls}>Sotuv sanasi *</label>
              <DatePicker
                value={saleDate}
                onChange={(val) => setSaleDate(val)}
                maxDate={getTodayISO()}
                compact
                required
                align="right"
              />
            </div>
          </div>
        </div>

        {selectedBatch?.isRoundTrip && (
          <div>
            <label className={labelCls}>Sotiladigan qism (borish / kelish) *</label>
            <div className="grid grid-cols-3 gap-2">
              {SALE_SEGMENT_OPTIONS.map((opt) => {
                const sellable = isSegmentSellable(selectedBatch, opt.value);
                const avail = availableFor(opt.value);
                const isDisabled = !sellable || avail === 0;
                const isActive = effectiveSegment === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSegment(opt.value)}
                    title={
                      isDisabled
                        ? avail === 0
                          ? "Bu qismda sotiladigan o'rin qolmagan"
                          : "Bu qismning muddati o'tgan"
                        : undefined
                    }
                    className={`px-2 py-2 rounded-xl border text-center transition-all ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20 cursor-pointer"
                        : isDisabled
                        ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed"
                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 cursor-pointer"
                    }`}
                  >
                    <span className="block font-bold text-xs sm:text-sm">{opt.label}</span>
                    <span
                      className={`block text-[10px] mt-0.5 tabular-nums ${
                        isActive ? "text-blue-100" : ""
                      }`}
                    >
                      {isDisabled
                        ? avail === 0
                          ? "Qoldiq yo'q"
                          : "Muddati o'tgan"
                        : `${avail} ta mavjud`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelCls}>Soni *</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value === "" ? "" : e.target.value)}
              onBlur={() => {
                if (qty === "" || Number(qty) < 1) setQty(1);
              }}
              className={`${inputCls} text-center tabular-nums font-bold`}
            />
          </div>
          <div>
            <label className={labelCls}>Sotish narxi ($) *</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value === "" ? "" : e.target.value)}
                onBlur={() => {
                  if (sellPrice === "" || isNaN(Number(sellPrice))) setSellPrice(0);
                }}
                className={`${inputCls} pl-6 tabular-nums font-bold`}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tan narx ($)</label>
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
              <label className={labelCls}>Uchish sanasi</label>
              <DatePicker value={flightDate} onChange={(val) => setFlightDate(val)} compact />
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

          <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Partiya almashtirilsa, reys ma&rsquo;lumotlari yangi partiyadan avtomatik
              to&lsquo;ldiriladi va tannarx ham yangilanadi.
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Yo&lsquo;lovchilar ismi (ixtiyoriy)
          </label>
          <textarea
            value={passengerNames}
            onChange={(e) => setPassengerNames(e.target.value)}
            rows={2}
            placeholder="Aziz Karimov, Malika Yusupova..."
            className={`${inputCls} font-normal resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Izoh (ixtiyoriy)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Eslatma..."
            className={`${inputCls} font-normal`}
          />
        </div>
      </form>
    </Modal>
  );
}
