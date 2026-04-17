import { Mail, Lock } from "lucide-react"
import GoogleIcon from "@/components/ui/GoogleIcon"
import LABELS from "@/utils/labels"

export default function LoginForm({ auth }: any) {
  const { form, setForm, loading, fieldErrors, clearFieldError, handleSubmit, handleGoogleLogin } = auth

  return (
    <form onSubmit={handleSubmit} className="auth-form-inner">
      <h2 className="auth-form-title centered">{LABELS.FORM_TITLE_WELCOME}</h2>

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
          placeholder={LABELS.PLACEHOLDER_PASSWORD}
          onChange={(e) => { setForm({ ...form, password: e.target.value }); clearFieldError("password") }}
          className={`auth-input${fieldErrors.password ? " auth-input-error" : LABELS.EMPTY_STRING}`}
        />
      </div>

      <div style={{ textAlign: "right", marginTop: "-4px" }}>
        <button
          type="button"
          className="auth-back-link"
          style={{ fontSize: "12px", color: "#059669" }}
          onClick={() => auth.setForgotStep("email")}
        >
          {LABELS.LINK_FORGOT_PASSWORD}
        </button>
      </div>

      <button type="submit" disabled={loading} className="auth-btn auth-btn-primary">
        {loading ? LABELS.BTN_SIGNING_IN : LABELS.BTN_SIGN_IN}
      </button>

      <div className="auth-divider"><span>or</span></div>

      <button type="button" onClick={handleGoogleLogin} className="auth-btn auth-btn-google">
        <GoogleIcon />
        {LABELS.BTN_GOOGLE}
      </button>
    </form>
  )
}
