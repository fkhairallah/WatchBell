import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/scheduleLogic';
import { User, Anchor, Sun, Moon } from 'lucide-react';

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.ceil(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
};

export const Dashboard: React.FC = () => {
  const { schedule, settings, effectiveOffset, crew, navigateTo } = useApp();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  if (crew.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold dark:text-white">No Crew Added</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs">Add crew members and configure a schedule to get started.</p>
        <button 
          onClick={() => navigateTo('/crew')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Manage Crew
        </button>
      </div>
    );
  }

  // Find current shift
  const currentShiftIndex = schedule.findIndex(s => s.startTime <= now && s.endTime > now);
  const currentShift = currentShiftIndex !== -1 ? schedule[currentShiftIndex] : null;
  
  // Find next shift logic
  let nextShift = null;
  if (currentShiftIndex !== -1 && currentShiftIndex + 1 < schedule.length) {
      nextShift = schedule[currentShiftIndex + 1];
  } else if (currentShiftIndex === -1) {
      // If no current shift, find the first one in the future
      nextShift = schedule.find(s => s.startTime > now) || null;
  }

  // Calculate progress of current shift
  let progress = 0;
  if (currentShift) {
    const totalDuration = currentShift.endTime - currentShift.startTime;
    const elapsed = now - currentShift.startTime;
    progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }

  const getCrewNames = (ids: string[]) => {
    return ids.map(id => crew.find(c => c.id === id)?.name || 'Unknown').join(', ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Ship Time Clock */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Anchor className="w-32 h-32 transform rotate-12" />
        </div>
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Ship Time</p>
          <h1 className="text-5xl font-bold font-mono tracking-tighter">
            {formatTime(now, effectiveOffset, settings.use24Hour)}
          </h1>
          <p className="text-blue-200 text-xs mt-2">UTC {effectiveOffset >= 0 ? '+' : ''}{effectiveOffset} offset</p>
        </div>
      </div>

      {/* Current Watch Card */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">On Watch Now</h2>
        {currentShift ? (
          <div className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {getCrewNames(currentShift.crewMemberIds)}
                  </h3>
                  {currentShift.isCaptainsHour && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded uppercase">
                      Captain's Hour
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatTime(currentShift.startTime, effectiveOffset, settings.use24Hour)} - {formatTime(currentShift.endTime, effectiveOffset, settings.use24Hour)}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 font-mono">
                <span>Elapsed: {formatDuration(now - currentShift.startTime)}</span>
                <span>Remaining: {formatDuration(currentShift.endTime - now)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white dark:bg-slate-700 rounded-xl text-center text-gray-500">
            No active watch scheduled.
          </div>
        )}
      </div>

      {/* Next Watch Card */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Up Next</h2>
        {nextShift ? (
          <div className="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-600 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 dark:bg-slate-700 p-2 rounded-lg">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {getCrewNames(nextShift.crewMemberIds)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  starts in {formatDuration(nextShift.startTime - now)}
                </p>
              </div>
            </div>
             <div className="text-right font-mono text-slate-600 dark:text-slate-400 text-sm">
                {formatTime(nextShift.startTime, effectiveOffset, settings.use24Hour)}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white dark:bg-slate-700 rounded-xl text-center text-gray-500 text-sm">
            End of scheduled watches.
          </div>
        )}
      </div>

      {/* Quick Visual Timeline (Next 12h) */}
      <div className="space-y-2 pt-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Upcoming 12 Hours</h2>
        <div className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 divide-y divide-gray-100 dark:divide-slate-600">
          {schedule.filter(s => s.endTime > now).slice(0, 4).map((shift) => {
             const isDay = new Date(shift.startTime).getHours() >= 6 && new Date(shift.startTime).getHours() < 18;
             return (
              <div 
                key={shift.id} 
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                onClick={() => {
                   const memberId = shift.crewMemberIds[0];
                   if(memberId) navigateTo(`/crew/${memberId}`);
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className={`p-1.5 rounded-full ${isDay ? 'bg-orange-50 text-orange-500' : 'bg-indigo-50 text-indigo-500'}`}>
                    {isDay ? <Sun size={14} /> : <Moon size={14} />}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {getCrewNames(shift.crewMemberIds)}
                    </span>
                    {shift.isCaptainsHour && <span className="text-[10px] uppercase text-yellow-600 font-bold">Captain's Hour</span>}
                  </div>
                </div>
                <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(shift.startTime, effectiveOffset, settings.use24Hour)} - {formatTime(shift.endTime, effectiveOffset, settings.use24Hour)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};