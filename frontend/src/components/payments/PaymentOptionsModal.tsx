import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Banknote, Calendar, Clock, DollarSign } from 'lucide-react';
import CurrencyAmountInput from '../common/CurrencyAmountInput';
import { DEFAULT_CURRENCY, createFinancialRecordData } from '../../utils/currency';

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentItem: {
    type: string;
    amount: number;
    studentName: string;
    className?: string;
    term?: string;
    year?: string;
  };
  onProcessPayment: (paymentData: any) => void;
}

const PaymentOptionsModal: React.FC<PaymentOptionsModalProps> = ({
  isOpen,
  onClose,
  paymentItem,
  onProcessPayment
}) => {
  const [paymentMethod, setPaymentMethod] = useState('mobile-money');
  const [paymentAmount, setPaymentAmount] = useState(paymentItem.amount);
  const [paymentCurrency, setPaymentCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [paymentReference] = useState(`PAY${Date.now()}`);
  const [currentDateTime, setCurrentDateTime] = useState({
    date: '',
    time: ''
  });

  // Update current date and time only once when modal opens
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentDateTime({ date, time });
    };

    if (isOpen) {
      updateDateTime();
    }
  }, [isOpen]);

  const paymentMethods = [
    { value: 'mobile-money', label: 'Mobile Money', icon: Smartphone },
    { value: 'bank-transfer', label: 'Bank Transfer', icon: Banknote },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'cash', label: 'Cash', icon: DollarSign },
  ];

  const handleProcessPayment = () => {
    // Update timestamp at the moment of payment processing
    const now = new Date();
    const paymentData = {
      studentName: paymentItem.studentName,
      paymentType: paymentItem.type,
      amount: paymentAmount,
      method: paymentMethod,
      reference: paymentReference,
      className: paymentItem.className,
      term: paymentItem.term,
      year: paymentItem.year,
      timestamp: now.toISOString(),
      currentDate: now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      currentTime: now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
    };

    onProcessPayment(paymentData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4" style={{ willChange: 'auto' }}>
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 backdrop-blur-xl rounded-xl p-4 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-700/50 transform transition-all duration-300 scale-100" style={{ willChange: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                💳 Process Payment
              </h2>
              <p className="text-xs text-gray-400">Complete payment for {paymentItem.studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-gradient-to-r from-red-600/20 to-pink-600/20 hover:from-red-600/30 hover:to-pink-600/30 rounded-lg flex items-center justify-center transition-all duration-200 group border border-red-500/30"
          >
            <X className="h-3 w-3 text-red-400 group-hover:text-red-300" />
          </button>
        </div>

        {/* Payment Item */}
        <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-gray-600/60 rounded-lg p-3 mb-3 shadow-lg backdrop-blur-sm">
          <div className="text-xs text-blue-400 font-medium mb-1">💰 Paying for</div>
          <div className="text-sm font-bold text-gray-200 mb-1">{paymentItem.type}</div>
          <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">UGX {paymentAmount.toLocaleString()}</div>
          {paymentItem.className && (
            <div className="text-xs text-gray-400">
              {paymentItem.className} • {paymentItem.term} {paymentItem.year}
            </div>
          )}
        </div>

        {/* Current Date & Time */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-gray-600/60 rounded-lg p-2 shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-1 mb-1">
              <Calendar className="h-3 w-3 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400">Date</span>
            </div>
            <div className="text-xs font-bold text-gray-200">{currentDateTime.date}</div>
          </div>
          <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-gray-600/60 rounded-lg p-2 shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-1 mb-1">
              <Clock className="h-3 w-3 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400">Time</span>
            </div>
            <div className="text-xs font-bold text-gray-200">{currentDateTime.time}</div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-2"></div>
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-gray-600 shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-200/20 bg-gray-800/80 backdrop-blur-sm transition-all duration-200 text-xs py-2 px-3 text-gray-200 font-medium"
          >
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              return (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Payment Amount */}
        <div className="mb-3">
          <CurrencyAmountInput
            amount={paymentAmount}
            currency={paymentCurrency}
            onAmountChange={setPaymentAmount}
            onCurrencyChange={setPaymentCurrency}
            label="Payment Amount"
            showUGXEquivalent={true}
            className="text-gray-200"
          />
          <div className="text-xs text-gray-400 mt-1">
            Max: UGX {paymentItem.amount.toLocaleString()}
          </div>
        </div>

        {/* Payment Reference */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-2"></div>
            Payment Reference
          </label>
          <div className="w-full rounded-lg border border-gray-600 shadow-sm bg-gray-800/80 backdrop-blur-sm text-xs py-2 px-3 text-gray-300 font-mono">
            {paymentReference}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 text-gray-200 px-3 py-2 rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-200 font-semibold text-xs shadow-lg hover:shadow-xl border border-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessPayment}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-semibold text-xs shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Process Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsModal;
