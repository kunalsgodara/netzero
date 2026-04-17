import { ApiError } from "@/services/httpClient"

const API_BASE = import.meta.env.VITE_API_URL || ""


async function authPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const err = new Error(data.detail || "Request failed") as Error & ApiError
    err.status = resp.status
    err.data = data
    throw err
  }
  return data as T
}

export const authApi = {
  register: (payload: any) =>
    authPost<any>("/api/auth/register", payload),
  login: (payload: any) =>
    authPost<any>("/api/auth/login", payload),
  verifyEmail: (email: string, otp: string) =>
    authPost<any>("/api/auth/verify-email", { email, otp }),
  resendOtp: (email: string) =>
    authPost<any>("/api/auth/resend-otp", { email }),
  forgotPassword: (email: string) =>
    authPost<any>("/api/auth/forgot-password", { email }),
  verifyResetOtp: (email: string, otp: string) =>
    authPost<any>("/api/auth/verify-reset-otp", { email, otp }),
  resetPassword: (email: string, otp: string, new_password: string) =>
    authPost<any>("/api/auth/reset-password", { email, otp, new_password }),
}
