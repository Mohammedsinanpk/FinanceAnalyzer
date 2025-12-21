import { useState } from 'react';
import axios from 'axios';

export default function BillUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      setResult(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select an image file');
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${API_URL}/api/upload-bill`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setResult(response.data.data);
        setSelectedFile(null);
        setPreview(null);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload bill');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-lg shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl opacity-60 -mr-10 -mt-10"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 relative z-10">Upload Bill/Receipt</h2>

        <div className="space-y-6 relative z-10">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              {preview ? (
                <img src={preview} alt="Preview" className="h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB)</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Processing...' : 'Upload & Extract'}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Bill Extracted Successfully!</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Date:</strong> {result.date}</p>
                <p><strong>Merchant:</strong> {result.merchant}</p>
                <p><strong>Category:</strong> {result.category}</p>
                <p><strong>Total Amount:</strong> ${(result.total_amount || result.amount).toFixed(2)}</p>
                {result.items && result.items.length > 0 && (
                  <div>
                    <strong>Items:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {result.items.map((item, index) => (
                        <li key={index}>{item.name || item.item} - ${item.price || item.amount}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={async () => {
                    try {
                      const API_URL = import.meta.env.VITE_API_URL || '';
                      const transactionData = {
                        date: result.date,
                        merchant: result.merchant,
                        category: result.category,
                        amount: result.total_amount || result.amount,
                        type: 'expense',
                        items: result.items
                      };
                      const response = await axios.post(`${API_URL}/api/transactions`, transactionData);
                      if (response.data.success) {
                        alert('Transaction saved successfully!');
                        setResult(null);
                        setSelectedFile(null);
                        setPreview(null);
                        if (onUploadSuccess) onUploadSuccess();
                      }
                    } catch (err) {
                      alert('Failed to save transaction: ' + (err.response?.data?.detail || err.message));
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                >
                  Save as Expense
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
