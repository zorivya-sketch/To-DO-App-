import { GOOGLE_SCRIPT_URL, getCurrentMonth } from '../config';

const isConfigured = () => {
  return GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
};

/**
 * Setup all sheets with headers (call once)
 */
export const setupSheets = async () => {
  if (!isConfigured()) return { error: 'Not configured' };
  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=setup`);
    return await res.json();
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
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) return json.data;
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
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=add`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ category, item, month: month || getCurrentMonth() })
    });
    return await res.json();
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
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=delete&category=${category}&id=${id}`);
    return await res.json();
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
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=update`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ category, id, updates })
    });
    return await res.json();
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
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getMonths`);
    const json = await res.json();
    if (json.success) return json.months;
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
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=createMonth&month=${encodeURIComponent(month)}`);
    return await res.json();
  } catch (err) {
    console.error('Create month error:', err);
    return { error: err.message };
  }
};
