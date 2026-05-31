import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentMonth } from '../config';
import {
  getAllData,
  addItemToSheet,
  deleteItemFromSheet,
  updateItemInSheet,
  getAvailableMonths,
  createNewMonth,
  setupSheets
} from '../services/googleSheets';

const AppContext = createContext();

const defaultData = {
  finance: {
    income: [],
    expenses: [],
    loans: [],
    creditCards: [],
    otherIncome: []
  },
  tasks: [],
  goals: [],
  payments: []
};

export function AppProvider({ children }) {
  const [data, setData] = useState(defaultData);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [availableMonths, setAvailableMonths] = useState([getCurrentMonth()]);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('rajlife-password') || '1234';
  });
  const [reminders, setReminders] = useState([]);

  // Check password on load
  useEffect(() => {
    const savedPass = localStorage.getItem('rajlife-password');
    if (!savedPass) {
      localStorage.setItem('rajlife-password', '1234');
    }
  }, []);

  // Save password
  const changePassword = (newPass) => {
    setPassword(newPass);
    localStorage.setItem('rajlife-password', newPass);
  };

  const unlock = (inputPass) => {
    if (inputPass === password) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  // Initial setup & sync from Google Sheets
  useEffect(() => {
    if (!isLocked) {
      const init = async () => {
        await setupSheets();
        await syncFromSheet();
        const months = await getAvailableMonths();
        if (months && months.length > 0) setAvailableMonths(months);
      };
      init();
    }
  }, [isLocked]);

  // Calculate reminders whenever payments change
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const upcoming = data.payments.filter(p => {
      if (p.done) return false;
      const payDate = new Date(p.dueDate);
      payDate.setHours(0, 0, 0, 0);
      return payDate >= today && payDate <= threeDaysLater;
    });
    setReminders(upcoming);
  }, [data.payments]);

  // Sync from Google Sheets - loads ALL data
  const syncFromSheet = useCallback(async (month) => {
    setSyncing(true);
    setSyncError(null);
    try {
      const targetMonth = month || currentMonth;
      const sheetData = await getAllData(targetMonth);
      if (sheetData) {
        setData({
          finance: {
            income: sheetData.income || [],
            expenses: sheetData.expenses || [],
            loans: sheetData.loans || [],
            creditCards: sheetData.creditCards || [],
            otherIncome: sheetData.otherIncome || []
          },
          tasks: sheetData.tasks || [],
          goals: sheetData.goals || [],
          payments: sheetData.payments || []
        });
        setLastSynced(new Date().toLocaleTimeString('en-IN'));
        setSyncError(null);
      } else {
        setSyncError('Could not load data');
      }
    } catch (err) {
      setSyncError('Sync failed');
      console.error('Sync error:', err);
    }
    setSyncing(false);
  }, [currentMonth]);

  // Change month
  const changeMonth = async (month) => {
    setCurrentMonth(month);
    await syncFromSheet(month);
  };

  // Create new month
  const handleCreateMonth = async (month) => {
    await createNewMonth(month);
    const months = await getAvailableMonths();
    if (months) setAvailableMonths(months);
    setCurrentMonth(month);
    await syncFromSheet(month);
  };

  // Finance Functions
  const addFinanceItem = async (category, item) => {
    const newItem = { ...item, id: Date.now(), createdAt: new Date().toISOString(), month: currentMonth };
    setData(prev => ({
      ...prev,
      finance: {
        ...prev.finance,
        [category]: [...prev.finance[category], newItem]
      }
    }));
    await addItemToSheet(category, item, currentMonth);
  };

  const deleteFinanceItem = async (category, id) => {
    setData(prev => ({
      ...prev,
      finance: {
        ...prev.finance,
        [category]: prev.finance[category].filter(item => item.id !== id)
      }
    }));
    await deleteItemFromSheet(category, id);
  };

  // Task Functions
  const addTask = async (task) => {
    const newTask = { ...task, id: Date.now(), done: false, createdAt: new Date().toISOString(), month: currentMonth };
    setData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
    await addItemToSheet('tasks', task, currentMonth);
  };

  const toggleTask = async (id) => {
    let newDone;
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === id) {
          newDone = !t.done;
          return { ...t, done: newDone };
        }
        return t;
      })
    }));
    await updateItemInSheet('tasks', id, { done: newDone });
  };

  const deleteTask = async (id) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
    await deleteItemFromSheet('tasks', id);
  };

  // Goal Functions
  const addGoal = async (goal) => {
    const newGoal = { ...goal, id: Date.now(), done: false, progress: 0, createdAt: new Date().toISOString(), month: currentMonth };
    setData(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal]
    }));
    await addItemToSheet('goals', goal, currentMonth);
  };

  const updateGoalProgress = async (id, progress) => {
    const done = progress >= 100;
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, progress, done } : g)
    }));
    await updateItemInSheet('goals', id, { progress, done });
  };

  const toggleGoal = async (id) => {
    let newDone, newProgress;
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id === id) {
          newDone = !g.done;
          newProgress = newDone ? 100 : g.progress;
          return { ...g, done: newDone, progress: newProgress };
        }
        return g;
      })
    }));
    await updateItemInSheet('goals', id, { done: newDone, progress: newProgress });
  };

  const deleteGoal = async (id) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
    await deleteItemFromSheet('goals', id);
  };

  // Payment Functions
  const addPayment = async (payment) => {
    const newPayment = { ...payment, id: Date.now(), done: false, createdAt: new Date().toISOString(), month: currentMonth };
    setData(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment]
    }));
    await addItemToSheet('payments', payment, currentMonth);
  };

  const togglePayment = async (id) => {
    let newDone;
    setData(prev => ({
      ...prev,
      payments: prev.payments.map(p => {
        if (p.id === id) {
          newDone = !p.done;
          return { ...p, done: newDone };
        }
        return p;
      })
    }));
    await updateItemInSheet('payments', id, { done: newDone });
  };

  const deletePayment = async (id) => {
    setData(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== id)
    }));
    await deleteItemFromSheet('payments', id);
  };

  return (
    <AppContext.Provider value={{
      data,
      currentMonth,
      availableMonths,
      syncing,
      lastSynced,
      syncError,
      isLocked,
      reminders,
      password,
      unlock,
      changePassword,
      changeMonth,
      handleCreateMonth,
      syncFromSheet,
      addFinanceItem,
      deleteFinanceItem,
      addTask,
      toggleTask,
      deleteTask,
      addGoal,
      updateGoalProgress,
      toggleGoal,
      deleteGoal,
      addPayment,
      togglePayment,
      deletePayment
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
