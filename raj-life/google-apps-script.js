/**
 * RAJ LIFE - Google Apps Script Web API
 * This script connects your Raj Life app to Google Sheets
 * 
 * SETUP: Deploy this as a Web App (Extensions > Apps Script > Deploy > Web App)
 * Set "Who has access" to "Anyone"
 */

const SPREADSHEET_ID = '1zhZA7C7h2oqoB4PPyvp_ihjXP3UrQRNIlGvTjEwfojk';

// Sheet names for each section
const SHEET_NAMES = {
  income: 'Income',
  expenses: 'Expenses', 
  loans: 'Loans',
  creditCards: 'CreditCards',
  otherIncome: 'OtherIncome',
  tasks: 'Tasks',
  goals: 'Goals'
};

// Headers for each sheet
const HEADERS = {
  income: ['ID', 'Title', 'Amount', 'Description', 'Created At', 'Month'],
  expenses: ['ID', 'Title', 'Amount', 'Description', 'Created At', 'Month'],
  loans: ['ID', 'Title', 'Amount', 'Person', 'Description', 'Created At', 'Month'],
  creditCards: ['ID', 'Title', 'Amount', 'Description', 'Created At', 'Month'],
  otherIncome: ['ID', 'Title', 'Amount', 'Description', 'Created At', 'Month'],
  tasks: ['ID', 'Title', 'Type', 'Priority', 'Description', 'Done', 'Created At', 'Month'],
  goals: ['ID', 'Title', 'Category', 'Deadline', 'Description', 'Progress', 'Done', 'Created At', 'Month']
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    
    let result;
    
    switch(action) {
      case 'setup':
        result = setupSheets();
        break;
      case 'getAll':
        result = getAllData(params.month);
        break;
      case 'add':
        const postData = JSON.parse(e.postData.contents);
        result = addItem(postData.category, postData.item, postData.month);
        break;
      case 'delete':
        result = deleteItem(params.category, params.id);
        break;
      case 'update':
        const updateData = JSON.parse(e.postData.contents);
        result = updateItem(updateData.category, updateData.id, updateData.updates);
        break;
      case 'getMonths':
        result = getAvailableMonths();
        break;
      case 'createMonth':
        result = createNewMonth(params.month);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Setup all sheets with headers
 */
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  Object.keys(SHEET_NAMES).forEach(key => {
    let sheet = ss.getSheetByName(SHEET_NAMES[key]);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAMES[key]);
    }
    // Set headers if empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS[key].length).setValues([HEADERS[key]]);
      sheet.getRange(1, 1, 1, HEADERS[key].length)
        .setFontWeight('bold')
        .setBackground('#6366f1')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });
  
  return { success: true, message: 'All sheets created successfully!' };
}

/**
 * Get all data from all sheets (optionally filtered by month)
 */
function getAllData(month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = {};
  
  Object.keys(SHEET_NAMES).forEach(key => {
    const sheet = ss.getSheetByName(SHEET_NAMES[key]);
    if (!sheet || sheet.getLastRow() <= 1) {
      data[key] = [];
      return;
    }
    
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const items = [];
    
    for (let i = 1; i < rows.length; i++) {
      const item = {};
      headers.forEach((header, index) => {
        const colName = header.toLowerCase().replace(/\s+/g, '');
        if (colName === 'id') item.id = rows[i][index];
        else if (colName === 'title') item.title = rows[i][index];
        else if (colName === 'amount') item.amount = rows[i][index];
        else if (colName === 'description') item.description = rows[i][index];
        else if (colName === 'person') item.person = rows[i][index];
        else if (colName === 'type') item.type = rows[i][index];
        else if (colName === 'priority') item.priority = rows[i][index];
        else if (colName === 'category') item.category = rows[i][index];
        else if (colName === 'deadline') item.deadline = rows[i][index];
        else if (colName === 'progress') item.progress = Number(rows[i][index]) || 0;
        else if (colName === 'done') item.done = rows[i][index] === true || rows[i][index] === 'TRUE' || rows[i][index] === 'true';
        else if (colName === 'createdat') item.createdAt = rows[i][index];
        else if (colName === 'month') item.month = rows[i][index];
      });
      
      // Filter by month if specified
      if (!month || item.month === month) {
        items.push(item);
      }
    }
    
    data[key] = items;
  });
  
  return { success: true, data: data };
}

/**
 * Add an item to a specific sheet
 */
function addItem(category, item, month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = SHEET_NAMES[category];
  
  if (!sheetName) return { error: 'Invalid category: ' + category };
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, HEADERS[category].length).setValues([HEADERS[category]]);
    sheet.getRange(1, 1, 1, HEADERS[category].length)
      .setFontWeight('bold')
      .setBackground('#6366f1')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  const currentMonth = month || getCurrentMonth();
  const id = Date.now();
  const createdAt = new Date().toISOString();
  
  let row;
  switch(category) {
    case 'income':
    case 'expenses':
    case 'otherIncome':
    case 'creditCards':
      row = [id, item.title, item.amount, item.description || '', createdAt, currentMonth];
      break;
    case 'loans':
      row = [id, item.title, item.amount, item.person || '', item.description || '', createdAt, currentMonth];
      break;
    case 'tasks':
      row = [id, item.title, item.type || 'daily', item.priority || 'medium', item.description || '', false, createdAt, currentMonth];
      break;
    case 'goals':
      row = [id, item.title, item.category || 'personal', item.deadline || '', item.description || '', 0, false, createdAt, currentMonth];
      break;
  }
  
  sheet.appendRow(row);
  
  return { success: true, id: id, message: 'Item added to ' + sheetName };
}

/**
 * Delete an item by ID from a specific sheet
 */
function deleteItem(category, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = SHEET_NAMES[category];
  
  if (!sheetName) return { error: 'Invalid category: ' + category };
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found: ' + sheetName };
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Item deleted' };
    }
  }
  
  return { error: 'Item not found with ID: ' + id };
}

/**
 * Update an item (for toggling tasks/goals done status, updating progress)
 */
function updateItem(category, id, updates) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = SHEET_NAMES[category];
  
  if (!sheetName) return { error: 'Invalid category: ' + category };
  
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Sheet not found: ' + sheetName };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      // Update specified fields
      Object.keys(updates).forEach(field => {
        let colName;
        if (field === 'done') colName = 'Done';
        else if (field === 'progress') colName = 'Progress';
        else if (field === 'title') colName = 'Title';
        else return;
        
        const colIndex = headers.indexOf(colName);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[field]);
        }
      });
      
      return { success: true, message: 'Item updated' };
    }
  }
  
  return { error: 'Item not found with ID: ' + id };
}

/**
 * Get available months from data
 */
function getAvailableMonths() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const months = new Set();
  
  Object.keys(SHEET_NAMES).forEach(key => {
    const sheet = ss.getSheetByName(SHEET_NAMES[key]);
    if (!sheet || sheet.getLastRow() <= 1) return;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const monthCol = headers.indexOf('Month');
    
    if (monthCol === -1) return;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][monthCol]) {
        months.add(data[i][monthCol]);
      }
    }
  });
  
  // Always include current month
  months.add(getCurrentMonth());
  
  return { success: true, months: Array.from(months).sort().reverse() };
}

/**
 * Create entries marker for a new month
 */
function createNewMonth(month) {
  // Simply return success - items will be tagged with the new month when added
  return { success: true, message: 'Month ' + month + ' is ready! Add items and they will be saved under this month.' };
}

/**
 * Helper: Get current month string
 */
function getCurrentMonth() {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[now.getMonth()] + ' ' + now.getFullYear();
}
