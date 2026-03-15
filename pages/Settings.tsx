import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, Eye, Clock, RotateCcw, Sunset, Smartphone } from 'lucide-react';
import { version } from '../package.json';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const handleReset = () => {
    if (window.confirm("Reset all settings to default?")) {
       localStorage.clear();
       window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h1>

      {/* Appearance */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Appearance</h2>
        <div className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-2 flex">
          <button
            onClick={() => updateSettings({ theme: 'light' })}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all ${
              settings.theme === 'light'
                ? 'bg-gray-100 text-slate-900 font-medium'
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Light</span>
          </button>
          <button
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all ${
              settings.theme === 'dark'
                ? 'bg-slate-700 text-white font-medium'
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Dark</span>
          </button>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 divide-y divide-gray-100 dark:divide-slate-600">
          {/* Manual toggle — disabled when auto is on */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${settings.nightVision ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'}`}>
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Night Vision Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {settings.autoNightVision ? 'Controlled automatically by sunset.' : 'Red tint to preserve eyes at night.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => !settings.autoNightVision && updateSettings({ nightVision: !settings.nightVision })}
              disabled={settings.autoNightVision}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.autoNightVision ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${settings.nightVision ? 'bg-red-600' : 'bg-gray-200 dark:bg-slate-600'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.nightVision ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Auto sunset/sunrise toggle */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${settings.autoNightVision ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'}`}>
                <Sunset className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Auto at Sunset</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Uses your location to detect dusk &amp; dawn.</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ autoNightVision: !settings.autoNightVision })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.autoNightVision ? 'bg-orange-500' : 'bg-gray-200 dark:bg-slate-600'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.autoNightVision ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Ship Time */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time & Location</h2>
        <div className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 divide-y divide-gray-100 dark:divide-slate-600">

          {/* Use phone time toggle */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${settings.usePhoneTime ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'}`}>
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Sync to Phone Time</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {settings.usePhoneTime
                    ? `Using device timezone (UTC${(() => { const o = -new Date().getTimezoneOffset() / 60; return (o >= 0 ? '+' : '') + o; })()})`
                    : 'Use manual Zulu offset below.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ usePhoneTime: !settings.usePhoneTime })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.usePhoneTime ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.usePhoneTime ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* 12 / 24-hour clock */}
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Clock Format</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">How times are displayed throughout the app.</p>
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-600 rounded-lg p-1 flex">
              <button
                onClick={() => updateSettings({ use24Hour: true })}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${settings.use24Hour ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}
              >24h</button>
              <button
                onClick={() => updateSettings({ use24Hour: false })}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${!settings.use24Hour ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}
              >12h</button>
            </div>
          </div>

          {/* Manual offset */}
          <div className={`p-6 space-y-4 ${settings.usePhoneTime ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Manual Zulu Offset</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Adjust the ship's clock relative to UTC as you cross timezones.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => updateSettings({ shipTimeOffset: settings.shipTimeOffset - 1 })}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center font-bold text-lg hover:bg-gray-200 dark:hover:bg-slate-500"
              >-</button>
              <div className="flex-1 text-center font-mono text-xl font-medium dark:text-white">
                {settings.shipTimeOffset > 0 ? '+' : ''}{settings.shipTimeOffset} Hrs
              </div>
              <button
                onClick={() => updateSettings({ shipTimeOffset: settings.shipTimeOffset + 1 })}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center font-bold text-lg hover:bg-gray-200 dark:hover:bg-slate-500"
              >+</button>
            </div>
          </div>

        </div>
      </section>

      {/* Danger Zone */}
       <section className="pt-6 border-t border-gray-200 dark:border-slate-800">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">WatchMaker v{version}</p>
        <button 
            onClick={handleReset}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
        >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Application Data</span>
        </button>
       </section>

    </div>
  );
};