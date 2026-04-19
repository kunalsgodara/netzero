"""
Central constants for the NetZeroWorks application.
All hardcoded brand strings should reference this file.
"""

APP_NAME = "NetZeroWorks"
APP_SUBTITLE = "Carbon Platform"
APP_API_TITLE = f"{APP_NAME} API"
APP_DESCRIPTION = "Carbon compliance platform backend — UK CBAM + SECR"
APP_VERSION = "2.0.0"

PLATFORM_LABEL = f"{APP_NAME} Platform"
PLATFORM_AI_LABEL = f"{APP_NAME} AI"

EMAIL_SUBJECT_VERIFY = f"Verify your {APP_NAME} account"
EMAIL_SUBJECT_RESET = f"Reset your {APP_NAME} password"

PDF_FOOTER_BASE = f"{PLATFORM_LABEL}"
PDF_REPORT_SUFFIX = "Confidential"
PDF_SECR_FOOTER = f"Prepared by {APP_NAME} · SECR / DEFRA aligned · {PDF_REPORT_SUFFIX}"
PDF_CBAM_FOOTER = f"EU CBAM Declaration · {APP_NAME} · {PDF_REPORT_SUFFIX}"
PDF_EXEC_FOOTER = f"AI-enhanced Executive Summary · {APP_NAME} · {PDF_REPORT_SUFFIX}"
