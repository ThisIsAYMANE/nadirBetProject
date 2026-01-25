/**
 * Odds conversion utilities
 */

/**
 * Convert American odds to decimal odds
 * @param americanOdds - American odds (e.g., -150, +200)
 * @returns Decimal odds (e.g., 1.67, 3.00)
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Convert decimal odds to American odds
 * @param decimalOdds - Decimal odds (e.g., 1.67, 3.00)
 * @returns American odds (e.g., -150, +200)
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return (decimalOdds - 1) * 100;
  } else {
    return -100 / (decimalOdds - 1);
  }
}

/**
 * Detect if odds are in American format
 * @param odds - Odds value
 * @returns true if likely American format
 */
export function isAmericanFormat(odds: number): boolean {
  // American odds are typically > 100 or < -100
  return Math.abs(odds) >= 100 || (odds < 0 && odds > -100);
}

/**
 * Normalize odds to decimal format
 * @param odds - Odds in any format
 * @returns Decimal odds
 */
export function normalizeToDecimal(odds: number): number {
  if (isAmericanFormat(odds)) {
    return americanToDecimal(odds);
  }
  return odds; // Already decimal
}

/**
 * Format odds for display
 * @param odds - Odds value
 * @param format - 'decimal' | 'american' | 'auto'
 * @returns Formatted odds string
 */
export function formatOdds(odds: number, format: 'decimal' | 'american' | 'auto' = 'auto'): string {
  if (format === 'auto') {
    format = isAmericanFormat(odds) ? 'american' : 'decimal';
  }

  if (format === 'american') {
    const american = isAmericanFormat(odds) ? odds : decimalToAmerican(odds);
    return american > 0 ? `+${american}` : `${american}`;
  }

  // Decimal format
  const decimal = normalizeToDecimal(odds);
  return decimal.toFixed(2);
}
