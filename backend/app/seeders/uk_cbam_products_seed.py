"""
UK CBAM Product Seed Data — HMRC Default Emission Intensities

Sectors in scope: Aluminium, Cement, Fertiliser, Hydrogen, Iron & Steel
Values are indicative defaults based on UK CBAM consultation documents (2025).
Indirect emissions excluded (includes_indirect = False) until 2029.

Format: (commodity_code, description, sector, product_type, default_intensity, valid_from, notes)
"""

from datetime import date

UK_CBAM_PRODUCTS = [
    # ─── Aluminium ──────────────────────────────────────────────────
    ("7601.10.00", "Unwrought aluminium, not alloyed", "aluminium", "simple", 8.600, date(2027, 1, 1),
     "Primary aluminium — direct emissions only"),
    ("7601.20.00", "Unwrought aluminium alloys", "aluminium", "complex", 8.600, date(2027, 1, 1),
     "Aluminium alloys — direct emissions only"),
    ("7604.10.00", "Aluminium bars, rods and profiles, not alloyed", "aluminium", "complex", 8.8500, date(2027, 1, 1),
     None),
    ("7604.29.00", "Aluminium alloy profiles", "aluminium", "complex", 8.8500, date(2027, 1, 1),
     None),
    ("7605.11.00", "Aluminium wire, not alloyed, max cross-section > 7mm", "aluminium", "complex", 8.9000, date(2027, 1, 1),
     None),
    ("7606.11.00", "Aluminium plates/sheets, not alloyed, rectangular", "aluminium", "complex", 9.0100, date(2027, 1, 1),
     None),
    ("7607.11.00", "Aluminium foil, not backed, rolled, thickness ≤ 0.2mm", "aluminium", "complex", 9.1500, date(2027, 1, 1),
     None),

    # ─── Cement ─────────────────────────────────────────────────────
    ("2523.10.00", "Cement clinkers", "cement", "simple", 0.8400, date(2027, 1, 1),
     "Portland cement clinker — primary precursor"),
    ("2523.21.00", "White Portland cement", "cement", "complex", 0.6200, date(2027, 1, 1),
     None),
    ("2523.29.00", "Grey Portland cement", "cement", "complex", 0.6200, date(2027, 1, 1),
     None),
    ("2523.30.00", "Aluminous cement", "cement", "complex", 0.7700, date(2027, 1, 1),
     None),
    ("2523.90.00", "Other hydraulic cements", "cement", "complex", 0.5500, date(2027, 1, 1),
     "Blended / composite cements — lower default intensity"),

    # ─── Fertiliser ─────────────────────────────────────────────────
    ("2808.00.00", "Nitric acid; sulphonitric acids", "fertiliser", "simple", 2.6900, date(2027, 1, 1),
     "Key precursor for nitrogen fertilisers"),
    ("2814.10.00", "Anhydrous ammonia", "fertiliser", "simple", 2.4040, date(2027, 1, 1),
     "Ammonia — Haber-Bosch process default"),
    ("3102.10.00", "Urea", "fertiliser", "complex", 1.5700, date(2027, 1, 1),
     None),
    ("3102.30.00", "Ammonium nitrate", "fertiliser", "complex", 3.6400, date(2027, 1, 1),
     "Higher default due to N₂O process emissions"),
    ("3105.20.00", "NPK fertilisers", "fertiliser", "complex", 2.1000, date(2027, 1, 1),
     "Mixed fertiliser — weighted default"),
    ("3105.30.00", "Diammonium hydrogenorthophosphate (DAP)", "fertiliser", "complex", 1.8500, date(2027, 1, 1),
     None),

    # ─── Hydrogen ───────────────────────────────────────────────────
    ("2804.10.00", "Hydrogen", "hydrogen", "simple", 11.8940, date(2027, 1, 1),
     "Grey hydrogen (SMR) default — highest CBAM sector intensity"),

    # ─── Iron & Steel ───────────────────────────────────────────────
    ("7201.10.00", "Non-alloy pig iron, Mn < 0.5%", "steel", "simple", 1.5100, date(2027, 1, 1),
     "Blast furnace pig iron"),
    ("7201.20.00", "Non-alloy pig iron, Mn ≥ 0.5%", "steel", "simple", 1.5100, date(2027, 1, 1),
     None),
    ("7202.11.00", "Ferro-manganese, C > 2%", "steel", "simple", 2.6500, date(2027, 1, 1),
     None),
    ("7203.10.00", "Direct reduced iron (DRI/sponge iron)", "steel", "simple", 1.3300, date(2027, 1, 1),
     None),
    ("7206.10.00", "Iron ingots", "steel", "simple", 1.3200, date(2027, 1, 1),
     None),
    ("7207.11.00", "Semi-finished products, rectangular cross-section, C < 0.25%", "steel", "complex", 1.8600, date(2027, 1, 1),
     None),
    ("7208.10.00", "Hot-rolled flat products, in coils, patterns in relief", "steel", "complex", 1.8600, date(2027, 1, 1),
     None),
    ("7209.15.00", "Cold-rolled flat products, thickness ≥ 3mm", "steel", "complex", 2.1300, date(2027, 1, 1),
     None),
    ("7210.11.00", "Tin-plated flat products, thickness ≥ 0.5mm", "steel", "complex", 2.3700, date(2027, 1, 1),
     None),
    ("7213.10.00", "Bars/rods, hot-rolled, with indentations/ribs (rebar)", "steel", "complex", 1.8600, date(2027, 1, 1),
     "Reinforcing steel bar"),
    ("7214.10.00", "Forged bars/rods of iron or non-alloy steel", "steel", "complex", 2.0500, date(2027, 1, 1),
     None),
    ("7216.10.00", "U/I/H sections, hot-rolled, height < 80mm", "steel", "complex", 1.8600, date(2027, 1, 1),
     "Structural steel sections"),
    ("7218.10.00", "Stainless steel ingots/semi-finished", "steel", "complex", 2.8900, date(2027, 1, 1),
     None),
    ("7219.11.00", "Stainless steel hot-rolled flat, coils, thickness > 10mm", "steel", "complex", 3.0200, date(2027, 1, 1),
     None),
    ("7222.11.00", "Stainless steel bars/rods, hot-rolled, circular cross-section", "steel", "complex", 3.1000, date(2027, 1, 1),
     None),
    ("7225.11.00", "Grain-oriented electrical steel, flat-rolled", "steel", "complex", 2.9500, date(2027, 1, 1),
     None),
    ("7228.10.00", "Bars/rods of high-speed steel", "steel", "complex", 3.2000, date(2027, 1, 1),
     None),
    ("7301.10.00", "Sheet piling of iron or steel", "steel", "complex", 1.9800, date(2027, 1, 1),
     None),
    ("7302.10.00", "Rails for railway/tramway track", "steel", "complex", 1.8600, date(2027, 1, 1),
     None),
    ("7304.11.00", "Line pipe, seamless, stainless steel", "steel", "complex", 3.2500, date(2027, 1, 1),
     None),
    ("7306.30.00", "Tubes/pipes, welded, circular cross-section, iron/non-alloy steel", "steel", "complex", 2.2000, date(2027, 1, 1),
     None),
    ("7318.15.00", "Bolts/screws with hexagonal head", "steel", "complex", 2.5000, date(2027, 1, 1),
     "Fasteners — downstream steel product"),
]
