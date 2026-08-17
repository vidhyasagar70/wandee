import React, { useState, useEffect } from 'react';
import EstimatorWizard from './components/Estimator/EstimatorWizard';
import AdminLogin from './components/Admin/AdminLogin';
import OwnerDashboard from './components/Admin/OwnerDashboard';
import { getStoredToken, clearStoredToken } from './services/api';

export default function App() {
  // Navigation state: 'estimator' | 'admin'
  const [currentView, setCurrentView] = useState(() => {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      return 'admin';
    }
    return 'estimator';
  });

  // Admin auth token state
  const [adminToken, setAdminToken] = useState(() => getStoredToken());

  // Listen to popstate / hash changes
  useEffect(() => {
    const handleNavigation = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('estimator');
      }
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  const handleAdminLogout = () => {
    clearStoredToken();
    setAdminToken('');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Brand Title */}
          <button
            onClick={() => navigateTo('estimator')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              R
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block leading-tight">
                Roofing Calculator
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Config-Driven Estimator
              </span>
            </div>
          </button>

          {/* Navigation View Switcher Buttons */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('estimator')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'estimator'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Estimator
            </button>

            <button
              onClick={() => navigateTo('admin')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Owner Portal
            </button>
          </nav>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        {currentView === 'estimator' ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2 py-4">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Instant Roofing Cost Estimator
              </h1>
              <p className="text-base text-slate-600 max-w-xl mx-auto font-medium">
                Answer a few quick questions to receive an accurate, real-time estimated pricing range for your roofing project.
              </p>
            </div>

            {/* Public Estimator Wizard */}
            <EstimatorWizard />
          </div>
        ) : (
          <div>
            {/* Admin Area (Protected by AdminLogin if not authenticated) */}
            {!adminToken ? (
              <AdminLogin onLoginSuccess={(token) => setAdminToken(token)} />
            ) : (
              <OwnerDashboard token={adminToken} onLogout={handleAdminLogout} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Roofing Estimator Platform. All rights reserved.</span>
          <span className="font-mono text-slate-400">Server-side Dynamic Calculation • Zero hardcoded schema</span>
        </div>
      </footer>
    </div>
  );
}
