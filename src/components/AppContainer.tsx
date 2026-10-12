"use client";

import React, { useState, useTransition } from "react";
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
import { useRouter } from "next/navigation";

interface AppContainerProps {
  initialStats: any;
  initialBatches: any[];
  initialSales: any[];
  initialPayments: any[];
  initialPartners: any[];
}

export function AppContainer({
  initialStats,
  initialBatches,
  initialSales,
  initialPayments,
  initialPartners,
}: AppContainerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState("dashboard");

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

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Quick Open Handlers
  const handleOpenSaleModal = (batchId?: number) => {
    setSelectedBatchId(batchId || null);
    setIsSaleModalOpen(true);
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

  const clients = initialPartners.filter((p) => p.type === "CLIENT");
  const suppliers = initialPartners.filter((p) => p.type === "SUPPLIER");

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSaleModal={() => handleOpenSaleModal()}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === "dashboard" && (
          <DashboardView
            stats={initialStats}
            batches={initialBatches}
            sales={initialSales}
            payments={initialPayments}
            partners={initialPartners}
            onOpenSaleModal={handleOpenSaleModal}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onOpenPaymentModal={handleOpenPaymentModal}
            onViewAllBatches={() => setActiveTab("batches")}
            onViewAllPartners={() => setActiveTab("partners")}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === "batches" && (
          <BatchesView
            batches={initialBatches}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onOpenSaleModal={handleOpenSaleModal}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === "partners" && (
          <PartnersView
            partners={initialPartners}
            onOpenPartnerModal={handleOpenPartnerModal}
            onOpenPaymentModal={handleOpenPaymentModal}
            onOpenHistoryModal={handleOpenHistoryModal}
          />
        )}

        {activeTab === "sales" && (
          <SalesView
            sales={initialSales}
            onOpenSaleModal={() => handleOpenSaleModal()}
          />
        )}

        {activeTab === "payments" && (
          <PaymentsView
            payments={initialPayments}
            onOpenPaymentModal={handleOpenPaymentModal}
          />
        )}
      </main>

      {/* Modals */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        batches={initialBatches}
        clients={clients}
        selectedBatchId={selectedBatchId}
        onSuccess={handleRefresh}
        onOpenClientModal={() => {
          setIsSaleModalOpen(false);
          handleOpenPartnerModal("CLIENT");
        }}
      />

      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        suppliers={suppliers}
        onSuccess={handleRefresh}
        onOpenSupplierModal={() => {
          setIsBatchModalOpen(false);
          handleOpenPartnerModal("SUPPLIER");
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        partners={initialPartners}
        defaultType={paymentModalType}
        defaultPartnerId={paymentModalPartnerId}
        onSuccess={handleRefresh}
      />

      <PartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        defaultType={partnerModalType}
        onSuccess={handleRefresh}
      />

      <PartnerHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        partnerId={historyPartnerId}
        onOpenPaymentModal={handleOpenPaymentModal}
      />
    </div>
  );
}
