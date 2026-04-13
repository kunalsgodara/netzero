"""
UK ETS Quarterly Average Prices — Seed Data

Prices are in GBP (£) per tCO₂e.
These are placeholder values based on recent UK ETS auction/trading data.
In production, these should be fetched from the UK ETS market data feed.

NOTE: UK ETS is a SEPARATE market to EU ETS. Never use EU ETS prices here.
"""

UK_ETS_PRICES = [
    # (quarter, price_gbp, source)
    ("2026-Q1", 36.75, "UK ETS Auction — ICE Futures Europe"),
    ("2026-Q2", 39.20, "UK ETS Auction — ICE Futures Europe"),
    ("2026-Q3", 42.50, "UK ETS Auction — ICE Futures Europe"),
    ("2026-Q4", 45.10, "UK ETS Auction — ICE Futures Europe"),
    ("2027-Q1", 47.85, "UK ETS Auction — ICE Futures Europe (provisional)"),
]
