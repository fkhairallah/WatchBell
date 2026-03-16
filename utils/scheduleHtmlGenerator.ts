import { WatchShift, CrewMember, AppSettings } from '../types';
import { formatTime } from './scheduleLogic';

export function generateScheduleHtml(
  schedule: WatchShift[],
  crew: CrewMember[],
  effectiveOffset: number,
  settings: Pick<AppSettings, 'use24Hour'>
): string {
  const getCrewNames = (ids: string[]) =>
    ids.map(id => crew.find(c => c.id === id)?.name ?? 'Unknown').join(', ');

  // Group shifts by ship-time day
  const shiftsByDay = new Map<string, WatchShift[]>();
  for (const shift of schedule) {
    const date = new Date(shift.startTime + effectiveOffset * 3_600_000);
    const key = date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    });
    if (!shiftsByDay.has(key)) shiftsByDay.set(key, []);
    shiftsByDay.get(key)!.push(shift);
  }

  const now = new Date();
  const generatedStr = now.toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const offsetLabel = `UTC${effectiveOffset >= 0 ? '+' : ''}${effectiveOffset}`;

  const rows = (shifts: WatchShift[]) => shifts.map(shift => {
    const start = formatTime(shift.startTime, effectiveOffset, settings.use24Hour);
    const end   = formatTime(shift.endTime,   effectiveOffset, settings.use24Hour);
    const hours = ((shift.endTime - shift.startTime) / 3_600_000)
      .toFixed(1).replace(/\.0$/, '');
    const isCh = shift.isCaptainsHour;
    return `<tr${isCh ? ' class="ch"' : ''}>
        <td class="mono">${start}–${end}</td>
        <td>${getCrewNames(shift.crewMemberIds)}</td>
        <td>${hours}h</td>
        <td>${isCh ? "&#9875; Captain's Hour" : 'Watch'}</td>
      </tr>`;
  }).join('\n');

  const sections = [...shiftsByDay.entries()].map(([day, shifts]) => `
  <section>
    <h2>${day}</h2>
    <table>
      <thead>
        <tr><th>Time</th><th>Crew</th><th>Duration</th><th>Type</th></tr>
      </thead>
      <tbody>
        ${rows(shifts)}
      </tbody>
    </table>
  </section>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Watch Schedule</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: #1e293b;
      background: #fff;
      padding: 24px 20px;
      max-width: 860px;
      margin: 0 auto;
    }
    header {
      border-bottom: 3px solid #1d4ed8;
      padding-bottom: 14px;
      margin-bottom: 28px;
    }
    header h1 {
      font-size: 22px;
      font-weight: 700;
      color: #1d4ed8;
      letter-spacing: -0.3px;
    }
    header p {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    h2 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #475569;
      background: #f1f5f9;
      padding: 5px 10px;
      border-left: 3px solid #94a3b8;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      padding: 5px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    .mono {
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }
    .ch td { background: #fefce8; }
    .ch .mono { color: #92400e; }
    .ch td:nth-child(4) { color: #92400e; font-weight: 600; }
    @media print {
      body { padding: 0; font-size: 12px; }
      section { page-break-inside: avoid; }
      header { page-break-after: avoid; }
      .ch td { background: #fefce8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Watch Schedule</h1>
    <p>Generated ${generatedStr}&nbsp;&nbsp;·&nbsp;&nbsp;Ship time ${offsetLabel}</p>
  </header>
${sections}
</body>
</html>`;
}
