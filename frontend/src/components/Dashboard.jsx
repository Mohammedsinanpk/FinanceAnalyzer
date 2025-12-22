import { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import AddTransactionModal from './AddTransactionModal';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Dashboard({ onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [chartMode, setChartMode] = useState('expenses');

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Fallback for empty state
  if (!dashboardData || !dashboardData.insights) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="mb-6">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your Finance Analyzer</h2>
          <p className="text-gray-500 mb-8">Start tracking your finances by adding your first transaction.</p>
          <div className="space-y-3">
            <button
              onClick={() => setShowAddIncome(true)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition duration-200 font-medium shadow-lg shadow-indigo-200"
            >
              Add Income
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition duration-200 font-medium"
            >
              Add Expense
            </button>
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

  const { insights, transactions } = dashboardData;

  // Modern Color Palette
  const colors = {
    primary: '#4F46E5', // Indigo 600
    success: '#10B981', // Emerald 500
    danger: '#EF4444', // Red 500
    warning: '#F59E0B', // Amber 500
    info: '#3B82F6', // Blue 500
    chartColors: [
      '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E', '#F59E0B', '#3B82F6'
    ]
  };

  const categoryData = {
    labels: Object.keys(insights.category_breakdown || {}),
    datasets: [{
      data: Object.values(insights.category_breakdown || {}),
      backgroundColor: colors.chartColors,
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const processChartData = (data) => {
    const grouped = data.reduce((acc, t) => {
      const date = new Date(t.date || t.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + (t.amount || t.total_amount);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);
  };

  const groupedTransactions = processChartData(transactions);
  const groupedExpenses = processChartData(transactions.filter(t => t.type === 'expense'));
  const currentChartData = chartMode === 'expenses' ? groupedExpenses : groupedTransactions;

  const lineChartData = {
    labels: currentChartData.map(t => t.date),
    datasets: [{
      label: chartMode === 'expenses' ? 'Expenses' : 'All Transactions',
      data: currentChartData.map(t => t.amount),
      borderColor: chartMode === 'expenses' ? colors.danger : colors.primary,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        const color = chartMode === 'expenses' ? '239, 68, 68' : '79, 70, 229';
        gradient.addColorStop(0, `rgba(${color}, 0.2)`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#fff',
      pointBorderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F2937',
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#9CA3AF' }
      },
      y: {
        grid: { color: '#F3F4F6', borderDash: [5, 5] },
        ticks: { font: { size: 12 }, color: '#9CA3AF', callback: (value) => `₹${value}` },
        beginAtZero: true
      }
    }
  };

  // Calculate totals for summary cards
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || t.total_amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || t.total_amount), 0);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans pb-20 sm:pb-8">

      {/* Header Section */}
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex w-full sm:w-auto space-x-3 bg-white p-1 rounded-xl shadow-sm border border-gray-100 sm:bg-transparent sm:shadow-none sm:border-0 sm:p-0">
          <button
            onClick={() => setShowAddIncome(true)}
            className="flex-1 sm:flex-none justify-center items-center px-4 py-2.5 bg-green-50 text-green-700 rounded-lg sm:bg-white sm:border sm:border-gray-200 sm:text-gray-700 sm:shadow-sm sm:hover:bg-gray-50 transition-all font-medium group active:scale-95"
          >
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center mr-2 text-green-700 sm:bg-green-100 sm:text-green-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </div>
              Income
            </div>
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex-1 sm:flex-none justify-center items-center px-4 py-2.5 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-800 transition-all font-medium group active:scale-95"
          >
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center mr-2 text-white group-hover:bg-gray-600 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </div>
              Expense
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Main Balance Card */}
        <div className="bg-white rounded-[20px] p-6 shadow-lg shadow-gray-200/50 border border-gray-100 relative overflow-hidden transition-all">
          <div className="relative z-10">
            <h3 className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Total Balance</h3>
            <div className="mt-1 flex items-baseline">
              <span className="text-4xl font-black text-gray-900 tracking-tight">₹{(totalIncome - totalExpenses).toLocaleString()}</span>
            </div>

            <div className="mt-6 flex flex-row space-x-8">
              <div>
                <div className="flex items-center text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-200"></div>
                  Income
                </div>
                <p className="text-lg font-bold text-gray-900">₹{totalIncome.toLocaleString()}</p>
              </div>
              <div>
                <div className="flex items-center text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-200"></div>
                  Expenses
                </div>
                <p className="text-lg font-bold text-gray-900">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
          {/* Decorative background circle */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full opacity-60 z-0 blur-xl"></div>
          <div className="absolute right-4 bottom-4 w-24 h-24 bg-gradient-to-tr from-emerald-50 to-teal-50 rounded-full opacity-60 z-0 blur-lg"></div>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md">
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-4 uppercase tracking-wider">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 text-xs text-center mb-1">Transactions</p>
                <p className="text-2xl font-bold text-gray-800 text-center">{insights.transaction_count}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 text-xs text-center mb-1">Top Category</p>
                <p className="text-sm font-bold text-gray-800 text-center truncate px-1" title={insights.top_category}>{insights.top_category || '-'}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Savings Rate</span>
              <span className={`font-bold ${totalIncome > 0 && ((totalIncome - totalExpenses) / totalIncome) >= 0.2 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${totalIncome > 0 && ((totalIncome - totalExpenses) / totalIncome) >= 0.2 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${totalIncome > 0 ? Math.max(0, Math.min(100, ((totalIncome - totalExpenses) / totalIncome) * 100)) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <h3 className="text-gray-500 font-medium text-sm mb-4 uppercase tracking-wider text-center">Spending Breakdown</h3>
          <div className="h-48 relative flex justify-center items-center">
            {Object.keys(insights.category_breakdown || {}).length > 0 ? (
              <Pie data={categoryData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 text-sm">
                <span className="block mb-2 text-2xl">📉</span>
                No spending data yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Chart & Transactions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Analytics</h3>
              <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                <button
                  onClick={() => setChartMode('all')}
                  className={`px-3 py-1 rounded-md transition-all ${chartMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setChartMode('expenses')}
                  className={`px-3 py-1 rounded-md transition-all ${chartMode === 'expenses' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Expenses
                </button>
              </div>
            </div>
            <div className="h-72">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
              <button onClick={() => onNavigate('transactions')} className="text-indigo-600 text-sm font-medium hover:text-indigo-700 hover:underline">View All</button>
            </div>

            <div className="space-y-1">
              {transactions.slice(0).reverse().slice(0, 5).map((transaction, index) => (
                <div key={index} className="flex items-center justify-between group p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                      {/* Basic icon logic */}
                      <span className="text-sm font-bold">{transaction.merchant ? transaction.merchant[0].toUpperCase() : '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{transaction.merchant}</p>
                      <p className="text-xs text-gray-500">{new Date(transaction.date || transaction.timestamp).toLocaleDateString()} • {transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${transaction.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{(transaction.amount || transaction.total_amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-2">No recent transactions</p>
                  <button onClick={() => setShowAddExpense(true)} className="text-indigo-600 text-sm font-medium hover:underline">Add one now</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Smart Insights */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-bold text-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Smart Insights
              </h3>
            </div>

            <div className="space-y-4 relative z-10">
              {insights.insights && insights.insights.length > 0 ? (
                insights.insights.slice(0, 3).map((insight, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-sm leading-relaxed shadow-sm">
                    {insight}
                  </div>
                ))
              ) : (
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-sm shadow-sm text-center">
                  <p className="mb-2">No insights yet.</p>
                  <p className="opacity-80 text-xs">Keep adding transactions to let our AI analyze your habits!</p>
                </div>
              )}
            </div>
            <button className="w-full mt-6 py-2.5 bg-white text-indigo-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg">
              Generate New Report
            </button>
          </div>

          {/* Feature Promo */}
          <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-md border border-gray-800">
            <div className="flex items-start">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <h4 className="font-bold mb-1 text-gray-100">Scan Receipts</h4>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">Too lazy to type? Upload a picture of your bill and let us handle the rest.</p>
                <button className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center group">
                  Try Bill Upload
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
            </div>
          </div>
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
