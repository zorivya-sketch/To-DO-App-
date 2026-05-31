import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { syncing, lastSynced, syncFromSheet, currentMonth, availableMonths, changeMonth, handleCreateMonth } = useApp();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState('');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'goals', label: 'Goals', icon: '🎯' }
  ];

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'finance': return <Finance />;
      case 'tasks': return <Tasks />;
      case 'goals': return <Goals />;
      default: return <Dashboard />;
    }
  };

  const generateMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = -2; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
    // Merge with available months
    const allMonths = new Set([...months, ...availableMonths]);
    return Array.from(allMonths).sort((a, b) => {
      const parseMonth = (s) => {
        const [m, y] = s.split(' ');
        const mi = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m);
        return new Date(Number(y), mi, 1);
      };
      return parseMonth(b) - parseMonth(a);
    });
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-0 border-b border-indigo-500/20 px-4 py-3 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold gradient-text">
            ✨ Raj Life
          </h1>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Month Selector */}
            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="text-xs md:text-sm px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-all"
            >
              📅 {currentMonth}
            </button>
            {/* Sync Button */}
            <button
              onClick={() => syncFromSheet()}
              className={`text-xs px-2 py-1.5 rounded-lg transition-all ${syncing ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'}`}
              disabled={syncing}
            >
              {syncing ? '🔄' : '☁️'}
            </button>
          </div>
        </div>
        {/* Sync Status */}
        {lastSynced && (
          <p className="text-[10px] text-slate-500 text-right mt-1">
            Last synced: {lastSynced}
          </p>
        )}
      </header>

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowMonthPicker(false)}>
          <div className="glass-card p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              📅 Select Month
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {generateMonthOptions().map(month => (
                <button
                  key={month}
                  onClick={() => { changeMonth(month); setShowMonthPicker(false); }}
                  className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                    currentMonth === month
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-700 pt-3">
              <p className="text-xs text-slate-400 mb-2">Or create custom month:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMonthInput}
                  onChange={(e) => setNewMonthInput(e.target.value)}
                  placeholder="e.g., Jun 2026"
                  className="flex-1 p-2 rounded-lg bg-slate-800/80 border border-slate-600 text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (newMonthInput.trim()) {
                      handleCreateMonth(newMonthInput.trim());
                      setNewMonthInput('');
                      setShowMonthPicker(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {renderPage()}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-0 border-t border-indigo-500/20 md:hidden">
        <div className="flex justify-around items-center py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item flex flex-col items-center py-2 px-3 rounded-xl ${
                activeTab === tab.id ? 'active text-white' : 'text-slate-400'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Side Navigation - Desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-20 glass-card border-0 border-r border-indigo-500/20 flex-col items-center py-8 gap-4">
        <div className="text-2xl mb-6">✨</div>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-item flex flex-col items-center py-3 px-4 rounded-xl ${
              activeTab === tab.id ? 'active text-white' : 'text-slate-400 hover:text-white'
            }`}
            title={tab.label}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[9px] mt-1">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
