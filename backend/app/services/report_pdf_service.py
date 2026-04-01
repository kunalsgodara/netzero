"""
Server-side PDF report generator using ReportLab.
Generates SECR, CBAM Declaration, and Executive Summary PDFs
from aggregated report data — replacing the former frontend jsPDF implementation.
"""

from __future__ import annotations

import io
from typing import Any, Dict, List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

# ── Colour palette (matching frontend reference) ──────────────────────────────
C_DARK_GREEN  = colors.HexColor("#1b5e20")   # header banner bg
C_GREEN       = colors.HexColor("#2e7d32")   # section title bg / totals
C_WHITE       = colors.white
C_DARK        = colors.HexColor("#14181e")   # body text
C_MID         = colors.HexColor("#505f6e")   # label text
C_LIGHT_BG    = colors.HexColor("#f0f4f8")   # zebra stripe
C_TBL_HDR    = colors.HexColor("#2e7d32")   # table header bg
C_INFO_BOX    = colors.HexColor("#e3f2fd")   # CBAM regulatory box bg
C_INFO_BORDER = colors.HexColor("#64b5f6")   # CBAM regulatory box border
C_ORANGE      = colors.HexColor("#ea580c")   # CBAM card accent
C_BLUE        = colors.HexColor("#2563eb")   # Scope-2 card accent
C_SLATE       = colors.HexColor("#4b5563")   # Scope-1 card accent
C_FOOTER_BG   = colors.HexColor("#e6ebf0")

PAGE_W, PAGE_H = A4                          # 595.28 × 841.89 pt
MARGIN = 40
CONTENT_W = PAGE_W - MARGIN * 2

STANDARD_FACTORS = [
    ("Scope 1", "Stationary Combustion", "Natural Gas",       "kWh",      0.18293),
    ("Scope 1", "Stationary Combustion", "Diesel",            "litres",   2.68787),
    ("Scope 1", "Stationary Combustion", "Petrol",            "litres",   2.31440),
    ("Scope 1", "Stationary Combustion", "Coal",              "tonnes",   2883.71),
    ("Scope 1", "Stationary Combustion", "LPG",               "litres",   1.55537),
    ("Scope 1", "Stationary Combustion", "Biomass",           "tonnes",   61.55),
    ("Scope 1", "Mobile Combustion",     "Diesel",            "litres",   2.68787),
    ("Scope 1", "Mobile Combustion",     "Petrol",            "litres",   2.31440),
    ("Scope 1", "Mobile Combustion",     "LPG",               "litres",   1.55537),
    ("Scope 1", "Mobile Combustion",     "Car (average)",     "km",       0.17145),
    ("Scope 1", "Mobile Combustion",     "Van (average)",     "km",       0.24587),
    ("Scope 1", "Mobile Combustion",     "HGV (average)",     "km",       0.86532),
    ("Scope 1", "Fugitive Emissions",    "Refrigerants",      "kg",       3922.0),
    ("Scope 2", "Purchased Electricity", "Grid Electricity",  "kWh",      0.20707),
    ("Scope 2", "Purchased Electricity", "Renewable Elec.",   "kWh",      0.000),
    ("Scope 2", "Purchased Heat/Steam",  "Heat and Steam",    "kWh",      0.17040),
    ("Scope 3", "Business Travel",       "Air Travel",        "km",       0.25493),
    ("Scope 3", "Business Travel",       "Rail Travel",       "km",       0.03549),
    ("Scope 3", "Business Travel",       "Taxi",              "km",       0.14880),
    ("Scope 3", "Employee Commuting",    "Car (average)",     "km",       0.17145),
    ("Scope 3", "Employee Commuting",    "Cycling/Walking",   "km",       0.000),
    ("Scope 3", "Waste Disposal",        "Landfill",          "tonnes",   586.5),
    ("Scope 3", "Waste Disposal",        "Recycled",          "tonnes",   21.35),
    ("Scope 3", "Transport",             "Road Freight",      "tonne-km", 0.10720),
]


# ── Canvas helper ─────────────────────────────────────────────────────────────

class ReportCanvas:
    """Thin wrapper around ReportLab canvas that tracks current y-position and
    auto-inserts new pages when content would overflow."""

    def __init__(self, buf: io.BytesIO, title: str):
        self.c = canvas.Canvas(buf, pagesize=A4)
        self.c.setTitle(title)
        self.y = MARGIN + 10
        self._pages: List[str] = []   # footer texts per page
        self._footer_text = ""

    # ── Page management ───────────────────────────────────────────────────────

    def new_page(self) -> None:
        self.c.showPage()
        self.y = MARGIN + 10

    def check_space(self, needed: float) -> None:
        """Insert a new page if there isn't enough vertical space."""
        if self.y + needed > PAGE_H - 55:
            self.new_page()

    # ── Drawing primitives ────────────────────────────────────────────────────

    def filled_rect(self, x, y, w, h, fill: colors.Color, stroke: Optional[colors.Color] = None) -> None:
        self.c.setFillColor(fill)
        if stroke:
            self.c.setStrokeColor(stroke)
            self.c.rect(x, PAGE_H - y - h, w, h, fill=1, stroke=1)
        else:
            self.c.rect(x, PAGE_H - y - h, w, h, fill=1, stroke=0)

    def rounded_rect(self, x, y, w, h, r: float,
                     fill: colors.Color, stroke: Optional[colors.Color] = None) -> None:
        self.c.setFillColor(fill)
        if stroke:
            self.c.setStrokeColor(stroke)
            self.c.roundRect(x, PAGE_H - y - h, w, h, r, fill=1, stroke=1)
        else:
            self.c.roundRect(x, PAGE_H - y - h, w, h, r, fill=1, stroke=0)

    def text(self, txt: str, x: float, y: float, size: int = 9,
             bold: bool = False, color: colors.Color = C_DARK,
             align: str = "left") -> None:
        self.c.setFillColor(color)
        self.c.setFontSize(size)
        self.c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        rl_y = PAGE_H - y
        if align == "right":
            self.c.drawRightString(x, rl_y, str(txt))
        elif align == "center":
            self.c.drawCentredString(x, rl_y, str(txt))
        else:
            self.c.drawString(x, rl_y, str(txt))

    def wrap_text(self, txt: str, x: float, y: float, max_w: float,
                  size: int = 9, bold: bool = False,
                  color: colors.Color = C_DARK, line_h: float = 13) -> float:
        """Draw wrapped text; returns updated y after all lines."""
        from reportlab.pdfbase.pdfmetrics import stringWidth
        self.c.setFillColor(color)
        font = "Helvetica-Bold" if bold else "Helvetica"
        self.c.setFont(font, size)
        words = str(txt).split()
        line = ""
        for word in words:
            test = (line + " " + word).strip()
            if stringWidth(test, font, size) <= max_w:
                line = test
            else:
                self.check_space(line_h)
                self.c.drawString(x, PAGE_H - y, line)
                y += line_h
                line = word
        if line:
            self.check_space(line_h)
            self.c.drawString(x, PAGE_H - y, line)
            y += line_h
        return y

    def save(self) -> None:
        self.c.save()


# ── Shared layout blocks ───────────────────────────────────────────────────────

def _add_header(cv: ReportCanvas, report_type: str, title: str,
                period: str, status: str, created_date: str) -> None:
    """Green banner at top of first page."""
    # Banner background
    cv.filled_rect(0, 0, PAGE_W, 110, C_DARK_GREEN)

    # Brand name
    cv.text("NetZeroWorks", MARGIN, 45, size=24, bold=True, color=C_WHITE)

    type_label = {
        "secr": "SECR / GHG Protocol Aligned Report",
        "cbam_declaration": "EU Carbon Border Adjustment Mechanism Declaration",
        "executive_summary": "Executive Carbon Performance & Reduction Summary",
    }.get(report_type, "Carbon Report")

    cv.text(type_label, MARGIN, 63, size=10, color=C_WHITE)
    cv.text(title, MARGIN, 90, size=14, bold=True, color=C_WHITE)

    # Meta row below banner
    y = 130
    cv.text(f"Report Type: {type_label.split(' / ')[0]}", MARGIN, y, size=8, color=C_MID)
    cv.text(f"Period: {period}", PAGE_W - MARGIN, y, size=8, color=C_MID, align="right")
    y += 14
    cv.text(f"Status: {status.upper()}", MARGIN, y, size=8, color=C_MID)
    cv.text(f"Generated: {created_date}", PAGE_W - MARGIN, y, size=8, color=C_MID, align="right")

    cv.y = y + 25


def _add_section_title(cv: ReportCanvas, title: str) -> None:
    cv.check_space(32)
    cv.rounded_rect(MARGIN, cv.y, CONTENT_W, 22, 3, C_GREEN)
    cv.text(title, MARGIN + 8, cv.y + 15, size=10, bold=True, color=C_WHITE)
    cv.y += 30


def _add_table(cv: ReportCanvas, headers: List[str], rows: List[List[str]],
               col_widths: List[float]) -> None:
    from reportlab.pdfbase.pdfmetrics import stringWidth
    ROW_H, HDR_H = 20, 22

    cv.check_space(HDR_H + ROW_H * min(len(rows), 3))

    # Header row
    cv.filled_rect(MARGIN, cv.y, CONTENT_W, HDR_H, C_TBL_HDR)
    x = MARGIN + 6
    for i, h in enumerate(headers):
        cv.text(h, x, cv.y + 15, size=8, bold=True, color=C_WHITE)
        x += col_widths[i]
    cv.y += HDR_H

    # Data rows
    for row_i, row in enumerate(rows):
        cv.check_space(ROW_H)
        if row_i % 2 == 0:
            cv.filled_rect(MARGIN, cv.y, CONTENT_W, ROW_H, C_LIGHT_BG)
        x = MARGIN + 6
        for i, cell in enumerate(row):
            # Truncate if too wide
            font = "Helvetica"
            max_w = col_widths[i] - 10
            s = str(cell)
            while stringWidth(s, font, 8) > max_w and len(s) > 1:
                s = s[:-2] + "…"
            cv.text(s, x, cv.y + 13, size=8, color=C_DARK)
            x += col_widths[i]
        cv.y += ROW_H

    cv.y += 5


def _add_kv_table(cv: ReportCanvas, pairs: List[Tuple[str, str]]) -> None:
    ROW_H = 20
    label_w = CONTENT_W * 0.45
    for i, (label, value) in enumerate(pairs):
        cv.check_space(ROW_H)
        if i % 2 == 0:
            cv.filled_rect(MARGIN, cv.y, CONTENT_W, ROW_H, C_LIGHT_BG)
        cv.text(label, MARGIN + 6, cv.y + 13, size=8, bold=True, color=C_MID)
        cv.text(value, MARGIN + label_w, cv.y + 13, size=8, color=C_DARK)
        cv.y += ROW_H
    cv.y += 5


def _add_footer(cv: ReportCanvas, footer_text: str) -> None:
    """Add page numbers + footer text to every page after saving."""
    # We draw per-page footers by iterating pages before save
    # ReportLab doesn't have a built-in "afterPage" hook on canvas,
    # so we use a two-pass approach: record current page count at end
    total = cv.c.getPageNumber()
    for page_num in range(1, total + 1):
        cv.c.showPage()  # finish current page (resets to new page tracking)

    # Rebuild using a fresh approach — draw footer on current (last) page and re-render
    # For simplicity, we append footer as page marks on save via _finalize
    pass  # handled in _finalize_pdf


def _finalize_pdf(buf: io.BytesIO, footer_text: str) -> bytes:
    """ReportLab low-level canvas doesn't allow retroactive page edits.
    We use a post-processing approach with pdfrw for footer stamping, or
    simply embed footers during rendering (preferred — see _add_page_footer)."""
    return buf.getvalue()


def _draw_page_footer(cv: ReportCanvas, footer_text: str) -> None:
    """Call at end of each page to stamp footer before showPage()."""
    cv.filled_rect(0, PAGE_H - 30, PAGE_W, 30, C_FOOTER_BG)
    cv.text(footer_text, MARGIN, PAGE_H - 12, size=7, color=C_MID)
    # Page number drawn later in multi-page tracking; approximate here
    cv.text("NetZeroWorks Platform", PAGE_W - MARGIN, PAGE_H - 12,
            size=7, color=C_MID, align="right")


def _add_emission_factors_appendix(cv: ReportCanvas, index: str = "") -> None:
    cv.new_page()
    title = f"{index} Emission Factors Appendix" if index else "Emission Factors Appendix"
    _add_section_title(cv, title)

    intro = (
        "To ensure full transparency, below is the list of standard emission factors "
        "used by NetZeroWorks for this reporting period (DEFRA 2024 dataset). These factors "
        "convert raw activity data into tonnes of CO2 equivalent (tCO2e)."
    )
    cv.y = cv.wrap_text(intro, MARGIN, cv.y + 10, CONTENT_W, size=9, color=C_DARK)
    cv.y += 6

    grouped: Dict[str, list] = {}
    for scope, category, source, unit, factor in STANDARD_FACTORS:
        grouped.setdefault(scope, []).append((category, source, unit, factor))

    for scope, factors in grouped.items():
        cv.check_space(25)
        cv.text(scope, MARGIN, cv.y, size=9, bold=True, color=C_DARK)
        cv.y += 14
        for category, source, unit, factor in factors:
            cv.check_space(14)
            line = f"  • {source} ({category}): {factor:.5f} kg CO2e per {unit}"
            cv.text(line, MARGIN + 8, cv.y, size=8, color=C_MID)
            cv.y += 13
        cv.y += 4


# ── SECR Report ───────────────────────────────────────────────────────────────

def _build_secr(cv: ReportCanvas, data: Dict[str, Any], meta: Dict[str, str]) -> None:
    _add_header(cv, "secr", meta["title"], meta["period"], meta["status"], meta["created_date"])

    org = data.get("organization")
    if org:
        _add_section_title(cv, "Organisation Details")
        _add_kv_table(cv, [
            ("Organisation",    org.get("name", "—")),
            ("Industry",        org.get("industry") or "—"),
            ("Country",         org.get("country") or "—"),
            ("Reporting Year",  str(org.get("reporting_year") or "—")),
            ("Base Year",       str(org.get("base_year") or "—")),
            ("Reduction Target",
             f"{org.get('reduction_target_pct')}% per annum"
             if org.get("reduction_target_pct") else "—"),
        ])

    _add_section_title(cv, "Emissions Summary by Scope (GHG Protocol)")
    scope_rows = [
        [s["label"], f"{s['emissions_tco2e']:.2f} tCO2e", s["description"]]
        for s in data.get("scope_breakdown", [])
    ]
    _add_table(cv, ["Scope", "Emissions", "Description"],
               scope_rows, [180, 100, CONTENT_W - 280])

    # Total row
    cv.check_space(20)
    total = data.get("total_emissions_tco2e", 0)
    cv.text(f"Total Gross Emissions: {total:.2f} tCO2e",
            MARGIN + 6, cv.y + 5, size=8, bold=True, color=C_DARK)
    cv.y += 20

    activities = data.get("activities", [])
    if activities:
        _add_section_title(cv, "Detailed Emission Activity Log")
        act_rows = [
            [
                a["activity_name"],
                a["scope"].replace("_", " ").replace("scope ", "Scope "),
                a.get("source") or "—",
                str(a["quantity"]),
                a["unit"],
                f"{a['co2e_tco2e']:.3f}",
            ]
            for a in activities
        ]
        _add_table(cv, ["Activity", "Scope", "Source", "Qty", "Unit", "tCO2e"],
                   act_rows, [130, 70, 100, 60, 60, CONTENT_W - 420])

    cats = data.get("category_breakdown", [])
    if cats:
        _add_section_title(cv, "Category Breakdown")
        cat_rows = [
            [c["category"], f"{c['emissions_tco2e']:.2f}", f"{c['share_pct']:.1f}%"]
            for c in cats
        ]
        _add_table(cv, ["Category", "Emissions (tCO2e)", "Share (%)"],
                   cat_rows, [250, 130, CONTENT_W - 380])

    # Methodology & governance — new page
    cv.new_page()
    _add_section_title(cv, "5. Methodology and Governance")
    org_name = org.get("name", "The Organisation") if org else "The Organisation"
    industry_str = f" within the {org.get('industry')} sector" if org and org.get("industry") else ""
    country_str = org.get("country", "United Kingdom") if org else "United Kingdom"

    methodology = (
        f"Emission calculations are performed by the NetZeroWorks platform using the UK Government "
        f"GHG Conversion Factors for Company Reporting (DEFRA 2024). This report covers "
        f"{org_name}'s operations in {country_str}{industry_str} for the period {meta['period']}. "
        f"NetZeroWorks applies standard GHG Protocol Corporate Accounting and Reporting Standard "
        f"principles. Scope 1 reflects direct combustion of fuels and fugitive emissions. Scope 2 "
        f"reflects location-based emissions from purchased energy. Scope 3 reflects optional "
        f"categories reported by the user. This report applies an Operational Control boundary as "
        f"defined by the GHG Protocol. No independent third-party verification has been performed "
        f"unless explicitly stated."
    )
    cv.y = cv.wrap_text(methodology, MARGIN, cv.y + 10, CONTENT_W, size=9, color=C_DARK, line_h=14)

    _add_emission_factors_appendix(cv, "6.")


# ── CBAM Report ───────────────────────────────────────────────────────────────

def _build_cbam(cv: ReportCanvas, data: Dict[str, Any], meta: Dict[str, str]) -> None:
    _add_header(cv, "cbam_declaration", meta["title"], meta["period"],
                meta["status"], meta["created_date"])

    # Regulatory reference box
    cv.check_space(65)
    cv.rounded_rect(MARGIN, cv.y, CONTENT_W, 55, 4, C_INFO_BOX, C_INFO_BORDER)
    cv.text("Regulatory Reference", MARGIN + 10, cv.y + 16, size=9, bold=True,
            color=colors.HexColor("#1976d2"))
    cv.text("Regulation (EU) 2023/956 — Carbon Border Adjustment Mechanism.",
            MARGIN + 10, cv.y + 30, size=8, color=C_MID)
    cv.text("Covers: cement, iron/steel, aluminium, fertilisers, electricity and hydrogen.",
            MARGIN + 10, cv.y + 42, size=8, color=C_MID)
    cv.y += 70

    _add_section_title(cv, "CBAM Declaration Summary")
    _add_kv_table(cv, [
        ("Total Imports Recorded",      f"{data.get('cbam_import_count', 0)} entries"),
        ("Total Embedded Emissions",    f"{data.get('total_embedded_emissions_tco2e', 0):.2f} tCO2e"),
        ("Total Projected CBAM Charge", f"€{data.get('total_cbam_charge_eur', 0):,.2f}"),
        ("Pending Declarations",
         f"{data.get('pending_declarations', 0)} of {data.get('cbam_import_count', 0)}"),
    ])

    cbam_cats = data.get("cbam_category_breakdown", [])
    if cbam_cats:
        _add_section_title(cv, "Embedded Emissions by Product Category")
        cat_rows = [
            [
                c["category"],
                f"{c['total_qty_tonnes']:.1f}",
                f"{c['embedded_emissions_tco2e']:.2f}",
                f"€{c['cbam_charge_eur']:,.2f}",
            ]
            for c in cbam_cats
        ]
        _add_table(cv, ["Category", "Total Qty (t)", "Embedded (tCO2e)", "CBAM Charge (€)"],
                   cat_rows, [140, 110, 130, CONTENT_W - 380])

    cbam_imports = data.get("cbam_imports", [])
    if cbam_imports:
        _add_section_title(cv, "Full CBAM Import Register")
        imp_rows = [
            [
                i["product_name"],
                i["hscn_code"],
                i["origin_country"],
                i.get("supplier_name") or "—",
                f"{i['quantity_tonnes']:.1f}",
                f"{i['embedded_emissions']:.2f}",
                i["declaration_status"],
            ]
            for i in cbam_imports
        ]
        _add_table(cv,
                   ["Product", "HSCN", "Origin", "Supplier", "Qty (t)", "Embedded tCO2e", "Status"],
                   imp_rows, [95, 65, 65, 75, 50, 90, CONTENT_W - 440])


# ── Executive Summary ──────────────────────────────────────────────────────────

def _build_executive(cv: ReportCanvas, data: Dict[str, Any], meta: Dict[str, str]) -> None:
    _add_header(cv, "executive_summary", meta["title"], meta["period"],
                meta["status"], meta["created_date"])

    # Highlight cards row
    cv.check_space(70)
    scope_bd = {s["scope"]: s for s in data.get("scope_breakdown", [])}
    cards = [
        ("Total Emissions",
         f"{data.get('total_emissions_tco2e', 0):.1f} tCO2e", C_GREEN),
        ("Scope 1 Direct",
         f"{scope_bd.get('scope_1', {}).get('emissions_tco2e', 0):.1f} tCO2e", C_SLATE),
        ("Scope 2 Energy",
         f"{scope_bd.get('scope_2', {}).get('emissions_tco2e', 0):.1f} tCO2e", C_BLUE),
        ("CBAM Liability",
         f"€{data.get('total_cbam_charge_eur', 0):,.0f}", C_ORANGE),
    ]
    card_w = (CONTENT_W - 15) / 4
    for i, (label, value, color) in enumerate(cards):
        x = MARGIN + i * (card_w + 5)
        cv.rounded_rect(x, cv.y, card_w, 55, 4, color)
        cv.text(label, x + 8, cv.y + 18, size=7, color=C_WHITE)
        cv.text(value, x + 8, cv.y + 40, size=12, bold=True, color=C_WHITE)
    cv.y += 70

    _add_section_title(cv, "GHG Footprint Summary")
    total = data.get("total_emissions_tco2e", 0) or 1
    scope_rows = [
        [
            s["label"],
            f"{s['emissions_tco2e']:.2f}",
            f"{s['emissions_tco2e'] / total * 100:.1f}%",
        ]
        for s in data.get("scope_breakdown", [])
    ]
    _add_table(cv, ["GHG Scope", "Emissions (tCO2e)", "% of Total"],
               scope_rows, [200, 150, CONTENT_W - 350])

    cats = data.get("category_breakdown", [])
    if cats:
        _add_section_title(cv, "Emissions by Category")
        cat_rows = [
            [c["category"], f"{c['emissions_tco2e']:.2f}", f"{c['share_pct']:.1f}%"]
            for c in cats
        ]
        _add_table(cv, ["Category", "Emissions (tCO2e)", "Share (%)"],
                   cat_rows, [250, 130, CONTENT_W - 380])

    org = data.get("organization")
    if org and org.get("reduction_target_pct"):
        _add_section_title(cv, "Organisation Reduction Commitment")
        _add_kv_table(cv, [
            ("Organisation",        org.get("name", "—")),
            ("Base Year",           str(org.get("base_year") or "—")),
            ("Annual Reduction Target", f"{org.get('reduction_target_pct')}%"),
        ])

    # AI placeholder — new page
    cv.new_page()
    _add_section_title(cv, "AI Generated Strategic Insights")
    placeholder = (
        "The following section will include AI-generated strategic recommendations "
        "curated by NetZeroWorks AI based on your organisation's carbon profile and "
        "regulatory exposure. Suggestions to reduce the SECR Intensity Ratio, mitigate "
        "CBAM liabilities, and optimize energy procurement will appear here once the "
        "AI Insights module has been run for this reporting period."
    )
    cv.y = cv.wrap_text(placeholder, MARGIN, cv.y + 10, CONTENT_W, size=9, color=C_DARK, line_h=14)

    _add_emission_factors_appendix(cv)


# ── Public entry point ────────────────────────────────────────────────────────

def generate_pdf(
    report_type: str,
    data: Dict[str, Any],
    meta: Dict[str, str],
) -> bytes:
    """
    Generate a PDF for the given report type and aggregation data.

    Args:
        report_type: 'secr' | 'cbam_declaration' | 'executive_summary'
        data: full ReportAggregation dict (from report_service.get_report_aggregation_data)
        meta: dict with keys: title, period, status, created_date

    Returns:
        Raw PDF bytes ready to stream to the client.
    """
    buf = io.BytesIO()
    cv = ReportCanvas(buf, title=meta.get("title", "NetZeroWorks Report"))

    if report_type == "cbam_declaration":
        _build_cbam(cv, data, meta)
    elif report_type == "executive_summary":
        _build_executive(cv, data, meta)
    else:
        _build_secr(cv, data, meta)

    cv.save()
    return buf.getvalue()
