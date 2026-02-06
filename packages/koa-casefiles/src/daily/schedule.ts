import type { DifficultyTier } from '../types.js';

export type DayOfWeek =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

export interface DailyScheduleConfig {
    tier: DifficultyTier;
    theme?: string;
}

export type WeeklySchedule = Record<DayOfWeek, DailyScheduleConfig>;

export const DEFAULT_SCHEDULE: WeeklySchedule = {
    monday:    { tier: 1 },
    tuesday:   { tier: 2 },
    wednesday: { tier: 2 },
    thursday:  { tier: 3 },
    friday:    { tier: 2 },
    saturday:  { tier: 1 },
    sunday:    { tier: 4 },
};

const UTC_DAY_MAP: DayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday',
];

export function dateToDayOfWeek(date: Date): DayOfWeek {
    return UTC_DAY_MAP[date.getUTCDay()];
}

export function getTierForDate(
    dateStr: string,
    schedule: WeeklySchedule = DEFAULT_SCHEDULE,
): DifficultyTier {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: "${dateStr}"`);
    }
    const day = dateToDayOfWeek(date);
    return schedule[day].tier;
}
