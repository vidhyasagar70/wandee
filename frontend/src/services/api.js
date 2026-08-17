/**
 * API service for communicating with the backend estimator API.
 */

const rawBase = import.meta.env.VITE_API_BASE_URL || '/api';
// Normalize base URL so it always ends with /api
const getNormalizedApiBase = (url) => {
  if (!url || url === '/api') return '/api';
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE = getNormalizedApiBase(rawBase);
const TOKEN_KEY = 'wandee_admin_token';



export const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY) || '';
};

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const getHeaders = (token = '') => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const authToken = token || getStoredToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

/**
 * Fetch the active configuration for the public estimator.
 */
export const fetchActiveConfig = async () => {
  const response = await fetch(`${API_BASE}/config/active`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch active configuration');
  }
  return data;
};

/**
 * Submit answers and contact info for calculation & lead capture.
 * @param {Object} payload { name, phone, email, answers }
 */
export const submitEstimate = async (payload) => {
  const response = await fetch(`${API_BASE}/estimate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error || 'Failed to submit estimate');
    err.field = data.field;
    throw err;
  }
  return data;
};

/**
 * Fetch the complete configuration (including inactive questions) for Admin panel.
 * @param {string} token Optional token override
 */
export const fetchAdminConfig = async (token = '') => {
  const response = await fetch(`${API_BASE}/admin/config`, {
    method: 'GET',
    headers: getHeaders(token)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Unauthorized or failed to fetch admin config');
  }
  return data;
};

/**
 * Update the configuration in Admin panel.
 * @param {Object} configData Entire config object to update
 * @param {string} token Optional token override
 */
export const updateAdminConfig = async (configData, token = '') => {
  const response = await fetch(`${API_BASE}/admin/config`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(configData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.details || 'Failed to update configuration');
  }
  return data;
};

/**
 * Fetch all leads for Admin panel.
 * @param {string} token Optional token override
 */
export const fetchAdminLeads = async (token = '') => {
  const response = await fetch(`${API_BASE}/admin/leads`, {
    method: 'GET',
    headers: getHeaders(token)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Unauthorized or failed to fetch leads');
  }
  return data;
};
