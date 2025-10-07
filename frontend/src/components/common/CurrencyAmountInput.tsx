import React, { useState, useEffect } from 'react';
import CurrencySelector from './CurrencySelector';
import { CURRENCIES, convertToUGX, formatCurrency, formatOriginalCurrency } from '../../utils/currency';

interface CurrencyAmountInputProps {
  amount: number;
  currency: string;
  onAmountChange: (amount: number) => void;
  onCurrencyChange: (currency: string) => void;
  className?: string;
  label?: string;
  showUGXEquivalent?: boolean;
  disabled?: boolean;
  min?: number;
  step?: number;
}

const CurrencyAmountInput: React.FC<CurrencyAmountInputProps> = ({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  className = '',
  label = 'Amount',
  showUGXEquivalent = true,
  disabled = false,
  min = 0,
  step = 0.01
}) => {
  const [ugxEquivalent, setUgxEquivalent] = useState<number>(0);

  useEffect(() => {
    if (amount > 0) {
      const ugx = convertToUGX(amount, currency);
      setUgxEquivalent(ugx);
    } else {
      setUgxEquivalent(0);
    }
  }, [amount, currency]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onAmountChange(value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Amount Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            type="number"
            value={amount || ''}
            onChange={handleAmountChange}
            disabled={disabled}
            min={min}
            step={step}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0.00"
          />
        </div>

        {/* Currency Selector */}
        <div>
          <CurrencySelector
            value={currency}
            onChange={onCurrencyChange}
            label="Currency"
            disabled={disabled}
          />
        </div>
      </div>

      {/* UGX Equivalent Display */}
      {showUGXEquivalent && amount > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
          <div className="flex justify-between items-center">
            <span>Original Amount:</span>
            <span className="font-medium">
              {formatOriginalCurrency(amount, currency)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>UGX Equivalent:</span>
            <span className="font-bold text-green-600">
              {formatCurrency(ugxEquivalent)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyAmountInput;



