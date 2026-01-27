/**
 * Settings store using Zustand.
 * Task 015: Zustand Stores
 *
 * Manages user preferences and configuration.
 */

import { create } from 'zustand';

/**
 * Counter visibility options.
 */
type CounterVisibility = 'always' | 'hover' | 'never';

/**
 * Settings store interface.
 */
interface SettingsStore {
  /** How to display counter-evidence */
  counterVisibility: CounterVisibility;
  /** Whether user has opted out of telemetry */
  telemetryOptOut: boolean;

  // Actions
  /** Set counter visibility preference */
  setCounterVisibility(visibility: CounterVisibility): void;
  /** Set telemetry opt-out preference */
  setTelemetryOptOut(optOut: boolean): void;
  /** Load settings from persisted state */
  loadSettings(settings: Partial<Pick<SettingsStore, 'counterVisibility' | 'telemetryOptOut'>>): void;
  /** Reset to default settings */
  reset(): void;
}

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS: Pick<SettingsStore, 'counterVisibility' | 'telemetryOptOut'> = {
  counterVisibility: 'hover',
  telemetryOptOut: false,
};

/**
 * Settings store using Zustand.
 */
export const useSettingsStore = create<SettingsStore>((set) => ({
  ...DEFAULT_SETTINGS,

  setCounterVisibility: (visibility) => {
    set({ counterVisibility: visibility });
  },

  setTelemetryOptOut: (optOut) => {
    set({ telemetryOptOut: optOut });
  },

  loadSettings: (settings) => {
    set({
      counterVisibility: settings.counterVisibility ?? DEFAULT_SETTINGS.counterVisibility,
      telemetryOptOut: settings.telemetryOptOut ?? DEFAULT_SETTINGS.telemetryOptOut,
    });
  },

  reset: () => {
    set(DEFAULT_SETTINGS);
  },
}));
