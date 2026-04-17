import React, { useState } from "react"
import { authApi } from "@/api/authApi"
import { setToken, API_BASE, ROUTES, TOKEN_KEYS } from "@/services/httpClient"
import { useOtpCooldown } from "@/hooks/useOtpCooldown"
import LABELS from "@/utils/labels"

function saveTokensAndRedirect(data: any, toastFn: any, message = LABELS.TOAST_WELCOME_BACK) {
  setToken(data.access_token)
  if (data.refresh_token) localStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh_token)
  toastFn(message, "success")
  setTimeout(() => { window.location.href = ROUTES.DASHBOARD }, 800)
}

export interface UseAuthModalProps {
  isRegister: boolean;
  setIsRegister: (val: boolean) => void;
  toast: (message: string, type?: "success" | "error" | "warning") => void;
}

export function useAuthModal({ isRegister, setIsRegister, toast }: UseAuthModalProps) {
  const [form, setForm] = useState({
    email: LABELS.EMPTY_STRING,
    password: LABELS.EMPTY_STRING,
    full_name: LABELS.EMPTY_STRING,
    org_name: LABELS.EMPTY_STRING,
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})

  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState(LABELS.EMPTY_STRING)
  const [otpLoading, setOtpLoading] = useState(false)
  const { cooldown: otpCooldown, startCooldown: startOtpCooldown } = useOtpCooldown()

  const [forgotStep, setForgotStep] = useState(LABELS.EMPTY_STRING)
  const [forgotEmail, setForgotEmail] = useState(LABELS.EMPTY_STRING)
  const [forgotOtp, setForgotOtp] = useState(LABELS.EMPTY_STRING)
  const [forgotPassword, setForgotPassword] = useState(LABELS.EMPTY_STRING)
  const [forgotConfirm, setForgotConfirm] = useState(LABELS.EMPTY_STRING)
  const [forgotLoading, setForgotLoading] = useState(false)

  const clearFieldError = (field: string) => setFieldErrors(prev => ({ ...prev, [field]: false }))

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google?redirect=${encodeURIComponent(
      window.location.origin + ROUTES.DASHBOARD
    )}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errs: Record<string, boolean> = {}
    if (isRegister && !form.full_name.trim()) errs.full_name = true
    if (isRegister && !form.org_name.trim())  errs.org_name = true
    if (!form.email.trim())                   errs.email    = true
    if (!form.password) {
      errs.password = true
    } else if (isRegister && form.password.length < 8) {
      errs.password = true
      toast(LABELS.ERROR_PASSWORD_LENGTH, "error")
      setFieldErrors(errs)
      return
    }
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      toast(LABELS.ERROR_FILL_FIELDS, "error")
      return
    }

    setFieldErrors({})
    setLoading(true)
    try {
      if (isRegister) {
        await authApi.register({
          email:     form.email,
          password:  form.password,
          full_name: form.full_name,
          org_name:  form.org_name,
        })
        toast(LABELS.TOAST_OTP_SENT, "success")
        setOtpStep(true)
        startOtpCooldown()
      } else {
        const data = await authApi.login({ email: form.email, password: form.password })
        saveTokensAndRedirect(data, toast)
      }
    } catch (err: any) {
      if (err.status === 403 && err.data?.detail === "EMAIL_NOT_VERIFIED") {
        toast(LABELS.ERROR_VERIFY_EMAIL, "error")
        setIsRegister(true)
        setOtpStep(true)
        startOtpCooldown()
        return
      }
      toast(err.message || String(err), "error")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) { toast(LABELS.ERROR_OTP_LENGTH, "error"); return }
    setOtpLoading(true)
    try {
      const data = await authApi.verifyEmail(form.email, otp)
      saveTokensAndRedirect(data, toast, LABELS.TOAST_EMAIL_VERIFIED)
    } catch (err: any) {
      toast(err.message || String(err), "error")
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (otpCooldown > 0) return
    try {
      const data = await authApi.resendOtp(form.email)
      toast(LABELS.TOAST_OTP_RESENT, "success")
      startOtpCooldown(data.cooldown_seconds ?? 30)
    } catch (err: any) {
      toast(err.message || String(err), "error")
    }
  }

  const handleForgotSendOtp = async () => {
    if (!forgotEmail.trim()) { toast(LABELS.ERROR_ENTER_EMAIL, "error"); return }
    setForgotLoading(true)
    try {
      const data = await authApi.forgotPassword(forgotEmail)
      toast(LABELS.TOAST_FORGOT_SENT, "success")
      setForgotStep("otp")
      startOtpCooldown(data.cooldown_seconds ?? 30)
    } catch (err: any) {
      toast(err.message || String(err), "error")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotVerifyOtp = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) { toast(LABELS.ERROR_OTP_LENGTH, "error"); return }
    setForgotLoading(true)
    try {
      await authApi.verifyResetOtp(forgotEmail, forgotOtp)
      toast(LABELS.TOAST_OTP_VERIFIED, "success")
      setForgotStep("reset")
    } catch (err: any) {
      toast(err.message || String(err), "error")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotReset = async () => {
    if (!forgotPassword)                    { toast(LABELS.ERROR_ENTER_PASSWORD, "error");    return }
    if (forgotPassword.length < 8)          { toast(LABELS.ERROR_PASSWORD_LENGTH, "error");   return }
    if (forgotPassword !== forgotConfirm)   { toast(LABELS.ERROR_PASSWORDS_MISMATCH, "error"); return }
    setForgotLoading(true)
    try {
      await authApi.resetPassword(forgotEmail, forgotOtp, forgotPassword)
      toast(LABELS.TOAST_PASSWORD_RESET, "success")
      resetForgot()
    } catch (err: any) {
      toast(err.message || String(err), "error")
    } finally {
      setForgotLoading(false)
    }
  }

  const resetForgot = () => {
    setForgotStep(LABELS.EMPTY_STRING)
    setForgotEmail(LABELS.EMPTY_STRING)
    setForgotOtp(LABELS.EMPTY_STRING)
    setForgotPassword(LABELS.EMPTY_STRING)
    setForgotConfirm(LABELS.EMPTY_STRING)
  }

  const resetModal = () => {
    setOtpStep(false)
    setOtp(LABELS.EMPTY_STRING)
    resetForgot()
  }

  return {
    form, setForm,
    loading,
    fieldErrors, clearFieldError,
    otpStep, setOtpStep,
    otp, setOtp,
    otpCooldown,
    otpLoading,
    forgotStep, setForgotStep,
    forgotEmail, setForgotEmail,
    forgotOtp, setForgotOtp,
    forgotPassword, setForgotPassword,
    forgotConfirm, setForgotConfirm,
    forgotLoading,
    handleSubmit,
    handleVerifyOtp,
    handleResendOtp,
    handleForgotSendOtp,
    handleForgotVerifyOtp,
    handleForgotReset,
    handleGoogleLogin,
    resetModal,
  }
}
