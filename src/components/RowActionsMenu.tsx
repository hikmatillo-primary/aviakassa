"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export interface RowActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface RowActionsMenuProps {
  actions: RowActionItem[];
  ariaLabel?: string;
}

export function RowActionsMenu({ actions, ariaLabel = "Amallar" }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 190;
      const menuHeight = actions.length * 38 + 12;
      const margin = 8;

      let top = rect.bottom + 4;
      if (top + menuHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - menuHeight - 4);
      }

      let left = rect.right - menuWidth;
      if (left < margin) left = margin;
      if (left + menuWidth > window.innerWidth - margin) {
        left = window.innerWidth - menuWidth - margin;
      }

      setCoords({ top, left });
    };

    updatePosition();

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleScrollOrResize = () => setIsOpen(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, actions.length]);

  if (actions.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
          isOpen
            ? "bg-slate-200 dark:bg-white/[0.12] text-slate-700 dark:text-slate-200"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-700 dark:hover:text-slate-200"
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        mounted &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: "190px",
              zIndex: 99999,
            }}
            className="bg-white dark:bg-[#0f1523] rounded-xl shadow-2xl border border-slate-200 dark:border-white/[0.1] p-1.5 animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  action.onClick();
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                  action.variant === "danger"
                    ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                {action.icon}
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
