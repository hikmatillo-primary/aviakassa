"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { EditBatchModal } from "./EditBatchModal";
import { EditSaleModal } from "./EditSaleModal";
import { BatchDetailView } from "./BatchDetailView";
import { PartnersListView } from "./PartnersListView";
import { PartnerDetailView } from "./PartnerDetailView";
import { LoginView } from "./LoginView";
import { ConfirmDialog } from "./ConfirmDialog";
import { DatabaseModal } from "./DatabaseModal";
import { getStoredUser, isAuthenticated, logoutUser, AuthUser } from "@/lib/auth";
import { useModalsState } from "@/hooks/useModalsState";
import { useAviakassaData } from "@/hooks/useAviakassaData";
import { useAviakassaActions } from "@/hooks/useAviakassaActions";

const ACTIVE_TAB_STORAGE_KEY = "aviakassa_active_tab";
const VALID_TABS = ["dashboard", "purchases", "inventory", "sales", "partners", "cash"];

export function AppContainer() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [detailBatchId, setDetailBatchId] = useState<number | null>(null);
  const [detailPartnerId, setDetailPartnerId] = useState<number | null>(null);
  const [partnersFilter, setPartnersFilter] = useState<"ALL" | "DEBT_US" | "DEBT_THEM">("ALL");
  const [isDark, setIsDark] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state hook
  const modals = useModalsState();

  // Data & sync state hook
  const dataHook = useAviakassaData(currentUser, () => {
    setCurrentUser(null);
  });

  const {
    data,
    syncError,
    isSyncing,
    activeDatabase,
    databases,
    loadDatabases,
    syncFromServer,
    toast,
    setToast,
    showToast,
    stats,
    batches,
    sales,
    payments,
    partners,
    debtOffsets,
    accounts,
    clients,
    suppliers,
  } = dataHook;

  // Actions hook
  const actions = useAviakassaActions({
    data,
    sales,
    batches,
    payments,
    debtOffsets,
    syncFromServer,
    showToast,
    setConfirmState: modals.setConfirmState,
    setLastCreatedPartnerId: modals.setLastCreatedPartnerId,
    editingPartner: modals.editingPartner,
    detailBatchId,
    setDetailBatchId,
    detailPartnerId,
    setDetailPartnerId,
  });

  // Theme initialisation
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

  // Sahifa yangilanganda oxirgi ochiq tab tiklansin
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

  // Check auth on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aviakassa_pro_data_v1");
      const user = getStoredUser();
      const isAuth = isAuthenticated();
      if (isAuth && user) {
        setCurrentUser(user);
      }
      setIsAuthChecking(false);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    showToast("Tizimdan muvaffaqiyatli chiqildi!", "info");
  };

  const handleOpenPartnerDetail = (partnerId: number) => {
    setDetailPartnerId(partnerId);
    setActiveTab("partners");
  };

  const handleOpenHistoryModal = (partnerId: number) => {
    handleOpenPartnerDetail(partnerId);
  };

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
        onChange={actions.handleImportFileChange}
        accept=".json"
        className="hidden"
      />

      {syncError && (
        <div
          role="alert"
          className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/40 px-4 py-2.5 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
        >
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {syncError}
          </span>
          <button
            type="button"
            onClick={() => void syncFromServer()}
            disabled={isSyncing}
            className="underline font-bold cursor-pointer disabled:opacity-60"
          >
            {isSyncing ? "Yuklanmoqda..." : "Qayta urinish"}
          </button>
        </div>
      )}

      {/* Navbar with exact requested tabs, dark mode toggle and user profile */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setDetailBatchId(null);
          setDetailPartnerId(null);
          setPartnersFilter("ALL");
        }}
        isDark={isDark}
        currentUser={currentUser}
        onLogout={handleLogout}
        onToggleTheme={handleToggleTheme}
        onOpenSaleModal={() => modals.handleOpenSaleModal()}
        onOpenBatchModal={modals.handleOpenBatchModal}
        onOpenPaymentModal={(type) => modals.handleOpenPaymentModal(type)}
        onExportData={actions.handleExportBackup}
        onImportData={() => fileInputRef.current?.click()}
        onOpenDatabases={() => modals.setIsDatabaseModalOpen(true)}
        databases={databases}
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
            debtOffsets={debtOffsets}
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
            onOpenSaleModal={(batchId) => modals.handleOpenSaleModal(batchId)}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              setDetailBatchId(null);
              setDetailPartnerId(null);
            }}
            onOpenPartnersDebt={(filter) => {
              setActiveTab("partners");
              setDetailBatchId(null);
              setDetailPartnerId(null);
              setPartnersFilter(filter);
            }}
          />
        )}

        {/* Tab 2: Xarid (Faqat xaridlar va yangi xarid qilish) */}
        {activeTab === "purchases" && (
          <PartnersView
            batches={batches}
            suppliers={suppliers}
            categories={data.categories || []}
            onCreateCategory={actions.handleCreateCategory}
            onAccountBatch={actions.handleAccountBatch}
            onAccountSeries={actions.handleAccountSeries}
            onOpenBatchModal={modals.handleOpenBatchModal}
            onOpenPartnerModal={() => modals.handleOpenPartnerModal("SUPPLIER")}
            onEditBatch={modals.handleOpenEditBatch}
            onFullEditBatch={modals.handleOpenFullEditBatch}
            onDeleteBatch={actions.handleDeleteBatch}
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
              onRepeatBatch={(batch) => modals.setRepeatBatch(batch)}
              onOpenBatchModal={modals.handleOpenBatchModal}
              onOpenSaleModal={(batchId) => modals.handleOpenSaleModal(batchId)}
              onEditBatch={modals.handleOpenEditBatch}
              onFullEditBatch={modals.handleOpenFullEditBatch}
              onEditSale={modals.handleOpenEditSale}
              onFullEditSale={modals.handleOpenFullEditSale}
              onDeleteBatch={actions.handleDeleteBatch}
              onDeleteSale={actions.handleDeleteSale}
              onOpenHistoryModal={handleOpenHistoryModal}
              onOpenPaymentModal={modals.handleOpenPaymentModal}
            />
          ) : (
            <BatchesView
              batches={batches}
              categories={data.categories || []}
              onOpenBatchModal={modals.handleOpenBatchModal}
              onEditBatch={modals.handleOpenEditBatch}
              onFullEditBatch={modals.handleOpenFullEditBatch}
              onDeleteBatch={actions.handleDeleteBatch}
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
            onOpenSaleModal={() => modals.handleOpenSaleModal()}
            onOpenPartnerModal={() => modals.handleOpenPartnerModal("CLIENT")}
            onEditSale={modals.handleOpenEditSale}
            onFullEditSale={modals.handleOpenFullEditSale}
            onDeleteSale={actions.handleDeleteSale}
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
              onOpenPaymentModal={modals.handleOpenPaymentModal}
              onOpenDebtOffsetModal={modals.handleOpenDebtOffsetModal}
              onEditBatch={modals.handleOpenEditBatch}
              onFullEditBatch={modals.handleOpenFullEditBatch}
              onEditSale={modals.handleOpenEditSale}
              onFullEditSale={modals.handleOpenFullEditSale}
              onEditPartner={modals.handleOpenEditPartner}
              onDeletePartner={actions.handleDeletePartner}
              onDeleteBatch={actions.handleDeleteBatch}
              onDeleteSale={actions.handleDeleteSale}
              onDeletePayment={actions.handleDeletePayment}
              onDeleteDebtOffset={actions.handleDeleteDebtOffset}
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
              initialFilter={partnersFilter}
              onSelectPartner={(partnerId) => setDetailPartnerId(partnerId)}
              onOpenPartnerModal={modals.handleOpenPartnerModal}
              onOpenPaymentModal={modals.handleOpenPaymentModal}
              onEditPartner={modals.handleOpenEditPartner}
              onDeletePartner={actions.handleDeletePartner}
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
            onOpenPaymentModal={modals.handleOpenPaymentModal}
            onOpenDebtOffsetModal={modals.handleOpenDebtOffsetModal}
            onOpenHistoryModal={handleOpenHistoryModal}
            onDeletePayment={actions.handleDeletePayment}
            onDeleteDebtOffset={actions.handleDeleteDebtOffset}
            onAddAccount={actions.handleAddAccount}
            onRenameAccount={actions.handleRenameAccount}
            onDeleteAccount={actions.handleDeleteAccount}
          />
        )}
      </main>

      {/* Modals */}
      <SaleModal
        isOpen={modals.isSaleModalOpen}
        onClose={() => {
          modals.setIsSaleModalOpen(false);
          modals.setSelectedBatchId(null);
          modals.setLastCreatedPartnerId(null);
        }}
        batches={batches}
        clients={partners}
        accounts={accounts}
        selectedBatchId={modals.selectedBatchId}
        onSave={actions.handleAddSale}
        newlyCreatedPartnerId={modals.lastCreatedPartnerId}
        onOpenClientModal={() => {
          modals.handleOpenPartnerModal("CLIENT");
        }}
      />

      <BatchModal
        isOpen={modals.isBatchModalOpen || modals.repeatBatch !== null}
        onClose={() => {
          modals.setIsBatchModalOpen(false);
          modals.setRepeatBatch(null);
          modals.setLastCreatedPartnerId(null);
        }}
        suppliers={partners}
        accounts={accounts}
        existingBatches={batches}
        categories={data.categories || []}
        repeatFrom={modals.repeatBatch}
        onSaveAuto={actions.handleAddAutoBatches}
        onCreateCategory={actions.handleCreateCategory}
        onSave={actions.handleAddBatch}
        newlyCreatedPartnerId={modals.lastCreatedPartnerId}
        onOpenSupplierModal={() => {
          modals.handleOpenPartnerModal("SUPPLIER");
        }}
      />

      <PaymentModal
        isOpen={modals.isPaymentModalOpen}
        onClose={() => modals.setIsPaymentModalOpen(false)}
        partners={partners}
        accounts={accounts}
        defaultType={modals.paymentModalType}
        defaultPartnerId={modals.paymentModalPartnerId}
        defaultNotes={modals.paymentModalNotes}
        defaultAmount={modals.paymentModalAmount}
        onSave={actions.handleAddPayment}
      />

      <PartnerModal
        isOpen={modals.isPartnerModalOpen}
        onClose={() => {
          modals.setIsPartnerModalOpen(false);
          modals.setEditingPartner(null);
        }}
        defaultType={modals.partnerModalType}
        partner={modals.editingPartner}
        onSave={actions.handleSavePartner}
      />

      <DebtOffsetModal
        isOpen={modals.isDebtOffsetModalOpen}
        onClose={() => modals.setIsDebtOffsetModalOpen(false)}
        partners={partners}
        defaultFromPartnerId={modals.debtOffsetModalFromId}
        defaultToPartnerId={modals.debtOffsetModalToId}
        onSave={actions.handleAddDebtOffset}
      />

      <EditPriceModal
        isOpen={modals.editPriceModal.isOpen}
        onClose={() => modals.setEditPriceModal((prev) => ({ ...prev, isOpen: false }))}
        mode={modals.editPriceModal.mode}
        item={modals.editPriceModal.item}
        onSaveBatch={actions.handleUpdateBatchPrice}
        onSaveSale={actions.handleUpdateSalePrice}
      />

      <EditBatchModal
        isOpen={modals.fullEditingBatch !== null}
        onClose={() => modals.setFullEditingBatch(null)}
        batch={modals.fullEditingBatch}
        suppliers={suppliers}
        onOpenSupplierModal={() => modals.handleOpenPartnerModal("SUPPLIER")}
        onSave={actions.handleSaveFullBatch}
      />

      <EditSaleModal
        isOpen={modals.fullEditingSale !== null}
        onClose={() => modals.setFullEditingSale(null)}
        sale={modals.fullEditingSale}
        batches={batches}
        clients={clients}
        onOpenClientModal={() => modals.handleOpenPartnerModal("CLIENT")}
        onSave={actions.handleSaveFullSale}
      />

      <ConfirmDialog
        isOpen={modals.confirmState !== null}
        title={modals.confirmState?.title}
        message={modals.confirmState?.message || ""}
        confirmLabel={modals.confirmState?.confirmLabel}
        variant={modals.confirmState?.variant}
        onCancel={() => modals.setConfirmState(null)}
        onConfirm={async () => {
          if (modals.confirmState?.action) await modals.confirmState.action();
        }}
      />

      {currentUser?.isStaff && (
        <DatabaseModal
          isOpen={modals.isDatabaseModalOpen}
          onClose={() => modals.setIsDatabaseModalOpen(false)}
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
