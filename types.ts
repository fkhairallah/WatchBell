export interface CrewMember {
  id: string;
  name: string;
  isActive: boolean;
}

export type ScheduleMode = 'standard' | 'day-night' | 'custom';

export interface StandardConfig {
  watchDurationHours: number;      // 2 | 3 | 4 | 6
  captainsHourEnabled: boolean;
  captainsHourStart: number;       // 0–23
}

export interface DayNightConfig {
  dayWatchDurationHours: number;   // 2 | 3 | 4 | 6
  nightWatchDurationHours: number; // 2 | 3 | 4 | 6
  dayStartHour: number;            // hour when "day" begins, e.g. 6
  nightStartHour: number;          // hour when "night" begins, e.g. 20
  captainsHourEnabled: boolean;
  captainsHourStart: number;       // 0–23
}

export interface CustomSlot {
  id: string;
  durationHours: number;
  crewMemberId: string | null;     // null = auto-assign from rotation
}

export interface CustomConfig {
  slots: CustomSlot[];             // pattern repeats indefinitely
}

export interface WatchConfig {
  mode: ScheduleMode;
  startTime: string;               // HH:MM
  startDate: string;               // ISO date string
  standard: StandardConfig;
  dayNight: DayNightConfig;
  custom: CustomConfig;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  nightVision: boolean;
  autoNightVision: boolean;
  shipTimeOffset: number;
}

export interface WatchShift {
  id: string;
  startTime: number;               // millisecond timestamp
  endTime: number;                 // millisecond timestamp
  crewMemberIds: string[];
  isCaptainsHour: boolean;
}

export enum RotationStatus {
  GOOD = 'GOOD',
  BAD = 'BAD',
  WARNING = 'WARNING'
}
