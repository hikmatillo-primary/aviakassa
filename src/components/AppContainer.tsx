"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Navbar } from "./Navbar";
import { DashboardView } from "./DashboardView";
import { BatchesView } from "./BatchesView";
import { PartnersView } from "./PartnersView";
import { SalesView } from "./SalesView";
import { PaymentsView } from "./PaymentsView";
import { SaleModal } from "./SaleModal";
import { BatchModal } from "./BatchModal";
import { PaymentModal } from "./PaymentModal";
import { PartnerModal } from "./PartnerModal";
import { PartnerHistoryModal } from "./PartnerHistoryModal";
import { DebtOffsetModal } from "./DebtOffsetModal";
import { EditPriceModal } from "./EditPriceModal";
import { BatchDetailView } from "./BatchDetailView";
import {
  AviakassaData,
  INITIAL_DEMO_DATA,
  loadData,
  saveData,
  calculateEnrichedData,
  Sale,
  Batch,
  Payment,
  Partner,
  DebtOffset,
} from "@/lib/storage";

export function AppContainer() {
  const [data, setData] = useState<AviakassaData>(INITIAL_DEMO_DATA);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [detailBatchId, setDetailBatchId] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme from localStorage / system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("aviakassa_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(shouldDark);
    if (shouldDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("aviakassa_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("aviakassa_theme", "light");
      }
      return next;
    });
  };

  // Initialize data from localStorage on mount
  useEffect(() => {
    const saved = loadData();
    setData(saved);
  }, []);

  const updateData = (newData: AviakassaData) => {
    setData(newData);
    saveData(newData);
  };

  // Enriched metrics & data
  const { stats, batches, sales, payments, partners, debtOffsets } = useMemo(
    () => calculateEnrichedData(data),
    [data]
  );

  // Modals state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [paymentModalPartnerId, setPaymentModalPartnerId] = useState<number | null>(null);

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerModalType, setPartnerModalType] = useState<"CLIENT" | "SUPPLIER">("CLIENT");

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPartnerId, setHistoryPartnerId] = useState<number | null>(null);

  const [isDebtOffsetModalOpen, setIsDebtOffsetModalOpen] = useState(false);
  const [debtOffsetModalFromId, setDebtOffsetModalFromId] = useState<number | null>(null);
  const [debtOffsetModalToId, setDebtOffsetModalToId] = useState<number | null>(null);

  const [editPriceModal, setEditPriceModal] = useState<{
    isOpen: boolean;
    mode: "BATCH" | "SALE";
    item: any | null;
  }>({
    isOpen: false,
    mode: "BATCH",
    item: null,
  });

  // Quick Open Handlers
  const handleOpenSaleModal = (batchId?: number) => {
    setSelectedBatchId(batchId || null);
    setIsSaleModalOpen(true);
  };

  const handleOpenEditBatch = (batch: any) => {
    setEditPriceModal({
      isOpen: true,
      mode: "BATCH",
      item: batch,
    });
  };

  const handleOpenEditSale = (sale: any) => {
    setEditPriceModal({
      isOpen: true,
      mode: "SALE",
      item: sale,
    });
  };

  const handleOpenPaymentModal = (type: "INCOME" | "EXPENSE" = "INCOME", partnerId?: number) => {
    setPaymentModalType(type);
    setPaymentModalPartnerId(partnerId || null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenPartnerModal = (type: "CLIENT" | "SUPPLIER" = "CLIENT") => {
    setPartnerModalType(type);
    setIsPartnerModalOpen(true);
  };

  const handleOpenHistoryModal = (partnerId: number) => {
    setHistoryPartnerId(partnerId);
    setIsHistoryModalOpen(true);
  };

  const handleOpenDebtOffsetModal = (fromPartnerId?: number, toPartnerId?: number) => {
    setDebtOffsetModalFromId(fromPartnerId || null);
    setDebtOffsetModalToId(toPartnerId || null);
    setIsDebtOffsetModalOpen(true);
  };

  const handleAddDebtOffset = (offsetInput: {
    fromPartnerId: number;
    toPartnerId: number;
    amount: number;
    date: string;
    notes: string;
  }) => {
    const newOffset: DebtOffset = {
      id: Date.now(),
      fromPartnerId: offsetInput.fromPartnerId,
      toPartnerId: offsetInput.toPartnerId,
      amount: offsetInput.amount,
      date: offsetInput.date,
      notes: offsetInput.notes,
      createdAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      debtOffsets: [newOffset, ...(data.debtOffsets || [])],
    });
  };

  // CRUD Operations
  const handleAddSale = (saleInput: {
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
      isRoundTrip?: boolean;
      returnDate?: string;
      returnFlightNumber?: string;
    }>;
  }) => {
    const newSales: Sale[] = [];
    let updatedBatches = [...data.batches];
    const routeNames: string[] = [];

    saleInput.items.forEach((item, index) => {
      const targetBatch = updatedBatches.find((b) => b.id === item.batchId);
      if (!targetBatch || item.qty <= 0) return;

      const totalAmount = item.qty * item.sellPrice;
      const profit = totalAmount - item.qty * targetBatch.buyPrice;
      routeNames.push(targetBatch.route);

      const newSale: Sale = {
        id: Date.now() + index,
        batchId: item.batchId,
        clientId: saleInput.clientId,
        qty: item.qty,
        sellPrice: item.sellPrice,
        totalAmount,
        profit,
        isRoundTrip: item.isRoundTrip ?? targetBatch.isRoundTrip ?? false,
        returnDate: item.returnDate || targetBatch.returnDate || "",
        returnFlightNumber: item.returnFlightNumber || targetBatch.returnFlightNumber || "",
        passengerNames: item.passengerNames || "",
        saleDate: saleInput.saleDate,
        notes: saleInput.notes,
        createdAt: new Date().toISOString(),
      };
      newSales.push(newSale);

      updatedBatches = updatedBatches.map((b) => {
        if (b.id === item.batchId) {
          const remainingQty = Math.max(0, b.remainingQty - item.qty);
          return {
            ...b,
            remainingQty,
            status: remainingQty === 0 ? ("COMPLETED" as const) : b.status,
          };
        }
        return b;
      });
    });

    const newPayments = [...data.payments];
    if (saleInput.paidNow > 0) {
      newPayments.unshift({
        id: Date.now() + 100,
        partnerId: saleInput.clientId,
        type: "INCOME",
        amount: saleInput.paidNow,
        paymentDate: saleInput.saleDate,
        paymentMethod: saleInput.paymentMethod,
        notes: `Chiptalar sotuvi uchun to'lov (${routeNames.join(", ")})`,
        createdAt: new Date().toISOString(),
      });
    }

    updateData({
      ...data,
      batches: updatedBatches,
      sales: [...newSales, ...data.sales],
      payments: newPayments,
    });
  };

  const handleAddBatch = (batchInput: {
    supplierId: number;
    purchaseDate?: string;
    paidNow?: number;
    paymentMethod?: string;
    notes?: string;
    items: Array<{
      route: string;
      flightDate: string;
      flightNumber?: string;
      isRoundTrip?: boolean;
      returnDate?: string;
      returnFlightNumber?: string;
      totalQty: number;
      buyPrice: number;
      baggage?: string;
      notes?: string;
      batchNumber?: string;
    }>;
  }) => {
    const newBatches: Batch[] = [];
    const routeNames: string[] = [];
    const baseId = Date.now();

    batchInput.items.forEach((item, index) => {
      // Auto-generate batch number if empty
      let batchNum = item.batchNumber;
      if (!batchNum || !batchNum.trim()) {
        const dest = item.route.includes("—") ? item.route.split("—")[1].trim() : item.route;
        const code = dest.slice(0, 3).toUpperCase();
        const rand = Math.floor(100 + Math.random() * 900);
        batchNum = `P-${code}-${rand}`;
      }

      const fullNotes = [
        item.baggage ? `Bagaj: ${item.baggage}` : null,
        item.notes ? item.notes.trim() : null,
      ]
        .filter(Boolean)
        .join(" • ");

      const newBatch: Batch = {
        id: baseId + index,
        batchNumber: batchNum,
        route: item.route,
        flightDate: item.flightDate,
        flightNumber: item.flightNumber ? item.flightNumber.trim().toUpperCase() : "",
        isRoundTrip: Boolean(item.isRoundTrip),
        returnDate: item.isRoundTrip ? item.returnDate : undefined,
        returnFlightNumber: item.isRoundTrip ? item.returnFlightNumber : undefined,
        purchaseDate: batchInput.purchaseDate || new Date().toISOString().split("T")[0],
        baggage: item.baggage,
        supplierId: batchInput.supplierId,
        totalQty: item.totalQty,
        remainingQty: item.totalQty,
        buyPrice: item.buyPrice,
        totalCost: item.totalQty * item.buyPrice,
        status: "ACTIVE",
        notes: fullNotes,
        createdAt: new Date().toISOString(),
      };
      newBatches.push(newBatch);
      routeNames.push(item.route);
    });

    const newPayments = [...data.payments];
    if (batchInput.paidNow && batchInput.paidNow > 0) {
      newPayments.unshift({
        id: baseId + 500,
        partnerId: batchInput.supplierId,
        type: "EXPENSE",
        amount: batchInput.paidNow,
        paymentDate:
          batchInput.purchaseDate ||
          newBatches[0]?.flightDate ||
          new Date().toISOString().split("T")[0],
        paymentMethod: batchInput.paymentMethod || "CASH",
        notes: `Partiyalar xaridi uchun to'lov (${routeNames.join(", ")})`,
        createdAt: new Date().toISOString(),
      });
    }

    updateData({
      ...data,
      batches: [...newBatches, ...data.batches],
      payments: newPayments,
    });
  };

  const handleAddPayment = (paymentInput: {
    partnerId: number;
    type: "INCOME" | "EXPENSE";
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes: string;
  }) => {
    const newPayment: Payment = {
      id: Date.now(),
      partnerId: paymentInput.partnerId,
      type: paymentInput.type,
      amount: paymentInput.amount,
      paymentDate: paymentInput.paymentDate,
      paymentMethod: paymentInput.paymentMethod,
      notes: paymentInput.notes,
      createdAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      payments: [newPayment, ...data.payments],
    });
  };

  const handleAddPartner = (partnerInput: {
    name: string;
    type: "SUPPLIER" | "CLIENT";
    phone: string;
    notes: string;
  }) => {
    const newPartner: Partner = {
      id: Date.now(),
      name: partnerInput.name,
      type: partnerInput.type,
      phone: partnerInput.phone,
      notes: partnerInput.notes,
      createdAt: new Date().toISOString(),
    };

    updateData({
      ...data,
      partners: [...data.partners, newPartner],
    });
  };

  const handleToggleBatchStatus = (id: number) => {
    const updatedBatches = data.batches.map((b) => {
      if (b.id === id) {
        return {
          ...b,
          status: (b.status === "ACTIVE" ? "COMPLETED" : "ACTIVE") as "ACTIVE" | "COMPLETED",
        };
      }
      return b;
    });

    updateData({
      ...data,
      batches: updatedBatches,
    });
  };

  // Xarid narxi va sonini tahrirlash (Kompaniya hisob-kitobi va sof foydani qayta hisoblaydi)
  const handleUpdateBatchPrice = (batchId: number, newBuyPrice: number, newTotalQty: number) => {
    const updatedBatches = data.batches.map((b) => {
      if (b.id === batchId) {
        return {
          ...b,
          buyPrice: newBuyPrice,
          totalQty: newTotalQty,
          totalCost: newTotalQty * newBuyPrice,
        };
      }
      return b;
    });

    const updatedSales = data.sales.map((s) => {
      if (s.batchId === batchId) {
        return {
          ...s,
          buyPrice: newBuyPrice,
          profit: s.qty * s.sellPrice - s.qty * newBuyPrice,
        };
      }
      return s;
    });

    updateData({
      ...data,
      batches: updatedBatches,
      sales: updatedSales,
    });
  };

  // Sotuv narxi va sonini tahrirlash (Mijoz hisob-kitobi va sof foydani qayta hisoblaydi)
  const handleUpdateSalePrice = (
    saleId: number,
    newSellPrice: number,
    newQty: number,
    newPassengerNames: string
  ) => {
    const updatedSales = data.sales.map((s) => {
      if (s.id === saleId) {
        const currentBatch = data.batches.find((b) => b.id === s.batchId);
        const currentBuyPrice = currentBatch ? currentBatch.buyPrice : (s.buyPrice || 0);
        const newTotalAmount = newQty * newSellPrice;
        return {
          ...s,
          sellPrice: newSellPrice,
          qty: newQty,
          passengerNames: newPassengerNames,
          buyPrice: currentBuyPrice,
          totalAmount: newTotalAmount,
          profit: newTotalAmount - newQty * currentBuyPrice,
        };
      }
      return s;
    });

    updateData({
      ...data,
      sales: updatedSales,
    });
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `aviakassa_zaxira_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
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
              "Fayldagi zaxira nusxa yuklansinmi? Hozirgi ma'lumotlar yangilanadi."
            )
          ) {
            updateData(parsed);
            alert("Ma'lumotlar muvaffaqiyatli tiklandi!");
          }
        } else {
          alert("Fayl formati mos kelmadi! Aviakassa zaxira JSON faylini tanlang.");
        }
      } catch (err) {
        alert("Faylni o'qishda xatolik yuz berdi!");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetDemo = () => {
    if (window.confirm("Barcha namunaviy demo ma'lumotlar qayta yuklansinmi?")) {
      updateData(INITIAL_DEMO_DATA);
    }
  };

  const clients = partners.filter((p) => p.type === "CLIENT");
  const suppliers = partners.filter((p) => p.type === "SUPPLIER");

  return (
    <div className="min-h-screen bg-[#f4f5f8] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Navbar with exact requested tabs and dark mode toggle */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setDetailBatchId(null);
        }}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenSaleModal={() => handleOpenSaleModal()}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onExportData={handleExportBackup}
        onImportData={() => fileInputRef.current?.click()}
        onResetDemo={handleResetDemo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-6">
        {/* Tab 1: Dashboard (Faqat ma'lumotlar va tahlil) */}
        {activeTab === "dashboard" && (
          <DashboardView
            stats={stats}
            batches={batches}
            sales={sales}
            payments={payments}
            partners={partners}
            onViewAllBatches={() => {
              setActiveTab("inventory");
              setDetailBatchId(null);
            }}
            onViewAllPartners={() => setActiveTab("purchases")}
            onResetDemo={handleResetDemo}
          />
        )}

        {/* Tab 2: Xarid (Faqat xaridlar va yangi xarid qilish) */}
        {activeTab === "purchases" && (
          <PartnersView
            batches={batches}
            suppliers={suppliers}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onOpenPartnerModal={() => handleOpenPartnerModal("SUPPLIER")}
            onEditBatch={handleOpenEditBatch}
            onOpenHistoryModal={handleOpenHistoryModal}
          />
        )}

        {/* Tab 3: Ombor (Bloklar va mahsulot ichki Xarid/Sotuv sahifasi) */}
        {activeTab === "inventory" && (
          detailBatchId !== null && batches.find((b) => b.id === detailBatchId) ? (
            <BatchDetailView
              batch={batches.find((b) => b.id === detailBatchId)}
              allBatches={batches}
              allSales={sales}
              onBack={() => setDetailBatchId(null)}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
              onOpenSaleModal={(batchId) => handleOpenSaleModal(batchId)}
              onEditBatch={handleOpenEditBatch}
              onEditSale={handleOpenEditSale}
              onOpenHistoryModal={handleOpenHistoryModal}
            />
          ) : (
            <BatchesView
              batches={batches}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
              onToggleStatus={handleToggleBatchStatus}
              onEditBatch={handleOpenEditBatch}
              onOpenHistoryModal={handleOpenHistoryModal}
              onSelectBatch={(batchId) => setDetailBatchId(batchId)}
            />
          )
        )}

        {/* Tab 4: Sotuv (Faqat sotuvlar daftari va chipta sotish) */}
        {activeTab === "sales" && (
          <SalesView
            sales={sales}
            clients={clients}
            onOpenSaleModal={() => handleOpenSaleModal()}
            onOpenPartnerModal={() => handleOpenPartnerModal("CLIENT")}
            onEditSale={handleOpenEditSale}
            onOpenHistoryModal={handleOpenHistoryModal}
          />
        )}

        {/* Tab 5: Kassa (Kassa kirim/chiqim, hamkorlar otchyoti va to'lovlar) */}
        {activeTab === "cash" && (
          <PaymentsView
            payments={payments}
            debtOffsets={debtOffsets}
            partners={partners}
            onOpenPaymentModal={handleOpenPaymentModal}
            onOpenDebtOffsetModal={handleOpenDebtOffsetModal}
            onOpenHistoryModal={handleOpenHistoryModal}
          />
        )}
      </main>

      {/* Modals */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        batches={batches}
        clients={clients}
        selectedBatchId={selectedBatchId}
        onSave={handleAddSale}
        onOpenClientModal={() => {
          setIsSaleModalOpen(false);
          handleOpenPartnerModal("CLIENT");
        }}
      />

      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        suppliers={suppliers}
        onSave={handleAddBatch}
        onOpenSupplierModal={() => {
          setIsBatchModalOpen(false);
          handleOpenPartnerModal("SUPPLIER");
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        partners={partners}
        defaultType={paymentModalType}
        defaultPartnerId={paymentModalPartnerId}
        onSave={handleAddPayment}
      />

      <PartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        defaultType={partnerModalType}
        onSave={handleAddPartner}
      />

      <PartnerHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        partnerId={historyPartnerId}
        partners={partners}
        batches={batches}
        sales={sales}
        payments={payments}
        debtOffsets={debtOffsets}
        onOpenPaymentModal={handleOpenPaymentModal}
        onOpenDebtOffsetModal={handleOpenDebtOffsetModal}
        onEditBatch={handleOpenEditBatch}
        onEditSale={handleOpenEditSale}
      />

      <DebtOffsetModal
        isOpen={isDebtOffsetModalOpen}
        onClose={() => setIsDebtOffsetModalOpen(false)}
        partners={partners}
        defaultFromPartnerId={debtOffsetModalFromId}
        defaultToPartnerId={debtOffsetModalToId}
        onSave={handleAddDebtOffset}
      />

      <EditPriceModal
        isOpen={editPriceModal.isOpen}
        onClose={() => setEditPriceModal((prev) => ({ ...prev, isOpen: false }))}
        mode={editPriceModal.mode}
        item={editPriceModal.item}
        onSaveBatch={handleUpdateBatchPrice}
        onSaveSale={handleUpdateSalePrice}
      />
    </div>
  );
}
