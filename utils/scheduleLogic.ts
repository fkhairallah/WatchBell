import { CrewMember, WatchConfig, WatchShift, RotationStatus, DayNightConfig } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the hour (0–23) at the given timestamp in ship time. */
const getShipHour = (ms: number, offsetHours: number): number =>
  new Date(ms + offsetHours * 3_600_000).getHours();

/**
 * Returns the next timestamp at which ship time will be exactly
 * `boundaryHour:00:00`. Always returns a value strictly greater than `ms`.
 */
const nextShipHourBoundary = (ms: number, offsetHours: number, boundaryHour: number): number => {
  const shipDate = new Date(ms + offsetHours * 3_600_000);
  const boundary = new Date(shipDate);
  boundary.setHours(boundaryHour, 0, 0, 0);
  if (boundary.getTime() <= shipDate.getTime()) boundary.setDate(boundary.getDate() + 1);
  return boundary.getTime() - offsetHours * 3_600_000;
};

const parseStartDateTime = (config: WatchConfig): Date => {
  let dt: Date;
  try {
    dt = new Date(config.startDate);
    if (isNaN(dt.getTime())) throw new Error();
  } catch {
    dt = new Date();
  }

  let h = 8, m = 0;
  if (config.startTime?.includes(':')) {
    const [ph, pm] = config.startTime.split(':').map(Number);
    if (!isNaN(ph) && !isNaN(pm)) { h = ph; m = pm; }
  }

  dt.setHours(h, m, 0, 0);
  return dt;
};

// ─── Mode: Standard ───────────────────────────────────────────────────────────

const generateStandard = (
  activeCrew: CrewMember[],
  config: WatchConfig,
  startDateTime: Date,
  endTime: number,
  shipTimeOffsetHours: number = 0
): WatchShift[] => {
  const { standard } = config;
  const minDuration = Math.max(0.5, standard.watchDurationHours || 3);
  const shifts: WatchShift[] = [];
  let currentTime = startDateTime.getTime();
  let crewIndex = 0;

  while (currentTime < endTime) {
    const currentHour = getShipHour(currentTime, shipTimeOffsetHours);
    let isCaptainsHour = false;
    let durationHours = minDuration;

    if (standard.captainsHourEnabled) {
      if (currentHour === standard.captainsHourStart) {
        isCaptainsHour = true;
        durationHours = 1;
      } else {
        const next = nextShipHourBoundary(currentTime, shipTimeOffsetHours, standard.captainsHourStart);
        const hoursUntil = (next - currentTime) / 3_600_000;
        if (hoursUntil < durationHours && hoursUntil > 0.01) durationHours = hoursUntil;
      }
    }

    const shiftEnd = currentTime + durationHours * 3_600_000;
    shifts.push({
      id: `shift-${currentTime}`,
      startTime: currentTime,
      endTime: shiftEnd,
      crewMemberIds: isCaptainsHour ? activeCrew.map(c => c.id) : [activeCrew[crewIndex].id],
      isCaptainsHour,
    });
    currentTime = shiftEnd;
    if (!isCaptainsHour) crewIndex = (crewIndex + 1) % activeCrew.length;
  }

  return shifts;
};

// ─── Mode: Day/Night ──────────────────────────────────────────────────────────

const generateDayNight = (
  activeCrew: CrewMember[],
  config: WatchConfig,
  startDateTime: Date,
  endTime: number,
  shipTimeOffsetHours: number = 0
): WatchShift[] => {
  const dn: DayNightConfig = config.dayNight;
  const shifts: WatchShift[] = [];
  let currentTime = startDateTime.getTime();
  let crewIndex = 0;

  const isInDayWindow = (hour: number) =>
    dn.dayStartHour < dn.nightStartHour
      ? hour >= dn.dayStartHour && hour < dn.nightStartHour
      : hour >= dn.dayStartHour || hour < dn.nightStartHour; // wraps midnight

  while (currentTime < endTime) {
    const currentHour = getShipHour(currentTime, shipTimeOffsetHours);
    const isDay = isInDayWindow(currentHour);
    const watchDuration = isDay ? dn.dayWatchDurationHours : dn.nightWatchDurationHours;
    let durationHours = Math.max(0.5, watchDuration);
    let isCaptainsHour = false;

    // Captain's Hour check (captainsHourStart is in ship time)
    if (dn.captainsHourEnabled) {
      if (currentHour === dn.captainsHourStart) {
        isCaptainsHour = true;
        durationHours = 1;
      } else {
        const next = nextShipHourBoundary(currentTime, shipTimeOffsetHours, dn.captainsHourStart);
        const hoursUntil = (next - currentTime) / 3_600_000;
        if (hoursUntil < durationHours && hoursUntil > 0.01) durationHours = hoursUntil;
      }
    }

    // Truncate at day/night boundary (dayStartHour/nightStartHour are in ship time)
    if (!isCaptainsHour) {
      const boundaryHour = isDay ? dn.nightStartHour : dn.dayStartHour;
      const boundary = nextShipHourBoundary(currentTime, shipTimeOffsetHours, boundaryHour);
      const hoursUntilBoundary = (boundary - currentTime) / 3_600_000;
      if (hoursUntilBoundary < durationHours && hoursUntilBoundary > 0.01) {
        durationHours = hoursUntilBoundary;
      }
    }

    const shiftEnd = currentTime + durationHours * 3_600_000;
    shifts.push({
      id: `shift-${currentTime}`,
      startTime: currentTime,
      endTime: shiftEnd,
      crewMemberIds: isCaptainsHour ? activeCrew.map(c => c.id) : [activeCrew[crewIndex].id],
      isCaptainsHour,
    });
    currentTime = shiftEnd;
    if (!isCaptainsHour) crewIndex = (crewIndex + 1) % activeCrew.length;
  }

  return shifts;
};

// ─── Mode: Custom ─────────────────────────────────────────────────────────────

const generateCustom = (
  activeCrew: CrewMember[],
  config: WatchConfig,
  startDateTime: Date,
  endTime: number
): WatchShift[] => {
  const { slots } = config.custom;
  if (slots.length === 0) return [];

  const shifts: WatchShift[] = [];
  let currentTime = startDateTime.getTime();
  let slotIndex = 0;
  let autoCrewIndex = 0; // global counter — drifts across cycles

  while (currentTime < endTime) {
    const slot = slots[slotIndex % slots.length];
    const durationHours = Math.max(0.5, slot.durationHours || 1);

    // Resolve crew: explicit assignment takes priority; fall back to auto-rotation
    let crewId: string;
    if (slot.crewMemberId !== null) {
      const found = activeCrew.find(c => c.id === slot.crewMemberId);
      crewId = found ? found.id : activeCrew[autoCrewIndex % activeCrew.length].id;
    } else {
      crewId = activeCrew[autoCrewIndex % activeCrew.length].id;
      autoCrewIndex++;
    }

    const shiftEnd = currentTime + durationHours * 3_600_000;
    shifts.push({
      id: `shift-${currentTime}`,
      startTime: currentTime,
      endTime: shiftEnd,
      crewMemberIds: [crewId],
      isCaptainsHour: false,
    });
    currentTime = shiftEnd;
    slotIndex++;
  }

  return shifts;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const generateSchedule = (
  crew: CrewMember[],
  config: WatchConfig,
  daysToGenerate: number = 7,
  shipTimeOffsetHours: number = 0
): WatchShift[] => {
  const activeCrew = crew.filter(c => c.isActive);
  if (activeCrew.length === 0) return [];

  const startDateTime = parseStartDateTime(config);
  const endTime = startDateTime.getTime() + daysToGenerate * 24 * 3_600_000;

  switch (config.mode) {
    case 'day-night': return generateDayNight(activeCrew, config, startDateTime, endTime, shipTimeOffsetHours);
    case 'custom':    return generateCustom(activeCrew, config, startDateTime, endTime);
    default:          return generateStandard(activeCrew, config, startDateTime, endTime, shipTimeOffsetHours);
  }
};

export const checkRotationQuality = (crewCount: number, watchLengthHours: number): RotationStatus => {
  if (crewCount === 0 || watchLengthHours === 0) return RotationStatus.WARNING;
  const cycleTime = crewCount * watchLengthHours;
  if (cycleTime % 24 === 0) return RotationStatus.BAD;
  if (24 % cycleTime === 0) return RotationStatus.BAD;
  return RotationStatus.GOOD;
};

export const formatTime = (timestamp: number, offsetHours: number = 0, use24Hour: boolean = true): string => {
  if (!timestamp || isNaN(timestamp)) return '--:--';
  const safeOffset = typeof offsetHours === 'number' && !isNaN(offsetHours) ? offsetHours : 0;
  try {
    const date = new Date(timestamp + safeOffset * 3_600_000);
    if (isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24Hour, timeZone: 'UTC' });
  } catch {
    return '--:--';
  }
};
