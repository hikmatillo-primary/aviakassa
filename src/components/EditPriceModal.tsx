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
  const [price, setPrice] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
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
  const newTotal = (qty || 0) * (price || 0);

  // For Sale mode: calculate new profit based on batch buyPrice
  const buyPriceForSale = !isBatch ? item.buyPrice || 0 : 0;
  const newProfitForSale = !isBatch ? newTotal - (qty || 0) * buyPriceForSale : 0;
  const unitProfitForSale = !isBatch ? (price || 0) - buyPriceForSale : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (price <= 0) {
      setError("Narx 0 dan katta bo‘lishi kerak!");
      return;
    }

    if (qty <= 0) {
      setError("Chipta soni kamida 1 ta bo‘lishi kerak!");
      return;
    }

    if (isBatch && qty < soldQtyInBatch) {
      setError(
        `Ushbu partiyadan allaqachon ${soldQtyInBatch} ta chipta sotilgan! Jami soni ${soldQtyInBatch} tadan kam bo‘la olmaydi.`
      );
      return;
    }

    if (isBatch && onSaveBatch) {
      onSaveBatch(item.id, Number(price), Number(qty));
    } else if (!isBatch && onSaveSale) {
      onSaveSale(item.id, Number(price), Number(qty), passengerNames.trim());
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
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="edit-price-form"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Yangi narxni saqlash
          </button>
        </div>
      }
    >
      <form id="edit-price-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Top Info Banner */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">
              {isBatch ? "Kompaniya (Ta’minotchi):" : "Xaridor (Mijoz):"}
            </span>
            <strong className="text-slate-900 dark:text-white font-bold">
              {isBatch ? item.supplierName : item.clientName}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Yo‘nalish:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {item.route} {item.batchNumber ? `(${item.batchNumber})` : ""}
            </span>
          </div>
          {!isBatch && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400">Kompaniyadan olingan tannarx:</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {formatUSD(buyPriceForSale)} (1 dona)
              </strong>
            </div>
          )}
        </div>

        {/* Price and Qty Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              {isBatch ? "1 dona olingan narx ($) *" : "1 dona sotilgan narx ($) *"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                autoFocus
                className="w-full pl-7 pr-3 py-2 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-blue-500 dark:border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-black font-mono"
                required
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Avvalgi narx: <b className="font-mono">{formatUSD(oldPrice)}</b>
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Chiptalar soni (dona) *
            </label>
            <input
              type="number"
              min={isBatch ? Math.max(1, soldQtyInBatch) : 1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-base bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-black font-mono"
              required
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Avvalgi soni: <b className="font-mono">{oldQty} ta</b>
            </span>
          </div>
        </div>

        {!isBatch && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Yo‘lovchi / PNR (ixtiyoriy)
            </label>
            <input
              type="text"
              value={passengerNames}
              onChange={(e) => setPassengerNames(e.target.value)}
              placeholder="Masalan: Karim Aliyev"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Live Calculation Comparison Box */}
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/70 rounded-2xl space-y-2">
          <div className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
            Hisob-kitob (Otchyot) qanday o‘zgaradi:
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Jami summa:</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="line-through text-slate-400">{formatUSD(oldTotal)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
              <strong className="text-sm font-black text-slate-900 dark:text-white">
                {formatUSD(newTotal)}
              </strong>
            </div>
          </div>

          {!isBatch && (
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-blue-200/60 dark:border-blue-800/60">
              <span className="text-slate-500 dark:text-slate-400">Sizga qoladigan sof foyda:</span>
              <strong
                className={`font-mono text-sm font-black ${
                  newProfitForSale >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {newProfitForSale >= 0
                  ? `+${formatUSD(newProfitForSale)}`
                  : `-${formatUSD(Math.abs(newProfitForSale))}`}{" "}
                <span className="text-[11px] font-normal">
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
