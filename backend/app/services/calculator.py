"""
UK CBAM Calculator — Pure functions implementing Section 4.3 formula logic.

All calculations follow the exact specification:
  1. Fetch product → emissions_intensity_default
  2. Fetch UK ETS rate → uk_ets_rate_used (snapshot)
  3. Determine intensity based on data_source
  4. Handle returned_goods / outward_processing special rules
  5. embedded_emissions = quantity_tonnes × intensity
  6. deduction_tco2e = carbon_price_deduction_gbp / uk_ets_rate_used
  7. net_emissions = max(0, embedded_emissions − deduction_tco2e)
  8. cbam_liability_gbp = net_emissions × uk_ets_rate_used
  9. ALWAYS compute cbam_liability_default_gbp (using default intensity)
  10. potential_saving_gbp = cbam_liability_default_gbp − cbam_liability_gbp
"""

from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass
from typing import Optional


@dataclass
class CalculationResult:
    """Immutable result object from the UK CBAM calculation engine."""
    emissions_intensity_default: Decimal
    uk_ets_rate_used: Decimal
    embedded_emissions_tco2e: Decimal
    cbam_liability_gbp: Decimal
    cbam_liability_default_gbp: Decimal
    potential_saving_gbp: Decimal
    is_threshold_exempt: bool
    exemption_reason: Optional[str]


def _quantize(value: Decimal, places: int = 4) -> Decimal:
    """Round to given decimal places using banker's rounding."""
    fmt = Decimal(10) ** -places
    return value.quantize(fmt, rounding=ROUND_HALF_UP)


def calculate_cbam_liability(
    quantity_tonnes: Decimal,
    data_source: str,
    import_type: str,
    emissions_intensity_default: Decimal,
    emissions_intensity_actual: Optional[Decimal],
    carbon_price_deduction_gbp: Decimal,
    uk_ets_rate: Decimal,
) -> CalculationResult:
    """
    Core UK CBAM liability calculator — implements Section 4.3 exactly.

    Args:
        quantity_tonnes: Mass of imported goods (tonnes)
        data_source: "default" | "actual_unverified" | "actual_verified"
        import_type: "standard" | "outward_processing" | "returned_goods"
        emissions_intensity_default: HMRC default tCO2e/tonne from uk_cbam_products
        emissions_intensity_actual: Supplier-provided intensity (may be None)
        carbon_price_deduction_gbp: Explicit carbon price already paid (£)
        uk_ets_rate: Current UK ETS quarterly rate (£/tCO2e) — snapshotted

    Returns:
        CalculationResult with all computed fields
    """

    # ── Step 4: returned_goods → liability = 0, exempt ──────────
    if import_type == "returned_goods":
        # Default liability still computed for reference
        default_embedded = _quantize(quantity_tonnes * emissions_intensity_default)
        default_liability = _quantize(default_embedded * uk_ets_rate, 2)
        return CalculationResult(
            emissions_intensity_default=emissions_intensity_default,
            uk_ets_rate_used=uk_ets_rate,
            embedded_emissions_tco2e=Decimal("0"),
            cbam_liability_gbp=Decimal("0"),
            cbam_liability_default_gbp=default_liability,
            potential_saving_gbp=default_liability,
            is_threshold_exempt=True,
            exemption_reason="Returned goods — re-imported within 3 years, unaltered. Exempt per UK CBAM regulations.",
        )

    # ── Step 3: determine intensity ─────────────────────────────
    if data_source in ("actual_unverified", "actual_verified") and emissions_intensity_actual is not None:
        intensity = emissions_intensity_actual
    else:
        intensity = emissions_intensity_default

    # ── Step 5: embedded emissions ──────────────────────────────
    embedded_emissions = _quantize(quantity_tonnes * intensity)

    # ── Step 6: deduction in tCO2e ──────────────────────────────
    if uk_ets_rate > 0 and carbon_price_deduction_gbp > 0:
        deduction_tco2e = _quantize(carbon_price_deduction_gbp / uk_ets_rate)
    else:
        deduction_tco2e = Decimal("0")

    # ── Step 7: net emissions ───────────────────────────────────
    net_emissions = max(Decimal("0"), embedded_emissions - deduction_tco2e)

    # ── Step 8: CBAM liability ──────────────────────────────────
    cbam_liability = _quantize(net_emissions * uk_ets_rate, 2)

    # ── Step 9: ALWAYS compute default liability ────────────────
    default_embedded = _quantize(quantity_tonnes * emissions_intensity_default)
    default_net = max(Decimal("0"), default_embedded - deduction_tco2e)
    cbam_liability_default = _quantize(default_net * uk_ets_rate, 2)

    # ── Step 10: potential saving ───────────────────────────────
    potential_saving = _quantize(cbam_liability_default - cbam_liability, 2)

    return CalculationResult(
        emissions_intensity_default=emissions_intensity_default,
        uk_ets_rate_used=uk_ets_rate,
        embedded_emissions_tco2e=embedded_emissions,
        cbam_liability_gbp=cbam_liability,
        cbam_liability_default_gbp=cbam_liability_default,
        potential_saving_gbp=potential_saving,
        is_threshold_exempt=False,
        exemption_reason=None,
    )
