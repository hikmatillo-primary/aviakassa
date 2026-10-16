"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import { getValidationMessage } from "@/lib/api";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "info";
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  isOpen,
  title = "Amalni tasdiqlang",
  message,
  confirmLabel,
  cancelLabel = "Bekor qilish",
  variant = "danger",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInfo = variant === "info";

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();
      onCancel();
    } catch (err) {
      setError(getValidationMessage(err));
      setIsSubmitting(false);
    }
  };

  const footer = isInfo ? (
    <div className="flex items-center justify-end w-full gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
      >
        {confirmLabel || "Tushundim"}
      </button>
    </div>
  ) : (
    <div className="flex items-center justify-end w-full gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? "Bajarilmoqda..." : confirmLabel || "O‘chirish"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onCancel}
      title={title}
      zIndex="z-[70]"
      maxWidth="max-w-md"
      footer={footer}
    >
      <div className="flex items-start gap-3">
        <div
          className={
            isInfo
              ? "w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"
              : "w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0"
          }
        >
          {isInfo ? <Info className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="space-y-2 min-w-0">
          <div className="text-sm text-slate-700 dark:text-slate-200">{message}</div>
          {error && (
            <div className="p-2.5 text-xs bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 font-medium">
              {error}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
