import { getAccessToken, setAccessToken } from "../features/auth/tokenStore";

const API_URL = import.meta.env.VITE_API_URL;

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newToken = data?.access_token as string | undefined;
    if (!newToken) return null;
    // persist flag’i değiştirmeden güncelle
    const persist = localStorage.getItem("persist_login") === "1";
    setAccessToken(newToken, persist);
    return newToken;
  } catch {
    return null;
  }
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const url = input.startsWith("http") ? input : `${API_URL}${input}`;

  const token = getAccessToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(url, {
    ...init,
    headers,
    credentials: "include", 
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { ...init, headers, credentials: "include" });
    }
  }

  return res;
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg);
  }
  return res.json();
}

export async function getJSON<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const msg = await safeError(res);
    throw new Error(msg);
  }
  return res.json();
}

async function safeError(res: Response) {
  try {
    const data = await res.json();
    return data?.detail || data?.message || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}
