import { useState } from 'react';
import Dashboard from './components/Dashboard';
import BillUpload from './components/BillUpload';
import ChatAssistant from './components/ChatAssistant';
import TransactionsPage from './components/TransactionsPage';
import AddTransactionModal from './components/AddTransactionModal';
import LoginPage from './components/LoginPage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem('user_session');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('user_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('user_session');
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('dashboard');
  };

  const handleAddSuccess = () => {
    setRefreshKey(prev => prev + 1);
    // If we're not on dashboard, maybe switch? Or just refresh data if we return.
    // For now, let's keep user on current tab but refresh key ensures dashboard updates when visited.
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">AI Finance Analyzer</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      < div className="sm:hidden bg-white shadow-sm p-4 sticky top-0 z-10" >
        <div className="flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-gray-900 text-lg">FinAnalyser</span>
        </div>
      </div >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`${activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard
                </div>
              </button>

              <button
                onClick={() => setActiveTab('upload')}
                className={`${activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Bill
                </div>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`${activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Chat Assistant
                </div>
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'dashboard' && <Dashboard key={refreshKey} onNavigate={setActiveTab} />}
          {activeTab === 'upload' && <BillUpload onUploadSuccess={handleUploadSuccess} />}
          {activeTab === 'chat' && <ChatAssistant />}
          {activeTab === 'transactions' && <TransactionsPage onNavigate={setActiveTab} />}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-50 pb-safe">
          <div className="flex justify-around items-center px-1 py-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 active:scale-95 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`p-1.5 rounded-full mb-1 ${activeTab === 'dashboard' ? 'bg-blue-100' : ''}`}>
                <svg className="w-5 h-5" fill={activeTab === 'dashboard' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-[10px] font-bold">Home</span>
            </button>

            <div className="relative">
              {isMenuOpen && (
                <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 min-w-[160px] animate-fade-in-up flex flex-col gap-1 z-50">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowAddIncome(true);
                    }}
                    className="flex items-center w-full px-4 py-3 text-left hover:bg-green-50 rounded-xl transition-colors text-gray-700 hover:text-green-700 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="font-semibold text-sm">Income</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowAddExpense(true);
                    }}
                    className="flex items-center w-full px-4 py-3 text-left hover:bg-red-50 rounded-xl transition-colors text-gray-700 hover:text-red-700 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                    </div>
                    <span className="font-semibold text-sm">Expense</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveTab('upload');
                    }}
                    className="flex items-center w-full px-4 py-3 text-left hover:bg-blue-50 rounded-xl transition-colors text-gray-700 hover:text-blue-700 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <span className="font-semibold text-sm">Scan Bill</span>
                  </button>
                </div>
              )}

              {/* Backdrop for menu */}
              {isMenuOpen && (
                <div
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => setIsMenuOpen(false)}
                ></div>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`transform transition-all duration-300 active:scale-90 ${isMenuOpen ? 'rotate-45' : ''}`}
              >
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full opacity-0"></div>
                <div className={`p-3 -mt-6 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-300 border-4 border-gray-50 flex items-center justify-center`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
              <span className="text-[10px] font-bold mt-1 text-gray-500 block text-center">Add</span>
            </div>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 active:scale-95 ${activeTab === 'chat' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className={`p-1.5 rounded-full mb-1 ${activeTab === 'chat' ? 'bg-blue-100' : ''}`}>
                <svg className="w-5 h-5" fill={activeTab === 'chat' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold">Chat</span>
            </button>
          </div>
        </div>
      </div>

      <AddTransactionModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSuccess={handleAddSuccess}
        type="expense"
      />
      <AddTransactionModal
        isOpen={showAddIncome}
        onClose={() => setShowAddIncome(false)}
        onSuccess={handleAddSuccess}
        type="income"
      />
    </div >
  );
}

export default App;
