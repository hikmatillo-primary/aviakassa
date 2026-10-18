"use client";

import React from "react";
import {
  AviakassaData,
  Batch,
  CashAccount,
  DebtOffset,
  Partner,
  Payment,
  Sale,
} from "@/lib/storage";
import {
  apiCreateDebtOffset,
  apiCreateAutoBatches,
  apiAccountBatch,
  apiAccountSeries,
  apiCreateCategory,
  apiCreateSalesBulk,
  apiCreateBatchesBulk,
  apiCreatePayment,
  apiCreatePartner,
  apiUpdatePartner,
  apiDeleteBatch,
  apiDeleteSale,
  apiDeletePayment,
  apiCreateAccount,
  apiUpdateAccount,
  apiDeleteAccount,
  apiDeleteDebtOffset,
  apiDeletePartner,
  apiUpdateBatch,
  apiUpdateSale,
  apiImportData,
  AutoBatchPayload,
} from "@/lib/api";
import { BatchUpdatePayload } from "@/components/EditBatchModal";
import { SaleUpdatePayload } from "@/components/EditSaleModal";
import { formatDate, getTodayISO } from "@/lib/format";
import { ConfirmState } from "./useModalsState";

interface UseAviakassaActionsProps {
  data: AviakassaData;
  sales: Sale[];
  batches: Batch[];
  payments: Payment[];
  debtOffsets: DebtOffset[];
  syncFromServer: () => Promise<boolean>;
  showToast: (message: string, type?: "success" | "warning" | "info") => void;
  setConfirmState: (state: ConfirmState | null) => void;
  setLastCreatedPartnerId: (id: number | null) => void;
  editingPartner: Partner | null;
  detailBatchId: number | null;
  setDetailBatchId: (id: number | null) => void;
  detailPartnerId: number | null;
  setDetailPartnerId: (id: number | null) => void;
}

export function useAviakassaActions({
  data,
  sales,
  batches,
  payments,
  debtOffsets,
  syncFromServer,
  showToast,
  setConfirmState,
  setLastCreatedPartnerId,
  editingPartner,
  detailBatchId,
  setDetailBatchId,
  detailPartnerId,
  setDetailPartnerId,
}: UseAviakassaActionsProps) {
  const handleAddDebtOffset = async (offsetInput: {
    fromPartnerId: number;
    toPartnerId: number;
    amount: number;
    date: string;
    notes: string;
  }) => {
    try {
      await apiCreateDebtOffset({
        fromPartnerId: offsetInput.fromPartnerId,
        toPartnerId: offsetInput.toPartnerId,
        amount: offsetInput.amount,
        date: offsetInput.date,
        notes: offsetInput.notes,
      });
      await syncFromServer();
      showToast("O‘zaro qarz muvaffaqiyatli surildi! 🔄");
    } catch (e) {
      console.error("O'zaro qarz saqlashda xato:", e);
      await syncFromServer().catch(() => {});
      throw e;
    }
  };

  const handleAddAutoBatches = async (payload: AutoBatchPayload) => {
    try {
      const res = await apiCreateAutoBatches(payload);
      await syncFromServer();
      showToast(
        `${res.count} ta avto-partiya yaratildi` +
          (res.skipped.length ? `, ${res.skipped.length} tasi allaqachon bor edi` : "")
      );
      return res;
    } catch (e) {
      console.error("Avto-xarid yaratishda xato:", e);
      throw e;
    }
  };

  const handleAccountBatch = async (batch: Batch) => {
    try {
      await apiAccountBatch(batch.id);
      await syncFromServer();
      showToast("Partiya hisobga qo'shildi! ✅");
    } catch (e) {
      console.error("Hisobga qo'shishda xato:", e);
      throw e;
    }
  };

  const handleAccountSeries = async (seriesId: string) => {
    try {
      const res = await apiAccountSeries({ seriesId });
      await syncFromServer();
      showToast(`${res.updated} ta partiya hisobga qo'shildi! ✅`);
    } catch (e) {
      console.error("Seriyani hisobga qo'shishda xato:", e);
      throw e;
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      await apiCreateCategory(name);
      await syncFromServer();
      showToast("Yangi xarid turi qo'shildi!");
    } catch (e) {
      console.error("Xarid turini qo'shishda xato:", e);
      throw e;
    }
  };

  const handleAddSale = async (saleInput: {
    clientId: number;
    saleDate: string;
    paidNow: number;
    paymentMethod: string;
    accountId?: number;
    notes: string;
    items: Array<{
      batchId: number;
      qty: number;
      sellPrice: number;
      passengerNames?: string;
      segment?: string;
      departureTime?: string;
      arrivalTime?: string;
      isRoundTrip?: boolean;
      returnDate?: string;
      returnFlightNumber?: string;
      returnDepartureTime?: string;
      returnArrivalTime?: string;
    }>;
  }) => {
    const routeNames: string[] = [];
    try {
      const validItems = saleInput.items.filter((item) => item.batchId && item.qty > 0);
      for (const item of validItems) {
        const targetBatch = data.batches.find((b) => b.id === item.batchId);
        if (targetBatch) routeNames.push(targetBatch.route);
      }

      await apiCreateSalesBulk({
        clientId: saleInput.clientId,
        saleDate: saleInput.saleDate,
        paidNow: saleInput.paidNow,
        paymentMethod: saleInput.paymentMethod,
        accountId: saleInput.accountId,
        notes: saleInput.notes,
        paymentNotes:
          saleInput.paidNow > 0
            ? `Chiptalar sotuvi uchun to'lov (${routeNames.join(", ")})`
            : undefined,
        items: validItems.map((item) => ({
          batchId: item.batchId,
          qty: item.qty,
          sellPrice: item.sellPrice,
          passengerNames: item.passengerNames || "",
          segment: item.segment || "",
          departureTime: item.departureTime,
          arrivalTime: item.arrivalTime,
          isRoundTrip: item.isRoundTrip,
          returnDate: item.returnDate,
          returnFlightNumber: item.returnFlightNumber,
          returnDepartureTime: item.returnDepartureTime,
          returnArrivalTime: item.returnArrivalTime,
        })),
      });

      await syncFromServer();
      showToast("Chipta sotuvi muvaffaqiyatli saqlandi! 🎉");
    } catch (e) {
      console.error("Sotuvni saqlashda xato:", e);
      await syncFromServer().catch(() => {});
      throw e;
    }
  };

  const handleAddBatch = async (batchInput: {
    supplierId: number;
    purchaseDate?: string;
    paidNow?: number;
    paymentMethod?: string;
    accountId?: number;
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
  }) => {
    const routeNames: string[] = [];
    try {
      const items = batchInput.items.map((item) => {
        routeNames.push(item.route);
        const fullNotes = [
          item.baggage ? `Bagaj: ${item.baggage}` : null,
          item.notes ? item.notes.trim() : null,
        ]
          .filter(Boolean)
          .join(" • ");

        return {
          route: item.route,
          flightDate: item.flightDate,
          flightNumber: item.flightNumber ? item.flightNumber.trim().toUpperCase() : "",
          departureTime: item.departureTime,
          arrivalTime: item.arrivalTime,
          isRoundTrip: Boolean(item.isRoundTrip),
          returnDate: item.isRoundTrip ? item.returnDate : undefined,
          returnFlightNumber: item.isRoundTrip ? item.returnFlightNumber : undefined,
          returnDepartureTime: item.isRoundTrip ? item.returnDepartureTime : undefined,
          returnArrivalTime: item.isRoundTrip ? item.returnArrivalTime : undefined,
          baggage: item.baggage,
          totalQty: item.totalQty,
          buyPrice: item.buyPrice,
          notes: fullNotes,
          batchNumber: item.batchNumber?.trim() || undefined,
        };
      });

      await apiCreateBatchesBulk({
        supplierId: batchInput.supplierId,
        purchaseDate: batchInput.purchaseDate || getTodayISO(),
        paidNow: batchInput.paidNow || 0,
        paymentMethod: batchInput.paymentMethod || "CASH",
        accountId: batchInput.accountId,
        paymentNotes:
          batchInput.paidNow && batchInput.paidNow > 0
            ? `Partiyalar xaridi uchun to'lov (${routeNames.join(", ")})`
            : undefined,
        items,
      });

      await syncFromServer();
      showToast("Yangi partiya omborga kiritildi! ✈️");
    } catch (e) {
      console.error("Partiyani saqlashda xato:", e);
      await syncFromServer().catch(() => {});
      throw e;
    }
  };

  const handleAddPayment = async (paymentInput: {
    partnerId: number;
    type: "INCOME" | "EXPENSE";
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    accountId?: number;
    notes: string;
  }) => {
    try {
      await apiCreatePayment({
        partnerId: paymentInput.partnerId,
        type: paymentInput.type,
        amount: paymentInput.amount,
        paymentDate: paymentInput.paymentDate,
        paymentMethod: paymentInput.paymentMethod,
        accountId: paymentInput.accountId,
        notes: paymentInput.notes,
      });
      await syncFromServer();
      showToast(
        paymentInput.type === "INCOME"
          ? "Kassa kirimi muvaffaqiyatli saqlandi! 💵"
          : "Kassa chiqimi muvaffaqiyatli saqlandi! 💸"
      );
    } catch (e) {
      console.error("To'lovni saqlashda xato:", e);
      throw e;
    }
  };

  const handleSavePartner = async (partnerInput: {
    name: string;
    type?: "SUPPLIER" | "CLIENT";
    tags?: string[];
    phone: string;
    notes: string;
  }) => {
    try {
      if (editingPartner) {
        await apiUpdatePartner(editingPartner.id, {
          name: partnerInput.name,
          type: partnerInput.type || editingPartner.type || "CLIENT",
          phone: partnerInput.phone,
          notes: partnerInput.notes,
        });
        await syncFromServer();
        showToast("Hamkor ma'lumotlari yangilandi!");
      } else {
        const created = await apiCreatePartner({
          name: partnerInput.name,
          type: partnerInput.type || "CLIENT",
          tags: partnerInput.tags || [],
          phone: partnerInput.phone,
          notes: partnerInput.notes,
        });
        setLastCreatedPartnerId(created.id);
        await syncFromServer();
        showToast("Yangi hamkor muvaffaqiyatli qo‘shildi! 🤝");
      }
    } catch (e) {
      console.error("Hamkorni saqlashda xato:", e);
      throw e;
    }
  };

  const handleDeleteBatch = (batch: Batch) => {
    const relatedSales = sales.filter((s) => s.batchId === batch.id);
    if (relatedSales.length > 0) {
      setConfirmState({
        title: "Partiyani o‘chirib bo‘lmaydi",
        variant: "info",
        confirmLabel: "Tushundim",
        message: (
          <div className="space-y-3">
            <p>
              <b>&quot;{batch.route}&quot;</b> partiyasiga <b>{relatedSales.length} ta sotuv</b> bog‘langan,
              shuning uchun uni o‘chirish mumkin emas.
            </p>
            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {relatedSales.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-lg px-3 py-2"
                >
                  <span className="truncate">
                    {s.clientName} • {formatDate(s.saleDate)}
                  </span>
                  <span className="font-semibold shrink-0">{s.qty} ta</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Avval ushbu sotuvlarni o‘chiring yoki boshqa partiyaga o‘tkazing, keyin partiyani
              o‘chirishingiz mumkin.
            </p>
          </div>
        ),
      });
      return;
    }
    setConfirmState({
      title: "Partiyani o‘chirish",
      message: `"${batch.route}" partiyasini o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi.`,
      action: async () => {
        await apiDeleteBatch(batch.id);
        await syncFromServer();
        showToast("Partiya o‘chirildi!", "info");
        if (detailBatchId === batch.id) setDetailBatchId(null);
      },
    });
  };

  const handleDeleteSale = (sale: Sale) => {
    setConfirmState({
      title: "Sotuvni o‘chirish",
      message: "Ushbu chipta sotuvini o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi.",
      action: async () => {
        await apiDeleteSale(sale.id);
        await syncFromServer();
        showToast("Sotuv o‘chirildi!", "info");
      },
    });
  };

  const handleDeletePayment = (payment: Payment) => {
    setConfirmState({
      title: "To‘lovni o‘chirish",
      message: "Ushbu kassa yozuvini o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi.",
      action: async () => {
        await apiDeletePayment(payment.id);
        await syncFromServer();
        showToast("To‘lov o‘chirildi!", "info");
      },
    });
  };

  const handleAddAccount = async (name: string) => {
    try {
      await apiCreateAccount({ name });
      await syncFromServer();
      showToast("Yangi hisob qo‘shildi! 🏦");
    } catch (e) {
      console.error("Hisobni saqlashda xato:", e);
      throw e;
    }
  };

  const handleRenameAccount = async (account: CashAccount, newName: string) => {
    try {
      await apiUpdateAccount(account.id, { name: newName });
      await syncFromServer();
      showToast("Hisob nomi o‘zgartirildi!");
    } catch (e) {
      console.error("Hisob nomini o‘zgartirishda xato:", e);
      throw e;
    }
  };

  const handleDeleteAccount = (account: CashAccount) => {
    const relatedPayments = payments.filter((p) => p.accountId === account.id);
    if (relatedPayments.length > 0) {
      setConfirmState({
        title: "Hisobni o‘chirib bo‘lmaydi",
        variant: "info",
        confirmLabel: "Tushundim",
        message: (
          <div className="space-y-3">
            <p>
              <b>&quot;{account.name}&quot;</b> hisobiga <b>{relatedPayments.length} ta to‘lov</b> bog‘langan,
              shuning uchun uni o‘chirish mumkin emas.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Avval ushbu to‘lovlarni o‘chiring yoki boshqa hisobga o‘tkazing, keyin hisobni
              o‘chirishingiz mumkin.
            </p>
          </div>
        ),
      });
      return;
    }
    setConfirmState({
      title: "Hisobni o‘chirish",
      message: `"${account.name}" hisobini o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi.`,
      action: async () => {
        await apiDeleteAccount(account.id);
        await syncFromServer();
        showToast("Hisob o‘chirildi!", "info");
      },
    });
  };

  const handleDeleteDebtOffset = (offset: DebtOffset) => {
    setConfirmState({
      title: "Qarz surishni o‘chirish",
      message: "Ushbu o‘zaro qarz surish yozuvini o‘chirmoqchimisiz?",
      action: async () => {
        await apiDeleteDebtOffset(offset.id);
        await syncFromServer();
        showToast("Qarz surish o‘chirildi!", "info");
      },
    });
  };

  const handleDeletePartner = (partner: Partner) => {
    const relatedSales = sales.filter((s) => s.clientId === partner.id);
    const relatedBatches = batches.filter((b) => b.supplierId === partner.id);
    const relatedPayments = payments.filter((p) => p.partnerId === partner.id);
    const relatedOffsets = debtOffsets.filter(
      (o) => o.fromPartnerId === partner.id || o.toPartnerId === partner.id
    );
    const totalRelated =
      relatedSales.length + relatedBatches.length + relatedPayments.length + relatedOffsets.length;

    if (totalRelated > 0) {
      const items: Array<{ label: string; count: number }> = [
        { label: "ta sotuv", count: relatedSales.length },
        { label: "ta partiya", count: relatedBatches.length },
        { label: "ta kassa to‘lovi", count: relatedPayments.length },
        { label: "ta o‘zaro qarz surish", count: relatedOffsets.length },
      ].filter((i) => i.count > 0);

      setConfirmState({
        title: "Hamkorni o‘chirib bo‘lmaydi",
        variant: "info",
        confirmLabel: "Tushundim",
        message: (
          <div className="space-y-3">
            <p>
              <b>&quot;{partner.name}&quot;</b> hamkoriga bog‘langan yozuvlar mavjud, shuning uchun uni
              o‘chirish mumkin emas:
            </p>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-lg px-3 py-2"
                >
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Avval ushbu yozuvlarni o‘chiring yoki boshqa hamkorga o‘tkazing, keyin hamkorni
              o‘chirishingiz mumkin.
            </p>
          </div>
        ),
      });
      return;
    }

    setConfirmState({
      title: "Hamkorni o‘chirish",
      message: `"${partner.name}" hamkorini o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi.`,
      action: async () => {
        await apiDeletePartner(partner.id);
        await syncFromServer();
        showToast("Hamkor o‘chirildi!", "info");
        if (detailPartnerId === partner.id) setDetailPartnerId(null);
      },
    });
  };

  const handleUpdateBatchPrice = async (
    batchId: number,
    newBuyPrice: number,
    newTotalQty: number
  ) => {
    try {
      await apiUpdateBatch(batchId, { buyPrice: newBuyPrice, totalQty: newTotalQty });
      await syncFromServer();
      showToast("Partiya ma'lumotlari yangilandi!");
    } catch (e) {
      console.error("Partiya ma'lumotlarini yangilashda xato:", e);
      await syncFromServer().catch(() => {});
      throw e;
    }
  };

  const handleUpdateSalePrice = async (
    saleId: number,
    newSellPrice: number,
    newQty: number,
    newPassengerNames: string
  ) => {
    try {
      await apiUpdateSale(saleId, {
        sellPrice: newSellPrice,
        qty: newQty,
        passengerNames: newPassengerNames,
      });
      await syncFromServer();
      showToast("Sotuv ma'lumotlari yangilandi!");
    } catch (e) {
      console.error("Sotuv ma'lumotlarini yangilashda xato:", e);
      await syncFromServer().catch(() => {});
      throw e;
    }
  };

  const handleSaveFullBatch = async (batchId: number, payload: BatchUpdatePayload) => {
    try {
      await apiUpdateBatch(batchId, payload);
      await syncFromServer();
      showToast("Partiya ma'lumotlari yangilandi! ✈️");
    } catch (e) {
      console.error("Partiyani tahrirlashda xato:", e);
      await syncFromServer().catch(() => {});
      throw e;
    }
  };

  const handleSaveFullSale = async (saleId: number, payload: SaleUpdatePayload) => {
    try {
      await apiUpdateSale(saleId, payload);
      await syncFromServer();
      showToast("Sotuv ma'lumotlari yangilandi! 🎉");
    } catch (e) {
      console.error("Sotuvni tahrirlashda xato:", e);
      await syncFromServer().catch(() => {});
      throw e;
    }
  };

  const handleExportBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = getTodayISO();
    a.href = url;
    a.download = `5tour_zaxira_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Zaxira nusxa fayli yuklab olindi! 📥");
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (
          parsed &&
          Array.isArray(parsed.batches) &&
          Array.isArray(parsed.partners) &&
          Array.isArray(parsed.sales) &&
          Array.isArray(parsed.payments)
        ) {
          if (
            window.confirm(
              "Fayldagi zaxira nusxa yuklansinmi? Hozirgi ma'lumotlar serverda yangilanadi."
            )
          ) {
            await apiImportData(parsed as AviakassaData);
            await syncFromServer();
            showToast("Zaxira nusxa muvaffaqiyatli tiklandi! 📦");
          }
        } else {
          showToast("Fayl formati mos kelmadi! 5TOUR JSON faylini tanlang.", "warning");
        }
      } catch (err) {
        console.error("Zaxira nusxani tiklashda xato:", err);
        showToast("Zaxira nusxani tiklab bo'lmadi!", "warning");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return {
    handleAddDebtOffset,
    handleAddAutoBatches,
    handleAccountBatch,
    handleAccountSeries,
    handleCreateCategory,
    handleAddSale,
    handleAddBatch,
    handleAddPayment,
    handleSavePartner,
    handleDeleteBatch,
    handleDeleteSale,
    handleDeletePayment,
    handleAddAccount,
    handleRenameAccount,
    handleDeleteAccount,
    handleDeleteDebtOffset,
    handleDeletePartner,
    handleUpdateBatchPrice,
    handleUpdateSalePrice,
    handleSaveFullBatch,
    handleSaveFullSale,
    handleExportBackup,
    handleImportFileChange,
  };
}
