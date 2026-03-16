import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/scheduleLogic';
import { generateICS } from '../utils/icsGenerator';
import { ArrowLeft, Clock, Share2, X, Download, MessageSquare } from 'lucide-react';

const DAY_OPTIONS = [1, 2, 3] as const;
type DayOption = typeof DAY_OPTIONS[number];

export const CrewDetail: React.FC = () => {
  const { crew, schedule, settings, effectiveOffset, currentRoute, navigateTo, now } = useApp();

  const id = currentRoute.split('/').pop();
  const member = crew.find(c => c.id === id);

  const [showShare, setShowShare] = useState(false);
  const [shareDays, setShareDays] = useState<DayOption>(2);

  const memberShifts = member ? schedule.filter(s => s.crewMemberIds.includes(member.id)) : [];

  if (!member) {
    return (
      <div className="text-center py-10">
        <p>Crew member not found.</p>
        <button onClick={() => navigateTo('/crew')} className="text-blue-500 underline mt-2">Go back</button>
      </div>
    );
  }

  // Group by day for schedule display
  const shiftsByDay: Record<string, typeof memberShifts> = {};
  memberShifts.forEach(shift => {
    const date = new Date(shift.startTime + (effectiveOffset * 3600000));
    const dayKey = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    if (!shiftsByDay[dayKey]) shiftsByDay[dayKey] = [];
    shiftsByDay[dayKey].push(shift);
  });

  const cutoff = now + shareDays * 24 * 3600 * 1000;
  const relevantShifts = memberShifts.filter(s => s.endTime >= now && s.startTime <= cutoff);

  const generateShareText = (): string => {
    const byDay: Record<string, typeof relevantShifts> = {};
    relevantShifts.forEach(shift => {
      const date = new Date(shift.startTime + effectiveOffset * 3600000);
      const dayKey = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(shift);
    });

    const lines: string[] = [`${member.name} - Watch Schedule\n`];
    Object.entries(byDay).forEach(([day, shifts]) => {
      lines.push(day);
      shifts.forEach(shift => {
        const start = formatTime(shift.startTime, effectiveOffset, settings.use24Hour);
        const end = formatTime(shift.endTime, effectiveOffset, settings.use24Hour);
        const label = shift.isCaptainsHour ? "Captain's Hour" : 'Watch';
        lines.push(`  ${start} - ${end}  (${label})`);
      });
      lines.push('');
    });

    return lines.join('\n').trim();
  };

  const shareAsText = async () => {
    const text = generateShareText();
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: `${member.name} Watch Schedule`, text });
    } else if (navigator.share) {
      await navigator.share({ title: `${member.name} Watch Schedule`, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const shareAsICS = async () => {
    const icsText = generateICS(member, memberShifts, effectiveOffset, shareDays);
    const fileName = `${member.name.replace(/\s+/g, '-')}-watch-schedule.ics`;

    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: fileName,
        data: icsText,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({ title: `${member.name} Watch Schedule`, files: [uri] });
    } else {
      const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const floatingBtn = ReactDOM.createPortal(
    <button
      onClick={() => setShowShare(true)}
      className="fixed top-16 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-lg"
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>,
    document.body
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {floatingBtn}
      <button
        onClick={() => navigateTo('/crew')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{member.name}</h1>
        <p className="text-gray-500 dark:text-gray-400">Personal Watch Schedule</p>
      </div>

      <div className="space-y-6">
        {Object.keys(shiftsByDay).length === 0 && (
          <div className="p-4 bg-gray-100 dark:bg-slate-700 rounded text-center">No shifts assigned.</div>
        )}

        {Object.entries(shiftsByDay).map(([day, shifts]) => (
          <div key={day} className="space-y-2">
            <h3 className="sticky top-16 z-10 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur py-2 px-1 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-slate-800">
              {day}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {shifts.map(shift => {
                const shipHour = new Date(shift.startTime + effectiveOffset * 3_600_000).getUTCHours();
                const isNight = shipHour < 6 || shipHour >= 20;
                return (
                  <div
                    key={shift.id}
                    className={`p-4 rounded-xl border flex justify-between items-center transition-transform hover:scale-[1.01] ${
                      isNight
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-gray-200 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${isNight ? 'bg-slate-700' : 'bg-blue-50 dark:bg-slate-600'}`}>
                        <Clock className={`w-5 h-5 ${isNight ? 'text-blue-300' : 'text-blue-600 dark:text-blue-300'}`} />
                      </div>
                      <div>
                        <span className="font-mono text-lg font-semibold">
                          {formatTime(shift.startTime, effectiveOffset, settings.use24Hour)} - {formatTime(shift.endTime, effectiveOffset, settings.use24Hour)}
                        </span>
                        {shift.isCaptainsHour && (
                          <div className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase mt-0.5">Captain's Hour</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs opacity-60 font-medium uppercase tracking-wider">
                        {Math.round((shift.endTime - shift.startTime) / (1000 * 60 * 60))} Hours
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {showShare && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-6"
          onClick={() => setShowShare(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Share Schedule</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{member.name}</p>
              </div>
              <button
                onClick={() => setShowShare(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Day selector */}
            <div className="flex gap-2">
              {DAY_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setShareDays(d)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    shareDays === d
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {d === 1 ? 'Next 24h' : `${d} Days`}
                </button>
              ))}
            </div>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              {relevantShifts.length} shift{relevantShifts.length !== 1 ? 's' : ''} in this window
            </p>

            {/* Share as ICS */}
            <button
              onClick={shareAsICS}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Share as Calendar File (.ics)
            </button>

            {/* Share as Text */}
            <button
              onClick={shareAsText}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Share as Text
            </button>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              Text works for messaging apps. .ics imports directly into any calendar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
