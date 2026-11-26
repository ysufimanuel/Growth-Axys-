"use client";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  code?: string;
}

/** Fetch ke /api/admin/* memakai session cookie + header anti-CSRF. Sesi habis (401) -> kembali ke login. */
export async function adminFetch<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: init.method ?? "GET",
      credentials: "same-origin",
      headers: { "X-Admin-Request": "1", ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const payload = (await res.json().catch(() => null)) as (T & { error?: string; code?: string }) | null;
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.assign("/admin/login");
    }
    if (!res.ok) return { ok: false, status: res.status, data: null, error: payload?.error ?? "Permintaan gagal.", code: payload?.code };
    return { ok: true, status: res.status, data: payload as T, error: null };
  } catch {
    return { ok: false, status: 0, data: null, error: "Tidak dapat terhubung ke server. Periksa koneksi Anda." };
  }
}
