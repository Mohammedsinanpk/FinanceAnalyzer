import { useState } from 'react';
import axios from 'axios';

export default function AddTransactionModal({ isOpen, onClose, onSuccess, type = 'expense' }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        merchant: '',
        category: '',
        amount: '',
        type: type, // 'income' or 'expense'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const API_URL = import.meta.env.VITE_API_URL || '';
            const response = await axios.post(`${API_URL}/api/transactions`, {
                ...formData,
                amount: parseFloat(formData.amount),
                type: type // Ensure type is correct even if state drifted (though it shouldn't)
            });

            if (response.data.success) {
                onSuccess(response.data.data);
                onClose();
                // Reset form slightly but keep date maybe?
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    merchant: '',
                    category: '',
                    amount: '',
                    type: type,
                });
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to add transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Add {type === 'income' ? 'Income' : 'Expense'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {type === 'income' ? 'Source' : 'Merchant/Description'}
                        </label>
                        <input
                            type="text"
                            name="merchant"
                            value={formData.merchant}
                            onChange={handleChange}
                            placeholder={type === 'income' ? 'e.g., Salary, Freelance' : 'e.g., Walmart, Uber'}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            placeholder={type === 'income' ? 'e.g., Salary' : 'e.g., Groceries, Transport'}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2 text-white rounded-md transition-colors ${type === 'income'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        >
                            {loading ? 'Saving...' : 'Save Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
