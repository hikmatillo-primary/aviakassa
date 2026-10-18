"use client";

import React, { useEffect, useState } from "react";
import {
  Database,
  Plus,
  CheckCircle2,
  Archive,
  Loader2,
  ServerCog,
  Trash2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  DatabaseCopySelection,
  DatabaseInfo,
  apiActivateDatabase,
  apiCloseDatabase,
  apiCreateDatabase,
  apiDeleteDatabase,
  getValidationMessage,
} from "@/lib/api";
import { formatDate } from "@/lib/format";

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  databases: DatabaseInfo[];
  onRefresh: () => Promise<void> | void;
  onSwitch: () => void;
  showToast: (message: string, type?: "success" | "warning" | "info") => void;
}

const CATEGORIES: { key: keyof DatabaseCopySelection; label: string }[] = [
  { key: "categories", label: "Xarid turlari (kategoriyalar)" },
  { key: "partners", label: "Hamkorlar" },
  { key: "batches", label: "Partiyalar" },
  { key: "sales", label: "Sotuvlar" },
  { key: "payments", label: "To'lovlar" },
  { key: "debtOffsets", label: "Qarz surishlar" },
];

export function DatabaseModal({
  isOpen,
  onClose,
  databases,
  onRefresh,
  onSwitch,
  showToast,
}: DatabaseModalProps) {
  const [name, setName] = useState("");
  const [copy, setCopy] = useState<DatabaseCopySelection>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // In-app confirm modallari (window.confirm o'rniga)
  const [activateTarget, setActivateTarget] = useState<DatabaseInfo | null>(null);
  const [closeTarget, setCloseTarget] = useState<DatabaseInfo | null>(null);

  // Baza o'chirish (parol so'rash bilan)
  const [deleteTarget, setDeleteTarget] = useState<DatabaseInfo | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setCopy({});
      setError("");
      setIsSubmitting(false);
      setBusyId(null);
      setActivateTarget(null);
      setCloseTarget(null);
      setDeleteTarget(null);
      setDeletePassword("");
      setDeleteError("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  const toggleCategory = (key: keyof DatabaseCopySelection) => {
    setCopy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Baza nomini kiriting.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await apiCreateDatabase(trimmed, copy);
      const total = Object.values(res.copied).reduce((sum, n) => sum + n, 0);
      showToast(
        total > 0
          ? `"${res.database.name}" bazasi yaratildi (${total} yozuv ko'chirildi).`
          : `"${res.database.name}" bazasi yaratildi (bo'sh).`
      );
      setName("");
      setCopy({});
      await onRefresh();
    } catch (e) {
      setError(getValidationMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmActivate = async () => {
    if (!activateTarget) return;
    const db = activateTarget;
    setBusyId(db.id);
    try {
      await apiActivateDatabase(db.id);
      showToast(`"${db.name}" bazasi faollashtirildi.`);
      setActivateTarget(null);
      onSwitch();
    } catch (e) {
      showToast(getValidationMessage(e), "warning");
      setBusyId(null);
    }
  };

  const handleConfirmClose = async () => {
    if (!closeTarget) return;
    const db = closeTarget;
    setBusyId(db.id);
    try {
      await apiCloseDatabase(db.id);
      showToast(`"${db.name}" bazasi yopildi.`, "info");
      setCloseTarget(null);
      await onRefresh();
    } catch (e) {
      showToast(getValidationMessage(e), "warning");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deleteTarget) return;
    if (!deletePassword) {
      setDeleteError("Davom etish uchun parolingizni kiriting.");
      return;
    }
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await apiDeleteDatabase(deleteTarget.id, deletePassword);
      showToast(res.detail || `"${deleteTarget.name}" bazasi o'chirildi.`);
      setDeleteTarget(null);
      setDeletePassword("");
      await onRefresh();
    } catch (err) {
      setDeleteError(getValidationMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Bazalar"
        description="Alohida ma'lumotlar bazalarini boshqaring va almashtiring"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Mavjud bazalar ro'yxati */}
          <div className="space-y-2">
            {databases.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                Hozircha bazalar yo&apos;q.
              </p>
            )}
            {databases.map((db) => {
              const isBaseDb = db.dbName === "aviakassa_db" || db.dbName === "default";
              const canDelete = !db.isActive && !isBaseDb;

              return (
                <div
                  key={db.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                    db.isActive
                      ? "border-blue-300 dark:border-blue-500/40 bg-blue-50/60 dark:bg-blue-500/10"
                      : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        db.isActive
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {db.name}
                        </span>
                        {db.isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Faol
                          </span>
                        )}
                        {db.isClosed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md">
                            <Archive className="w-3 h-3" /> Yopilgan
                          </span>
                        )}
                        {isBaseDb && (
                          <span className="inline-flex items-center text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                            Asosiy
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-slate-400 truncate">
                        {db.dbName} · {formatDate(db.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!db.isActive && (
                      <button
                        type="button"
                        disabled={busyId === db.id}
                        onClick={() => setActivateTarget(db)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        {busyId === db.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ServerCog className="w-3.5 h-3.5" />
                        )}
                        Ochish
                      </button>
                    )}
                    {!db.isClosed && (
                      <button
                        type="button"
                        disabled={busyId === db.id}
                        onClick={() => setCloseTarget(db)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Yopish
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        disabled={busyId === db.id}
                        onClick={() => {
                          setDeleteTarget(db);
                          setDeletePassword("");
                          setDeleteError("");
                        }}
                        title="Bazani butunlay o'chirish"
                        aria-label={`"${db.name}" bazasini o'chirish`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Yangi baza yaratish */}
          <div className="border-t border-slate-100 dark:border-white/[0.07] pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Yangi baza yaratish
              </h4>
            </div>

            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Baza nomi
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Filial 2026"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0c121e] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors disabled:opacity-60"
            />

            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-4 mb-2">
              Qaysi ma&apos;lumotlar ko&apos;chirilsin?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] cursor-pointer hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(copy[cat.key])}
                    onChange={() => toggleCategory(cat.key)}
                    disabled={isSubmitting}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {cat.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Bog&apos;liq ma&apos;lumotlar avtomatik qo&apos;shiladi: sotuvlar uchun partiyalar va
              hamkorlar, boshqa bo&apos;limlar uchun hamkorlar.
            </p>

            {error && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-3">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="mt-4 w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Yaratilmoqda...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Bazani yaratish
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bazani almashtirish (Activate) in-app dialog */}
      <ConfirmDialog
        isOpen={activateTarget !== null}
        title="Bazaga o'tish"
        message={
          <span>
            «<strong>{activateTarget?.name}</strong>» bazasiga o&apos;tilsinmi?
            Barcha foydalanuvchilar shu bazaga o&apos;tadi va barcha yangi ma&apos;lumotlar ushbu bazada yuritiladi.
          </span>
        }
        variant="primary"
        confirmLabel="O'tish"
        onCancel={() => setActivateTarget(null)}
        onConfirm={handleConfirmActivate}
      />

      {/* Bazani yopish (Close) in-app dialog */}
      <ConfirmDialog
        isOpen={closeTarget !== null}
        title="Bazani yopish"
        message={
          <span>
            «<strong>{closeTarget?.name}</strong>» bazasi yopilsinmi? Baza o&apos;chirilmaydi — uni
            keyinchalik yana qayta ochish mumkin.
          </span>
        }
        variant="danger"
        confirmLabel="Yopish"
        onCancel={() => setCloseTarget(null)}
        onConfirm={handleConfirmClose}
      />

      {/* Bazani o'chirish (Delete with Password) in-app modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={isDeleting ? () => {} : () => setDeleteTarget(null)}
        title="Bazani o'chirish"
        zIndex="z-[70]"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end w-full gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={() => handleConfirmDelete()}
              disabled={isDeleting || !deletePassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isDeleting ? "O'chirilmoqda..." : "Bazani o'chirish"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleConfirmDelete} className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                «{deleteTarget?.name}» bazasini o&apos;chirmoqchimisiz?
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed font-medium">
                Diqqat: Ushbu amal bazani PostgreSQL serveridan va barcha unga tegishli
                ma&apos;lumotlarni butunlay o&apos;chirib yuboradi. Ushbu amalni ortga qaytarib bo&apos;lmaydi!
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tasdiqlash uchun joriy parolingizni kiriting:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError("");
                }}
                placeholder="Parolingizni kiriting"
                autoFocus
                disabled={isDeleting}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0c121e] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-colors disabled:opacity-60"
              />
            </div>
            {deleteError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold pt-1">
                {deleteError}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}
