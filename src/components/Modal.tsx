"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-xl md:max-w-2xl",
  zIndex = "z-50",
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      const openModals = document.querySelectorAll(".aviakassa-modal-root");
      if (openModals.length <= 1) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8 overflow-y-auto aviakassa-modal-root`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-[#111726] rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200/80 dark:border-white/[0.08] overflow-hidden transform transition-all z-10 max-h-[92vh] sm:max-h-[90vh] flex flex-col`}
      >
        {/* Mobile grab handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-5 sm:px-7 md:px-8 py-3.5 sm:py-4 md:py-5 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between shrink-0 bg-slate-50/40 dark:bg-white/[0.02]">
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            {description && <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">{children}</div>

        {/* Pinned Footer (Always visible) */}
        {footer && (
          <div className="px-5 sm:px-7 md:px-8 py-3.5 sm:py-4 md:py-5 border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-50/95 dark:bg-[#0c121e]/95 backdrop-blur-xs shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
