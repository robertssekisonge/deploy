import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useNotification } from '../common/NotificationProvider';

const API_BASE_URL = '/api';

const SecretaryFeeBalances: React.FC = () => {
  const { findStudentByAccessNumber } = useData();
  const { showError } = useNotification();
  const [accessNumber, setAccessNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [student, setStudent] = useState<any | null>(null);

  const search = async () => {
    setSummary(null);
    const s = findStudentByAccessNumber(accessNumber);
    if (!s) {
      showError('Student Not Found', `No student with access number ${accessNumber}`);
      return;
    }
    setStudent(s);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payments/summary/${s.id}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      } else {
        showError('Failed', 'Could not load payment summary');
      }
    } catch (_e) {
      showError('Network Error', 'Could not reach payments API');
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to search
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void search();
    }
  };

  const PaidUnpaidRow: React.FC<{ label: string; paid: number; remaining: number; required: number }>= ({ label, paid, remaining, required }) => (
    <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-100">
      <div className="col-span-4 text-sm text-gray-800">{label}</div>
      <div className="col-span-2 text-sm text-blue-700">UGX {required.toLocaleString()}</div>
      <div className="col-span-3 text-sm text-green-700">Paid: UGX {Number(paid||0).toLocaleString()}</div>
      <div className="col-span-3 text-sm text-red-700">Unpaid: UGX {Number(remaining||0).toLocaleString()}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Fee Balances (View Only)</h1>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              value={accessNumber}
              onChange={(e) => setAccessNumber(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Enter Access Number (e.g., AA02)"
              className="w-full rounded-xl border-2 border-purple-200/60 focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-purple-50/30 px-4 py-3 text-gray-800 font-medium"
            />
            {accessNumber && (
              <button
                onClick={() => { setAccessNumber(''); setSummary(null); setStudent(null); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={search}
            disabled={loading || !accessNumber}
            className="inline-flex items-center px-4 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </button>
        </div>
      </div>

      {student && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-purple-600">Student</div>
              <div className="font-semibold text-purple-900">{student.name}</div>
            </div>
            <div>
              <div className="text-xs text-purple-600">Access</div>
              <div className="font-semibold text-purple-900">{student.accessNumber}</div>
            </div>
            <div>
              <div className="text-xs text-purple-600">Class</div>
              <div className="font-semibold text-purple-900">{student.class}</div>
            </div>
            <div>
              <div className="text-xs text-purple-600">Stream</div>
              <div className="font-semibold text-purple-900">{student.stream}</div>
            </div>
          </div>

          {loading && <div className="text-center text-gray-500">Loading summary…</div>}

          {!loading && summary && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-purple-700">Total Required</div>
                  <div className="text-2xl font-bold text-purple-800">UGX {(Number(summary.totalFeesRequired||0)).toLocaleString()}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-green-700">Total Paid</div>
                  <div className="text-2xl font-bold text-green-800">UGX {(Number(summary.totalPaid||0)).toLocaleString()}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-red-700">Balance</div>
                  <div className="text-2xl font-bold text-red-800">UGX {(Number(summary.balance||0)).toLocaleString()}</div>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600 border-b"> 
                  <div className="col-span-4">Fee Type</div>
                  <div className="col-span-2">Required</div>
                  <div className="col-span-3">Paid</div>
                  <div className="col-span-3">Unpaid</div>
                </div>
                <div className="px-4">
                  {Array.isArray(summary.paymentBreakdown) && summary.paymentBreakdown.length > 0 ? (
                    summary.paymentBreakdown.map((it: any, idx: number) => (
                      <PaidUnpaidRow
                        key={idx}
                        label={it.billingType || it.name}
                        required={Number(it.required||0)}
                        paid={Number(it.paid||0)}
                        remaining={Number(it.remaining||0)}
                      />
                    ))
                  ) : (
                    <div className="py-6 text-center text-gray-500">No fee items configured for this class</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SecretaryFeeBalances;










