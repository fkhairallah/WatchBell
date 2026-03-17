import React from 'react';
import { Home, Users, Settings, Clock, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, currentRoute } = useApp();

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors duration-200 bg-transparent border-0 cursor-pointer ${
      isActive 
        ? 'text-blue-600 dark:text-blue-400' 
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  const isActive = (path: string, exact = false) => {
    if (exact) return currentRoute === path;
    return currentRoute.startsWith(path);
  };

  return (
    <div className={`min-h-screen flex flex-col ${settings.theme === 'dark' ? 'dark bg-slate-900 text-white' : 'bg-gray-50'}`}>
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 pb-3 pt-safe shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">WatchBell</h1>
          </div>
          {settings.nightVision && (
            <span className="text-xs font-bold text-red-600 border border-red-600 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
              Night Vision
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-30 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 pb-safe">
        <div className="max-w-3xl mx-auto h-16 flex items-center justify-around px-2">
          <a href="#/" className={navClass({ isActive: isActive('/', true) })}>
            <Home className="w-6 h-6" />
            <span>Dashboard</span>
          </a>
          <a href="#/crew" className={navClass({ isActive: isActive('/crew') })}>
            <Users className="w-6 h-6" />
            <span>Crew</span>
          </a>
          <a href="#/config" className={navClass({ isActive: isActive('/config') })}>
            <Clock className="w-6 h-6" />
            <span>Schedule</span>
          </a>
          <a href="#/settings" className={navClass({ isActive: isActive('/settings') })}>
            <Settings className="w-6 h-6" />
            <span>Settings</span>
          </a>
        </div>
      </nav>
    </div>
  );
};