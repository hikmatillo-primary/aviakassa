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
  CashAccount,
} from "@/lib/storage";
import {
  apiFetchAll,
  apiUpdateBatch,
  apiUpdateSale,
  apiCreateSalesBulk,
  apiCreateBatchesBulk,
  apiCreatePayment,
  apiCreatePartner,
  apiUpdatePartner,
  apiCreateDebtOffset,
  apiDeletePartner,
  apiDeleteBatch,
  apiDeleteSale,
  apiDeletePayment,
  apiDeleteDebtOffset,
  apiCreateAccount,
  apiDeleteAccount,
  apiImportData,
  apiListDatabases,
  DatabaseInfo,
  UNAUTHORIZED_EVENT,
} from "@/lib/api";
import { LoginView } from "./LoginView";
import { ConfirmDialog } from "./ConfirmDialog";
import { DatabaseModal } from "./DatabaseModal";
import { getStoredUser, isAuthenticated, logoutUser, AuthUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

const ACTIVE_TAB_STORAGE_KEY = "aviakassa_active_tab";
const VALID_TABS = ["dashboard", "purchases", "inventory", "sales", "partners", "cash"];

export function AppContainer() {
  const [data, setData] = useState<AviakassaData>(EMPTY_AVIAKASSA_DATA);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

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

  // Sahifa yangilanganda oxirgi ochiq tab tiklansin (dashboardga qaytib ketmasligi uchun)
  useEffect(() => {
    const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (savedTab && VALID_TABS.includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

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

  // Admin uchun bazalar ro'yxatini yuklash
  const loadDatabases = async () => {
    if (!currentUser?.isStaff) return;
    try {
      const res = await apiListDatabases();
      setDatabases(res.databases);
    } catch (err) {
      console.warn("Bazalar ro'yxatini yuklab bo'lmadi:", err);
    }
  };

  useEffect(() => {
    if (currentUser?.isStaff) {
      loadDatabases();
    } else {
      setDatabases([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

  // Enriched metrics & data
  const { stats, batches, sales, payments, partners, debtOffsets } = useMemo(
    () => calculateEnrichedData(data),
    [data]
  );

  const accounts: CashAccount[] = data.accounts || [];

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
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    variant?: "danger" | "info";
    action?: () => Promise<void>;
  } | null>(null);

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
    setLastCreatedPartnerId(null);
    setIsSaleModalOpen(true);
  };

  const handleOpenBatchModal = () => {
    setLastCreatedPartnerId(null);
    setIsBatchModalOpen(true);
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
      await syncFromServer();
      throw e;
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
      await syncFromServer();
      throw e;
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
        purchaseDate: batchInput.purchaseDate || new Date().toISOString().split("T")[0],
        paidNow: batchInput.paidNow || 0,
        paymentMethod: batchInput.paymentMethod || "CASH",
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
      await syncFromServer();
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

  const handleOpenEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerModalType(partner.type === "SUPPLIER" ? "SUPPLIER" : "CLIENT");
    setIsPartnerModalOpen(true);
  };

  // O'chirish amallari (in-app tasdiqlash bilan)
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

  const handleUpdateBatchPrice = async (batchId: number, newBuyPrice: number, newTotalQty: number) => {
    try {
      await apiUpdateBatch(batchId, { buyPrice: newBuyPrice, totalQty: newTotalQty });
      await syncFromServer();
      showToast("Partiya ma'lumotlari yangilandi!");
    } catch (e) {
      console.error("Partiya ma'lumotlarini yangilashda xato:", e);
      await syncFromServer();
      throw e;
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
      await syncFromServer();
      throw e;
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
        onOpenBatchModal={handleOpenBatchModal}
        onOpenPaymentModal={(type) => handleOpenPaymentModal(type)}
        onExportData={handleExportBackup}
        onImportData={() => fileInputRef.current?.click()}
        onOpenDatabases={() => setIsDatabaseModalOpen(true)}
        activeDatabaseName={databases.find((d) => d.isActive)?.name}
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
            onOpenBatchModal={handleOpenBatchModal}
            onOpenPartnerModal={() => handleOpenPartnerModal("SUPPLIER")}
            onEditBatch={handleOpenEditBatch}
            onDeleteBatch={handleDeleteBatch}
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
              onOpenBatchModal={handleOpenBatchModal}
              onOpenSaleModal={(batchId) => handleOpenSaleModal(batchId)}
              onEditBatch={handleOpenEditBatch}
              onEditSale={handleOpenEditSale}
              onDeleteBatch={handleDeleteBatch}
              onDeleteSale={handleDeleteSale}
              onOpenHistoryModal={handleOpenHistoryModal}
              onOpenPaymentModal={handleOpenPaymentModal}
            />
          ) : (
            <BatchesView
              batches={batches}
              onOpenBatchModal={handleOpenBatchModal}
              onEditBatch={handleOpenEditBatch}
              onDeleteBatch={handleDeleteBatch}
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
            onDeleteSale={handleDeleteSale}
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
              onEditPartner={handleOpenEditPartner}
              onDeletePartner={handleDeletePartner}
              onDeleteBatch={handleDeleteBatch}
              onDeleteSale={handleDeleteSale}
              onDeletePayment={handleDeletePayment}
              onDeleteDebtOffset={handleDeleteDebtOffset}
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
              onEditPartner={handleOpenEditPartner}
              onDeletePartner={handleDeletePartner}
            />
          )
        )}

        {/* Tab 6: Kassa (Kassa kirim/chiqim, hamkorlar otchyoti va to'lovlar) */}
        {activeTab === "cash" && (
          <PaymentsView
            payments={payments}
            debtOffsets={debtOffsets}
            partners={partners}
            accounts={accounts}
            onOpenPaymentModal={handleOpenPaymentModal}
            onOpenDebtOffsetModal={handleOpenDebtOffsetModal}
            onOpenHistoryModal={handleOpenHistoryModal}
            onDeletePayment={handleDeletePayment}
            onDeleteDebtOffset={handleDeleteDebtOffset}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>

      {/* Modals */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSelectedBatchId(null);
          setLastCreatedPartnerId(null);
        }}
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
        onClose={() => {
          setIsBatchModalOpen(false);
          setLastCreatedPartnerId(null);
        }}
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
        accounts={accounts}
        defaultType={paymentModalType}
        defaultPartnerId={paymentModalPartnerId}
        defaultNotes={paymentModalNotes}
        defaultAmount={paymentModalAmount}
        onSave={handleAddPayment}
      />

      <PartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => {
          setIsPartnerModalOpen(false);
          setEditingPartner(null);
        }}
        defaultType={partnerModalType}
        partner={editingPartner}
        onSave={handleSavePartner}
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

      <ConfirmDialog
        isOpen={confirmState !== null}
        title={confirmState?.title}
        message={confirmState?.message || ""}
        confirmLabel={confirmState?.confirmLabel}
        variant={confirmState?.variant}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          if (confirmState?.action) await confirmState.action();
        }}
      />

      {currentUser?.isStaff && (
        <DatabaseModal
          isOpen={isDatabaseModalOpen}
          onClose={() => setIsDatabaseModalOpen(false)}
          databases={databases}
          onRefresh={loadDatabases}
          onSwitch={() => window.location.reload()}
          showToast={showToast}
        />
      )}

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
            aria-label="Bildirishnomani yopish"
            className="p-1 hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-lg text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors cursor-pointer shrink-0 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
