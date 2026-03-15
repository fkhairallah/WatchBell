import { WatchShift, CrewMember } from '../types';

function toICSDate(timestampMs: number, offsetHours: number): string {
  // Apply ship time offset then format as local floating time (no Z suffix)
  const d = new Date(timestampMs + offsetHours * 3600000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`
  );
}

export function generateICS(
  member: CrewMember,
  shifts: WatchShift[],
  offsetHours: number,
  days: number
): string {
  const now = Date.now();
  // Include shifts that start within the window (or are already ongoing)
  const cutoff = now + days * 24 * 3600 * 1000;
  const relevant = shifts.filter(s => s.endTime >= now && s.startTime <= cutoff);

  const events = relevant.map(shift => {
    const summary = shift.isCaptainsHour
      ? `${member.name} – Captain's Hour`
      : `${member.name} – Watch`;
    return [
      'BEGIN:VEVENT',
      `DTSTART:${toICSDate(shift.startTime, offsetHours)}`,
      `DTEND:${toICSDate(shift.endTime, offsetHours)}`,
      `SUMMARY:${summary}`,
      `UID:wm-${shift.id}@watchmaker`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WatchMaker//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}
