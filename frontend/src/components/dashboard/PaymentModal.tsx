import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle, TrendingUp, FileText, Heart, Star, Trophy, Gift, Sparkles, Calendar } from 'lucide-react';

interface PaymentModalProps {
  student: any;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ student, onClose }) => {
  const [celebrationEmojis, setCelebrationEmojis] = useState<string[]>([]);
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const handleClose = () => {
    onClose();
  };

  // Calculate payment progress and generate encouraging messages
  useEffect(() => {
    const totalRequired = feeBreakdown.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    const paidAmount = Number(student.paidAmount) || 0;
    const progress = totalRequired > 0 ? (paidAmount / totalRequired) * 100 : 0;
    setPaymentProgress(progress);

    // Generate encouraging messages based on payment progress
    if (progress === 0) {
      setEncouragementMessage("🌟 Every journey begins with a single step! You're about to make a wonderful investment in your child's future!");
      setCelebrationEmojis(['🌟', '💪', '🚀', '✨']);
    } else if (progress < 25) {
      setEncouragementMessage("🎯 Great start! You're building momentum. Every payment brings your child closer to their dreams!");
      setCelebrationEmojis(['🎯', '💪', '⭐', '🌟']);
    } else if (progress < 50) {
      setEncouragementMessage("🔥 Amazing progress! You're halfway there! Your dedication is truly inspiring!");
      setCelebrationEmojis(['🔥', '💪', '⭐', '🎉', '🌟']);
    } else if (progress < 75) {
      setEncouragementMessage("🚀 You're on fire! Almost there! Your child is so lucky to have such a committed parent!");
      setCelebrationEmojis(['🚀', '💪', '⭐', '🎉', '🌟', '💎']);
    } else if (progress < 100) {
      setEncouragementMessage("💎 So close to the finish line! You're an incredible parent! Just one more push!");
      setCelebrationEmojis(['💎', '💪', '⭐', '🎉', '🌟', '🏆', '💝']);
    } else {
      setEncouragementMessage("🏆 CONGRATULATIONS! You've completed all payments! Your child's education is fully secured!");
      setCelebrationEmojis(['🏆', '🎉', '🌟', '💎', '💝', '🎊', '✨', '⭐', '💪', '🚀']);
    }
  }, [student.paidAmount, student.class, feeBreakdown]);

  // Animate celebration emojis
  useEffect(() => {
    if (celebrationEmojis.length > 0) {
      const interval = setInterval(() => {
        setCelebrationEmojis(prev => {
          const newEmojis = [...prev];
          // Add random emoji animation
          const randomEmoji = ['🎉', '🌟', '⭐', '💎', '💝', '🎊', '✨', '💪', '🚀', '🏆'][Math.floor(Math.random() * 10)];
          newEmojis.push(randomEmoji);
          return newEmojis.slice(-8); // Keep only last 8 emojis
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [celebrationEmojis.length]);

  // Fetch fee breakdown from database - use payment summary API
  const [feeBreakdown, setFeeBreakdown] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchFeeBreakdown = async () => {
      try {
        console.log('🔍 Fetching payment summary for student:', student.id, 'Term:', selectedTerm, 'Year:', selectedYear);
        const response = await fetch(`http://localhost:5000/api/payments/summary/${student.id}?term=${selectedTerm}&year=${selectedYear}`);
        if (response.ok) {
          const paymentData = await response.json();
          console.log('📊 Payment summary from API:', paymentData);
          
          // Convert payment breakdown to fee breakdown format
          const breakdown = paymentData.paymentBreakdown?.map((item: any) => ({
            name: item.billingType,
            amount: item.required,
            frequency: item.frequency,
            term: item.term,
            year: item.year
          })) || [];
          
          setFeeBreakdown(breakdown);
          console.log('✅ Fee breakdown set:', breakdown);
        } else {
          console.error('❌ Failed to fetch payment summary:', response.status);
          setFeeBreakdown([]);
        }
      } catch (error) {
        console.error('❌ Error fetching payment summary:', error);
        setFeeBreakdown([]);
      }
    };
    
    if (student?.id) {
      fetchFeeBreakdown();
    }
  }, [student?.id, selectedTerm, selectedYear]);
  
  const totalRequired = feeBreakdown.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  const paidAmount = Number(student.paidAmount) || 0;
  const balance = Math.max(0, totalRequired - paidAmount);

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
      style={{ willChange: 'auto' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-gradient-to-br from-white/95 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
              <h2 className="text-2xl font-black">Payment Details for {student.name}</h2>
            </div>
            <div 
              onClick={handleClose}
              className="h-10 w-10 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm cursor-pointer"
            >
              <X className="h-5 w-5 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
        
        {/* Term & Year Filter */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">Filter by Term & Year:</span>
            </div>
            <div className="flex items-center space-x-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Currently viewing: <span className="font-semibold text-blue-600">{selectedTerm} {selectedYear}</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Encouragement Message */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-800 leading-relaxed">
                  {encouragementMessage}
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                {celebrationEmojis.map((emoji, index) => (
                  <span 
                    key={index} 
                    className="text-2xl animate-bounce"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Payment Progress</span>
                <span className="text-sm font-bold text-gray-800">{Math.round(paymentProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${
                    paymentProgress === 100 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : paymentProgress >= 75 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                        : paymentProgress >= 50
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          : 'bg-gradient-to-r from-red-500 to-pink-500'
                  }`}
                  style={{ width: `${paymentProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">{student.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-gray-900">{student.name}</h3>
              <p className="text-sm font-medium text-gray-600">{student.class} - {student.stream}</p>
              <p className="text-xs text-gray-500">Access: {student.accessNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-600">Balance</p>
              <p className={`text-2xl font-black ${balance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                UGX {balance.toLocaleString()}
              </p>
              {balance <= 0 && (
                <div className="flex items-center justify-center mt-2">
                  <span className="text-2xl animate-pulse">🎉</span>
                  <span className="text-xs font-bold text-green-600 ml-1">FULLY PAID!</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Original Fees Panel */}
            <div className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-black text-purple-800">Original Fees</h4>
              </div>
              <div className="space-y-3">
                {feeBreakdown.length > 0 ? (
                  feeBreakdown.map((fee, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-purple-100">
                  <div className="flex justify-between items-start">
                    <div>
                          <p className="font-bold text-purple-800 capitalize">{fee.name}</p>
                          <p className="text-xs text-purple-600">{fee.frequency} • {fee.term} {fee.year}</p>
                        </div>
                        <span className="font-black text-purple-800">UGX {Number(fee.amount).toLocaleString()}</span>
                    </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-purple-600 py-4">
                    <p>No fee structure found for this class</p>
                    <p className="text-xs">Please contact the school administration</p>
                  </div>
                )}
                
                <div className="border-t border-purple-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-black text-purple-800">Total Required:</span>
                    <span className="font-black text-purple-800">UGX {totalRequired.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Already Paid Panel */}
            <div className="bg-gradient-to-br from-green-50/80 to-green-100/80 backdrop-blur-sm rounded-2xl border border-green-200/50 shadow-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-black text-green-800">Already Paid</h4>
              </div>
              <div className="space-y-3">
                {paidAmount > 0 ? (
                  feeBreakdown.map((fee, index) => {
                    const paidForThisFee = Math.min(paidAmount, Number(fee.amount));
                    return (
                      <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-100">
                  <div className="flex justify-between items-start">
                    <div>
                            <p className="font-bold text-green-800 capitalize">{fee.name}</p>
                            <p className="text-xs text-green-600">UGX {paidForThisFee.toLocaleString()} Paid</p>
                    </div>
                          <span className="font-black text-green-800">UGX {paidForThisFee.toLocaleString()}</span>
                  </div>
                </div>
                    );
                  })
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-100">
                    <div className="text-center text-green-600">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <span className="text-2xl">🌟</span>
                        <span className="text-2xl">💪</span>
                        <span className="text-2xl">🚀</span>
                      </div>
                      <p className="font-semibold">Ready to start your payment journey!</p>
                      <p className="text-xs text-green-500 mt-1">Every payment counts towards your child's future</p>
                    </div>
                  </div>
                )}
                
                <div className="border-t border-green-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-black text-green-800">Total Paid:</span>
                    <span className="font-black text-green-800">UGX {paidAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Remaining Balance Panel */}
            <div className="bg-gradient-to-br from-orange-50/80 to-orange-100/80 backdrop-blur-sm rounded-2xl border border-orange-200/50 shadow-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-black text-orange-800">Remaining Balance</h4>
              </div>
              <div className="space-y-3">
                {feeBreakdown.length > 0 ? (
                  feeBreakdown.map((fee, index) => {
                    const remainingForThisFee = Math.max(0, Number(fee.amount) - Math.min(paidAmount, Number(fee.amount)));
                  return (
                      <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                            <p className="font-bold text-orange-800 capitalize">{fee.name}</p>
                          <p className="text-xs text-orange-600">UGX {remainingForThisFee.toLocaleString()} Remaining</p>
                    </div>
                          <button className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors font-bold flex items-center space-x-1">
                            <span>💪</span>
                            <span>Pay UGX {remainingForThisFee.toLocaleString()}</span>
                    </button>
                  </div>
                    </div>
                  );
                  })
                ) : (
                  <div className="text-center text-orange-600 py-4">
                    <p>No fee structure found for this class</p>
                    <p className="text-xs">Please contact the school administration</p>
                  </div>
                )}
                
                <div className="border-t border-orange-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-black text-orange-800">Total Remaining:</span>
                    <span className="font-black text-orange-800">UGX {balance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 backdrop-blur-sm rounded-b-3xl">
          {balance <= 0 ? (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-3xl animate-bounce">🏆</span>
                <span className="text-3xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</span>
                <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🌟</span>
                <span className="text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>💎</span>
                <span className="text-3xl animate-bounce" style={{ animationDelay: '0.4s' }}>🎊</span>
              </div>
              <p className="text-lg font-bold text-green-600 mb-2">🎊 CONGRATULATIONS! 🎊</p>
              <p className="text-sm text-gray-600">All payments completed! Your child's education is fully secured!</p>
            </div>
          ) : (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">💪</span>
                <span className="text-2xl">🌟</span>
                <span className="text-2xl">🚀</span>
              </div>
              <p className="text-sm text-gray-600">Keep up the great work! Every payment brings you closer to your goal!</p>
            </div>
          )}
          
          <div 
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 px-6 rounded-2xl font-bold transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
