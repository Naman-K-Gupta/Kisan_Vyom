/**
 * Standard utility formatters for agricultural financial and volumetric metrics.
 * Follows Government of India APMC standards and the Indian Numbering System.
 */

/**
 * Formats a monetary amount into the Indian currency format (e.g. ₹1,24,500).
 *
 * @param amount - The numerical value in Indian Rupees (INR)
 * @param includeDecimals - Whether to show paise decimals (default: false)
 * @returns Formatted currency string with the Rupee symbol
 */
export function formatCurrency(amount?: number | null, includeDecimals = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  return formatter.format(amount);
}

/**
 * Formats produce weights in Metric Quintals or Kilograms.
 * By APMC convention: 1 Quintal (Qtl) = 100 Kilograms (kg).
 *
 * @param weightInKg - Produce weight in Kilograms
 * @param preferQuintals - When true, outputs quintals for weights >= 100kg
 * @returns Clean, formatted string e.g. "45.50 Qtl" or "85 kg"
 */
export function formatWeight(weightInKg?: number | null, preferQuintals = true): string {
  if (weightInKg === undefined || weightInKg === null || isNaN(weightInKg)) {
    return '0 kg';
  }

  if (preferQuintals && Math.abs(weightInKg) >= 100) {
    const qtl = weightInKg / 100;
    return `${qtl.toFixed(2)} Qtl`;
  }

  return `${Math.round(weightInKg)} kg`;
}

/**
 * Formats timestamps into human-readable regional date strings.
 *
 * @param date - Date object, ISO string, or timestamp
 * @param options - Optional standard Intl formatting options
 * @returns Formatted localized date string
 */
export function formatDate(
  date?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };

  return d.toLocaleDateString('en-IN', defaultOptions);
}

/**
 * Masks an Aadhaar or Bank Account Number for privacy while preserving end digits for verification.
 * e.g. "123456789012" -> "•••• •••• 9012"
 */
export function maskSensitiveId(identifier?: string | null, unmaskedTailLength = 4): string {
  if (!identifier) return '';
  const clean = identifier.replace(/\s+/g, '');
  if (clean.length <= unmaskedTailLength) return clean;

  const tail = clean.slice(-unmaskedTailLength);
  const maskedPrefix = '•'.repeat(Math.min(clean.length - unmaskedTailLength, 8));
  return `${maskedPrefix} ${tail}`;
}

/**
 * Converts a currency amount to Indian English Words.
 * e.g. 91000 -> "Rupees Ninety-One Thousand Only"
 */
export function numberToWordsINR(num?: number | null): string {
  if (!num || isNaN(num) || num <= 0) return 'Rupees Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  const intNum = Math.floor(num);
  const crore = Math.floor(intNum / 10000000);
  const lakh = Math.floor((intNum % 10000000) / 100000);
  const thousand = Math.floor((intNum % 100000) / 1000);
  const hundred = Math.floor((intNum % 1000) / 100);
  const rest = intNum % 100;

  const parts: string[] = [];
  if (crore) parts.push(inWords(crore) + ' Crore');
  if (lakh) parts.push(inWords(lakh) + ' Lakh');
  if (thousand) parts.push(inWords(thousand) + ' Thousand');
  if (hundred) parts.push(inWords(hundred) + ' Hundred');
  if (rest) parts.push(inWords(rest));

  return 'Rupees ' + (parts.join(' ') || 'Zero') + ' Only';
}

