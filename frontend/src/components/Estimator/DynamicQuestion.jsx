import React from 'react';

/**
 * DynamicQuestion component renders dynamic form controls strictly based on API question schema.
 * 
 * Props:
 * - question: Question schema object from GET /api/config/active
 * - value: Current answer value
 * - onChange: Callback (val) => void
 * - error: Error message string (if any)
 */
export default function DynamicQuestion({ question, value, onChange, error }) {
  if (!question) return null;

  const { key, label, type, unit, min, max, required, options = [] } = question;

  // Handle Number Question Type
  if (type === 'number') {
    const numValue = value !== undefined && value !== null ? value : '';

    const handleNumberChange = (e) => {
      const val = e.target.value;
      if (val === '') {
        onChange('');
        return;
      }
      const parsed = parseFloat(val);
      onChange(isNaN(parsed) ? '' : parsed);
    };

    return (
      <div className="space-y-3">
        <label htmlFor={`q-${key}`} className="block text-lg font-semibold text-slate-800">
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        
        {(min !== undefined || max !== undefined) && (
          <p className="text-xs font-medium text-slate-500">
            Allowed range: {min !== undefined ? `${min.toLocaleString()}` : '0'}
            {max !== undefined ? ` – ${max.toLocaleString()}` : ''} {unit || ''}
          </p>
        )}

        <div className="relative rounded-xl shadow-xs">
          <input
            id={`q-${key}`}
            type="number"
            min={min}
            max={max}
            value={numValue}
            onChange={handleNumberChange}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={`w-full px-4 py-3.5 pr-20 text-lg font-medium text-slate-900 bg-white border rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-3 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 hover:border-slate-400'
            }`}
          />
          {unit && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {unit}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600 mt-1">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }

  // Handle Select / Radio Option Group Question Type
  if (type === 'select' || type === 'radio') {
    return (
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-slate-800">
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`relative flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-md ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-medium text-base leading-snug">{option.label}</span>
                </div>

                {isSelected && (
                  <svg className="w-5 h-5 text-blue-600 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600 mt-1">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }

  // Handle Checkbox / Boolean Question Type
  if (type === 'checkbox') {
    const isChecked = Boolean(value);
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onChange(!isChecked)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
            isChecked
              ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-md'
              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
              isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
            }`}>
              {isChecked && (
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                </svg>
              )}
            </div>
            <span className="font-semibold text-lg">{label}</span>
          </div>
        </button>

        {error && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600 mt-1">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }

  // Handle Default Text Question Type
  return (
    <div className="space-y-3">
      <label htmlFor={`q-${key}`} className="block text-lg font-semibold text-slate-800">
        {label} {required && <span className="text-rose-500 font-bold">*</span>}
      </label>

      <input
        id={`q-${key}`}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        className={`w-full px-4 py-3.5 text-lg font-medium text-slate-900 bg-white border rounded-xl transition-all duration-200 focus:outline-hidden focus:ring-3 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20 hover:border-slate-400'
        }`}
      />

      {error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600 mt-1">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
