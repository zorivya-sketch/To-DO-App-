// Google Apps Script Web App URL
// Replace this with your deployed Apps Script URL
// Follow GOOGLE_SHEETS_SETUP.md for instructions
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwc86vpBHSryzj2vWOap2QRioQixWW4coUPnyPLfHjvNbTj5ToTOEkzj7I0ikl4COKB5A/exec';

// Get current month string
export const getCurrentMonth = () => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};
