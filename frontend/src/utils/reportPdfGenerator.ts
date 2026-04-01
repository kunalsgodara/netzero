/**
 * PDF Report Generator using jsPDF.
 * Generates styled PDFs matching the reference templates for SECR, CBAM, and Executive reports.
 */
import jsPDF from 'jspdf';
import type { ReportAggregation } from '@/types/report';

// Colour palette (matching reference PDFs)
const GREEN = [46, 125, 50] as const;       // #2e7d32 — section headers
const DARK_GREEN = [27, 94, 32] as const;   // #1b5e20 — header banner
const WHITE = [255, 255, 255] as const;
const DARK = [20, 30, 40] as const;
const MID = [80, 95, 110] as const;
const LIGHT_BG = [240, 244, 248] as const;  // zebra stripe
const TABLE_HEADER_BG = [46, 125, 50] as const;
const INFO_BOX = [227, 242, 253] as const;  // light blue regulatory box
const INFO_BORDER = [100, 181, 246] as const;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Standard GHG Protocol / DEFRA 2024 Factors (Comprehensive list for Appendix)
const STANDARD_FACTORS = [
  { scope: 'Scope 1', category: 'Stationary Combustion', source: 'Natural Gas', unit: 'kWh', factor: 0.18293 },
  { scope: 'Scope 1', category: 'Stationary Combustion', source: 'Diesel', unit: 'litres', factor: 2.68787 },
  { scope: 'Scope 1', category: 'Stationary Combustion', source: 'Petrol', unit: 'litres', factor: 2.31440 },
  { scope: 'Scope 1', category: 'Stationary Combustion', source: 'Coal', unit: 'tonnes', factor: 2883.71 },
  { scope: 'Scope 1', category: 'Stationary Combustion', source: 'LPG', unit: 'litres', factor: 1.55537 },
  { scope: 'Scope 1', category: 'Stationary Combustion', source: 'Biomass', unit: 'tonnes', factor: 61.55 },
  { scope: 'Scope 1', category: 'Mobile Combustion', source: 'Diesel', unit: 'litres', factor: 2.68787 },
  { scope: 'Scope 1', category: 'Mobile Combustion', source: 'Petrol', unit: 'litres', factor: 2.31440 },
  { scope: 'Scope 1', category: 'Mobile Combustion', source: 'LPG', unit: 'litres', factor: 1.55537 },
  { scope: 'Scope 1', category: 'Mobile Combustion', source: 'Car (average)', unit: 'km', factor: 0.17145 },
  { scope: 'Scope 1', category: 'Mobile Combustion', source: 'Van (average)', unit: 'km', factor: 0.24587 },
  { scope: 'Scope 1', category: 'Mobile Combustion', source: 'HGV (average)', unit: 'km', factor: 0.86532 },
  { scope: 'Scope 1', category: 'Fugitive Emissions', source: 'Refrigerants', unit: 'kg', factor: 3922.0 },
  { scope: 'Scope 2', category: 'Purchased Electricity', source: 'Grid Electricity', unit: 'kWh', factor: 0.20707 },
  { scope: 'Scope 2', category: 'Purchased Electricity', source: 'Renewable Electricity', unit: 'kWh', factor: 0.000 },
  { scope: 'Scope 2', category: 'Purchased Heat/Steam', source: 'Heat and Steam', unit: 'kWh', factor: 0.17040 },
  { scope: 'Scope 3', category: 'Business Travel', source: 'Air Travel', unit: 'km', factor: 0.25493 },
  { scope: 'Scope 3', category: 'Business Travel', source: 'Rail Travel', unit: 'km', factor: 0.03549 },
  { scope: 'Scope 3', category: 'Business Travel', source: 'Taxi', unit: 'km', factor: 0.14880 },
  { scope: 'Scope 3', category: 'Employee Commuting', source: 'Car (average)', unit: 'km', factor: 0.17145 },
  { scope: 'Scope 3', category: 'Employee Commuting', source: 'Cycling/Walking', unit: 'km', factor: 0.000 },
  { scope: 'Scope 3', category: 'Waste Disposal', source: 'Landfill', unit: 'tonnes', factor: 586.5 },
  { scope: 'Scope 3', category: 'Waste Disposal', source: 'Recycled', unit: 'tonnes', factor: 21.35 },
  { scope: 'Scope 3', category: 'Transport', source: 'Road Freight', unit: 'tonne-km', factor: 0.10720 },
];

interface ReportMeta {
  title: string;
  type: string;
  period: string;
  status: string;
  createdDate: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function initDoc(): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  
  // Monkey-patch text generation to sanitize unsupported subscript fonts 
  const originalText = doc.text.bind(doc);
  // @ts-ignore
  doc.text = function(text: any, x: any, y: any, options?: any) {
    const sanitize = (s: string) => s.replace(/₂/g, '2').replace(/₃/g, '3');
    if (typeof text === 'string') {
      text = sanitize(text);
    } else if (Array.isArray(text)) {
      text = text.map(t => typeof t === 'string' ? sanitize(t) : t);
    }
    return originalText(text, x, y, options);
  };
  
  return doc;
}

function addPage(doc: jsPDF) {
  doc.addPage();
  return MARGIN + 10;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - 50) {
    return addPage(doc);
  }
  return y;
}

function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (typeof text !== 'string') text = String(text);
  if (doc.getTextWidth(text) <= maxWidth) return text;
  
  let start = 0;
  let end = text.length;
  while (start <= end) {
    let mid = Math.floor((start + end) / 2);
    if (doc.getTextWidth(text.substring(0, mid) + '…') <= maxWidth) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  return text.substring(0, end) + '…';
}

function addHeader(doc: jsPDF, meta: ReportMeta): number {
  // Green banner
  doc.setFillColor(...DARK_GREEN);
  doc.rect(0, 0, PAGE_W, 110, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('NetZeroWorks', MARGIN, 45);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const typeLabel =
    meta.type === 'secr' ? 'SECR / GHG Protocol Aligned Report' :
    meta.type === 'cbam_declaration' ? 'EU Carbon Border Adjustment Mechanism Declaration' :
    'Executive Carbon Performance & Reduction Summary';
  doc.text(typeLabel, MARGIN, 63);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(meta.title, MARGIN, 90);

  // Meta info below banner
  let y = 130;
  doc.setTextColor(...MID);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text(`Report Type: ${typeLabel.split(' / ')[0]}`, MARGIN, y);
  doc.text(`Period: ${meta.period}`, PAGE_W - MARGIN, y, { align: 'right' });
  y += 14;
  doc.text(`Status: ${meta.status.toUpperCase()}`, MARGIN, y);
  doc.text(`Generated: ${meta.createdDate}`, PAGE_W - MARGIN, y, { align: 'right' });

  return y + 25;
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  y = checkPageBreak(doc, y, 30);
  doc.setFillColor(...GREEN);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 8, y + 15);
  return y + 30;
}

function addTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  y: number,
): number {
  const ROW_H = 20;
  const HDR_H = 22;

  y = checkPageBreak(doc, y, HDR_H + ROW_H * Math.min(rows.length, 3));

  // Header row
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(MARGIN, y, CONTENT_W, HDR_H, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let xPos = MARGIN + 6;
  headers.forEach((h, i) => {
    doc.text(h, xPos, y + 14);
    xPos += colWidths[i];
  });
  y += HDR_H;

  // Data rows
  doc.setFont('helvetica', 'normal');
  rows.forEach((row, rowIdx) => {
    y = checkPageBreak(doc, y, ROW_H);
    // Zebra stripe
    if (rowIdx % 2 === 0) {
      doc.setFillColor(...LIGHT_BG);
      doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'F');
    }
    doc.setTextColor(...DARK);
    doc.setFontSize(8);

    xPos = MARGIN + 6;
    row.forEach((cell, i) => {
      const maxW = colWidths[i] - 8;
      const text = truncateText(doc, String(cell), maxW);
      doc.text(text, xPos, y + 13);
      xPos += colWidths[i];
    });
    y += ROW_H;
  });

  return y + 5;
}

function addKeyValueTable(doc: jsPDF, data: [string, string][], y: number): number {
  const ROW_H = 20;
  const labelW = CONTENT_W * 0.45;
  const valW = CONTENT_W * 0.55;

  data.forEach((pair, idx) => {
    y = checkPageBreak(doc, y, ROW_H);
    if (idx % 2 === 0) {
      doc.setFillColor(...LIGHT_BG);
      doc.rect(MARGIN, y, CONTENT_W, ROW_H, 'F');
    }
    doc.setTextColor(...MID);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(truncateText(doc, String(pair[0]), labelW - 10), MARGIN + 6, y + 13);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    doc.text(truncateText(doc, String(pair[1]), valW - 10), MARGIN + labelW, y + 13);
    y += ROW_H;
  });
  return y + 5;
}

function addFooter(doc: jsPDF, footerText: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(230, 235, 240);
    doc.rect(0, PAGE_H - 30, PAGE_W, 30, 'F');
    doc.setTextColor(...MID);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(footerText, MARGIN, PAGE_H - 12);
    doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN - 40, PAGE_H - 12);
  }
}

function addEmissionFactorsAppendix(doc: jsPDF, y: number, indexNumber: string = ''): number {
  const title = indexNumber ? `${indexNumber} Emission Factors Appendix` : 'Emission Factors Appendix';
  y = addPage(doc);
  y = addSectionTitle(doc, title, y);
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  y += 10;
  
  const appendixIntro = `To ensure full transparency, below is a list of all standard emission factors supported by NetZeroWorks for this reporting period (DEFRA 2024 dataset). These factors are used to convert raw activity data into tonnes of carbon dioxide equivalent (tCO2e).\n\n`;
  const splitIntro = doc.splitTextToSize(appendixIntro, CONTENT_W);
  doc.text(splitIntro, MARGIN, y);
  y += splitIntro.length * 12;

  // Group factors for display
  const grouped = STANDARD_FACTORS.reduce((acc, f) => {
    if (!acc[f.scope]) acc[f.scope] = [];
    acc[f.scope].push(f);
    return acc;
  }, {} as Record<string, typeof STANDARD_FACTORS>);

  Object.entries(grouped).forEach(([scope, factors]) => {
    y = checkPageBreak(doc, y, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(scope, MARGIN, y);
    y += 15;
    doc.setFont('helvetica', 'normal');
    
    factors.forEach(f => {
      y = checkPageBreak(doc, y, 15);
      const line = `• ${f.source} (${f.category}): ${f.factor.toFixed(5)} kg CO2e per ${f.unit}`;
      doc.text(line, MARGIN + 10, y);
      y += 15;
    });
    y += 5;
  });
  return y;
}

// ─── SECR Report ────────────────────────────────────────────────────────────

export function generateSECRPdf(data: ReportAggregation, meta: ReportMeta) {
  const doc = initDoc();
  let y = addHeader(doc, meta);

  // Organisation Details
  if (data.organization) {
    const org = data.organization;
    y = addSectionTitle(doc, 'Organisation Details', y);
    y = addKeyValueTable(doc, [
      ['Organisation', org.name],
      ['Industry', org.industry || '—'],
      ['Country', org.country || '—'],
      ['Reporting Year', String(org.reporting_year || '—')],
      ['Base Year', String(org.base_year || '—')],
      ['Reduction Target', org.reduction_target_pct ? `${org.reduction_target_pct}% per annum` : '—'],
    ], y);
  }

  // Emissions Summary by Scope
  y = addSectionTitle(doc, 'Emissions Summary by Scope (GHG Protocol)', y);
  const scopeHeaders = ['Scope', 'Emissions', 'Description'];
  const scopeWidths = [180, 100, CONTENT_W - 280];
  const scopeRows = data.scope_breakdown.map(s => [
    s.label, `${s.emissions_tco2e.toFixed(2)} tCO2e`, s.description,
  ]);
  const totalRow = ['Total Gross Emissions', `${data.total_emissions_tco2e.toFixed(2)} tCO2e`, ''];
  y = addTable(doc, scopeHeaders, scopeRows, scopeWidths, y);

  // Total row
  y = checkPageBreak(doc, y, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Total Gross Emissions', MARGIN + 6, y + 5);
  doc.text(`${data.total_emissions_tco2e.toFixed(2)} tCO2e`, MARGIN + 186, y + 5);
  y += 20;

  // Detailed Activity Log
  if (data.activities.length > 0) {
    y = addSectionTitle(doc, 'Detailed Emission Activity Log', y);
    const actHeaders = ['Activity', 'Scope', 'Source', 'Qty', 'Unit', 'tCO2e'];
    const actWidths = [130, 70, 100, 60, 60, CONTENT_W - 420];
    const actRows = data.activities.map(a => [
      a.activity_name, a.scope.replace('_', ' ').replace('scope ', 'Scope '),
      a.source || '—', String(a.quantity), a.unit, a.co2e_tco2e.toFixed(3),
    ]);
    y = addTable(doc, actHeaders, actRows, actWidths, y);
  }

  // Category Breakdown
  if (data.category_breakdown.length > 0) {
    y = addSectionTitle(doc, 'Category Breakdown', y);
    const catHeaders = ['Category', 'Emissions (t CO2e)', 'Share (%)'];
    const catWidths = [250, 130, CONTENT_W - 380];
    const catRows = data.category_breakdown.map(c => [
      c.category, c.emissions_tco2e.toFixed(2), `${c.share_pct.toFixed(1)}%`,
    ]);
    y = addTable(doc, catHeaders, catRows, catWidths, y);
  }

  // --- Methodology & Governance ---
  y = addPage(doc);
  y = addSectionTitle(doc, '5. Methodology and Governance', y);
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  y += 10;
  
  const orgName = data.organization?.name || 'The Organisation';
  const industry = data.organization?.industry ? ` within the ${data.organization.industry} sector` : '';
  const country = data.organization?.country || 'United Kingdom';

  const methodologyText = `Emission calculations are performed by the NetZeroWorks platform using the UK Government GHG Conversion Factors for Company Reporting (DEFRA 2024). This report covers ${orgName}'s operations in ${country}${industry} for the period ${meta.period}.\n\nCalculation Methodology: NetZeroWorks applies standard GHG Protocol Corporate Accounting and Reporting Standard principles. Scope 1 reflects direct combustion of fuels and fugitive emissions. Scope 2 reflects location-based emissions from purchased energy. Scope 3 reflects optional categories reported by the user to provide transparency into the value chain.\n\nBoundary & Control: This report applies an "Operational Control" boundary as defined by the GHG Protocol. NetZeroWorks ensures that all data points are mapped to the correct conversion factors based on the activity type, unit of measure, and reporting year.\n\nData Quality and Assurance: NetZeroWorks performs automated validation of inputs to ensure unit consistency. The final tCO2e values represent the best estimate based on the raw data verified by ${orgName}'s directors or authorised representatives. No independent third-party verification has been performed unless explicitly stated.`;

  const splitMeth = doc.splitTextToSize(methodologyText, CONTENT_W);
  doc.text(splitMeth, MARGIN, y);
  y += splitMeth.length * 15;

  // --- Emission Factors Appendix ---
  y = addEmissionFactorsAppendix(doc, y, '6.');

  addFooter(doc, 'Prepared by NetZeroWorks · SECR / DEFRA aligned · Confidential');
  doc.save(`${meta.title.replace(/\s+/g, '_')}_SECR.pdf`);
}

// ─── CBAM Report ────────────────────────────────────────────────────────────

export function generateCBAMPdf(data: ReportAggregation, meta: ReportMeta) {
  const doc = initDoc();
  let y = addHeader(doc, meta);

  // Regulatory Reference box
  y = checkPageBreak(doc, y, 60);
  doc.setFillColor(...INFO_BOX);
  doc.setDrawColor(...INFO_BORDER);
  doc.roundedRect(MARGIN, y, CONTENT_W, 50, 4, 4, 'FD');
  doc.setTextColor(25, 118, 210);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Regulatory Reference', MARGIN + 10, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MID);
  doc.setFontSize(8);
  doc.text(
    'Regulation (EU) 2023/956 – Carbon Border Adjustment Mechanism. Declarants must report embedded emissions',
    MARGIN + 10, y + 30
  );
  doc.text(
    'in imported goods for cement, iron/steel, aluminium, fertilisers, electricity and hydrogen.',
    MARGIN + 10, y + 42
  );
  y += 65;

  // CBAM Declaration Summary
  y = addSectionTitle(doc, 'CBAM Declaration Summary', y);
  y = addKeyValueTable(doc, [
    ['Total Imports Recorded', `${data.cbam_import_count} entries`],
    ['Total Embedded Emissions', `${data.total_embedded_emissions_tco2e.toFixed(2)} tCO2e`],
    ['Total Projected CBAM Charge', `€${data.total_cbam_charge_eur.toLocaleString()}`],
    ['Pending Declarations', `${data.pending_declarations} of ${data.cbam_import_count}`],
  ], y);

  // Embedded Emissions by Category
  if (data.cbam_category_breakdown.length > 0) {
    y = addSectionTitle(doc, 'Embedded Emissions by Product Category', y);
    const catHeaders = ['Category', 'Total Qty (t)', 'Embedded (tCO2e)', 'CBAM Charge (€)'];
    const catWidths = [140, 110, 130, CONTENT_W - 380];
    const catRows = data.cbam_category_breakdown.map(c => [
      c.category, c.total_qty_tonnes.toFixed(1),
      c.embedded_emissions_tco2e.toFixed(2), c.cbam_charge_eur.toLocaleString(),
    ]);
    y = addTable(doc, catHeaders, catRows, catWidths, y);
  }

  // Full Import Register
  if (data.cbam_imports.length > 0) {
    y = addSectionTitle(doc, 'Full CBAM Import Register', y);
    const impHeaders = ['Product', 'HSCN', 'Origin', 'Supplier', 'Qty (t)', 'Embedded tCO2e', 'Status'];
    const impWidths = [95, 65, 60, 75, 50, 85, CONTENT_W - 430];
    const impRows = data.cbam_imports.map(i => [
      i.product_name, i.hscn_code, i.origin_country,
      i.supplier_name || '—', i.quantity_tonnes.toFixed(1),
      i.embedded_emissions.toFixed(2), i.declaration_status,
    ]);
    y = addTable(doc, impHeaders, impRows, impWidths, y);
  }

  addFooter(doc, 'EU CBAM Declaration · NetZeroWorks · Confidential');
  doc.save(`${meta.title.replace(/\s+/g, '_')}_CBAM.pdf`);
}

// ─── Executive Summary ──────────────────────────────────────────────────────

export function generateExecutivePdf(data: ReportAggregation, meta: ReportMeta) {
  const doc = initDoc();
  let y = addHeader(doc, meta);

  // Summary highlight cards
  y = checkPageBreak(doc, y, 70);
  const cardData = [
    { label: 'Total Emissions', value: `${data.total_emissions_tco2e.toFixed(1)} tCO2e`, color: GREEN },
    { label: 'Scope 1 Direct', value: `${(data.scope_breakdown.find(s => s.scope === 'scope_1')?.emissions_tco2e || 0).toFixed(1)} tCO2e`, color: [75, 85, 99] as const },
    { label: 'Scope 2 Energy', value: `${(data.scope_breakdown.find(s => s.scope === 'scope_2')?.emissions_tco2e || 0).toFixed(1)} tCO2e`, color: [37, 99, 235] as const },
    { label: 'CBAM Liability', value: `€${data.total_cbam_charge_eur.toLocaleString()}`, color: [234, 88, 12] as const },
  ];
  const cardW = (CONTENT_W - 15) / 4;
  cardData.forEach((card, i) => {
    const x = MARGIN + i * (cardW + 5);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, y, cardW, 55, 4, 4, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + 8, y + 18);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 8, y + 40);
  });
  y += 70;

  // GHG Footprint Summary
  y = addSectionTitle(doc, 'GHG Footprint Summary', y);
  const scopeHeaders = ['GHG Scope', 'Emissions (tCO2e)', '% of Total'];
  const scopeWidths = [200, 150, CONTENT_W - 350];
  const total = data.total_emissions_tco2e || 1;
  const scopeRows = data.scope_breakdown.map(s => [
    s.label,
    s.emissions_tco2e.toFixed(2),
    `${(s.emissions_tco2e / total * 100).toFixed(1)}%`,
  ]);
  y = addTable(doc, scopeHeaders, scopeRows, scopeWidths, y);

  // Category Breakdown
  if (data.category_breakdown.length > 0) {
    y = addSectionTitle(doc, 'Emissions by Category', y);
    const catHeaders = ['Category', 'Emissions (t CO2e)', 'Share (%)'];
    const catWidths = [250, 130, CONTENT_W - 380];
    const catRows = data.category_breakdown.map(c => [
      c.category, c.emissions_tco2e.toFixed(2), `${c.share_pct.toFixed(1)}%`,
    ]);
    y = addTable(doc, catHeaders, catRows, catWidths, y);
  }

  // Organisation Reduction Commitment
  if (data.organization?.reduction_target_pct) {
    y = addSectionTitle(doc, 'Organisation Reduction Commitment', y);
    y = addKeyValueTable(doc, [
      ['Organisation', data.organization.name],
      ['Base Year', String(data.organization.base_year || '—')],
      ['Annual Reduction Target', `${data.organization.reduction_target_pct}%`],
    ], y);
  }

  // --- AI Strategic Recommendations ---
  y = addPage(doc);
  y = addSectionTitle(doc, 'AI Generated Strategic Insights', y);
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  y += 10;
  
  const aiIntro = `The following insights and strategic recommendations are curated by NetZeroWorks AI based on your organization's carbon profile and regulatory exposure.\n\n[ AI Recommendations Module Pending Integration ]\n\nCurated suggestions to reduce the SECR Intensity Ratio, mitigate CBAM liabilities, and optimize energy procurement will dynamically appear here once enabled. Information such as shifting material sourcing or investing in specific renewable initiatives will be powered by AI analysis rather than hardcoded metrics.`;
  const splitAi = doc.splitTextToSize(aiIntro, CONTENT_W);
  doc.text(splitAi, MARGIN, y);
  y += splitAi.length * 15;

  // --- Emission Factors Appendix ---
  y = addEmissionFactorsAppendix(doc, y);

  addFooter(doc, 'AI-enhanced Executive Summary · NetZeroWorks · Confidential');
  doc.save(`${meta.title.replace(/\s+/g, '_')}_Executive.pdf`);
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

export function generateReportPdf(
  reportType: string,
  data: ReportAggregation,
  meta: ReportMeta,
) {
  switch (reportType) {
    case 'secr':
      return generateSECRPdf(data, meta);
    case 'cbam_declaration':
      return generateCBAMPdf(data, meta);
    case 'executive_summary':
      return generateExecutivePdf(data, meta);
    default:
      return generateSECRPdf(data, meta);
  }
}
