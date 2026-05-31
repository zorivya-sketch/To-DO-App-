import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    localStorage.setItem('rajlife-data', JSON.stringify(data));
  }, [data]);

  // Finance Functions
  const addFinanceItem = (category, item) => {
    setData(prev => ({
      ...prev,
      finance: {
        ...prev.finance,
        [category]: [...prev.finance[category], { ...item, id: Date.now(), createdAt: new Date().toISOString() }]
      }
    }));
  };

  const deleteFinanceItem = (category, id) => {
    setData(prev => ({
      ...prev,
      finance: {
        ...prev.finance,
        [category]: prev.finance[category].filter(item => item.id !== id)
      }
    }));
  };

  // Task Functions
  const addTask = (task) => {
    setData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { ...task, id: Date.now(), done: false, createdAt: new Date().toISOString() }]
    }));
  };

  const toggleTask = (id) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    }));
  };

  const deleteTask = (id) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  // Goal Functions
  const addGoal = (goal) => {
    setData(prev => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: Date.now(), done: false, progress: 0, createdAt: new Date().toISOString() }]
    }));
  };

  const updateGoalProgress = (id, progress) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, progress, done: progress >= 100 } : g)
    }));
  };

  const toggleGoal = (id) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, done: !g.done, progress: !g.done ? 100 : g.progress } : g)
    }));
  };

  const deleteGoal = (id) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
  };

  return (
    <AppContext.Provider value={{
      data,
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
