import { AviakassaData, Batch, BatchCategory, CashAccount, DebtOffset, Partner, Payment, Sale } from "./storage";

// Default: same-origin "/api" (nginx frontend /api/ ni backendga proksilaydi).
// Kerak bo'lsa NEXT_PUBLIC_API_URL orqali to'liq manzil beriladi.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const ACCESS_TOKEN_KEY = "aviakassa_access_token";
const REFRESH_TOKEN_KEY = "aviakassa_refresh_token";

export const UNAUTHORIZED_EVENT = "aviakassa:unauthorized";

/**
 * Backenddan kelgan xatolik. DRF maydonlar bo'yicha xato qaytarsa,
 * ular `fieldErrors`da saqlanadi (masalan: { name: ["Bu maydon majburiy."] }).
 */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// DRF javobini tekis xabarlar ro'yxatiga aylantiradi (nested list/dict ham).
function collectErrorMessages(
  value: unknown,
  fieldKey: string | null,
  acc: Record<string, string[]>,
  out: string[]
): void {
  if (value == null) return;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return;
    out.push(text);
    if (fieldKey) {
      (acc[fieldKey] ||= []).push(text);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectErrorMessages(entry, fieldKey, acc, out);
    return;
  }
  if (typeof value === "object") {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      collectErrorMessages(val, key, acc, out);
    }
  }
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => "");
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  const fieldErrors: Record<string, string[]> = {};
  const messages: string[] = [];
  collectErrorMessages(body, null, fieldErrors, messages);

  const message =
    messages[0] ||
    (res.status === 401
      ? "Avtorizatsiya muddati tugagan. Qayta kiring."
      : res.status === 403
      ? "Bu amalni bajarishga ruxsat yo'q."
      : res.status === 404
      ? "So'ralgan ma'lumot topilmadi."
      : res.status >= 500
      ? "Serverda ichki xatolik yuz berdi. Keyinroq qayta urinib ko'ring."
      : `Xatolik yuz berdi (HTTP ${res.status}).`);

  return new ApiError(message, res.status, fieldErrors);
}

/**
 * Har qanday xatolikdan foydalanuvchiga ko'rsatiladigan matn chiqaradi.
 */
export function getValidationMessage(
  error: unknown,
  fallback = "Xatolik yuz berdi. Qayta urinib ko'ring."
): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof TypeError) {
    return "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("aviakassa_user_info");
}

// Bir vaqtda bir nechta 401 kelganda faqat bitta refresh so'rovi yuboriladi.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.access) return null;
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
    if (data.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
    return data.access as string;
  } catch {
    return null;
  }
}

async function rawRequest<T>(url: string, options: RequestInit, token: string | null): Promise<Response> {
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
}

async function request<T>(endpoint: string, options?: RequestInit, allowRetry = true): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const res = await rawRequest(url, options || {}, getAccessToken());

  // Access token muddati o'tgan bo'lsa — refresh qilib, bir marta qayta urinamiz.
  if (res.status === 401 && allowRetry && typeof window !== "undefined") {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return request<T>(endpoint, options, false);
    }
    clearTokens();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

/**
 * DRF pagination'ini to'liq aylanib chiqadi (faqat birinchi sahifani emas).
 * `page_size` bilan odatda bitta so'rov kifoya qiladi.
 */
async function requestAll<T>(endpoint: string): Promise<T[]> {
  const out: T[] = [];
  let url: string | null =
    endpoint + (endpoint.includes("?") ? "&" : "?") + "page_size=5000";
  while (url) {
    const data: T[] | { results?: T[]; next?: string | null } = await request(url);
    if (Array.isArray(data)) {
      out.push(...data);
      break;
    }
    if (data && Array.isArray(data.results)) {
      out.push(...data.results);
      url = data.next ?? null;
    } else {
      break;
    }
  }
  return out;
}

export async function checkBackendHealth(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_BASE_URL}/health/`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Butun ma'lumotlar bazasini backenddan yuklash.
 * Asosiy yo'l — bitta `/data/snapshot/` so'rovi (sahifalash yo'q).
 * Eski backend bo'lsa (404) — alohida endpointlarga qaytamiz.
 */
export async function apiFetchAll(): Promise<AviakassaData> {
  try {
    const data = await request<AviakassaData>("/data/snapshot/");
    return {
      partners: data.partners || [],
      batches: data.batches || [],
      sales: data.sales || [],
      payments: data.payments || [],
      debtOffsets: data.debtOffsets || [],
      accounts: data.accounts || [],
    };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }
  }

  const [partners, batches, sales, payments, debtOffsets, accounts] = await Promise.all([
    requestAll<Partner>("/partners/"),
    requestAll<Batch>("/batches/"),
    requestAll<Sale>("/sales/"),
    requestAll<Payment>("/cash/payments/"),
    requestAll<DebtOffset>("/cash/offsets/"),
    requestAll<CashAccount>("/cash/accounts/"),
  ]);

  return { partners, batches, sales, payments, debtOffsets, accounts };
}


// ================= Partners =================
export async function apiCreatePartner(partner: Partial<Partner>): Promise<Partner> {
  return request<Partner>("/partners/", {
    method: "POST",
    body: JSON.stringify(partner),
  });
}

export async function apiUpdatePartner(id: number, data: Partial<Partner>): Promise<Partner> {
  return request<Partner>(`/partners/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDeletePartner(id: number): Promise<void> {
  await request<void>(`/partners/${id}/`, { method: "DELETE" });
}

// ================= Batches =================
export async function apiCreateBatch(batch: Partial<Batch>): Promise<Batch> {
  return request<Batch>("/batches/", {
    method: "POST",
    body: JSON.stringify(batch),
  });
}

export async function apiUpdateBatch(id: number, data: Partial<Batch> | object): Promise<Batch> {
  return request<Batch>(`/batches/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBatch(id: number): Promise<void> {
  await request<void>(`/batches/${id}/`, { method: "DELETE" });
}

export interface BatchBulkPayload {
  supplierId: number;
  purchaseDate?: string;
  paidNow?: number;
  paymentMethod?: string;
  accountId?: number;
  notes?: string;
  paymentNotes?: string;
  items: Array<Record<string, unknown>>;
}

export async function apiCreateBatchesBulk(
  payload: BatchBulkPayload
): Promise<{ created: Batch[]; paymentId: number | null }> {
  return request<{ created: Batch[]; paymentId: number | null }>("/batches/bulk/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ================= Avto xarid / hisobga olish =================
export interface AutoBatchPayload {
  supplierId: number;
  route: string;
  flightDate: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  isRoundTrip?: boolean;
  returnDate?: string | null;
  returnFlightNumber?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  baggage?: string;
  totalQty: number;
  buyPrice: number;
  purchaseDate?: string;
  categoryId?: number | null;
  notes?: string;
  until: string;
  intervalDays?: number;
}

export async function apiCreateAutoBatches(payload: AutoBatchPayload): Promise<{
  created: Batch[];
  skipped: string[];
  seriesId: string;
  count: number;
}> {
  return request("/batches/auto/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiAccountBatch(id: number): Promise<Batch> {
  return request<Batch>(`/batches/${id}/account/`, { method: "POST" });
}

export async function apiAccountSeries(payload: {
  seriesId?: string;
  ids?: number[];
}): Promise<{ updated: number }> {
  return request<{ updated: number }>("/batches/account-all/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ================= Xarid turlari (kategoriya) =================
export async function apiListCategories(): Promise<BatchCategory[]> {
  return requestAll<BatchCategory>("/categories/");
}

export async function apiCreateCategory(name: string): Promise<BatchCategory> {
  return request<BatchCategory>("/categories/", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// ================= Sales =================
export async function apiCreateSale(sale: Partial<Sale>): Promise<Sale> {
  return request<Sale>("/sales/", {
    method: "POST",
    body: JSON.stringify(sale),
  });
}

export async function apiUpdateSale(id: number, data: Partial<Sale> | object): Promise<Sale> {
  return request<Sale>(`/sales/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteSale(id: number): Promise<void> {
  await request<void>(`/sales/${id}/`, { method: "DELETE" });
}

export interface SaleBulkPayload {
  clientId: number;
  saleDate: string;
  paidNow?: number;
  paymentMethod?: string;
  accountId?: number;
  notes?: string;
  paymentNotes?: string;
  items: Array<Record<string, unknown>>;
}

export async function apiCreateSalesBulk(
  payload: SaleBulkPayload
): Promise<{ created: Sale[]; paymentId: number | null }> {
  return request<{ created: Sale[]; paymentId: number | null }>("/sales/bulk/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ================= Payments =================
export async function apiCreatePayment(payment: Partial<Payment>): Promise<Payment> {
  return request<Payment>("/cash/payments/", {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

export async function apiDeletePayment(id: number): Promise<void> {
  await request<void>(`/cash/payments/${id}/`, { method: "DELETE" });
}

// ================= Cash Accounts =================
export async function apiCreateAccount(account: { name: string }): Promise<CashAccount> {
  return request<CashAccount>("/cash/accounts/", {
    method: "POST",
    body: JSON.stringify(account),
  });
}

export async function apiUpdateAccount(id: number, account: { name: string }): Promise<CashAccount> {
  return request<CashAccount>(`/cash/accounts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(account),
  });
}

export async function apiDeleteAccount(id: number): Promise<void> {
  await request<void>(`/cash/accounts/${id}/`, { method: "DELETE" });
}

// ================= Debt Offsets =================
export async function apiCreateDebtOffset(offset: Partial<DebtOffset>): Promise<DebtOffset> {
  return request<DebtOffset>("/cash/offsets/", {
    method: "POST",
    body: JSON.stringify(offset),
  });
}

export async function apiDeleteDebtOffset(id: number): Promise<void> {
  await request<void>(`/cash/offsets/${id}/`, { method: "DELETE" });
}

// ================= Backup / Restore =================
export async function apiImportData(
  payload: AviakassaData
): Promise<{ created: Record<string, number> }> {
  return request<{ created: Record<string, number> }>("/data/import/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiResetData(): Promise<void> {
  await request<void>("/data/reset/", { method: "POST" });
}

// ================= Databases (multi-DB boshqaruvi, faqat admin) =================
export interface DatabaseInfo {
  id: number;
  name: string;
  dbName: string;
  isActive: boolean;
  isClosed: boolean;
  createdAt: string;
  closedAt: string | null;
}

export interface DatabaseCopySelection {
  partners?: boolean;
  batches?: boolean;
  sales?: boolean;
  payments?: boolean;
  debtOffsets?: boolean;
}

export async function apiListDatabases(): Promise<{
  databases: DatabaseInfo[];
  activeId: number | null;
}> {
  return request<{ databases: DatabaseInfo[]; activeId: number | null }>("/databases/");
}

export async function apiCreateDatabase(
  name: string,
  copy: DatabaseCopySelection
): Promise<{ database: DatabaseInfo; copied: Record<string, number> }> {
  return request<{ database: DatabaseInfo; copied: Record<string, number> }>("/databases/", {
    method: "POST",
    body: JSON.stringify({ name, copy }),
  });
}

export async function apiActivateDatabase(id: number): Promise<{ database: DatabaseInfo }> {
  return request<{ database: DatabaseInfo }>(`/databases/${id}/activate/`, {
    method: "POST",
  });
}

export async function apiCloseDatabase(id: number): Promise<{ database: DatabaseInfo }> {
  return request<{ database: DatabaseInfo }>(`/databases/${id}/close/`, {
    method: "POST",
  });
}
