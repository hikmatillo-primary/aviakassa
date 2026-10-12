"use client";

import React, { useTransition } from "react";
import {
  TrendingUp,
  CreditCard,
  Ticket,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Package,
  Layers,
  Sparkles,
  PlaneTakeoff,
  Users,
} from "lucide-react";

interface DashboardViewProps {
  stats: any;
  batches: any[];
  sales: any[];
  payments: any[];
  partners: any[];
  onOpenSaleModal: (batchId?: number) => void;
  onOpenBatchModal: () => void;
  onOpenPaymentModal: (type?: "INCOME" | "EXPENSE") => void;
  onViewAllBatches: () => void;
  onViewAllPartners: () => void;
  onRefresh?: () => void;
  onResetDemo?: () => void;
}

export function DashboardView({
  stats,
  batches,
  sales,
  payments,
  partners,
  onOpenSaleModal,
  onOpenBatchModal,
  onOpenPaymentModal,
  onViewAllBatches,
  onViewAllPartners,
  onRefresh,
  onResetDemo,
}: DashboardViewProps) {
  const activeBatches = batches.filter((b) => b.status === "ACTIVE");
  const isEmptyData = batches.length === 0 && partners.length === 0;

  const handleSeed = () => {
    if (onResetDemo) onResetDemo();
  };

  return (
    <div className="space-y-6">
      {/* Empty State / Demo Data Banner */}
      {isEmptyData && (
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              Tizimga xush kelibsiz! Baza hali bo&apos;sh
            </h4>
            <p className="text-xs text-blue-100 max-w-xl">
              Tizim qanday ishlashini darhol ko&apos;rish uchun bir tugma bilan namunaviy partiyalar, sotuvlar va qarzdorlik ma&apos;lumotlarini yuklashingiz mumkin.
            </p>
          </div>
          <button
            onClick={handleSeed}
            className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            Demo ma&apos;lumotlarni yuklash
          </button>
        </div>
      )}

      {/* 4 Ta Asosiy Ko'rsatkich Kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Bizning haqimiz (Debitorlik) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bizning haqimiz
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              ${(stats?.clientDebtToUs || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Mijozlar qarzi</span>
              <button
                onClick={() => onOpenPaymentModal("INCOME")}
                className="text-blue-600 hover:underline font-semibold"
              >
                + Qabul qilish
              </button>
            </p>
          </div>
        </div>

        {/* 2. Bizning qarzimiz (Kreditorlik) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bizning qarzimiz
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              ${(stats?.ourDebtToSuppliers || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Ta&apos;minotchilarga</span>
              <button
                onClick={() => onOpenPaymentModal("EXPENSE")}
                className="text-blue-600 hover:underline font-semibold"
              >
                - To&apos;lash
              </button>
            </p>
          </div>
        </div>

        {/* 3. Sof foyda */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sof Foyda
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-600 tracking-tight font-mono">
              +${(stats?.totalProfit || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Barcha sotuvlardan sof marja
            </p>
          </div>
        </div>

        {/* 4. Mavjud chiptalar ombori (Qoldiq) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ombordagi chiptalar
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {(stats?.totalRemainingTickets || 0)} <span className="text-sm font-semibold text-slate-500">ta</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{stats?.activeBatchesCount || 0} ta faol partiyada</span>
              <button onClick={onViewAllBatches} className="text-blue-600 hover:underline font-semibold">
                Barchasi
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Partiyalar Vitrinasi (Chiptalar qoldig'i bo'yicha) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <PlaneTakeoff className="w-5 h-5 text-blue-600" />
              Faol Partiyalar va Chiptalar Qoldig&apos;i
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Qaysi yo&apos;nalishda nechta joy qolganini ko&apos;ring va to&apos;g&apos;ridan-to&apos;g&apos;ri soting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBatchModal}
              className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              + Yangi partiya
            </button>
            <button
              onClick={onViewAllBatches}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Barcha partiyalar &rarr;
            </button>
          </div>
        </div>

        {activeBatches.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Hozirda faol partiya mavjud emas</p>
            <button
              onClick={onOpenBatchModal}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs"
            >
              + Birinchi partiyani qo&apos;shish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBatches.map((batch) => {
              const soldQty = batch.totalQty - batch.remainingQty;
              const percentSold = Math.round((soldQty / batch.totalQty) * 100);
              const isLowStock = batch.remainingQty <= 5;

              return (
                <div
                  key={batch.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Batch Number & Flight */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-mono font-bold text-slate-700 bg-slate-200/60 px-1.5 py-0.5 rounded">
                        {batch.batchNumber}
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {batch.flightDate}
                      </span>
                    </div>

                    {/* Route */}
                    <h4 className="text-base font-extrabold text-slate-900 tracking-tight my-1">
                      {batch.route}
                    </h4>
                    {batch.flightNumber && (
                      <span className="text-[11px] font-medium text-slate-500 block mb-2">
                        Reys: <span className="font-mono text-slate-700">{batch.flightNumber}</span>
                      </span>
                    )}

                    {/* Progress Bar & Quantity */}
                    <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs text-slate-600">Qolgan chipta:</span>
                        <span className={`text-base font-black font-mono ${isLowStock ? "text-amber-600" : "text-blue-600"}`}>
                          {batch.remainingQty} <span className="text-xs font-normal text-slate-500">/ {batch.totalQty} ta</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLowStock ? "bg-amber-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${percentSold}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>{soldQty} ta sotildi ({percentSold}%)</span>
                        <span>Tannarx: ${batch.buyPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 truncate max-w-[130px]" title={batch.supplierName}>
                      {batch.supplierName}
                    </span>
                    <button
                      onClick={() => onOpenSaleModal(batch.id)}
                      disabled={batch.remainingQty <= 0}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-xs disabled:opacity-50"
                    >
                      Sotish &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* So'nggi amallar (Sotuvlar va To'lovlar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* So'nggi Sotuvlar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900">So&apos;nggi Sotuvlar</h4>
            <span className="text-xs text-slate-400">{sales.length} ta jami</span>
          </div>
          <div className="divide-y divide-slate-100">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{sale.clientName}</div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                    <span>{sale.route}</span>
                    <span>•</span>
                    <span>{sale.qty} ta chipta</span>
                    <span>•</span>
                    <span>{sale.saleDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 font-mono">${sale.totalAmount.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-600 font-medium">
                    +${sale.profit.toLocaleString()} foyda
                  </div>
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <p className="py-6 text-xs text-slate-400 text-center">Hozircha sotuvlar yo&apos;q</p>
            )}
          </div>
        </div>

        {/* So'nggi To'lovlar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-900">Kassa Harakati (To&apos;lovlar)</h4>
            <span className="text-xs text-slate-400">{payments.length} ta jami</span>
          </div>
          <div className="divide-y divide-slate-100">
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      p.type === "INCOME"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {p.type === "INCOME" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{p.partnerName}</div>
                    <div className="text-slate-500 text-[11px]">
                      {p.paymentDate} • {p.paymentMethod} {p.notes ? `(${p.notes})` : ""}
                    </div>
                  </div>
                </div>
                <div
                  className={`font-bold font-mono text-sm ${
                    p.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {p.type === "INCOME" ? "+" : "-"}${p.amount.toLocaleString()}
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <p className="py-6 text-xs text-slate-400 text-center">Hozircha to&apos;lovlar kiritilmagan</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
