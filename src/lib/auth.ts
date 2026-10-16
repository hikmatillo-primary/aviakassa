import { API_BASE_URL } from "./api";

const TOKEN_KEY = "aviakassa_access_token";
const REFRESH_KEY = "aviakassa_refresh_token";
const USER_KEY = "aviakassa_user_info";

export interface AuthUser {
  id?: number;
  username: string;
  name?: string;
  isStaff?: boolean;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export async function loginUser(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message =
      errData.detail ||
      errData.non_field_errors?.[0] ||
      "Login yoki parol noto'g'ri kiritildi!";
    throw new Error(message);
  }

  const data = await res.json();
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, data.access);
    if (data.refresh) {
      localStorage.setItem(REFRESH_KEY, data.refresh);
    }
  }

  // Fetch or construct user info
  const user: AuthUser = {
    username,
    name: username === "admin" ? "Bosh Administrator" : username,
    isStaff: true,
  };

  try {
    const userRes = await fetch(`${API_BASE_URL}/auth/user/`, {
      headers: {
        Authorization: `Bearer ${data.access}`,
        Accept: "application/json",
      },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      Object.assign(user, userData);
    }
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  return user;
}

export function logoutUser(): void {
  if (typeof window === "undefined") return;

  // Serverdagi refresh tokenni bekor qilamiz (best-effort, xatoga chidamli).
  const refresh = localStorage.getItem(REFRESH_KEY);
  const token = localStorage.getItem(TOKEN_KEY);
  if (refresh && token) {
    fetch(`${API_BASE_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refresh }),
    }).catch(() => {
      // Chiqishni bloklamaymiz.
    });
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
