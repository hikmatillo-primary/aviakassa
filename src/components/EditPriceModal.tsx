"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Check, ArrowRight, Info } from "lucide-react";
import { formatUSD } from "@/lib/format";

interface EditPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "BATCH" | "SALE";
  item: any | null;
  onSaveBatch?: (batchId: number, newBuyPrice: number, newTotalQty: number) => void;
  onSaveSale?: (
    saleId: number,
    newSellPrice: number,
    newQty: number,
    newPassengerNames: string
  ) => void;
}

export function EditPriceModal({
  isOpen,
  onClose,
  mode,
  item,
  onSaveBatch,
  onSaveSale,
}: EditPriceModalProps) {
  const [price, setPrice] = useState<number | string>(0);
  const [qty, setQty] = useState<number | string>(1);
  const [passengerNames, setPassengerNames] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      setError(null);
      if (mode === "BATCH") {
        setPrice(item.buyPrice || 0);
        setQty(item.totalQty || 1);
      } else {
        setPrice(item.sellPrice || 0);
        setQty(item.qty || 1);
        setPassengerNames(item.passengerNames || "");
      }
    }
  }, [isOpen, item, mode]);

  if (!isOpen || !item) return null;

  const isBatch = mode === "BATCH";
  const soldQtyInBatch = isBatch ? (item.totalQty || 0) - (item.remainingQty || 0) : 0;

  const oldPrice = isBatch ? item.buyPrice || 0 : item.sellPrice || 0;
  const oldQty = isBatch ? item.totalQty || 0 : item.qty || 0;
  const oldTotal = oldQty * oldPrice;

  const numPrice = price === "" ? 0 : Number(price);
  const numQty = qty === "" ? 0 : Number(qty);
  const newTotal = numQty * numPrice;

  // For Sale mode: calculate new profit based on batch buyPrice
  const buyPriceForSale = !isBatch ? item.buyPrice || 0 : 0;
  const newProfitForSale = !isBatch ? newTotal - numQty * buyPriceForSale : 0;
  const unitProfitForSale = !isBatch ? numPrice - buyPriceForSale : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numPrice <= 0) {
      setError("Narx 0 dan katta bo‘lishi kerak!");
      return;
    }

    if (numQty <= 0) {
      setError("Chipta soni kamida 1 ta bo‘lishi kerak!");
      return;
    }

    if (isBatch && numQty < soldQtyInBatch) {
      setError(
        `Ushbu partiyadan allaqachon ${soldQtyInBatch} ta chipta sotilgan! Jami soni ${soldQtyInBatch} tadan kam bo‘la olmaydi.`
      );
      return;
    }

    if (isBatch && onSaveBatch) {
      onSaveBatch(item.id, numPrice, numQty);
    } else if (!isBatch && onSaveSale) {
      onSaveSale(item.id, numPrice, numQty, passengerNames.trim());
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isBatch
          ? "Kompaniyadan olingan narxni o‘zgartirish"
          : "Mijozga sotilgan narxni o‘zgartirish"
      }
      maxWidth="max-w-xl md:max-w-2xl"
      footer={
        <div className="flex items-center justify-end w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="edit-price-form"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Yangi narxni saqlash
          </button>
        </div>
      }
    >
      <form id="edit-price-form" onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {error && (
          <div className="p-3 sm:p-4 text-xs sm:text-sm bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Top Info Banner */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-2 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">
              {isBatch ? "Kompaniya (Ta’minotchi):" : "Xaridor (Mijoz):"}
            </span>
            <strong className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">
              {isBatch ? item.supplierName : item.clientName}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Yo‘nalish:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
              {item.route} {item.batchNumber ? `(${item.batchNumber})` : ""}
            </span>
          </div>
          {!isBatch && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">Kompaniyadan olingan tannarx:</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {formatUSD(buyPriceForSale)} (1 dona)
              </strong>
            </div>
          )}
        </div>

        {/* Price and Qty Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              {isBatch ? "1 dona olingan narx ($) *" : "1 dona sotilgan narx ($) *"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 text-base sm:text-lg font-bold">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrice(val === "" ? "" : val);
                }}
                onBlur={() => {
                  if (price === "" || isNaN(Number(price))) {
                    setPrice(0);
                  }
                }}
                autoFocus
                className="w-full pl-8 pr-3 py-2.5 sm:py-3 text-lg sm:text-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-blue-500 dark:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-black font-mono"
                required
              />
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Avvalgi narx: <b className="font-mono">{formatUSD(oldPrice)}</b>
            </span>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Chiptalar soni (dona) *
            </label>
            <input
              type="number"
              min={isBatch ? Math.max(1, soldQtyInBatch) : 1}
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
                const minQty = isBatch ? Math.max(1, soldQtyInBatch) : 1;
                if (qty === "" || Number(qty) < minQty) {
                  setQty(minQty);
                }
              }}
              className="w-full px-3.5 py-2.5 sm:py-3 text-lg sm:text-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-black font-mono"
              required
            />
            <span className="text-xs text-slate-400 mt-1 block">
              Avvalgi soni: <b className="font-mono">{oldQty} ta</b>
            </span>
          </div>
        </div>

        {!isBatch && (
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Yo‘lovchi / PNR (ixtiyoriy)
            </label>
            <input
              type="text"
              value={passengerNames}
              onChange={(e) => setPassengerNames(e.target.value)}
              placeholder="Masalan: Karim Aliyev"
              className="w-full px-3.5 py-2.5 text-sm sm:text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Live Calculation Comparison Box */}
        <div className="p-4 sm:p-5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/70 rounded-2xl space-y-2.5">
          <div className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
            Hisob-kitob (Otchyot) qanday o‘zgaradi:
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Jami summa:</span>
            <div className="flex items-center gap-2.5 font-mono">
              <span className="line-through text-slate-400 text-sm sm:text-base">{formatUSD(oldTotal)}</span>
              <ArrowRight className="w-4 h-4 text-blue-500" />
              <strong className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                {formatUSD(newTotal)}
              </strong>
            </div>
          </div>

          {!isBatch && (
            <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-blue-200/60 dark:border-blue-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Sizga qoladigan sof foyda:</span>
              <strong
                className={`font-mono text-base sm:text-xl font-black ${
                  newProfitForSale >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {newProfitForSale >= 0
                  ? `+${formatUSD(newProfitForSale)}`
                  : `-${formatUSD(Math.abs(newProfitForSale))}`}{" "}
                <span className="text-xs sm:text-sm font-normal">
                  (1 donadan {unitProfitForSale >= 0 ? `+$${unitProfitForSale}` : `-$${Math.abs(unitProfitForSale)}`})
                </span>
              </strong>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
