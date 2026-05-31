import { GOOGLE_SCRIPT_URL, getCurrentMonth } from '../config';

const isConfigured = () => {
  return GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
};

/**
 * Helper: fetch with redirect handling for Google Apps Script
 */
const gFetch = async (url, options = {}) => {
  const res = await fetch(url, { ...options, redirect: 'follow' });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', text.substring(0, 200));
    return null;
  }
};

/**
 * Setup all sheets with headers (call once)
 */
export const setupSheets = async () => {
  if (!isConfigured()) return { error: 'Not configured' };
  try {
    return await gFetch(`${GOOGLE_SCRIPT_URL}?action=setup`);
  } catch (err) {
    console.error('Setup error:', err);
    return { error: err.message };
  }
};

/**
 * Get all data from Google Sheets
 */
export const getAllData = async (month) => {
  if (!isConfigured()) return null;
  try {
    const url = month 
      ? `${GOOGLE_SCRIPT_URL}?action=getAll&month=${encodeURIComponent(month)}`
      : `${GOOGLE_SCRIPT_URL}?action=getAll`;
    const json = await gFetch(url);
    if (json && json.success) return json.data;
    return null;
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
};

/**
 * Add an item to Google Sheets
 */
export const addItemToSheet = async (category, item, month) => {
  if (!isConfigured()) return null;
  try {
    return await gFetch(`${GOOGLE_SCRIPT_URL}?action=add`, {
      method: 'POST',
      body: JSON.stringify({ category, item, month: month || getCurrentMonth() })
    });
  } catch (err) {
    console.error('Add error:', err);
    return null;
  }
};

/**
 * Delete an item from Google Sheets
 */
export const deleteItemFromSheet = async (category, id) => {
  if (!isConfigured()) return null;
  try {
    return await gFetch(`${GOOGLE_SCRIPT_URL}?action=delete&category=${category}&id=${id}`);
  } catch (err) {
    console.error('Delete error:', err);
    return null;
  }
};

/**
 * Update an item in Google Sheets (toggle done, update progress)
 */
export const updateItemInSheet = async (category, id, updates) => {
  if (!isConfigured()) return null;
  try {
    return await gFetch(`${GOOGLE_SCRIPT_URL}?action=update`, {
      method: 'POST',
      body: JSON.stringify({ category, id, updates })
    });
  } catch (err) {
    console.error('Update error:', err);
    return null;
  }
};

/**
 * Get available months
 */
export const getAvailableMonths = async () => {
  if (!isConfigured()) return [getCurrentMonth()];
  try {
    const json = await gFetch(`${GOOGLE_SCRIPT_URL}?action=getMonths`);
    if (json && json.success) return json.months;
    return [getCurrentMonth()];
  } catch (err) {
    console.error('Months error:', err);
    return [getCurrentMonth()];
  }
};

/**
 * Create a new month
 */
export const createNewMonth = async (month) => {
  if (!isConfigured()) return { success: true };
  try {
    return await gFetch(`${GOOGLE_SCRIPT_URL}?action=createMonth&month=${encodeURIComponent(month)}`);
  } catch (err) {
    console.error('Create month error:', err);
    return { error: err.message };
  }
};

/**
 * Get password from Google Sheets
 */
export const getPasswordFromSheet = async () => {
  if (!isConfigured()) return null;
  try {
    const json = await gFetch(`${GOOGLE_SCRIPT_URL}?action=getPassword`);
    if (json && json.success) return json.password;
    return null;
  } catch (err) {
    console.error('Get password error:', err);
    return null;
  }
};

/**
 * Save password to Google Sheets
 */
export const savePasswordToSheet = async (password) => {
  if (!isConfigured()) return null;
  try {
    return await gFetch(`${GOOGLE_SCRIPT_URL}?action=setPassword&password=${encodeURIComponent(password)}`);
  } catch (err) {
    console.error('Save password error:', err);
    return null;
  }
};
