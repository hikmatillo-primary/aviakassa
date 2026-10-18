"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AviakassaData,
  EMPTY_AVIAKASSA_DATA,
  calculateEnrichedData,
  CashAccount,
} from "@/lib/storage";
import {
  apiFetchAll,
  apiListDatabases,
  ActiveDatabaseInfo,
  DatabaseInfo,
  UNAUTHORIZED_EVENT,
} from "@/lib/api";
import { AuthUser, logoutUser } from "@/lib/auth";

export interface ToastNotification {
  id: number;
  message: string;
  type: "success" | "warning" | "info";
}

export function useAviakassaData(
  currentUser: AuthUser | null,
  onSessionExpired: () => void
) {
  const [data, setData] = useState<AviakassaData>(EMPTY_AVIAKASSA_DATA);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeDatabase, setActiveDatabase] = useState<ActiveDatabaseInfo | null>(null);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);

  // Toast Notification state
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "warning" | "info" = "success") => {
      const id = Date.now();
      setToast({ id, message, type });
      setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 3200);
    },
    []
  );

  // Serverdan ma'lumot yuklash (yagona haqiqat manbai = server)
  const syncFromServer = useCallback(async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const { data: synced, activeDatabase: activeDb } = await apiFetchAll();
      setData(synced);
      setActiveDatabase(activeDb);
      setSyncError(null);
      return true;
    } catch (e) {
      console.error("Serverdan ma'lumot yuklashda xato:", e);
      setSyncError(
        "Server bilan aloqa yo'q. Oxirgi o'zgarish saqlangan bo'lishi mumkin emas — tekshirib ko'ring."
      );
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Boshlang'ich yuklash
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    setIsSyncing(true);
    apiFetchAll()
      .then(({ data: backendData, activeDatabase: activeDb }) => {
        if (cancelled) return;
        setData(backendData);
        setActiveDatabase(activeDb);
        setSyncError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Serverdan ma'lumot yuklashda xato:", err);
        setSyncError(
          "Server bilan aloqa yo'q. Ma'lumotlar yangilanmagan — iltimos, keyinroq qayta urinib ko'ring."
        );
      })
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // Token muddati tugaganda (401) avtomatik xabar
  useEffect(() => {
    const onUnauthorized = () => {
      logoutUser();
      onSessionExpired();
      showToast("Sessiya muddati tugadi. Iltimos, qayta kiring.", "warning");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [onSessionExpired, showToast]);

  // Admin uchun bazalar ro'yxatini yuklash
  const loadDatabases = useCallback(async () => {
    if (!currentUser?.isStaff) return;
    try {
      const res = await apiListDatabases();
      setDatabases(res.databases);
    } catch (err) {
      console.warn("Bazalar ro'yxatini yuklab bo'lmadi:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.isStaff) {
      loadDatabases();
    } else {
      setDatabases([]);
    }
  }, [currentUser, loadDatabases]);

  // Enriched metrics & data
  const { stats, batches, sales, payments, partners, debtOffsets } = useMemo(
    () => calculateEnrichedData(data),
    [data]
  );

  const accounts: CashAccount[] = data.accounts || [];
  const clients = useMemo(() => partners.filter((p) => p.type === "CLIENT"), [partners]);
  const suppliers = useMemo(() => partners.filter((p) => p.type === "SUPPLIER"), [partners]);

  return {
    data,
    setData,
    syncError,
    setSyncError,
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
  };
}
