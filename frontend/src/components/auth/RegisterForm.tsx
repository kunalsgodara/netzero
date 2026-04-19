import { Mail, Lock, User, Building2 } from "lucide-react"
import CompanyLogo from "@/components/ui/CompanyLogo"
import GoogleIcon from "@/components/ui/GoogleIcon"
import LABELS from "@/utils/labels"

function RegisterFields({ auth }: any) {
  const { form, setForm, loading, fieldErrors, clearFieldError, handleSubmit, handleGoogleLogin } = auth
  return (
    <form onSubmit={handleSubmit} className="auth-form-inner">
      <h2 className="auth-form-title centered">{LABELS.FORM_TITLE_CREATE}</h2>

      <div className="auth-input-wrap">
        <User className="auth-input-icon" />
        <input
          type="text"
          value={form.full_name}
          placeholder={LABELS.PLACEHOLDER_FULL_NAME}
          onChange={(e) => { setForm({ ...form, full_name: e.target.value }); clearFieldError("full_name") }}
          className={`auth-input${fieldErrors.full_name ? " auth-input-error" : LABELS.EMPTY_STRING}`}
        />
      </div>

      <div className="auth-input-wrap">
        <Building2 className="auth-input-icon" />
        <input
          type="text"
          value={form.org_name}
          placeholder={LABELS.PLACEHOLDER_ORG_NAME}
          onChange={(e) => { setForm({ ...form, org_name: e.target.value }); clearFieldError("org_name") }}
          className={`auth-input${fieldErrors.org_name ? " auth-input-error" : LABELS.EMPTY_STRING}`}
        />
      </div>

      <div className="auth-input-wrap">
        <Mail className="auth-input-icon" />
        <input
          type="email"
          value={form.email}
          placeholder={LABELS.PLACEHOLDER_EMAIL}
          onChange={(e) => { setForm({ ...form, email: e.target.value }); clearFieldError("email") }}
          className={`auth-input${fieldErrors.email ? " auth-input-error" : LABELS.EMPTY_STRING}`}
        />
      </div>

      <div className="auth-input-wrap">
        <Lock className="auth-input-icon" />
        <input
          type="password"
          value={form.password}
          placeholder={LABELS.PLACEHOLDER_PASSWORD_MIN}
          onChange={(e) => { setForm({ ...form, password: e.target.value }); clearFieldError("password") }}
          className={`auth-input${fieldErrors.password ? " auth-input-error" : LABELS.EMPTY_STRING}`}
        />
      </div>

      <button type="submit" disabled={loading} className="auth-btn auth-btn-primary">
        {loading ? LABELS.BTN_CREATING : LABELS.BTN_CREATE_ACCOUNT}
      </button>

      <div className="auth-divider"><span>or</span></div>

      <button type="button" onClick={handleGoogleLogin} className="auth-btn auth-btn-google">
        <GoogleIcon />
        {LABELS.BTN_GOOGLE}
      </button>
    </form>
  )
}

function OtpStep({ auth }: any) {
  const { form, otp, setOtp, otpCooldown, otpLoading, handleVerifyOtp, handleResendOtp, setOtpStep, setOtp: resetOtp } = auth
  return (
    <div className="auth-form-inner">
      <div className="auth-form-logo">
        <CompanyLogo size={30} />
        <span className="auth-logo-text">{LABELS.BRAND_NAME}</span>
      </div>
      <h2 className="auth-form-title">{LABELS.FORM_TITLE_VERIFY}</h2>
      <p className="auth-form-sub">
        We sent a 6-digit code to<br /><strong>{form.email}</strong>
      </p>
      <div className="auth-input-wrap">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          placeholder={LABELS.PLACEHOLDER_OTP}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, LABELS.EMPTY_STRING))}
          className="auth-input auth-input-otp"
        />
      </div>
      <button type="button" onClick={handleVerifyOtp} disabled={otpLoading} className="auth-btn auth-btn-primary">
        {otpLoading ? LABELS.BTN_VERIFYING : LABELS.BTN_VERIFY_CONTINUE}
      </button>
      <button
        type="button"
        onClick={handleResendOtp}
        disabled={otpCooldown > 0}
        className="auth-btn auth-btn-ghost"
      >
        {otpCooldown > 0 ? LABELS.resendCountdown(otpCooldown) : LABELS.BTN_RESEND_OTP}
      </button>
      <button
        type="button"
        onClick={() => { setOtpStep(false); resetOtp(LABELS.EMPTY_STRING) }}
        className="auth-back-link"
      >
        {LABELS.LINK_BACK_REGISTRATION}
      </button>
    </div>
  )
}

export default function RegisterForm({ auth }: any) {
  return auth.otpStep ? <OtpStep auth={auth} /> : <RegisterFields auth={auth} />
}
