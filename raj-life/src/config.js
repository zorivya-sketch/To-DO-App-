// Google Apps Script Web App URL
// Replace this with your deployed Apps Script URL
// Follow GOOGLE_SHEETS_SETUP.md for instructions
export const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

// Get current month string
export const getCurrentMonth = () => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};
