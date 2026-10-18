"use client";

import React, { useState } from "react";
import { Batch, Partner, Sale } from "@/lib/storage";

export interface ConfirmState {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  variant?: "danger" | "info";
  action?: () => Promise<void>;
}

export interface EditPriceModalState {
  isOpen: boolean;
  mode: "BATCH" | "SALE";
  item: any | null;
}

export function useModalsState() {
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

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const [isDebtOffsetModalOpen, setIsDebtOffsetModalOpen] = useState(false);
  const [debtOffsetModalFromId, setDebtOffsetModalFromId] = useState<number | null>(null);
  const [debtOffsetModalToId, setDebtOffsetModalToId] = useState<number | null>(null);

  const [editPriceModal, setEditPriceModal] = useState<EditPriceModalState>({
    isOpen: false,
    mode: "BATCH",
    item: null,
  });

  const [fullEditingBatch, setFullEditingBatch] = useState<Batch | null>(null);
  const [fullEditingSale, setFullEditingSale] = useState<Sale | null>(null);
  const [repeatBatch, setRepeatBatch] = useState<Batch | null>(null);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

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

  const handleOpenFullEditBatch = (batch: Batch) => {
    setFullEditingBatch(batch);
  };

  const handleOpenFullEditSale = (sale: Sale) => {
    setFullEditingSale(sale);
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

  const handleOpenEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerModalType(partner.type === "SUPPLIER" ? "SUPPLIER" : "CLIENT");
    setIsPartnerModalOpen(true);
  };

  const handleOpenDebtOffsetModal = (fromPartnerId?: number, toPartnerId?: number) => {
    setDebtOffsetModalFromId(fromPartnerId || null);
    setDebtOffsetModalToId(toPartnerId || null);
    setIsDebtOffsetModalOpen(true);
  };

  return {
    isSaleModalOpen,
    setIsSaleModalOpen,
    selectedBatchId,
    setSelectedBatchId,
    isBatchModalOpen,
    setIsBatchModalOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    paymentModalType,
    setPaymentModalType,
    paymentModalPartnerId,
    setPaymentModalPartnerId,
    paymentModalNotes,
    setPaymentModalNotes,
    paymentModalAmount,
    setPaymentModalAmount,
    isPartnerModalOpen,
    setIsPartnerModalOpen,
    partnerModalType,
    setPartnerModalType,
    lastCreatedPartnerId,
    setLastCreatedPartnerId,
    editingPartner,
    setEditingPartner,
    confirmState,
    setConfirmState,
    isDebtOffsetModalOpen,
    setIsDebtOffsetModalOpen,
    debtOffsetModalFromId,
    debtOffsetModalToId,
    editPriceModal,
    setEditPriceModal,
    fullEditingBatch,
    setFullEditingBatch,
    fullEditingSale,
    setFullEditingSale,
    repeatBatch,
    setRepeatBatch,
    isDatabaseModalOpen,
    setIsDatabaseModalOpen,
    handleOpenSaleModal,
    handleOpenBatchModal,
    handleOpenEditBatch,
    handleOpenEditSale,
    handleOpenFullEditBatch,
    handleOpenFullEditSale,
    handleOpenPaymentModal,
    handleOpenPartnerModal,
    handleOpenEditPartner,
    handleOpenDebtOffsetModal,
  };
}
