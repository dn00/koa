import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../../src/stores/settingsStore.js';

/**
 * Task 015: Zustand Stores - Settings Store
 */
describe('Task 015: Zustand Stores - Settings Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  // ==========================================================================
  // AC-7: Settings Store Created
  // ==========================================================================
  describe('AC-7: Settings Store Created', () => {
    it('should create settings store with useSettingsStore hook', () => {
      const store = useSettingsStore.getState();
      expect(store).toBeDefined();
      expect(typeof store.setCounterVisibility).toBe('function');
      expect(typeof store.setTelemetryOptOut).toBe('function');
    });

    it('should have default settings values', () => {
      const store = useSettingsStore.getState();
      expect(store.counterVisibility).toBe('hover');
      expect(store.telemetryOptOut).toBe(false);
    });
  });

  // ==========================================================================
  // AC-8: Counter Visibility Setting
  // ==========================================================================
  describe('AC-8: Counter Visibility Setting', () => {
    it('should update counterVisibility to "always"', () => {
      useSettingsStore.getState().setCounterVisibility('always');
      expect(useSettingsStore.getState().counterVisibility).toBe('always');
    });

    it('should update counterVisibility to "never"', () => {
      useSettingsStore.getState().setCounterVisibility('never');
      expect(useSettingsStore.getState().counterVisibility).toBe('never');
    });

    it('should update counterVisibility to "hover"', () => {
      useSettingsStore.getState().setCounterVisibility('always');
      useSettingsStore.getState().setCounterVisibility('hover');
      expect(useSettingsStore.getState().counterVisibility).toBe('hover');
    });
  });

  // ==========================================================================
  // AC-9: Telemetry Opt-Out Setting
  // ==========================================================================
  describe('AC-9: Telemetry Opt-Out Setting', () => {
    it('should update telemetryOptOut to true', () => {
      useSettingsStore.getState().setTelemetryOptOut(true);
      expect(useSettingsStore.getState().telemetryOptOut).toBe(true);
    });

    it('should update telemetryOptOut to false', () => {
      useSettingsStore.getState().setTelemetryOptOut(true);
      useSettingsStore.getState().setTelemetryOptOut(false);
      expect(useSettingsStore.getState().telemetryOptOut).toBe(false);
    });
  });

  // ==========================================================================
  // AC-10: Load and Persist Settings
  // ==========================================================================
  describe('AC-10: Load and Persist Settings', () => {
    it('should load settings from persisted state', () => {
      // Simulate loading from persistence
      useSettingsStore.getState().loadSettings({
        counterVisibility: 'never',
        telemetryOptOut: true,
      });

      const store = useSettingsStore.getState();
      expect(store.counterVisibility).toBe('never');
      expect(store.telemetryOptOut).toBe(true);
    });

    it('should handle partial settings load (counterVisibility only)', () => {
      useSettingsStore.getState().loadSettings({
        counterVisibility: 'always',
      });

      const store = useSettingsStore.getState();
      expect(store.counterVisibility).toBe('always');
      expect(store.telemetryOptOut).toBe(false); // Default
    });

    it('should handle partial settings load (telemetryOptOut only)', () => {
      useSettingsStore.getState().loadSettings({
        telemetryOptOut: true,
      });

      const store = useSettingsStore.getState();
      expect(store.counterVisibility).toBe('hover'); // Default
      expect(store.telemetryOptOut).toBe(true);
    });

    it('should handle empty settings load', () => {
      // First change settings
      useSettingsStore.getState().setCounterVisibility('never');
      // Then load empty - should reset to defaults
      useSettingsStore.getState().loadSettings({});

      const store = useSettingsStore.getState();
      expect(store.counterVisibility).toBe('hover'); // Default
      expect(store.telemetryOptOut).toBe(false); // Default
    });
  });

  // ==========================================================================
  // EC-1: Reset Settings
  // ==========================================================================
  describe('EC-1: Reset Settings', () => {
    it('should reset all settings to defaults', () => {
      useSettingsStore.getState().setCounterVisibility('never');
      useSettingsStore.getState().setTelemetryOptOut(true);

      useSettingsStore.getState().reset();

      const store = useSettingsStore.getState();
      expect(store.counterVisibility).toBe('hover');
      expect(store.telemetryOptOut).toBe(false);
    });
  });

  // ==========================================================================
  // EC-2: Settings Subscriptions (Zustand reactivity)
  // ==========================================================================
  describe('EC-2: Settings Subscriptions', () => {
    it('should notify subscribers when settings change', () => {
      let notificationCount = 0;
      const unsubscribe = useSettingsStore.subscribe(() => {
        notificationCount++;
      });

      useSettingsStore.getState().setCounterVisibility('always');
      useSettingsStore.getState().setTelemetryOptOut(true);

      expect(notificationCount).toBe(2);
      unsubscribe();
    });
  });
});
