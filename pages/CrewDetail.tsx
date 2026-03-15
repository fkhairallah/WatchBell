import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/scheduleLogic';
import { generateICS } from '../utils/icsGenerator';
import { ArrowLeft, Clock, QrCode, X, Download } from 'lucide-react';

const DAY_OPTIONS = [1, 2, 3] as const;
type DayOption = typeof DAY_OPTIONS[number];

export const CrewDetail: React.FC = () => {
  const { crew, schedule, settings, currentRoute, navigateTo } = useApp();

  const id = currentRoute.split('/').pop();
  const member = crew.find(c => c.id === id);

  const [showQR, setShowQR] = useState(false);
  const [qrDays, setQrDays] = useState<DayOption>(2);
  const [qrError, setQrError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const memberShifts = member ? schedule.filter(s => s.crewMemberIds.includes(member.id)) : [];

  useEffect(() => {
    if (!showQR || !canvasRef.current || !member) return;
    setQrError(false);
    const icsText = generateICS(member, memberShifts, settings, qrDays);
    QRCode.toCanvas(canvasRef.current, icsText, { width: 260, margin: 2, errorCorrectionLevel: 'M' }, (err) => {
      if (err) setQrError(true);
    });
  }, [showQR, qrDays, member, memberShifts, settings]);

  if (!member) {
    return (
      <div className="text-center py-10">
        <p>Crew member not found.</p>
        <button onClick={() => navigateTo('/crew')} className="text-blue-500 underline mt-2">Go back</button>
      </div>
    );
  }

  // Group by day for nicer display
  const shiftsByDay: Record<string, typeof memberShifts> = {};
  memberShifts.forEach(shift => {
    const date = new Date(shift.startTime + (settings.shipTimeOffset * 3600000));
    const dayKey = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!shiftsByDay[dayKey]) shiftsByDay[dayKey] = [];
    shiftsByDay[dayKey].push(shift);
  });

  const upcomingCount = memberShifts.filter(s => s.endTime >= Date.now() && s.startTime <= Date.now() + qrDays * 24 * 3600 * 1000).length;

  const downloadICS = () => {
    const icsText = generateICS(member!, memberShifts, settings, qrDays);
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${member!.name.replace(/\s+/g, '-')}-watch-schedule.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigateTo('/crew')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{member.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Personal Watch Schedule</p>
        </div>
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow"
        >
          <QrCode className="w-4 h-4" />
          Share via QR
        </button>
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
                const isNight = new Date(shift.startTime).getHours() < 6 || new Date(shift.startTime).getHours() > 20;
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
                          {formatTime(shift.startTime, settings.shipTimeOffset)} - {formatTime(shift.endTime, settings.shipTimeOffset)}
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

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-6"
          onClick={() => setShowQR(false)}
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
                onClick={() => setShowQR(false)}
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
                  onClick={() => setQrDays(d)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    qrDays === d
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {d === 1 ? 'Next 24h' : `${d} Days`}
                </button>
              ))}
            </div>

            {/* Download — primary action, works reliably on all platforms */}
            <button
              onClick={downloadICS}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download .ics ({upcomingCount} shift{upcomingCount !== 1 ? 's' : ''})
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600" />
              <span className="text-xs text-gray-400">or scan QR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600" />
            </div>

            {/* QR Code — secondary; Android camera only imports 1st event */}
            <div className="flex flex-col items-center gap-2">
              {qrError ? (
                <div className="w-[260px] h-[260px] flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-xl text-center text-sm text-gray-500 dark:text-gray-400 p-4">
                  Too many shifts to encode. Try a shorter window.
                </div>
              ) : (
                <canvas ref={canvasRef} className="rounded-xl" />
              )}
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                QR works best on iOS. Android camera may only import the first event — use the download button instead.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
