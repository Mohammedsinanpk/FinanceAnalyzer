import { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import AddTransactionModal from './AddTransactionModal';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${API_URL}/api/dashboard`);
      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSuccess = () => {
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!dashboardData || !dashboardData.insights) {
    // If no data, still show buttons to add first transaction
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddIncome(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Income
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Expense
            </button>
          </div>
        </div>

        <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-md">
          <p className="text-xl">No data available yet</p>
          <p className="mt-2 text-gray-400">Add your first transaction or upload a bill to see insights</p>
        </div>

        <AddTransactionModal
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          onSuccess={handleTransactionSuccess}
          type="expense"
        />
        <AddTransactionModal
          isOpen={showAddIncome}
          onClose={() => setShowAddIncome(false)}
          onSuccess={handleTransactionSuccess}
          type="income"
        />
      </div>
    );
  }

  const { insights, transactions } = dashboardData;

  const categoryData = {
    labels: Object.keys(insights.category_breakdown || {}),
    datasets: [
      {
        label: 'Spending by Category',
        data: Object.values(insights.category_breakdown || {}),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(201, 203, 207, 0.8)',
        ],
      },
    ],
  };

  const recentTransactions = transactions.slice().reverse().slice(0, 7);
  const transactionBarData = {
    labels: recentTransactions.map((t, i) => `#${recentTransactions.length - i}`),
    datasets: [
      {
        label: 'Recent Transactions',
        data: recentTransactions.map(t => t.amount), // Updated from t.total_amount
        backgroundColor: recentTransactions.map(t => t.type === 'income' ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)'),
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddIncome(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Income
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Spent</h3>
          <p className="text-3xl font-bold text-gray-900">${insights.total_spent}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Transactions</h3>
          <p className="text-3xl font-bold text-gray-900">{insights.transaction_count}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Top Category</h3>
          <p className="text-3xl font-bold text-gray-900">{insights.top_category || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Smart Insights</h3>
        <div className="space-y-3">
          {insights.insights && insights.insights.length > 0 ? (
            insights.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">{insight}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No specific insights yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
          {Object.keys(insights.category_breakdown || {}).length > 0 ? (
            <div className="flex justify-center">
              <div className="w-64 h-64">
                <Pie data={categoryData} options={{ maintainAspectRatio: true }} />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No category data yet</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          {recentTransactions.length > 0 ? (
            <Bar data={transactionBarData} options={{ maintainAspectRatio: true, scales: { y: { beginAtZero: true } } }} />
          ) : (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.slice(0).reverse().map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date || transaction.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.merchant}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${(transaction.amount || transaction.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {transaction.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddTransactionModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSuccess={handleTransactionSuccess}
        type="expense"
      />
      <AddTransactionModal
        isOpen={showAddIncome}
        onClose={() => setShowAddIncome(false)}
        onSuccess={handleTransactionSuccess}
        type="income"
      />
    </div>
  );
}
