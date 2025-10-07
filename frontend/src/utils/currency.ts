// Currency conversion utilities
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number; // Rate to UGX
}

export const CURRENCIES: Currency[] = [
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX', exchangeRate: 1.0 },
  { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 3700.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 4000.0 },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 4600.0 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', exchangeRate: 25.0 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', exchangeRate: 1.6 },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', exchangeRate: 3.0 },
];

export const DEFAULT_CURRENCY = 'UGX';
export const DISPLAY_CURRENCY = 'UGX'; // Always display in UGX on dashboards

/**
 * Convert amount from one currency to UGX
 */
export function convertToUGX(amount: number, fromCurrency: string): number {
  if (fromCurrency === 'UGX') return amount;
  
  const currency = CURRENCIES.find(c => c.code === fromCurrency);
  if (!currency) {
    console.warn(`Unknown currency: ${fromCurrency}, treating as UGX`);
    return amount;
  }
  
  return amount * currency.exchangeRate;
}

/**
 * Convert amount from UGX to another currency
 */
export function convertFromUGX(amount: number, toCurrency: string): number {
  if (toCurrency === 'UGX') return amount;
  
  const currency = CURRENCIES.find(c => c.code === toCurrency);
  if (!currency) {
    console.warn(`Unknown currency: ${toCurrency}, treating as UGX`);
    return amount;
  }
  
  return amount / currency.exchangeRate;
}

/**
 * Format amount for display (always in UGX)
 */
export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return showSymbol ? `UGX ${formatted}` : formatted;
}

/**
 * Format amount with original currency for entry forms
 */
export function formatOriginalCurrency(amount: number, currency: string, showSymbol: boolean = true): string {
  const currencyInfo = CURRENCIES.find(c => c.code === currency);
  const symbol = currencyInfo?.symbol || currency;
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return showSymbol ? `${symbol} ${formatted}` : formatted;
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  const currency = getCurrencyInfo(code);
  return currency?.symbol || code;
}

/**
 * Validate currency code
 */
export function isValidCurrency(code: string): boolean {
  return CURRENCIES.some(c => c.code === code);
}

/**
 * Calculate exchange rate between two currencies
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1.0;
  
  const from = CURRENCIES.find(c => c.code === fromCurrency);
  const to = CURRENCIES.find(c => c.code === toCurrency);
  
  if (!from || !to) return 1.0;
  
  // Convert from -> UGX -> to
  return from.exchangeRate / to.exchangeRate;
}

/**
 * Create financial record data with currency conversion
 */
export function createFinancialRecordData(
  originalAmount: number,
  originalCurrency: string,
  additionalData: Record<string, any> = {}
) {
  const ugxAmount = convertToUGX(originalAmount, originalCurrency);
  const exchangeRate = getExchangeRate(originalCurrency, 'UGX');
  
  return {
    ...additionalData,
    amount: ugxAmount, // Always store in UGX
    originalAmount,
    originalCurrency,
    exchangeRate,
  };
}

/**
 * Parse financial record for display
 */
export function parseFinancialRecord(record: any) {
  return {
    ...record,
    displayAmount: formatCurrency(record.amount),
    originalDisplayAmount: formatOriginalCurrency(
      record.originalAmount || record.amount,
      record.originalCurrency || 'UGX'
    ),
  };
}



