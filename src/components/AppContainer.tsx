"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
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
import { PartnersListView } from "./PartnersListView";
import { PartnerDetailView } from "./PartnerDetailView";
import {
  AviakassaData,
  EMPTY_AVIAKASSA_DATA,
  loadData,
  saveData,
  calculateEnrichedData,
  Sale,
  Batch,
  Payment,
  Partner,
  DebtOffset,
} from "@/lib/storage";
import {
  apiFetchAll,
  apiCreateBatch,
  apiUpdateBatch,
  apiCreateSale,
  apiUpdateSale,
  apiCreatePayment,
  apiCreatePartner,
  apiCreateDebtOffset,
  apiImportData,
  apiResetData,
  UNAUTHORIZED_EVENT,
} from "@/lib/api";
import { LoginView } from "./LoginView";
import { getStoredUser, isAuthenticated, logoutUser, AuthUser } from "@/lib/auth";

export function AppContainer() {
  const [data, setData] = useState<AviakassaData>(EMPTY_AVIAKASSA_DATA);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [detailBatchId, setDetailBatchId] = useState<number | null>(null);
  const [detailPartnerId, setDetailPartnerId] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast Notification state
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: "success" | "warning" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "warning" | "info" = "success") => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  };

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

  // Prevent mouse wheel from incrementing/decrementing number inputs
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === "number") {
        active.blur();
      }
      const target = e.target;
      if (target instanceof HTMLInputElement && target.type === "number") {
        target.blur();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
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

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = getStoredUser();
      const isAuth = isAuthenticated();
      if (isAuth && user) {
        setCurrentUser(user);
      }
      setIsAuthChecking(false);
    }
  }, []);

  // Sync data with Django backend when authenticated
  useEffect(() => {
    if (!currentUser) return;
    const saved = loadData();
    setData(saved);

    // Backend bilan sinxronlash
    apiFetchAll()
      .then((backendData) => {
        setData(backendData);
        saveData(backendData);
      })
      .catch((err) => {
        console.warn("Backend bilan ulanib bo'lmadi, lokal ma'lumotlar ishlatilmoqda:", err);
      });
  }, [currentUser]);

  // Token muddati tugaganda (401) avtomatik chiqarish
  useEffect(() => {
    const onUnauthorized = () => {
      logoutUser();
      setCurrentUser(null);
      showToast("Sessiya muddati tugadi. Iltimos, qayta kiring.", "warning");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    showToast("Tizimdan muvaffaqiyatli chiqildi!", "info");
  };

  // Serverdan eng so'nggi holatni yuklash (yagona haqiqat manbai = server)
  const syncFromServer = async (): Promise<boolean> => {
    try {
      const synced = await apiFetchAll();
      setData(synced);
      saveData(synced);
      return true;
    } catch (e) {
      console.warn("Serverdan ma'lumot yuklashda xato:", e);
      return false;
    }
  };

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
  const [paymentModalNotes, setPaymentModalNotes] = useState<string>("");
  const [paymentModalAmount, setPaymentModalAmount] = useState<number | undefined>(undefined);

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerModalType, setPartnerModalType] = useState<"CLIENT" | "SUPPLIER">("CLIENT");
  const [lastCreatedPartnerId, setLastCreatedPartnerId] = useState<number | null>(null);

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

  const handleOpenPaymentModal = (
    type: "INCOME" | "EXPENSE" = "INCOME",
    partnerId?: number,
    defaultNotes?: string,
    defaultAmount?: number
  ) => {
    setPaymentModalType(type);
    setPaymentModalPartnerId(partnerId || null);
    setPaymentModalNotes(defaultNotes || "");
    setPaymentModalAmount(defaultAmount);
    setIsPaymentModalOpen(true);
  };

  const handleOpenPartnerModal = (type: "CLIENT" | "SUPPLIER" = "CLIENT") => {
    setPartnerModalType(type);
    setIsPartnerModalOpen(true);
  };

  const handleOpenPartnerDetail = (partnerId: number) => {
    setDetailPartnerId(partnerId);
    setActiveTab("partners");
  };

  const handleOpenHistoryModal = (partnerId: number) => {
    handleOpenPartnerDetail(partnerId);
  };

  const handleOpenDebtOffsetModal = (fromPartnerId?: number, toPartnerId?: number) => {
    setDebtOffsetModalFromId(fromPartnerId || null);
    setDebtOffsetModalToId(toPartnerId || null);
    setIsDebtOffsetModalOpen(true);
  };

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
      showToast("O‘zaro qarzni saqlab bo'lmadi. Qayta urinib ko'ring.", "warning");
    }
  };

  // CRUD Operations
  const handleAddSale = async (saleInput: {
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
  }) => {
    const routeNames: string[] = [];
    try {
      for (const item of saleInput.items) {
        if (!item.batchId || item.qty <= 0) continue;
        const targetBatch = data.batches.find((b) => b.id === item.batchId);
        if (targetBatch) routeNames.push(targetBatch.route);

        await apiCreateSale({
          batchId: item.batchId,
          clientId: saleInput.clientId,
          qty: item.qty,
          sellPrice: item.sellPrice,
          passengerNames: item.passengerNames || "",
          saleDate: saleInput.saleDate,
          departureTime: item.departureTime,
          arrivalTime: item.arrivalTime,
          isRoundTrip: item.isRoundTrip,
          returnDate: item.returnDate,
          returnFlightNumber: item.returnFlightNumber,
          returnDepartureTime: item.returnDepartureTime,
          returnArrivalTime: item.returnArrivalTime,
          notes: saleInput.notes,
        });
      }
      if (saleInput.paidNow > 0) {
        await apiCreatePayment({
          partnerId: saleInput.clientId,
          type: "INCOME",
          amount: saleInput.paidNow,
          paymentDate: saleInput.saleDate,
          paymentMethod: saleInput.paymentMethod,
          notes: `Chiptalar sotuvi uchun to'lov (${routeNames.join(", ")})`,
        });
      }
      await syncFromServer();
      showToast("Chipta sotuvi muvaffaqiyatli saqlandi! 🎉");
    } catch (e) {
      console.error("Sotuvni saqlashda xato:", e);
      await syncFromServer();
      showToast("Sotuvni saqlab bo'lmadi! Ma'lumotlar serverdan yangilandi.", "warning");
    }
  };

  const handleAddBatch = async (batchInput: {
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
  }) => {
    const routeNames: string[] = [];
    try {
      for (const item of batchInput.items) {
        routeNames.push(item.route);
        const fullNotes = [
          item.baggage ? `Bagaj: ${item.baggage}` : null,
          item.notes ? item.notes.trim() : null,
        ]
          .filter(Boolean)
          .join(" • ");

        await apiCreateBatch({
          supplierId: batchInput.supplierId,
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
          purchaseDate: batchInput.purchaseDate || new Date().toISOString().split("T")[0],
          baggage: item.baggage,
          totalQty: item.totalQty,
          buyPrice: item.buyPrice,
          notes: fullNotes,
          batchNumber: item.batchNumber?.trim() || undefined,
        });
      }
      if (batchInput.paidNow && batchInput.paidNow > 0) {
        await apiCreatePayment({
          partnerId: batchInput.supplierId,
          type: "EXPENSE",
          amount: batchInput.paidNow,
          paymentDate:
            batchInput.purchaseDate ||
            batchInput.items[0]?.flightDate ||
            new Date().toISOString().split("T")[0],
          paymentMethod: batchInput.paymentMethod || "CASH",
          notes: `Partiyalar xaridi uchun to'lov (${routeNames.join(", ")})`,
        });
      }
      await syncFromServer();
      showToast("Yangi partiya omborga kiritildi! ✈️");
    } catch (e) {
      console.error("Partiyani saqlashda xato:", e);
      await syncFromServer();
      showToast("Partiyani saqlab bo'lmadi! Ma'lumotlar serverdan yangilandi.", "warning");
    }
  };

  const handleAddPayment = async (paymentInput: {
    partnerId: number;
    type: "INCOME" | "EXPENSE";
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes: string;
  }) => {
    try {
      await apiCreatePayment({
        partnerId: paymentInput.partnerId,
        type: paymentInput.type,
        amount: paymentInput.amount,
        paymentDate: paymentInput.paymentDate,
        paymentMethod: paymentInput.paymentMethod,
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
      showToast("To'lovni saqlab bo'lmadi! Qayta urinib ko'ring.", "warning");
    }
  };

  const handleAddPartner = async (partnerInput: {
    name: string;
    type?: "SUPPLIER" | "CLIENT";
    tags?: string[];
    phone: string;
    notes: string;
  }) => {
    try {
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
    } catch (e) {
      console.error("Hamkorni saqlashda xato:", e);
      showToast("Hamkorni saqlab bo'lmadi! Qayta urinib ko'ring.", "warning");
    }
  };

  const handleToggleBatchStatus = async (id: number) => {
    const batch = data.batches.find((b) => b.id === id);
    if (!batch) return;
    const nextStatus = batch.status === "ACTIVE" ? "COMPLETED" : "ACTIVE";
    try {
      await apiUpdateBatch(id, { status: nextStatus });
      await syncFromServer();
      showToast("Partiya holati yangilandi!");
    } catch (e) {
      console.error("Partiya holatini yangilashda xato:", e);
      showToast("Partiya holatini o'zgartirib bo'lmadi.", "warning");
    }
  };

  // Xarid narxi va sonini tahrirlash (Kompaniya hisob-kitobi va sof foydani qayta hisoblaydi)
  const handleUpdateBatchPrice = async (batchId: number, newBuyPrice: number, newTotalQty: number) => {
    try {
      await apiUpdateBatch(batchId, { buyPrice: newBuyPrice, totalQty: newTotalQty });
      await syncFromServer();
      showToast("Partiya ma'lumotlari yangilandi!");
    } catch (e) {
      console.error("Partiya ma'lumotlarini yangilashda xato:", e);
      showToast("Partiya ma'lumotlarini yangilab bo'lmadi.", "warning");
    }
  };

  // Sotuv narxi va sonini tahrirlash (Mijoz hisob-kitobi va sof foydani qayta hisoblaydi)
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
      showToast("Sotuv ma'lumotlarini yangilab bo'lmadi.", "warning");
    }
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
          showToast("Fayl formati mos kelmadi! Aviakassa JSON faylini tanlang.", "warning");
        }
      } catch (err) {
        console.error("Zaxira nusxani tiklashda xato:", err);
        showToast("Zaxira nusxani tiklab bo'lmadi!", "warning");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Barcha ma'lumotlar serverdan o'chirilib, bo'sh holatga o'tkazilsinmi?")) {
      return;
    }
    try {
      await apiResetData();
      await syncFromServer();
      showToast("Barcha ma'lumotlar tozalandi! 🧹", "info");
    } catch (err) {
      console.error("Ma'lumotlarni tozalashda xato:", err);
      showToast("Ma'lumotlarni tozalab bo'lmadi!", "warning");
    }
  };

  const clients = partners.filter((p) => p.type === "CLIENT");
  const suppliers = partners.filter((p) => p.type === "SUPPLIER");

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] dark:bg-[#090d16] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Xush kelibsiz, ${user.name || user.username}! 👋`);
        }}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Navbar with exact requested tabs, dark mode toggle and user profile */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setDetailBatchId(null);
          setDetailPartnerId(null);
        }}
        isDark={isDark}
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleTheme={handleToggleTheme}
        onOpenSaleModal={() => handleOpenSaleModal()}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenPaymentModal={(type) => handleOpenPaymentModal(type)}
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
            onViewAllPartners={() => {
              setActiveTab("partners");
              setDetailPartnerId(null);
            }}
            onSelectBatch={(batchId) => {
              setActiveTab("inventory");
              setDetailBatchId(batchId);
            }}
            onOpenSaleModal={(batchId) => handleOpenSaleModal(batchId)}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              setDetailBatchId(null);
              setDetailPartnerId(null);
            }}
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
            onSelectBatch={(batchId) => {
              setActiveTab("inventory");
              setDetailBatchId(batchId);
            }}
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
              onOpenPaymentModal={handleOpenPaymentModal}
            />
          ) : (
            <BatchesView
              batches={batches}
              onOpenBatchModal={() => setIsBatchModalOpen(true)}
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

        {/* Tab 5: Hamkorlar (Mijozlar va ta'minotchilar to'liq ro'yxati va Batafsil sahifasi) */}
        {activeTab === "partners" && (
          detailPartnerId !== null && partners.find((p) => p.id === detailPartnerId) ? (
            <PartnerDetailView
              partnerId={detailPartnerId}
              partners={partners}
              batches={batches}
              sales={sales}
              payments={payments}
              debtOffsets={debtOffsets}
              onBack={() => setDetailPartnerId(null)}
              onOpenPaymentModal={handleOpenPaymentModal}
              onOpenDebtOffsetModal={handleOpenDebtOffsetModal}
              onEditBatch={handleOpenEditBatch}
              onEditSale={handleOpenEditSale}
              onSelectBatch={(batchId) => {
                setActiveTab("inventory");
                setDetailBatchId(batchId);
              }}
            />
          ) : (
            <PartnersListView
              partners={partners}
              batches={batches}
              sales={sales}
              payments={payments}
              onSelectPartner={(partnerId) => setDetailPartnerId(partnerId)}
              onOpenPartnerModal={handleOpenPartnerModal}
              onOpenPaymentModal={handleOpenPaymentModal}
            />
          )
        )}

        {/* Tab 6: Kassa (Kassa kirim/chiqim, hamkorlar otchyoti va to'lovlar) */}
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
        clients={partners}
        selectedBatchId={selectedBatchId}
        onSave={handleAddSale}
        newlyCreatedPartnerId={lastCreatedPartnerId}
        onOpenClientModal={() => {
          handleOpenPartnerModal("CLIENT");
        }}
      />

      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        suppliers={partners}
        existingBatches={batches}
        onSave={handleAddBatch}
        newlyCreatedPartnerId={lastCreatedPartnerId}
        onOpenSupplierModal={() => {
          handleOpenPartnerModal("SUPPLIER");
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        partners={partners}
        defaultType={paymentModalType}
        defaultPartnerId={paymentModalPartnerId}
        defaultNotes={paymentModalNotes}
        defaultAmount={paymentModalAmount}
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

      {/* Enterprise Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 sm:bottom-6 right-5 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 rounded-2xl shadow-xl border border-white/10 dark:border-slate-800 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast.type === "success" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          )}
          {toast.type === "warning" && (
            <AlertCircle className="w-4 h-4 text-amber-400 dark:text-amber-600 shrink-0" />
          )}
          {toast.type === "info" && (
            <Info className="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-lg text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
