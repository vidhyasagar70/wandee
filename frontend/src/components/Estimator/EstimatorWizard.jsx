import React, { useState, useEffect } from 'react';
import { fetchActiveConfig, submitEstimate } from '../../services/api';
import DynamicQuestion from './DynamicQuestion';

export default function EstimatorWizard() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0); // 0..questions.length (last step is contact info)
  const [answers, setAnswers] = useState({});
  const [contactInfo, setContactInfo] = useState({ name: '', phone: '', email: '' });
  
  // Validation state
  const [errors, setErrors] = useState({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      setConfigError(null);
      const data = await fetchActiveConfig();
      setConfig(data);
    } catch (err) {
      console.error('Error loading estimator config:', err);
      setConfigError(err.message || 'Unable to load estimator configuration.');
    } finally {
      setLoadingConfig(false);
    }
  };

  const questions = config?.questions || [];
  const totalSteps = questions.length + 1; // questions + 1 contact step
  const isContactStep = currentStep === questions.length;
  const currentQuestion = questions[currentStep];

  const handleAnswerChange = (questionKey, val) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: val }));
    // Clear error on change
    if (errors[questionKey]) {
      setErrors((prev) => ({ ...prev, [questionKey]: null }));
    }
  };

  const handleContactChange = (field, val) => {
    setContactInfo((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateCurrentStep = () => {
    const newErrors = {};

    if (!isContactStep) {
      // Validate current question
      if (!currentQuestion) return false;

      const val = answers[currentQuestion.key];
      if (currentQuestion.required && (val === undefined || val === null || val === '')) {
        newErrors[currentQuestion.key] = 'This selection or field is required.';
      } else if (currentQuestion.type === 'number' && val !== '' && val !== undefined) {
        if (currentQuestion.min !== undefined && val < currentQuestion.min) {
          newErrors[currentQuestion.key] = `Value must be at least ${currentQuestion.min.toLocaleString()} ${currentQuestion.unit || ''}`;
        } else if (currentQuestion.max !== undefined && val > currentQuestion.max) {
          newErrors[currentQuestion.key] = `Value cannot exceed ${currentQuestion.max.toLocaleString()} ${currentQuestion.unit || ''}`;
        }
      }
    } else {
      // Validate contact info
      if (!contactInfo.name.trim()) {
        newErrors.name = 'Full name is required';
      }
      if (!contactInfo.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
      if (contactInfo.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateCurrentStep()) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        name: contactInfo.name.trim(),
        phone: contactInfo.phone.trim(),
        email: contactInfo.email.trim(),
        answers: answers
      };

      const res = await submitEstimate(payload);
      setEstimateResult(res);
    } catch (err) {
      console.error('Failed to submit estimate:', err);
      setSubmitError(err.message || 'Failed to process calculation. Please check your answers.');
      if (err.field) {
        setErrors({ [err.field]: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setContactInfo({ name: '', phone: '', email: '' });
    setErrors({});
    setEstimateResult(null);
    setSubmitError(null);
    setCurrentStep(0);
  };

  // 1. Loading state
  if (loadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl border border-slate-100 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-lg">Loading instant estimate wizard...</p>
      </div>
    );
  }

  // 2. Config error state
  if (configError || !config || questions.length === 0) {
    return (
      <div className="p-8 bg-rose-50 rounded-2xl border border-rose-200 text-center max-w-lg mx-auto my-8 shadow-sm">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-rose-900 mb-2">Estimator Unavailable</h3>
        <p className="text-rose-700 text-sm mb-6">{configError || 'No active questions found in configuration.'}</p>
        <button
          onClick={loadConfig}
          className="px-6 py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // 3. Final Estimate Result Card
  if (estimateResult) {
    const formattedLow = (estimateResult.estimate_low || 0).toLocaleString();
    const formattedHigh = (estimateResult.estimate_high || 0).toLocaleString();
    const currency = estimateResult.currency || config.business?.currency || 'USD';
    const currencySymbol = currency === 'USD' ? '$' : '$';

    return (
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-w-2xl mx-auto my-6 animate-fade-in">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Estimate Ready
          </div>
          
          <h2 className="text-3xl font-extrabold tracking-tight mb-1">
            {config.business?.name || 'Roofing Estimator'}
          </h2>
          <p className="text-slate-300 text-sm">Estimated Total Project Cost</p>

          {/* Big Price Range Display */}
          <div className="mt-6 py-4 px-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 inline-block">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              {currencySymbol}{formattedLow} – {currencySymbol}{formattedHigh}
            </span>
            <span className="block text-xs text-slate-300 mt-1 uppercase font-medium">
              Estimated Range ({currency})
            </span>
          </div>
        </div>

        {/* Details & Confirmation */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Homeowner Details Confirmed
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Name</span>
                <span className="font-semibold text-slate-800">{contactInfo.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Phone</span>
                <span className="font-semibold text-slate-800">{contactInfo.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Email</span>
                <span className="font-semibold text-slate-800">{contactInfo.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Summary of Selections */}
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-3">Project Specs Summary</h4>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
              {questions.map((q) => {
                const answerVal = answers[q.key];
                let displayVal = 'N/A';
                
                if (q.type === 'select' || q.type === 'radio') {
                  const opt = q.options?.find((o) => o.value === answerVal);
                  displayVal = opt ? opt.label : answerVal;
                } else if (q.type === 'number') {
                  displayVal = answerVal ? `${answerVal.toLocaleString()} ${q.unit || ''}` : 'N/A';
                } else if (typeof answerVal === 'boolean') {
                  displayVal = answerVal ? 'Yes' : 'No';
                } else if (answerVal) {
                  displayVal = String(answerVal);
                }

                return (
                  <div key={q.key} className="flex items-center justify-between p-3.5 hover:bg-slate-50 text-sm">
                    <span className="text-slate-600 font-medium">{q.label}</span>
                    <span className="font-bold text-slate-900 text-right ml-4">{displayVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReset}
              className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Calculate Another Estimate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Interactive Wizard Steps
  const progressPct = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden max-w-xl mx-auto my-4 sm:my-8 transition-all duration-300">
      {/* Header & Business Brand */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              R
            </div>
            <span className="font-bold text-lg tracking-tight">
              {config.business?.name || 'Roofing Estimator'}
            </span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-white/10 rounded-full text-slate-300 border border-white/10">
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Main Wizard Form Body */}
      <div className="p-6 sm:p-8">
        {submitError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}

        {!isContactStep ? (
          // Dynamic Question Step
          <div>
            <DynamicQuestion
              question={currentQuestion}
              value={answers[currentQuestion?.key]}
              onChange={(val) => handleAnswerChange(currentQuestion?.key, val)}
              error={errors[currentQuestion?.key]}
            />
          </div>
        ) : (
          // Contact Info Final Step
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Final Step: Contact Information</h3>
              <p className="text-sm text-slate-500 mb-4">
                Where should we display and send your official estimated quote?
              </p>
            </div>

            {/* Name input */}
            <div>
              <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                value={contactInfo.name}
                onChange={(e) => handleContactChange('name', e.target.value)}
                placeholder="John Doe"
                className={`w-full px-4 py-3 rounded-xl border font-medium text-slate-900 bg-white transition-all ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.name && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.name}</p>}
            </div>

            {/* Phone input */}
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                placeholder="(512) 555-0199"
                className={`w-full px-4 py-3 rounded-xl border font-medium text-slate-900 bg-white transition-all ${
                  errors.phone
                    ? 'border-rose-400 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.phone && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.phone}</p>}
            </div>

            {/* Email input */}
            <div>
              <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="contact-email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                placeholder="john@example.com"
                className={`w-full px-4 py-3 rounded-xl border font-medium text-slate-900 bg-white transition-all ${
                  errors.email
                    ? 'border-rose-400 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              {errors.email && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.email}</p>}
            </div>
          </form>
        )}

        {/* Wizard Controls Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
              currentStep === 0 || isSubmitting
                ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-98'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {!isContactStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  Get Instant Estimate
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
