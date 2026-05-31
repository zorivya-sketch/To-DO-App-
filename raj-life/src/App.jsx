import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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

  return (
    <AppProvider>
      <div className="min-h-screen pb-20 md:pb-0 md:pl-20">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-card border-0 border-b border-indigo-500/20 px-4 py-3 md:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold gradient-text">
              ✨ Raj Life
            </h1>
            <span className="text-xs md:text-sm text-slate-400">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

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
    </AppProvider>
  );
}

export default App;
