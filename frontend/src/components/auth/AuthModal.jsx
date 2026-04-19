import { useAuthModal } from "@/hooks/useAuthModal"
import LoginForm from "./LoginForm"
import ForgotPasswordFlow from "./ForgotPasswordFlow"
import RegisterForm from "./RegisterForm"
import AuthPanels from "./AuthPanels"
import LABELS from "@/utils/labels"

const AUTH_CSS = `
  .auth-modal-backdrop {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    background: rgba(0,0,0,0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: backdropIn 0.25s ease-out;
  }
  @keyframes backdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(12px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  .auth-modal-container {
    position: relative;
    width: min(900px, 100%);
    height: min(560px, calc(100dvh - 32px));
    background: white;
    border-radius: 24px;
    box-shadow: 0 40px 100px rgba(0,0,0,0.22);
    overflow: hidden;
    display: flex;
    animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .auth-form-box {
    position: absolute; top: 0; height: 100%; width: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .auth-form-login {
    left: 50%; opacity: 1; pointer-events: auto;
    transition: opacity 0.2s ease-in-out 0.75s;
  }
  .auth-modal-active .auth-form-login {
    opacity: 0; pointer-events: none;
    transition: opacity 0.15s ease-in-out 0s;
  }
  .auth-form-register {
    left: 0; opacity: 0; pointer-events: none;
    transition: opacity 0.15s ease-in-out 0s;
  }
  .auth-modal-active .auth-form-register {
    opacity: 1; pointer-events: auto;
    transition: opacity 0.2s ease-in-out 0.75s;
  }
  .auth-form-inner {
    width: 100%; padding: 36px 32px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .auth-form-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .auth-logo-icon {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #059669, #0d9488);
  }
  .auth-logo-text { font-size: 13px; font-weight: 800; color: #071a0b; letter-spacing: -0.3px; }
  .auth-form-title { font-size: 22px; font-weight: 900; color: #071a0b; margin: 0; line-height: 1.2; }
  .auth-form-title.centered { text-align: center; font-size: 28px; }
  .auth-form-sub   { font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5; }
  .auth-input-wrap { position: relative; }
  .auth-input-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    width: 15px; height: 15px; color: #9ca3af; pointer-events: none;
  }
  .auth-input {
    width: 100%; height: 42px;
    padding: 0 12px 0 38px;
    border-radius: 10px;
    border: 1.5px solid hsl(214.3 31.8% 91.4%);
    background: #fafafa;
    font-size: 13.5px; color: #071a0b; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .auth-input:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.12); }
  .auth-input-error { border-color: #ef4444 !important; }
  .auth-input-otp {
    text-align: center; letter-spacing: 0.5rem;
    font-size: 20px; font-weight: 700; padding: 0 12px;
  }
  .auth-btn {
    width: 100%; height: 42px; border: none; border-radius: 10px;
    font-size: 13.5px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s;
  }
  .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .auth-btn-primary {
    background: linear-gradient(135deg, #059669, #0d9488);
    color: white;
    box-shadow: 0 4px 14px rgba(5,150,105,0.35);
  }
  .auth-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(5,150,105,0.4); }
  .auth-btn-google {
    background: white; color: #374151;
    border: 1.5px solid hsl(214.3 31.8% 91.4%);
    font-weight: 600;
  }
  .auth-btn-google:hover { background: #f9fafb; }
  .auth-btn-ghost {
    background: transparent; color: #059669;
    border: 1.5px solid #059669;
    font-weight: 600; font-size: 13px;
  }
  .auth-btn-ghost:disabled { color: #047857; border-color: #047857; opacity: 0.7; }
  .auth-back-link {
    background: none; border: none; cursor: pointer;
    font-size: 12px; color: #9ca3af; text-align: center;
    padding: 4px 0; transition: color 0.2s;
  }
  .auth-back-link:hover { color: #059669; }
  .auth-divider {
    display: flex; align-items: center; gap: 12px;
    color: #d1d5db; font-size: 11px;
  }
  .auth-divider::before, .auth-divider::after {
    content: ""; flex: 1; height: 1px; background: #e5e7eb;
  }
  .auth-divider span { color: #9ca3af; white-space: nowrap; }
  .auth-toggle-box {
    position: absolute; inset: 0; overflow: hidden; z-index: 10;
    pointer-events: none;
  }
  .auth-toggle-box::before {
    content: "";
    position: absolute; top: 0; left: -250%; width: 300%; height: 100%;
    background: linear-gradient(135deg, #059669 0%, #0d9488 60%, #064e3b 100%);
    border-radius: 150px;
    z-index: 1;
    transition: left 0.9s ease-in-out;
  }
  .auth-modal-active .auth-toggle-box::before { left: 50%; }
  .auth-toggle-panel {
    position: absolute; top: 0; width: 50%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 28px 32px;
    box-sizing: border-box;
    z-index: 2; pointer-events: auto;
  }
  .auth-toggle-left  { left: 0; opacity: 1; pointer-events: auto; transition: opacity 0.2s ease-in-out 0.75s; }
  .auth-modal-active .auth-toggle-left  { opacity: 0; pointer-events: none; transition: opacity 0.15s ease-in-out 0s; }
  .auth-toggle-right { right: 0; opacity: 0; pointer-events: none; transition: opacity 0.15s ease-in-out 0s; }
  .auth-modal-active .auth-toggle-right { opacity: 1; pointer-events: auto; transition: opacity 0.2s ease-in-out 0.75s; }
  .auth-panel-dots {
    position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
  }
  .auth-panel-dot {
    position: absolute;
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.12);
    animation: dotPulse 4s ease-in-out infinite;
  }
  .auth-panel-dot:nth-child(1)  { top: 8%;  left: 12%; width: 8px;  height: 8px; }
  .auth-panel-dot:nth-child(2)  { top: 15%; left: 72%; width: 5px;  height: 5px; }
  .auth-panel-dot:nth-child(3)  { top: 28%; left: 30%; width: 10px; height: 10px; background: rgba(255,255,255,0.07); }
  .auth-panel-dot:nth-child(4)  { top: 38%; left: 80%; width: 6px;  height: 6px; }
  .auth-panel-dot:nth-child(5)  { top: 55%; left: 18%; width: 4px;  height: 4px; }
  .auth-panel-dot:nth-child(6)  { top: 62%; left: 60%; width: 9px;  height: 9px; background: rgba(255,255,255,0.06); }
  .auth-panel-dot:nth-child(7)  { top: 75%; left: 40%; width: 5px;  height: 5px; }
  .auth-panel-dot:nth-child(8)  { top: 82%; left: 85%; width: 7px;  height: 7px; }
  .auth-panel-dot:nth-child(9)  { top: 90%; left: 22%; width: 4px;  height: 4px; }
  .auth-panel-dot:nth-child(10) { top: 20%; left: 50%; width: 3px;  height: 3px; }
  .auth-panel-dot:nth-child(11) { top: 48%; left: 92%; width: 6px;  height: 6px; }
  .auth-panel-dot:nth-child(12) { top: 70%; left: 8%;  width: 8px;  height: 8px; background: rgba(255,255,255,0.08); }
  .auth-panel-dot:nth-child(13) { top: 5%;  left: 45%; width: 5px;  height: 5px; }
  .auth-panel-dot:nth-child(14) { top: 93%; left: 65%; width: 4px;  height: 4px; }
  .auth-panel-dot:nth-child(15) { top: 42%; left: 5%;  width: 7px;  height: 7px; }
  @keyframes dotPulse {
    0%,100% { opacity: 0.4; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.4); }
  }
  .auth-toggle-title { font-size: 20px; font-weight: 900; color: white; margin: 0 0 8px; }
  .auth-toggle-sub   { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.6; margin: 0 0 14px; }
  .auth-toggle-btn {
    padding: 0 28px; height: 40px; border-radius: 10px;
    border: 2px solid rgba(255,255,255,0.7);
    background: transparent; color: white;
    font-size: 13px; font-weight: 700; cursor: pointer;
    transition: all 0.2s;
  }
  .auth-toggle-btn:hover { background: rgba(255,255,255,0.15); border-color: white; }
  .auth-close-btn {
    position: absolute; top: 14px; right: 14px;
    width: 32px; height: 32px; border-radius: 50%;
    border: none; background: rgba(0,0,0,0.07);
    color: #6b7280; font-size: 14px;
    cursor: pointer; z-index: 20;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, color 0.2s;
  }
  .auth-close-btn:hover { background: rgba(0,0,0,0.13); color: #111; }
  @media (max-width: 600px) {
    .auth-modal-container {
      flex-direction: column;
      width: 100%; height: auto;
      max-height: calc(100dvh - 32px);
      border-radius: 20px;
      overflow-y: auto;
    }
    .auth-toggle-box { display: none; }
    .auth-form-box {
      position: relative; width: 100%; height: auto;
      opacity: 1 !important;
      left: auto !important;
      pointer-events: auto !important;
      transition: none;
      display: none;
    }
    .auth-form-login  { display: flex; }
    .auth-form-register { display: none; }
    .auth-modal-active .auth-form-login    { display: none; }
    .auth-modal-active .auth-form-register { display: flex; }
    .auth-form-inner { padding: 28px 20px; gap: 10px; }
    .auth-form-title { font-size: 20px; }
    .auth-mobile-switch {
      display: flex; justify-content: center; align-items: center;
      gap: 6px; padding: 0 20px 20px;
      font-size: 12.5px; color: #6b7280;
    }
    .auth-mobile-switch button {
      background: none; border: none; cursor: pointer;
      color: #059669; font-weight: 700; font-size: 12.5px;
      text-decoration: underline;
    }
  }
  @media (min-width: 601px) {
    .auth-mobile-switch { display: none; }
  }
`

export default function AuthModal({ showAuth, setShowAuth, isRegister, setIsRegister, toast }) {
  const auth = useAuthModal({ isRegister, setIsRegister, toast })

  const closeModal = () => {
    setShowAuth(false)
    auth.resetModal()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal()
  }

  if (!showAuth) return null

  return (
    <>
      <style>{AUTH_CSS}</style>
      <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
        <div className={`auth-modal-container${isRegister ? " auth-modal-active" : LABELS.EMPTY_STRING}`}>

          <div className="auth-form-box auth-form-login">
            {auth.forgotStep === LABELS.EMPTY_STRING
              ? <LoginForm auth={auth} />
              : <ForgotPasswordFlow auth={auth} />
            }
          </div>

          <div className="auth-form-box auth-form-register">
            <RegisterForm auth={auth} />
          </div>

          <AuthPanels isRegister={isRegister} setIsRegister={setIsRegister} auth={auth} />

          <button className="auth-close-btn" onClick={closeModal}>&#x2715;</button>

          <div className="auth-mobile-switch">
            {isRegister ? (
              <>
                <span>{LABELS.MOBILE_HAVE_ACCOUNT}</span>
                <button type="button" onClick={() => { setIsRegister(false); auth.setOtpStep(false); auth.setOtp(LABELS.EMPTY_STRING) }}>
                  {LABELS.BTN_SIGN_IN}
                </button>
              </>
            ) : (
              <>
                <span>{LABELS.MOBILE_NO_ACCOUNT}</span>
                <button type="button" onClick={() => setIsRegister(true)}>
                  {LABELS.BTN_GET_STARTED}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
