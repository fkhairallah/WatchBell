import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  CrewMember, WatchConfig, AppSettings, WatchShift,
  ScheduleMode, StandardConfig, DayNightConfig, CustomSlot,
} from '../types';
import { saveToStorage, loadFromStorage } from '../services/storageService';
import { generateSchedule } from '../utils/scheduleLogic';
import { isNightTime } from '../utils/sunCalc';

interface AppContextType {
  crew: CrewMember[];
  addCrewMember: (name: string) => void;
  removeCrewMember: (id: string) => void;
  reorderCrew: (newOrder: CrewMember[]) => void;
  updateCrewMember: (id: string, updates: Partial<CrewMember>) => void;

  config: WatchConfig;
  updateConfig: (updates: Partial<WatchConfig>) => void;
  setScheduleMode: (mode: ScheduleMode) => void;
  updateStandardConfig: (updates: Partial<StandardConfig>) => void;
  updateDayNightConfig: (updates: Partial<DayNightConfig>) => void;
  addCustomSlot: () => void;
  removeCustomSlot: (id: string) => void;
  updateCustomSlot: (id: string, updates: Partial<CustomSlot>) => void;
  reorderCustomSlots: (newOrder: CustomSlot[]) => void;
  autoFillCustomSlots: () => void;

  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  schedule: WatchShift[];
  refreshSchedule: () => void;

  currentRoute: string;
  navigateTo: (path: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SAMPLE_CREW: CrewMember[] = [
  { id: 'c-1', name: 'Alex (Skipper)', isActive: true },
  { id: 'c-2', name: 'Sarah (Nav)', isActive: true },
  { id: 'c-3', name: 'James', isActive: true },
  { id: 'c-4', name: 'Mia', isActive: true },
  { id: 'c-5', name: 'Robert', isActive: true },
];

const DEFAULT_CONFIG: WatchConfig = {
  mode: 'standard',
  startTime: '20:00',
  startDate: new Date().toISOString(),
  standard: {
    watchDurationHours: 4,
    captainsHourEnabled: true,
    captainsHourStart: 18,
  },
  dayNight: {
    dayWatchDurationHours: 4,
    nightWatchDurationHours: 3,
    dayStartHour: 6,
    nightStartHour: 20,
    captainsHourEnabled: false,
    captainsHourStart: 18,
  },
  custom: {
    slots: [],
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  nightVision: false,
  autoNightVision: false,
  shipTimeOffset: 0,
};

/** Migrate old flat WatchConfig to the new nested format. */
function migrateConfig(saved: any): WatchConfig {
  if (!saved || typeof saved !== 'object') return DEFAULT_CONFIG;

  // Already new format
  if (saved.mode) {
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      standard: { ...DEFAULT_CONFIG.standard, ...(saved.standard ?? {}) },
      dayNight: { ...DEFAULT_CONFIG.dayNight, ...(saved.dayNight ?? {}) },
      custom: { ...DEFAULT_CONFIG.custom, ...(saved.custom ?? {}) },
    };
  }

  // Old flat format — migrate to standard mode
  return {
    ...DEFAULT_CONFIG,
    startTime: saved.startTime ?? DEFAULT_CONFIG.startTime,
    startDate: saved.startDate ?? DEFAULT_CONFIG.startDate,
    standard: {
      watchDurationHours: saved.watchDurationHours ?? 4,
      captainsHourEnabled: saved.captainsHourEnabled ?? true,
      captainsHourStart: saved.captainsHourStart ?? 18,
    },
  };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [crew, setCrew] = useState<CrewMember[]>(() => loadFromStorage('wm_crew', SAMPLE_CREW));
  const autoIntervalRef = useRef<number | null>(null);

  const [config, setConfig] = useState<WatchConfig>(() =>
    migrateConfig(loadFromStorage('wm_config', {}))
  );

  const [settings, setSettings] = useState<AppSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...loadFromStorage('wm_settings', {}),
  }));

  const [schedule, setSchedule] = useState<WatchShift[]>([]);

  const [currentRoute, setCurrentRoute] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => { window.location.hash = path; };

  useEffect(() => { saveToStorage('wm_crew', crew); refreshSchedule(); }, [crew]);
  useEffect(() => { saveToStorage('wm_config', config); refreshSchedule(); }, [config]);
  useEffect(() => { refreshSchedule(); }, [settings.shipTimeOffset]);

  useEffect(() => {
    saveToStorage('wm_settings', settings);
    document.body.classList.toggle('night-vision-filter', settings.nightVision);
    document.documentElement.classList.toggle(
      'dark',
      settings.theme === 'dark' && !settings.nightVision
    );
  }, [settings]);

  // Auto night vision
  useEffect(() => {
    const clearAuto = () => {
      if (autoIntervalRef.current !== null) {
        window.clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
    if (!settings.autoNightVision) { clearAuto(); return; }

    const startAuto = (lat: number, lng: number) => {
      const apply = () => {
        const night = isNightTime(lat, lng);
        setSettings(prev => prev.nightVision !== night ? { ...prev, nightVision: night } : prev);
      };
      apply();
      autoIntervalRef.current = window.setInterval(apply, 60000);
    };

    navigator.geolocation.getCurrentPosition(
      pos => startAuto(pos.coords.latitude, pos.coords.longitude),
      () => {}
    );
    return clearAuto;
  }, [settings.autoNightVision]);

  const refreshSchedule = () => setSchedule(generateSchedule(crew, config, 7, settings.shipTimeOffset));

  // ── Crew ──────────────────────────────────────────────────────────────────

  const addCrewMember = (name: string) =>
    setCrew(prev => [...prev, { id: crypto.randomUUID(), name, isActive: true }]);

  const removeCrewMember = (id: string) =>
    setCrew(prev => prev.filter(c => c.id !== id));

  const updateCrewMember = (id: string, updates: Partial<CrewMember>) =>
    setCrew(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

  const reorderCrew = (newOrder: CrewMember[]) => setCrew(newOrder);

  // ── Config ────────────────────────────────────────────────────────────────

  const updateConfig = (updates: Partial<WatchConfig>) =>
    setConfig(prev => ({ ...prev, ...updates }));

  const setScheduleMode = (mode: ScheduleMode) =>
    setConfig(prev => ({ ...prev, mode }));

  const updateStandardConfig = (updates: Partial<StandardConfig>) =>
    setConfig(prev => ({ ...prev, standard: { ...prev.standard, ...updates } }));

  const updateDayNightConfig = (updates: Partial<DayNightConfig>) =>
    setConfig(prev => ({ ...prev, dayNight: { ...prev.dayNight, ...updates } }));

  const addCustomSlot = () =>
    setConfig(prev => ({
      ...prev,
      custom: {
        slots: [
          ...prev.custom.slots,
          { id: crypto.randomUUID(), durationHours: 4, crewMemberId: null },
        ],
      },
    }));

  const removeCustomSlot = (id: string) =>
    setConfig(prev => ({
      ...prev,
      custom: { slots: prev.custom.slots.filter(s => s.id !== id) },
    }));

  const updateCustomSlot = (id: string, updates: Partial<CustomSlot>) =>
    setConfig(prev => ({
      ...prev,
      custom: {
        slots: prev.custom.slots.map(s => s.id === id ? { ...s, ...updates } : s),
      },
    }));

  const reorderCustomSlots = (newOrder: CustomSlot[]) =>
    setConfig(prev => ({ ...prev, custom: { slots: newOrder } }));

  const autoFillCustomSlots = () => {
    const activeCrew = crew.filter(c => c.isActive);
    setConfig(prev => ({
      ...prev,
      custom: {
        slots: activeCrew.map(c => ({
          id: crypto.randomUUID(),
          durationHours: prev.standard.watchDurationHours,
          crewMemberId: c.id,
        })),
      },
    }));
  };

  // ── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = (updates: Partial<AppSettings>) =>
    setSettings(prev => ({ ...prev, ...updates }));

  return (
    <AppContext.Provider value={{
      crew, addCrewMember, removeCrewMember, reorderCrew, updateCrewMember,
      config, updateConfig, setScheduleMode,
      updateStandardConfig, updateDayNightConfig,
      addCustomSlot, removeCustomSlot, updateCustomSlot, reorderCustomSlots, autoFillCustomSlots,
      settings, updateSettings,
      schedule, refreshSchedule,
      currentRoute, navigateTo,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
