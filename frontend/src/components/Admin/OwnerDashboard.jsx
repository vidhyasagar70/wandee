import React, { useState, useEffect } from 'react';
import { fetchAdminConfig, updateAdminConfig, fetchAdminLeads, clearStoredToken } from '../../services/api';

export default function OwnerDashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'leads'

  // Config tab state
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState(null);
  const [createNewVersion, setCreateNewVersion] = useState(false);

  // Leads tab state
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null); // Lead modal or expandable detail

  const loadConfigData = React.useCallback(async () => {
    try {
      setLoadingConfig(true);
      const data = await fetchAdminConfig(token);
      setConfig(data);
    } catch (err) {
      console.error('Failed to load admin config:', err);
      if (err.message && err.message.includes('Unauthorized')) {
        clearStoredToken();
        if (onLogout) onLogout();
      }
    } finally {
      setLoadingConfig(false);
    }
  }, [token, onLogout]);

  const loadLeadsData = React.useCallback(async () => {
    try {
      setLoadingLeads(true);
      setLeadsError(null);
      const data = await fetchAdminLeads(token);
      setLeads(data);
    } catch (err) {
      console.error('Failed to load admin leads:', err);
      setLeadsError(err.message || 'Failed to load captured leads');
    } finally {
      setLoadingLeads(false);
    }
  }, [token]);

  useEffect(() => {
    loadConfigData();
    loadLeadsData();
  }, [loadConfigData, loadLeadsData]);


  // Handler for saving config
  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      setConfigMessage(null);

      const payload = {
        config_version: config.config_version,
        business: config.business,
        questions: config.questions,
        modifiers: config.modifiers,
        createNewVersion: createNewVersion
      };

      const res = await updateAdminConfig(payload, token);
      setConfig(res.config);
      setConfigMessage({ type: 'success', text: res.message || 'Configuration saved successfully!' });
      setCreateNewVersion(false);
    } catch (err) {
      console.error('Failed to save admin config:', err);
      setConfigMessage({ type: 'error', text: err.message || 'Failed to update configuration.' });
    } finally {
      setSavingConfig(false);
    }
  };

  // Question manipulation helpers
  const handleToggleQuestionActive = (index) => {
    const updated = [...config.questions];
    updated[index].active = !updated[index].active;
    setConfig({ ...config, questions: updated });
  };

  const handleQuestionChange = (index, field, val) => {
    const updated = [...config.questions];
    updated[index][field] = val;
    setConfig({ ...config, questions: updated });
  };

  const handleOptionChange = (qIndex, oIndex, field, val) => {
    const updatedQuestions = [...config.questions];
    const opts = [...updatedQuestions[qIndex].options];
    opts[oIndex] = { ...opts[oIndex], [field]: val };
    updatedQuestions[qIndex].options = opts;
    setConfig({ ...config, questions: updatedQuestions });
  };

  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...config.questions];
    const opts = updatedQuestions[qIndex].options || [];
    opts.push({ label: 'New Option', value: `option_${Date.now()}`, rate: 0, multiplier: 1 });
    updatedQuestions[qIndex].options = opts;
    setConfig({ ...config, questions: updatedQuestions });
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const updatedQuestions = [...config.questions];
    updatedQuestions[qIndex].options.splice(oIndex, 1);
    setConfig({ ...config, questions: updatedQuestions });
  };

  const handleAddQuestion = () => {
    const newQ = {
      key: `question_${Date.now()}`,
      label: 'New Question Label',
      type: 'select',
      unit: '',
      required: true,
      active: true,
      options: [
        { label: 'Option A', value: 'opt_a', rate: 0, multiplier: 1 }
      ]
    };
    setConfig({ ...config, questions: [...config.questions, newQ] });
  };

  const handleRemoveQuestion = (qIndex) => {
    const updated = [...config.questions];
    updated.splice(qIndex, 1);
    setConfig({ ...config, questions: updated });
  };

  // Filter leads based on query
  const filteredLeads = leads.filter((lead) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (lead.name && lead.name.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      (lead.email && lead.email.toLowerCase().includes(q))
    );
  });

  // Helper function to format lead keys safely (handling legacy fields gracefully)
  const renderLeadAnswers = (answersObj) => {
    if (!answersObj || typeof answersObj !== 'object') return <p className="text-slate-400 italic">No answers logged</p>;

    // Map question keys to human readable labels if present in current config
    const questionMap = (config?.questions || []).reduce((acc, q) => {
      acc[q.key] = q;
      return acc;
    }, {});

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {Object.entries(answersObj).map(([k, val]) => {
          const matchedQuestion = questionMap[k];
          const label = matchedQuestion ? matchedQuestion.label : k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          let valDisplay = String(val);

          // Find option label if select
          if (matchedQuestion && (matchedQuestion.type === 'select' || matchedQuestion.type === 'radio')) {
            const opt = matchedQuestion.options?.find(o => o.value === val);
            if (opt) valDisplay = `${opt.label} (${val})`;
          }

          return (
            <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">
                {label} {!matchedQuestion && <span className="text-amber-600 font-medium">(Legacy/Custom Field: `{k}`)</span>}
              </span>
              <span className="text-sm font-bold text-slate-800 break-words">{valDisplay}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Admin Top Navigation & Header */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight">Owner Control Panel</h1>
            {config && (
              <span className="px-3 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-full">
                v{config.config_version} Active
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {config?.business?.name || 'Roofing Business'} – Manage dynamic pricing schema & homeowner leads
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab buttons */}
          <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Config Editor
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'leads'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Leads Viewer
              <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs">
                {leads.length}
              </span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-2 bg-slate-800 hover:bg-rose-900/80 text-rose-300 hover:text-white rounded-xl text-sm font-bold border border-slate-700 transition-all cursor-pointer"
            title="Log Out"
          >
            Logout
          </button>
        </div>
      </div>

      {/* TAB 1: CONFIG EDITOR */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {loadingConfig ? (
            <div className="p-12 bg-white rounded-3xl shadow-sm text-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Loading configuration schema...</p>
            </div>
          ) : !config ? (
            <div className="p-8 bg-rose-50 rounded-2xl border border-rose-200 text-rose-700">
              Failed to load configuration data.
            </div>
          ) : (
            <>
              {configMessage && (
                <div className={`p-4 rounded-xl text-sm font-medium border ${
                  configMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {configMessage.text}
                </div>
              )}

              {/* Global Modifiers & Business Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Info */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Business Profile</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Company Name</label>
                      <input
                        type="text"
                        value={config.business?.name || ''}
                        onChange={(e) => setConfig({ ...config, business: { ...config.business, name: e.target.value } })}
                        className="w-full px-3 py-2 border rounded-lg text-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Region</label>
                        <input
                          type="text"
                          value={config.business?.region || ''}
                          onChange={(e) => setConfig({ ...config, business: { ...config.business, region: e.target.value } })}
                          className="w-full px-3 py-2 border rounded-lg text-slate-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Currency</label>
                        <input
                          type="text"
                          value={config.business?.currency || 'USD'}
                          onChange={(e) => setConfig({ ...config, business: { ...config.business, currency: e.target.value } })}
                          className="w-full px-3 py-2 border rounded-lg text-slate-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Modifiers */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Pricing Multipliers & Modifiers</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Waste Factor (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.modifiers?.waste_factor !== undefined ? config.modifiers.waste_factor : 0.15}
                        onChange={(e) => setConfig({ ...config, modifiers: { ...config.modifiers, waste_factor: parseFloat(e.target.value) || 0 } })}
                        className="w-full px-3 py-2 border rounded-lg text-slate-900 text-sm font-semibold"
                      />
                      <span className="text-[10px] text-slate-400">e.g. 0.15 = 15%</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Permit Fee ($)</label>
                      <input
                        type="number"
                        value={config.modifiers?.permit_flat_fee !== undefined ? config.modifiers.permit_flat_fee : 250}
                        onChange={(e) => setConfig({ ...config, modifiers: { ...config.modifiers, permit_flat_fee: parseFloat(e.target.value) || 0 } })}
                        className="w-full px-3 py-2 border rounded-lg text-slate-900 text-sm font-semibold"
                      />
                      <span className="text-[10px] text-slate-400">Flat fee</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Spread Pct (%)</label>
                      <input
                        type="number"
                        value={config.modifiers?.range_spread_pct !== undefined ? config.modifiers.range_spread_pct : 10}
                        onChange={(e) => setConfig({ ...config, modifiers: { ...config.modifiers, range_spread_pct: parseFloat(e.target.value) || 0 } })}
                        className="w-full px-3 py-2 border rounded-lg text-slate-900 text-sm font-semibold"
                      />
                      <span className="text-[10px] text-slate-400">High/Low spread</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Schema Editor */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Dynamic Questions Schema</h3>
                    <p className="text-xs text-slate-500">Configure public estimator questions, rates, and multipliers.</p>
                  </div>
                  <button
                    onClick={handleAddQuestion}
                    className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-sm transition-all border border-blue-200 cursor-pointer flex items-center gap-1.5"
                  >
                    + Add New Question
                  </button>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                  {config.questions.map((q, qIndex) => {
                    const isActive = q.active !== false;

                    return (
                      <div
                        key={qIndex}
                        className={`rounded-2xl p-5 border-2 transition-all space-y-4 ${
                          isActive
                            ? 'bg-slate-50/50 border-slate-200'
                            : 'bg-slate-100/70 border-slate-300 opacity-60'
                        }`}
                      >
                        {/* Question Header Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Active Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleQuestionActive(qIndex)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                isActive ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
                              }`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </button>

                            <input
                              type="text"
                              value={q.label}
                              onChange={(e) => handleQuestionChange(qIndex, 'label', e.target.value)}
                              placeholder="Question Label"
                              className="font-bold text-slate-900 text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-hidden px-1 py-0.5 w-full"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 uppercase font-bold">Key: `{q.key}`</span>
                            <button
                              onClick={() => handleRemoveQuestion(qIndex)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Question"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Question Metadata Fields */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Question Type</label>
                            <select
                              value={q.type}
                              onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                              className="w-full p-2 border rounded-lg bg-white font-medium text-slate-800"
                            >
                              <option value="number">Number</option>
                              <option value="select">Select / Radio</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="text">Text</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Unit Badge</label>
                            <input
                              type="text"
                              value={q.unit || ''}
                              onChange={(e) => handleQuestionChange(qIndex, 'unit', e.target.value)}
                              placeholder="e.g. sq ft"
                              className="w-full p-2 border rounded-lg bg-white text-slate-800"
                            />
                          </div>

                          {q.type === 'number' && (
                            <>
                              <div>
                                <label className="block text-slate-500 font-semibold mb-1">Min Value</label>
                                <input
                                  type="number"
                                  value={q.min !== undefined ? q.min : ''}
                                  onChange={(e) => handleQuestionChange(qIndex, 'min', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                  placeholder="500"
                                  className="w-full p-2 border rounded-lg bg-white text-slate-800"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-500 font-semibold mb-1">Max Value</label>
                                <input
                                  type="number"
                                  value={q.max !== undefined ? q.max : ''}
                                  onChange={(e) => handleQuestionChange(qIndex, 'max', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                  placeholder="10000"
                                  className="w-full p-2 border rounded-lg bg-white text-slate-800"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Options Editor for Select / Radio Questions */}
                        {(q.type === 'select' || q.type === 'radio') && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Options & Pricing Rates</span>
                              <button
                                onClick={() => handleAddOption(qIndex)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md cursor-pointer"
                              >
                                + Add Option
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(q.options || []).map((opt, oIndex) => (
                                <div key={oIndex} className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
                                  <div className="flex-1 w-full">
                                    <input
                                      type="text"
                                      value={opt.label}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, 'label', e.target.value)}
                                      placeholder="Option Display Label"
                                      className="w-full p-1.5 text-xs font-semibold text-slate-900 border-b border-transparent focus:border-blue-500"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-[10px] text-slate-400 font-mono">val:</span>
                                    <input
                                      type="text"
                                      value={opt.value}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, 'value', e.target.value)}
                                      placeholder="value_key"
                                      className="w-24 p-1 text-xs font-mono text-slate-700 border rounded-md"
                                    />

                                    <span className="text-[10px] text-slate-400">Rate ($):</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={opt.rate !== undefined ? opt.rate : ''}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, 'rate', parseFloat(e.target.value) || 0)}
                                      placeholder="Rate"
                                      className="w-20 p-1 text-xs font-bold text-emerald-700 border rounded-md"
                                    />

                                    <span className="text-[10px] text-slate-400">Mult:</span>
                                    <input
                                      type="text"
                                      value={opt.multiplier !== undefined ? opt.multiplier : '1.00'}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, 'multiplier', e.target.value)}
                                      placeholder="1.00"
                                      className="w-16 p-1 text-xs font-bold text-blue-700 border rounded-md"
                                    />

                                    <button
                                      onClick={() => handleRemoveOption(qIndex, oIndex)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Bar */}
              <div className="sticky bottom-4 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-slate-700">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createNewVersion}
                    onChange={(e) => setCreateNewVersion(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-blue-600"
                  />
                  <span>Save as New Version (Increments v{config.config_version + 1})</span>
                </label>

                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 font-bold text-sm text-white rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  {savingConfig ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Config...
                    </>
                  ) : (
                    'Save Updates'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: LEADS VIEWER */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Captured Leads ({filteredLeads.length})</h3>
                <p className="text-xs text-slate-500">Homeowner estimates submitted through the wizard</p>
              </div>

              {/* Search filter */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, email..."
                  className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {loadingLeads ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Fetching leads...</p>
              </div>
            ) : leadsError ? (
              <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm">{leadsError}</div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 font-medium">
                No homeowner leads found matching your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                      <th className="py-3 px-4">Homeowner</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Estimate Range</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredLeads.map((lead) => {
                      const low = (lead.estimate_low || 0).toLocaleString();
                      const high = (lead.estimate_high || 0).toLocaleString();
                      const dateStr = lead.captured_at ? new Date(lead.captured_at).toLocaleString() : 'N/A';

                      return (
                        <tr key={lead.id || lead._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {lead.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-semibold text-slate-800">{lead.phone}</div>
                            <div className="text-xs text-slate-400">{lead.email || 'No email provided'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200">
                              ${low} – ${high}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                            v{lead.config_version}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {dateStr}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              View Specs
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEAD SPECS MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedLead.name}</h3>
                <p className="text-xs text-slate-500">{selectedLead.phone} • {selectedLead.email || 'No email'}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Estimate banner */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-300 block">Calculated Range</span>
                <span className="text-2xl font-black text-emerald-400">
                  ${(selectedLead.estimate_low || 0).toLocaleString()} – ${(selectedLead.estimate_high || 0).toLocaleString()}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-white/10 text-slate-300 text-xs font-mono rounded-lg">
                v{selectedLead.config_version}
              </span>
            </div>

            {/* Dynamic key-values (with graceful fallback for legacy fields) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Project Answer Specs</h4>
              {renderLeadAnswers(selectedLead.answers)}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
