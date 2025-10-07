import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Building2,
  Banknote,
  Wheat,
  Stethoscope,
  Calculator,
  RefreshCw,
  Eye,
  Printer
} from 'lucide-react';

interface FinancialStatement {
  id: number;
  statementType: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  generatedBy: string;
  generatedAt: string;
  status: string;
}

interface StatementBreakdown {
  schoolFunding: number;
  foundationFunding: number;
  farmIncome: number;
  clinicIncome: number;
}

const FinancialStatementGeneration: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [statements, setStatements] = useState<FinancialStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<FinancialStatement | null>(null);
  const [statementBreakdown, setStatementBreakdown] = useState<StatementBreakdown | null>(null);

  const [formData, setFormData] = useState({
    statementType: 'monthly',
    period: ''
  });

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      const response = await fetch('/api/cfo/financial-statements');
      if (response.ok) {
        const data = await response.json();
        setStatements(data);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      showAINotification('❌ Failed to fetch financial statements', 3000);
    } finally {
      setLoading(false);
    }
  };

  const generateStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await fetch('/api/cfo/financial-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          generatedBy: user?.name || 'Unknown'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showAINotification('✅ Financial statement generated successfully!', 3000);
        setShowModal(false);
        setFormData({ statementType: 'monthly', period: '' });
        fetchStatements();
        
        // Show breakdown if available
        if (result.statement) {
          setStatementBreakdown(result.statement.breakdown);
        }
      } else {
        showAINotification('❌ Failed to generate financial statement', 3000);
      }
    } catch (error) {
      console.error('Error generating statement:', error);
      showAINotification('❌ Error generating financial statement', 3000);
    } finally {
      setGenerating(false);
    }
  };

  const viewStatement = async (statement: FinancialStatement) => {
    setSelectedStatement(statement);
    // In a real implementation, you might fetch detailed breakdown here
    showAINotification('📊 Statement details loaded', 2000);
  };

  const exportStatement = (statement: FinancialStatement) => {
    // In a real implementation, this would generate a PDF or Excel file
    showAINotification('📄 Statement exported successfully!', 3000);
  };

  const printStatement = (statement: FinancialStatement) => {
    // In a real implementation, this would open print dialog
    showAINotification('🖨️ Opening print dialog...', 2000);
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading financial statements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                Financial Statement Generation
              </h1>
              <p className="text-gray-600 mt-2">Generate and manage comprehensive financial statements</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
            >
              <FileText className="h-5 w-5" />
              <span>Generate Statement</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Statements</p>
                <p className="text-2xl font-bold text-green-600">{statements.length}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-cyan-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statements.filter(s => s.period === getCurrentPeriod()).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Net Income</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${statements.length > 0 ? Math.round(statements.reduce((sum, s) => sum + s.netIncome, 0) / statements.length).toLocaleString() : '0'}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Calculator className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 via-orange-50/30 to-yellow-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latest Statement</p>
                <p className="text-lg font-bold text-orange-600">
                  {statements.length > 0 ? new Date(statements[0].generatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Statements Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-100 to-indigo-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statement Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Period</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Income</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Expenses</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Net Income</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Generated By</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statements.map((statement) => (
                  <tr key={statement.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {statement.statementType.charAt(0).toUpperCase() + statement.statementType.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{statement.period}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      ${statement.totalIncome.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">
                      ${statement.totalExpenses.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      <span className={`${statement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${statement.netIncome.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{statement.generatedBy}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(statement.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewStatement(statement)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => exportStatement(statement)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                          title="Export"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => printStatement(statement)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Statement Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="px-6 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                <h2 className="text-lg font-bold">Generate Financial Statement</h2>
              </div>
              <div className="p-6">
              
              <form onSubmit={generateStatement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statement Type</label>
                  <select
                    value={formData.statementType}
                    onChange={(e) => setFormData({ ...formData, statementType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="monthly">Monthly Statement</option>
                    <option value="quarterly">Quarterly Statement</option>
                    <option value="annual">Annual Statement</option>
                    <option value="custom">Custom Period</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={formData.statementType === 'monthly' ? '2024-01' : '2024-Q1'}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>Generate Statement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Statement Details Modal */}
        {selectedStatement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Statement Details</h2>
              
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-green-600 font-medium">Total Income</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${selectedStatement.totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl">
                    <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">
                      ${selectedStatement.totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${selectedStatement.netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-sm font-medium ${selectedStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Net Income
                    </p>
                    <p className={`text-2xl font-bold ${selectedStatement.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ${selectedStatement.netIncome.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Income Breakdown */}
                {statementBreakdown && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Breakdown</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">School Funding</p>
                          <p className="text-lg font-bold text-blue-700">
                            ${statementBreakdown.schoolFunding.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg">
                        <Banknote className="h-5 w-5 text-cyan-600" />
                        <div>
                          <p className="text-sm text-cyan-600 font-medium">Foundation Funding</p>
                          <p className="text-lg font-bold text-cyan-700">
                            ${statementBreakdown.foundationFunding.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <Wheat className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Farm Income</p>
                          <p className="text-lg font-bold text-green-700">
                            ${statementBreakdown.farmIncome.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <Stethoscope className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Clinic Income</p>
                          <p className="text-lg font-bold text-orange-700">
                            ${statementBreakdown.clinicIncome.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statement Info */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Statement Type:</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedStatement.statementType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Period:</p>
                      <p className="font-medium text-gray-900">{selectedStatement.period}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Generated By:</p>
                      <p className="font-medium text-gray-900">{selectedStatement.generatedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Generated At:</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedStatement.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setSelectedStatement(null)}
                  className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => exportStatement(selectedStatement)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialStatementGeneration;
