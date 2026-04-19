const LABELS = {
  EMPTY_STRING: "",

  BRAND_NAME: "NetZeroWorks",
  BRAND_SUBTITLE: "Carbon Platform",

  NAV_SIGN_IN: "Sign In",
  NAV_GET_STARTED: "Get Started",
  NAV_DASHBOARD: "Dashboard",

  FORM_TITLE_WELCOME: "Welcome back",
  FORM_TITLE_CREATE: "Create account",
  FORM_TITLE_RESET: "Reset password",
  FORM_TITLE_CHECK_EMAIL: "Check your email",
  FORM_TITLE_NEW_PASSWORD: "New password",
  FORM_TITLE_VERIFY: "Verify your email",

  PLACEHOLDER_EMAIL: "Work email",
  PLACEHOLDER_PASSWORD: "Password",
  PLACEHOLDER_FULL_NAME: "Full name",
  PLACEHOLDER_ORG_NAME: "Organisation name",
  PLACEHOLDER_PASSWORD_MIN: "Password (min 8 chars)",
  PLACEHOLDER_NEW_PASSWORD: "New password (min 8 chars)",
  PLACEHOLDER_CONFIRM_PASSWORD: "Confirm new password",
  PLACEHOLDER_OTP: "_ _ _ _ _ _",

  BTN_SIGN_IN: "Sign In",
  BTN_SIGNING_IN: "Signing in\u2026",
  BTN_CREATE_ACCOUNT: "Create Account",
  BTN_CREATING: "Creating account\u2026",
  BTN_GOOGLE: "Continue with Google",
  BTN_GET_STARTED: "Get Started",
  BTN_SEND_CODE: "Send Code",
  BTN_SENDING: "Sending\u2026",
  BTN_VERIFY_CODE: "Verify Code",
  BTN_VERIFYING: "Verifying\u2026",
  BTN_VERIFY_CONTINUE: "Verify & Continue",
  BTN_RESEND_OTP: "Resend OTP",
  BTN_RESEND_CODE: "Resend Code",
  BTN_RESET_PASSWORD: "Reset Password",
  BTN_RESETTING: "Resetting\u2026",

  LINK_FORGOT_PASSWORD: "Forgot password?",
  LINK_BACK_SIGNIN: "\u2190 Back to sign in",
  LINK_CHANGE_EMAIL: "\u2190 Change email",
  LINK_BACK_REGISTRATION: "\u2190 Back to registration",

  PANEL_LEFT_TITLE: "New here?",
  PANEL_LEFT_SUB: "Join companies cutting their CBAM liability with verified supplier data.",
  PANEL_RIGHT_TITLE: "Already a member?",
  PANEL_RIGHT_SUB: "Sign in to your dashboard and stay ahead of CBAM deadlines.",

  SUB_RESET_EMAIL: "Enter your email and we'll send a verification code.",
  SUB_NEW_PASSWORD: "Choose a strong password for your account.",

  MOBILE_HAVE_ACCOUNT: "Already have an account?",
  MOBILE_NO_ACCOUNT: "Don't have an account?",

  TOAST_OTP_SENT: "OTP sent to your email. Please verify.",
  TOAST_EMAIL_VERIFIED: "Email verified! Welcome aboard.",
  TOAST_OTP_RESENT: "OTP resent to your email",
  TOAST_FORGOT_SENT: "If this email is registered, a code has been sent",
  TOAST_OTP_VERIFIED: "OTP verified",
  TOAST_PASSWORD_RESET: "Password reset! Please sign in.",
  TOAST_WELCOME_BACK: "Welcome back!",

  ERROR_OTP_LENGTH: "Enter the 6-digit code",
  ERROR_FILL_FIELDS: "Please fill in all required fields",
  ERROR_PASSWORD_LENGTH: "Password must be at least 8 characters",
  ERROR_ENTER_EMAIL: "Enter your email address",
  ERROR_ENTER_PASSWORD: "Enter a new password",
  ERROR_PASSWORDS_MISMATCH: "Passwords do not match",
  ERROR_AUTH_FAILED: "Authentication failed",
  ERROR_SEND_OTP: "Failed to send OTP",
  ERROR_INVALID_OTP: "Invalid OTP",
  ERROR_RESET_FAILED: "Failed to reset password",
  ERROR_RESEND_FAILED: "Failed to resend OTP",
  ERROR_VERIFY_EMAIL: "Please verify your email first.",

  resendCountdown: (s) => `Resend in ${s}s`,
  otpSentTo: (email) => `We sent a 6-digit code to ${email}`,
}

export default LABELS
