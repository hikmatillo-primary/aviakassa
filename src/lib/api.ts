import { AviakassaData, Batch, DebtOffset, Partner, Payment, Sale } from "./storage";

// Default: same-origin "/api" (nginx frontend /api/ ni backendga proksilaydi).
// Kerak bo'lsa NEXT_PUBLIC_API_URL orqali to'liq manzil beriladi.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";


async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("aviakassa_access_token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`API Error [${res.status}] ${res.statusText}: ${errorText}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE_URL}/health/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

function extractList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

/**
 * Butun ma'lumotlar bazasini backenddan yuklash (Partners, Batches, Sales, Payments, DebtOffsets)
 */
export async function apiFetchAll(): Promise<AviakassaData> {
  const [partnersRes, batchesRes, salesRes, paymentsRes, debtOffsetsRes] = await Promise.all([
    request<any>("/partners/"),
    request<any>("/batches/"),
    request<any>("/sales/"),
    request<any>("/cash/payments/"),
    request<any>("/cash/offsets/"),
  ]);

  return {
    partners: extractList<Partner>(partnersRes),
    batches: extractList<Batch>(batchesRes),
    sales: extractList<Sale>(salesRes),
    payments: extractList<Payment>(paymentsRes),
    debtOffsets: extractList<DebtOffset>(debtOffsetsRes),
  };
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

export async function apiUpdateBatch(id: number, data: Partial<Batch>): Promise<Batch> {
  return request<Batch>(`/batches/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBatch(id: number): Promise<void> {
  await request<void>(`/batches/${id}/`, { method: "DELETE" });
}

// ================= Sales =================
export async function apiCreateSale(sale: Partial<Sale>): Promise<Sale> {
  return request<Sale>("/sales/", {
    method: "POST",
    body: JSON.stringify(sale),
  });
}

export async function apiUpdateSale(id: number, data: Partial<Sale>): Promise<Sale> {
  return request<Sale>(`/sales/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteSale(id: number): Promise<void> {
  await request<void>(`/sales/${id}/`, { method: "DELETE" });
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
