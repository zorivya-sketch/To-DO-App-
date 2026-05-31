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
  goals: []
};

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('rajlife-data');
    return saved ? JSON.parse(saved) : defaultData;
  });
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [availableMonths, setAvailableMonths] = useState([getCurrentMonth()]);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('rajlife-data', JSON.stringify(data));
  }, [data]);

  // Initial setup & sync
  useEffect(() => {
    const init = async () => {
      await setupSheets();
      await syncFromSheet();
      const months = await getAvailableMonths();
      setAvailableMonths(months);
    };
    init();
  }, []);

  // Sync from Google Sheets
  const syncFromSheet = useCallback(async (month) => {
    setSyncing(true);
    setSyncError(null);
    try {
      const sheetData = await getAllData(month || currentMonth);
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
          goals: sheetData.goals || []
        });
        setLastSynced(new Date().toLocaleTimeString('en-IN'));
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
    setAvailableMonths(months);
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
    // Sync to Google Sheets
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
    // Sync to Google Sheets
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

  return (
    <AppContext.Provider value={{
      data,
      currentMonth,
      availableMonths,
      syncing,
      lastSynced,
      syncError,
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
      deleteGoal
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
