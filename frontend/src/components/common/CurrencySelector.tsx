import React from 'react';
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencySymbol } from '../../utils/currency';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  className?: string;
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  className = '',
  label = 'Currency',
  showLabel = true,
  disabled = false
}) => {
  return (
    <div className={className}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} - {currency.name} ({currency.code})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;



