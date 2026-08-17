import React, { useState } from 'react';
import { fetchAdminConfig, setStoredToken } from '../../services/api';

export default function AdminLogin({ onLoginSuccess }) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please enter the owner admin secret key.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = tokenInput.trim();
      
      // Verify token against admin config endpoint
      await fetchAdminConfig(token);
      
      // Store token and trigger callback
      setStoredToken(token);
      if (onLoginSuccess) {
        onLoginSuccess(token);
      }
    } catch (err) {
      console.error('Admin authentication failed:', err);
      setError(err.message || 'Invalid secret key or unauthorized access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-blue-400 mx-auto shadow-lg shadow-slate-900/20">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Owner Portal Authentication</h2>
          <p className="text-sm text-slate-500">
            Enter your admin secret key to access the estimator config & leads.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-secret" className="block text-sm font-bold text-slate-700 mb-1.5">
              Admin Secret Key
            </label>
            <input
              id="admin-secret"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. admin_secret_key"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-3 focus:ring-blue-600/20"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold text-base rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying Credentials...
              </>
            ) : (
              'Unlock Owner Panel'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-xs text-slate-400">
            Protected endpoint area (`/api/admin/*`)
          </span>
        </div>
      </div>
    </div>
  );
}
