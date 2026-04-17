
import * as XLSX from 'xlsx';
import type { ReportAggregation } from '@/types/report';

interface ExportMeta {
  title: string;
  type: string;
  period: string;
}



function arrayToCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (val: string | number) => {
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach(row => lines.push(row.map(escape).join(',')));
  return lines.join('\n');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: ReportAggregation, meta: ExportMeta) {
  const sheets: string[] = [];

  
  const emHeaders = ['Scope', 'Emissions (tCO2e)', 'Description'];
  const emRows = data.scope_breakdown.map(s => [s.label, s.emissions_tco2e, s.description] as (string | number)[]);
  emRows.push(['TOTAL', data.total_emissions_tco2e, '']);
  sheets.push(`--- Emissions Summary ---\n${arrayToCSV(emHeaders, emRows)}`);

  
  if (data.category_breakdown.length > 0) {
    const catHeaders = ['Category', 'Emissions (tCO2e)', 'Share (%)'];
    const catRows = data.category_breakdown.map(c => [c.category, c.emissions_tco2e, c.share_pct] as (string | number)[]);
    sheets.push(`\n--- Category Breakdown ---\n${arrayToCSV(catHeaders, catRows)}`);
  }

  
  if (data.activities.length > 0) {
    const actHeaders = ['Activity', 'Scope', 'Source', 'Quantity', 'Unit', 'tCO2e', 'Date'];
    const actRows = data.activities.map(a => [
      a.activity_name, a.scope, a.source || '', a.quantity, a.unit, a.co2e_tco2e, a.activity_date || '',
    ] as (string | number)[]);
    sheets.push(`\n--- Activity Log ---\n${arrayToCSV(actHeaders, actRows)}`);
  }

  
  if (data.cbam_imports.length > 0) {
    const cbamHeaders = ['Product', 'HSCN', 'Origin', 'Supplier', 'Qty (t)', 'Embedded (tCO2e)', 'Charge (€)', 'Status'];
    const cbamRows = data.cbam_imports.map(i => [
      i.product_name, i.hscn_code, i.origin_country, i.supplier_name || '',
      i.quantity_tonnes, i.embedded_emissions, i.cbam_charge_eur, i.declaration_status,
    ] as (string | number)[]);
    sheets.push(`\n--- CBAM Imports ---\n${arrayToCSV(cbamHeaders, cbamRows)}`);
  }

  const csvContent = sheets.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${meta.title.replace(/\s+/g, '_')}_${meta.period}.csv`);
}



export function exportToXLS(data: ReportAggregation, meta: ExportMeta) {
  const wb = XLSX.utils.book_new();

  
  const summaryData: (string | number)[][] = [
    ['Report Title', meta.title],
    ['Report Type', meta.type],
    ['Period', meta.period],
    ['Total Emissions (tCO2e)', data.total_emissions_tco2e],
    ['Total CBAM Charge (€)', data.total_cbam_charge_eur],
    [],
    ['--- Scope Breakdown ---'],
    ['Scope', 'Emissions (tCO2e)', 'Description'],
    ...data.scope_breakdown.map(s => [s.label, s.emissions_tco2e, s.description]),
    ['TOTAL', data.total_emissions_tco2e, ''],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  
  if (data.category_breakdown.length > 0) {
    const catData = [
      ['Category', 'Emissions (tCO2e)', 'Share (%)'],
      ...data.category_breakdown.map(c => [c.category, c.emissions_tco2e, c.share_pct]),
    ];
    const wsCat = XLSX.utils.aoa_to_sheet(catData);
    wsCat['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Categories');
  }

  
  if (data.activities.length > 0) {
    const actData = [
      ['Activity', 'Scope', 'Source', 'Quantity', 'Unit', 'tCO2e', 'Date'],
      ...data.activities.map(a => [
        a.activity_name, a.scope, a.source || '', a.quantity, a.unit, a.co2e_tco2e, a.activity_date || '',
      ]),
    ];
    const wsAct = XLSX.utils.aoa_to_sheet(actData);
    wsAct['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsAct, 'Activities');
  }

  
  if (data.cbam_imports.length > 0) {
    const cbamData = [
      ['Product', 'HSCN Code', 'Origin', 'Supplier', 'Qty (tonnes)', 'Embedded (tCO2e)', 'CBAM Charge (€)', 'Status'],
      ...data.cbam_imports.map(i => [
        i.product_name, i.hscn_code, i.origin_country, i.supplier_name || '',
        i.quantity_tonnes, i.embedded_emissions, i.cbam_charge_eur, i.declaration_status,
      ]),
    ];
    const wsCbam = XLSX.utils.aoa_to_sheet(cbamData);
    wsCbam['!cols'] = [{ wch: 25 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCbam, 'CBAM Imports');
  }

  
  if (data.cbam_category_breakdown.length > 0) {
    const cbamCatData = [
      ['Category', 'Total Qty (t)', 'Embedded Emissions (tCO2e)', 'CBAM Charge (€)'],
      ...data.cbam_category_breakdown.map(c => [
        c.category, c.total_qty_tonnes, c.embedded_emissions_tco2e, c.cbam_charge_eur,
      ]),
    ];
    const wsCbamCat = XLSX.utils.aoa_to_sheet(cbamCatData);
    wsCbamCat['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 25 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsCbamCat, 'CBAM Categories');
  }

  XLSX.writeFile(wb, `${meta.title.replace(/\s+/g, '_')}_${meta.period}.xlsx`);
}
