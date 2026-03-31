/** Format a number as EUR currency */
export function formatEur(value: number): string {
  return `€${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format tCO2e with fixed decimal */
export function formatEmissions(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)} tCO₂e`;
}

/** Format a date string to locale date */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB');
}
