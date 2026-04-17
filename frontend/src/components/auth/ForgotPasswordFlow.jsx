import { Mail, Lock } from "lucide-react"
import LABELS from "@/utils/labels"

export default function ForgotPasswordFlow({ auth }) {
  const {
    forgotStep, setForgotStep,
    forgotEmail, setForgotEmail,
    forgotOtp, setForgotOtp,
    forgotPassword, setForgotPassword,
    forgotConfirm, setForgotConfirm,
    forgotLoading,
    otpCooldown,
    handleForgotSendOtp,
    handleForgotVerifyOtp,
    handleForgotReset,
  } = auth

  if (forgotStep === "email") {
    return (
      <div className="auth-form-inner">
        <h2 className="auth-form-title">{LABELS.FORM_TITLE_RESET}</h2>
        <p className="auth-form-sub">{LABELS.SUB_RESET_EMAIL}</p>
        <div className="auth-input-wrap">
          <Mail className="auth-input-icon" />
          <input
            type="email"
            value={forgotEmail}
            placeholder={LABELS.PLACEHOLDER_EMAIL}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="auth-input"
          />
        </div>
        <button type="button" onClick={handleForgotSendOtp} disabled={forgotLoading} className="auth-btn auth-btn-primary">
          {forgotLoading ? LABELS.BTN_SENDING : LABELS.BTN_SEND_CODE}
        </button>
        <button type="button" onClick={() => setForgotStep(LABELS.EMPTY_STRING)} className="auth-back-link">
          {LABELS.LINK_BACK_SIGNIN}
        </button>
      </div>
    )
  }

  if (forgotStep === "otp") {
    return (
      <div className="auth-form-inner">
        <h2 className="auth-form-title">{LABELS.FORM_TITLE_CHECK_EMAIL}</h2>
        <p className="auth-form-sub">
          {LABELS.otpSentTo(forgotEmail)}<br /><strong>{forgotEmail}</strong>
        </p>
        <div className="auth-input-wrap">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={forgotOtp}
            placeholder={LABELS.PLACEHOLDER_OTP}
            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, LABELS.EMPTY_STRING))}
            className="auth-input auth-input-otp"
          />
        </div>
        <button type="button" onClick={handleForgotVerifyOtp} disabled={forgotLoading} className="auth-btn auth-btn-primary">
          {forgotLoading ? LABELS.BTN_VERIFYING : LABELS.BTN_VERIFY_CODE}
        </button>
        <button type="button" disabled={otpCooldown > 0} className="auth-btn auth-btn-ghost" onClick={handleForgotSendOtp}>
          {otpCooldown > 0 ? LABELS.resendCountdown(otpCooldown) : LABELS.BTN_RESEND_CODE}
        </button>
        <button type="button" onClick={() => setForgotStep("email")} className="auth-back-link">
          {LABELS.LINK_CHANGE_EMAIL}
        </button>
      </div>
    )
  }

  if (forgotStep === "reset") {
    return (
      <div className="auth-form-inner">
        <h2 className="auth-form-title">{LABELS.FORM_TITLE_NEW_PASSWORD}</h2>
        <p className="auth-form-sub">{LABELS.SUB_NEW_PASSWORD}</p>
        <div className="auth-input-wrap">
          <Lock className="auth-input-icon" />
          <input
            type="password"
            value={forgotPassword}
            placeholder={LABELS.PLACEHOLDER_NEW_PASSWORD}
            onChange={(e) => setForgotPassword(e.target.value)}
            className="auth-input"
          />
        </div>
        <div className="auth-input-wrap">
          <Lock className="auth-input-icon" />
          <input
            type="password"
            value={forgotConfirm}
            placeholder={LABELS.PLACEHOLDER_CONFIRM_PASSWORD}
            onChange={(e) => setForgotConfirm(e.target.value)}
            className="auth-input"
          />
        </div>
        <button type="button" onClick={handleForgotReset} disabled={forgotLoading} className="auth-btn auth-btn-primary">
          {forgotLoading ? LABELS.BTN_RESETTING : LABELS.BTN_RESET_PASSWORD}
        </button>
        <button type="button" onClick={() => setForgotStep(LABELS.EMPTY_STRING)} className="auth-back-link">
          {LABELS.LINK_BACK_SIGNIN}
        </button>
      </div>
    )
  }

  return null
}
